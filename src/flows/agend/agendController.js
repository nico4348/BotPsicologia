import { prisma, obtenerUsuario } from '../../queries/queries.js'

// Consultar cita existente
async function consultarCita(idUsuario) {
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
async function controladorAgendamiento(datosUsuario) {
	try {
		const horarioUsuario = datosUsuario.disponibilidad
		let practicanteSeleccionado
		let horariosCoincidentes = []

		if (datosUsuario.practicanteAsignado) {
			practicanteSeleccionado = await prisma.practicante.findUnique({
				where: { idPracticante: datosUsuario.practicanteAsignado },
			})

			if (!practicanteSeleccionado) {
				throw new Error('Practicante asignado no encontrado')
			}

			horariosCoincidentes = encontrarHorariosCoincidentes(
				horarioUsuario,
				practicanteSeleccionado.horario
			)

			if (horariosCoincidentes.length === 0) {
				throw new Error('No hay horarios disponibles con el practicante asignado')
			}

			horariosCoincidentes = await verificarDisponibilidadConsultorios(
				horariosCoincidentes,
				practicanteSeleccionado.idPracticante
			)

			return {
				success: true,
				horarios: horariosCoincidentes.slice(0, 5),
				practicante: {
					idPracticante: practicanteSeleccionado.idPracticante,
					nombre: practicanteSeleccionado.nombre,
				},
			}
		} else {
			const practicantes = await prisma.practicante.findMany()
			const practicantesDisponibles = []

			for (const practicante of practicantes) {
				const coincidencias = encontrarHorariosCoincidentes(
					horarioUsuario,
					practicante.horario
				)

				if (coincidencias.length > 0) {
					const horariosVerificados = await verificarDisponibilidadConsultorios(
						coincidencias,
						practicante.idPracticante
					)

					if (horariosVerificados.length > 0) {
						practicantesDisponibles.push({
							practicante,
							horarios: horariosVerificados,
						})
					}
				}
			}

			if (practicantesDisponibles.length === 0) {
				throw new Error('No se encontró disponibilidad con ningún practicante')
			}

			const indiceAleatorio = Math.floor(Math.random() * practicantesDisponibles.length)
			const seleccion = practicantesDisponibles[indiceAleatorio]

			return {
				success: true,
				horarios: seleccion.horarios.slice(0, 5),
				practicante: {
					idPracticante: seleccion.practicante.idPracticante,
					nombre: seleccion.practicante.nombre,
				},
				esPrimeraCita: true,
			}
		}
	} catch (error) {
		console.error('Error al buscar horarios:', error)
		throw error
	}
}

// Confirmar y crear nueva cita
async function confirmarCita(datosUsuario, idPracticante, horarioSeleccionado) {
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
async function modificarCita(idCita, nuevoHorario) {
	try {
		const citaActual = await prisma.cita.findUnique({
			where: { idCita },
			include: {
				practicante: true,
			},
		})

		if (!citaActual) {
			throw new Error('Cita no encontrada')
		}

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
async function eliminarCita(idCita) {
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
function encontrarHorariosCoincidentes(horarioUsuario, horarioPracticante) {
	const horariosCoincidentes = []
	for (const dia in horarioUsuario) {
		if (horarioPracticante[dia]) {
			const horasCoincidentes = horarioUsuario[dia].filter((hora) =>
				horarioPracticante[dia].includes(hora)
			)
			if (horasCoincidentes.length > 0) {
				horasCoincidentes.forEach((hora) => {
					horariosCoincidentes.push({
						dia,
						hora,
					})
				})
			}
		}
	}
	return horariosCoincidentes
}

async function verificarDisponibilidadConsultorios(horarios) {
	const horariosDisponibles = []
	for (const horario of horarios) {
		const consultorioDisponible = await encontrarConsultorioDisponible(horario)
		if (consultorioDisponible) {
			horariosDisponibles.push(horario)
		}
	}
	return horariosDisponibles
}

async function encontrarConsultorioDisponible(horario) {
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

export { consultarCita, controladorAgendamiento, confirmarCita, modificarCita, eliminarCita }

// Pruebas
try {
	const usuario = await obtenerUsuario('573127061275')
	console.log('Usuario obtenido: \n', usuario)

	const pruebaControladorAgendamiento = await controladorAgendamiento(usuario)
	console.log('Resultado de controladorAgendamiento:  \n', pruebaControladorAgendamiento)

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
		console.log('Prueba confirmar cita:  \n', pruebaConfirmarCita)

		if (pruebaConfirmarCita && pruebaConfirmarCita.cita) {
			const pruebaModificarCita = await modificarCita(
				pruebaConfirmarCita.cita.idCita,
				pruebaControladorAgendamiento.horarios[1]
			)
			console.log('Prueba modificar cita:  \n', pruebaModificarCita)

			const pruebaEliminarCita = await eliminarCita(pruebaConfirmarCita.cita.idCita)
			console.log('Prueba eliminar cita:  \n', pruebaEliminarCita)
		} else {
			console.error('Error: No se pudo confirmar la cita.')
		}
	} else {
		console.error('Error: No se encontraron horarios o practicantes disponibles.')
	}

	const pruebaConsultarCita = await consultarCita(usuario.idUsuario)
	console.log('Prueba consultar cita:  \n', pruebaConsultarCita)
} catch (error) {
	console.error('Error en las pruebas:', error)
}
