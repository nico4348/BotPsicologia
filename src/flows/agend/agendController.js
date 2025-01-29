import { prisma } from '../../queries/queries.js'
import { apiHorarios } from './aiHorarios.js'

// Consultar cita existente
export async function consultarCita(idUsuario) {
	try {
		const cita = await prisma.cita.findFirst({
			where: { idUsuario },
			include: {
				practicante: {
					select: {
						nombre: true,
						horario: true,
					},
				},
				consultorio: {
					select: {
						nombre: true,
					},
				},
			},
		})

		if (!cita) {
			throw new Error('No se encontró ninguna cita para este usuario')
		}

		return cita
	} catch (error) {
		console.error('Error al consultar cita:', error)
		throw error
	}
}

// Buscar horarios disponibles y practicante
// Controlador para gestionar el agendamiento de citas
export async function controladorAgendamiento(datosUsuario) {
	try {
		const horarioUsuario = datosUsuario.disponibilidad
		let practicanteSeleccionado
		let horariosCoincidentes = []

		// Caso 1: Usuario ya tiene un practicante asignado
		if (datosUsuario.practicanteAsignado) {
			// 1. Buscar el practicante en la base de datos
			practicanteSeleccionado = await prisma.practicante.findUnique({
				where: { idPracticante: datosUsuario.practicanteAsignado },
			})

			// 1.1 Validar si existe el practicante
			if (!practicanteSeleccionado) {
				throw new Error('Practicante asignado no encontrado')
			}

			// 2. Encontrar coincidencias de horarios entre usuario y practicante
			horariosCoincidentes = encontrarHorariosCoincidentes(
				horarioUsuario,
				practicanteSeleccionado.horario
			)
			console.log(horariosCoincidentes)

			// 3. Verificar disponibilidad real en consultorios físicos
			horariosCoincidentes = await verificarDisponibilidadConsultorios(
				horariosCoincidentes,
				practicanteSeleccionado.idPracticante
			)

			// 4. Retornar máximo 5 horarios con datos del practicante
			return {
				success: true,
				horarios: horariosCoincidentes.slice(0, 5),
				practicante: {
					idPracticante: practicanteSeleccionado.idPracticante,
					nombre: practicanteSeleccionado.nombre,
				},
			}
		}
		// Caso 2: Usuario sin practicante asignado (primera cita)
		else {
			// 1. Obtener todos los practicantes disponibles
			const practicantes = await prisma.practicante.findMany()
			const practicantesDisponibles = []

			//Organizar los practicantes de menor numero de sesiones (practicantes.sesiones) a mayor numero de sesiones
			practicantes.sort((a, b) => a.sesiones - b.sesiones)

			// 2. Evaluar cada practicante
			for (const practicante of practicantes) {
				// 2.1 Buscar coincidencias de horarios
				const coincidencias = encontrarHorariosCoincidentes(
					horarioUsuario,
					practicante.horario
				)

				//! AQUI ME QUEDE.
				if (coincidencias.length > 0) {
					// 2.2 Verificar disponibilidad en consultorios
					const horariosVerificados = await verificarDisponibilidadConsultorios(
						coincidencias,
						practicante.idPracticante
					)

					// 2.3 Almacenar practicante si tiene disponibilidad
					if (horariosVerificados.length > 0) {
						practicantesDisponibles.push({
							practicante,
							horarios: horariosVerificados,
						})
					}
				}
			}

			// 3. Validar si hay practicantes disponibles
			if (practicantesDisponibles.length === 0) {
				throw new Error('No se encontró disponibilidad con ningún practicante')
			}

			// 4. Selección aleatoria de practicante disponible
			const indiceAleatorio = Math.floor(Math.random() * practicantesDisponibles.length)
			const seleccion = practicantesDisponibles[indiceAleatorio]

			// 5. Retornar resultados para primera cita
			return {
				success: true,
				horarios: seleccion.horarios.slice(0, 5),
				practicante: {
					idPracticante: seleccion.practicante.idPracticante,
					nombre: seleccion.practicante.nombre,
				},
				esPrimeraCita: true, // Bandera para identificar primera asignación
			}
		}
	} catch (error) {
		// Manejo centralizado de errores
		console.error('Error al buscar horarios:', error)

		// Relanzar error para manejo en capa superior
		throw error
	}
}

