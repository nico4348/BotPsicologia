import { prisma,obtenerUsuario } from '../../queries/queries.js'


// Mantenemos el nombre original de la función exportada
export async function controladorAgendamiento(datosUsuario) {
	try {
		//console.log('Datos del usuario:', datosUsuario);
		const horarioUsuario = datosUsuario.disponibilidad;
		let practicanteSeleccionado;
		let horariosCoincidentes = [];

		// Verificar si el usuario ya tiene practicante asignado
		if (datosUsuario.practicanteAsignado) {
			//console.log('Usuario ya tiene practicante asignado:', datosUsuario.practicanteAsignado);
			practicanteSeleccionado = await prisma.practicante.findUnique({
				where: { idPracticante: datosUsuario.practicanteAsignado },
			});

			if (!practicanteSeleccionado) {
				throw new Error('Practicante asignado no encontrado');
			}

			//console.log('Practicante seleccionado:', practicanteSeleccionado);
			const horarioPracticante = practicanteSeleccionado.horario;
			horariosCoincidentes = encontrarHorariosCoincidentes(horarioUsuario, horarioPracticante);
			//console.log('Horarios coincidentes:', horariosCoincidentes);

			if (horariosCoincidentes.length === 0) {
				throw new Error('No hay horarios disponibles con el practicante asignado');
			}

			// Verificar disponibilidad de consultorios para cada horario
			horariosCoincidentes = await verificarDisponibilidadConsultorios(
				horariosCoincidentes, 
				practicanteSeleccionado.idPracticante
			);
			//console.log('Horarios coincidentes con consultorios disponibles:', horariosCoincidentes);

			return {
				success: true,
				horarios: horariosCoincidentes.slice(0, 5),
				practicante: {
					idPracticante: practicanteSeleccionado.idPracticante,
					nombre: practicanteSeleccionado.nombre
				}
			};

		} else {
			// Buscar nuevo practicante disponible
			//console.log('Buscando nuevo practicante disponible');
			const practicantes = await prisma.practicante.findMany();
			const practicantesDisponibles = [];

			for (const practicante of practicantes) {
				const horarioPracticante = practicante.horario;
				const coincidencias = encontrarHorariosCoincidentes(
					horarioUsuario,
					horarioPracticante
				);
				//console.log('Coincidencias para practicante', practicante.idPracticante, ':', coincidencias);

				if (coincidencias.length > 0) {
					// Verificar disponibilidad de consultorios
					const horariosVerificados = await verificarDisponibilidadConsultorios(
						coincidencias,
						practicante.idPracticante
					);
					//console.log('Horarios verificados para practicante', practicante.idPracticante, ':', horariosVerificados);

					if (horariosVerificados.length > 0) {
						practicantesDisponibles.push({
							practicante,
							horarios: horariosVerificados
						});
					}
				}
			}

			if (practicantesDisponibles.length === 0) {
				throw new Error('No se encontró disponibilidad con ningún practicante');
			}

			// Seleccionar un practicante aleatorio de los disponibles
			const indiceAleatorio = Math.floor(Math.random() * practicantesDisponibles.length);
			const seleccion = practicantesDisponibles[indiceAleatorio];
			//console.log('Practicante seleccionado aleatoriamente:', seleccion);

			return {
				success: true,
				horarios: seleccion.horarios.slice(0, 5),
				practicante: {
					idPracticante: seleccion.practicante.idPracticante,
					nombre: seleccion.practicante.nombre
				},
				esPrimeraCita: true
			};
		}
	} catch (error) {
		console.error('Error al buscar horarios:', error);
		throw error;
	}
}



function encontrarHorariosCoincidentes(horarioUsuario, horarioPracticante) {
	const horariosCoincidentes = [];
	//console.log('Buscando horarios coincidentes entre usuario y practicante');

	for (const dia in horarioUsuario) {
		if (horarioPracticante[dia]) {
			// Buscar todas las horas coincidentes
			const horasCoincidentes = horarioUsuario[dia].filter((hora) =>
				horarioPracticante[dia].includes(hora)
			);

			if (horasCoincidentes.length > 0) {
				// Agregar cada hora como un horario individual
				horasCoincidentes.forEach(hora => {
					horariosCoincidentes.push({
						dia,
						hora
					});
				});
			}
		}
	}

	//console.log('Horarios coincidentes encontrados:', horariosCoincidentes);
	return horariosCoincidentes;
}