/*
 * Funciones auxiliares (ejemplo de estructura):
 *
 * 1. encontrarHorariosCoincidentes(horarioUsuario, horarioPracticante):
 *    - Compara dos arrays de horarios y devuelve las coincidencias
 *    - Formato esperado: ["Lunes 09:00", "Martes 15:30", ...]
 *
 * 2. verificarDisponibilidadConsultorios(horarios, idPracticante):
 *    - Consulta la base de datos para filtrar horarios ya ocupados
 *    - Devuelve solo los horarios con consultorio disponible
 */

// Confirmar y crear nueva cita
export async function confirmarCita(datosUsuario, idPracticante, horarioSeleccionado) {
	try {
		const consultorioDisponible = await encontrarConsultorioDisponible(horarioSeleccionado)

		if (!consultorioDisponible) {
			throw new Error('No hay consultorios disponibles para el horario seleccionado')
		}

		if (!datosUsuario.practicanteAsignado) {
			await prisma.informacionUsuario.update({
				where: { idUsuario: datosUsuario.idUsuario },
				data: {
					practicanteAsignado: idPracticante,
				},
			})
		} else {
			idPracticante = datosUsuario.practicanteAsignado
		}

		const nuevaCita = await prisma.cita.create({
			data: {
				idUsuario: datosUsuario.idUsuario,
				idPracticante: idPracticante,
				idConsultorio: consultorioDisponible.idConsultorio,
				fechaHora: `${horarioSeleccionado.dia} ${horarioSeleccionado.hora}`,
			},
		})

		const practicante = await prisma.practicante.findUnique({
			where: { idPracticante: idPracticante },
		})

		const horarioPracticanteActualizado = practicante.horario
		const horaIndex = horarioPracticanteActualizado[horarioSeleccionado.dia].indexOf(
			horarioSeleccionado.hora
		)

		if (horaIndex > -1) {
			horarioPracticanteActualizado[horarioSeleccionado.dia].splice(horaIndex, 1)
		}

		await prisma.practicante.update({
			where: { idPracticante: idPracticante },
			data: {
				horario: horarioPracticanteActualizado,
			},
		})

		return {
			success: true,
			cita: {
				...nuevaCita,
				practicante: {
					nombre: practicante.nombre,
					idPracticante: practicante.idPracticante,
				},
				consultorio: {
					nombre: consultorioDisponible.nombre,
					idConsultorio: consultorioDisponible.idConsultorio,
				},
			},
		}
	} catch (error) {
		console.error('Error al crear cita:', error)
		throw error
	}
}

// Modificar cita existente
export async function modificarCita(idUsuario, horario) {
	try {
		let idCita = await prisma.cita.findFirst({
			where: { idUsuario },
			select: { idCita: true },
		})

		idCita = idCita.idCita

		if (!idCita) {
			throw new Error('No se encontró ninguna cita para este usuario')
		}
		console.log(idCita)
		console.log(horario)
		const nuevoHorario0 = await apiHorarios(horario)
		const nuevoHorario = Object.entries(nuevoHorario0)
			.map(([dia, horas]) => {
				return horas.map((hora) => ({ dia, hora }))
			})
			.flat()[0] // Toma solo el primer elemento del arreglo
		console.log(nuevoHorario)
		const citaActual = await prisma.cita.findUnique({
			where: { idCita: idCita },
			include: {
				practicante: true,
			},
		})

		if (!citaActual) {
			throw new Error('Cita no encontrada')
		}

		console.log(citaActual)
		const horarioPracticante = citaActual.practicante.horario
		if (!horarioPracticante[nuevoHorario.dia]?.includes(nuevoHorario.hora)) {
			throw new Error('El practicante no está disponible en este horario')
		}

		const consultorioDisponible = await encontrarConsultorioDisponible(nuevoHorario)
		if (!consultorioDisponible) {
			throw new Error('No hay consultorios disponibles para el nuevo horario')
		}

		const horarioActualizado = { ...horarioPracticante }

		const [diaAnterior, horaAnterior] = citaActual.fechaHora.split(' ')
		if (!horarioActualizado[diaAnterior]) {
			horarioActualizado[diaAnterior] = []
		}
		horarioActualizado[diaAnterior].push(horaAnterior)
		horarioActualizado[diaAnterior].sort()

		const horaIndex = horarioActualizado[nuevoHorario.dia].indexOf(nuevoHorario.hora)
		if (horaIndex > -1) {
			horarioActualizado[nuevoHorario.dia].splice(horaIndex, 1)
		}

		const citaModificada = await prisma.$transaction([
			prisma.cita.update({
				where: { idCita },
				data: {
					fechaHora: `${nuevoHorario.dia} ${nuevoHorario.hora}`,
					idConsultorio: consultorioDisponible.idConsultorio,
				},
			}),
			prisma.practicante.update({
				where: { idPracticante: citaActual.idPracticante },
				data: {
					horario: horarioActualizado,
				},
			}),
		])

		return citaModificada[0]
	} catch (error) {
		console.error('Error al modificar cita:', error)
		throw error
	}
}