async function verificarDisponibilidadConsultorios(horarios, idPracticante) {
	const horariosDisponibles = [];
	//console.log('Verificando disponibilidad de consultorios para horarios:', horarios);

	for (const horario of horarios) {
		const consultorioDisponible = await encontrarConsultorioDisponible(horario);
		if (consultorioDisponible) {
			horariosDisponibles.push(horario);
		}
	}

	//console.log('Horarios disponibles con consultorios:', horariosDisponibles);
	return horariosDisponibles;
}

async function encontrarConsultorioDisponible(horario) {
	//console.log('Buscando consultorio disponible para horario:', horario);
	const consultorios = await prisma.consultorio.findMany({
		where: { activo: true },
	});

	for (const consultorio of consultorios) {
		const citasExistentes = await prisma.cita.findMany({
			where: {
				idConsultorio: consultorio.idConsultorio,
				fechaHora: `${horario.dia} ${horario.hora}`,
			},
		});

		if (citasExistentes.length === 0) {
			//console.log('Consultorio disponible encontrado:', consultorio);
			return consultorio;
		}
	}

	//console.log('No se encontró consultorio disponible para el horario:', horario);
	return null;
}

// Función para crear la cita cuando el usuario confirme
export async function confirmarCita(datosUsuario, idPracticante, horarioSeleccionado) {
	try {
		//console.log('Confirmando cita para usuario:', datosUsuario.idUsuario, 'con practicante:', idPracticante, 'en horario:', horarioSeleccionado);
		// Buscar consultorio disponible
		const consultorioDisponible = await encontrarConsultorioDisponible(horarioSeleccionado);
		
		if (!consultorioDisponible) {
			throw new Error('No hay consultorios disponibles para el horario seleccionado');
		}

		//console.log('Consultorio disponible encontrado:', consultorioDisponible);

		// Si es primera cita, asignar practicante al usuario
		if (!datosUsuario.practicanteAsignado) {
			await prisma.informacionUsuario.update({
				where: { idUsuario: datosUsuario.idUsuario },
				data: {
					practicanteAsignado: idPracticante,
				},
			});
			//console.log('Practicante asignado al usuario:', idPracticante);
		}

		// Crear la cita
		const nuevaCita = await prisma.cita.create({
			data: {
				idUsuario: datosUsuario.idUsuario,
				idPracticante: idPracticante,
				idConsultorio: consultorioDisponible.idConsultorio,
				fechaHora: `${horarioSeleccionado.dia} ${horarioSeleccionado.hora}`,
			},
		});
		//console.log('Nueva cita creada:', nuevaCita);

		// Actualizar horario del practicante
		const practicante = await prisma.practicante.findUnique({
			where: { idPracticante: idPracticante }
		});

		const horarioPracticanteActualizado = practicante.horario;
		const horaIndex = horarioPracticanteActualizado[horarioSeleccionado.dia]
			.indexOf(horarioSeleccionado.hora);
		
		if (horaIndex > -1) {
			horarioPracticanteActualizado[horarioSeleccionado.dia].splice(horaIndex, 1);
		}

		await prisma.practicante.update({
			where: { idPracticante: idPracticante },
			data: {
				horario: horarioPracticanteActualizado,
			},
		});
		//console.log('Horario del practicante actualizado:', horarioPracticanteActualizado);

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
			}
		};
	} catch (error) {
		console.error('Error al crear cita:', error);
		throw error;
	}
}
// const a =  await controladorAgendamiento(await obtenerUsuario("573127061275"))
// console.log(a)
// console.log( await confirmarCita(await obtenerUsuario("573127061275"),a.practicante.idPracticante,{dia:"mie",hora:"13:00"}))