// Eliminar cita
export async function eliminarCita(idCita) {
	try {
		const cita = await prisma.cita.findUnique({
			where: { idCita },
			include: {
				practicante: true,
			},
		})

		if (!cita) {
			throw new Error('Cita no encontrada')
		}

		const [dia, hora] = cita.fechaHora.split(' ')
		const horarioActualizado = { ...cita.practicante.horario }

		if (!horarioActualizado[dia]) {
			horarioActualizado[dia] = []
		}
		horarioActualizado[dia].push(hora)
		horarioActualizado[dia].sort()

		await prisma.$transaction([
			prisma.cita.delete({
				where: { idCita },
			}),
			prisma.practicante.update({
				where: { idPracticante: cita.idPracticante },
				data: {
					horario: horarioActualizado,
				},
			}),
		])

		return { success: true, message: 'Cita eliminada exitosamente' }
	} catch (error) {
		console.error('Error al eliminar cita:', error)
		throw error
	}
}

// Funciones auxiliares
export function encontrarHorariosCoincidentes(usuario, practicante) {
	return Object.keys(usuario).flatMap((dia) => {
		const horasUsuario = new Set(usuario[dia])
		return (practicante[dia] || [])
			.filter((hora) => horasUsuario.has(hora))
			.map((hora) => ({ dia, hora }))
	})
}

export async function verificarDisponibilidadConsultorios(horarios) {
	const horariosDisponibles = []
	for (const horario of horarios) {
		const consultorioDisponible = await encontrarConsultorioDisponible(horario)
		if (consultorioDisponible) {
			horariosDisponibles.push(horario)
		}
	}
	return horariosDisponibles
}

export async function encontrarConsultorioDisponible(horario) {
	const consultorios = await prisma.consultorio.findMany({
		where: { activo: true },
	})

	for (const consultorio of consultorios) {
		const citasExistentes = await prisma.cita.findMany({
			where: {
				idConsultorio: consultorio.idConsultorio,
				fechaHora: `${horario.dia} ${horario.hora}`,
			},
		})

		if (citasExistentes.length === 0) {
			return consultorio
		}
	}

	return null
}

// Pruebas

import { obtenerUsuario } from '../../queries/queries.js'

try {
	const usuario = await obtenerUsuario('573022949109')
	//console.log('Usuario obtenido: \n', usuario)

	const pruebaControladorAgendamiento = await controladorAgendamiento(usuario)
	//console.log('Resultado de controladorAgendamiento:  \n', pruebaControladorAgendamiento)

	if (
		pruebaControladorAgendamiento &&
		pruebaControladorAgendamiento.practicante &&
		pruebaControladorAgendamiento.horarios.length > 0
	) {
		const pruebaConfirmarCita = await confirmarCita(
			usuario,
			pruebaControladorAgendamiento.practicante.idPracticante,
			pruebaControladorAgendamiento.horarios[0]
		)
		//console.log('Prueba confirmar cita:  \n', pruebaConfirmarCita)

		if (pruebaConfirmarCita && pruebaConfirmarCita.cita) {
			const pruebaModificarCita = await modificarCita(
				pruebaConfirmarCita.cita.idCita,
				pruebaControladorAgendamiento.horarios[1]
			)
			//console.log('Prueba modificar cita:  \n', pruebaModificarCita)

			const pruebaEliminarCita = await eliminarCita(pruebaConfirmarCita.cita.idCita)
			//console.log('Prueba eliminar cita:  \n', pruebaEliminarCita)
		} else {
			console.error('Error: No se pudo confirmar la cita.')
		}
	} else {
		console.error('Error: No se encontraron horarios o practicantes disponibles.')
	}

	const pruebaConsultarCita = await consultarCita(usuario.idUsuario)
	//console.log('Prueba consultar cita:  \n', pruebaConsultarCita)
} catch (error) {
	console.error('Error en las pruebas:', error)
}
