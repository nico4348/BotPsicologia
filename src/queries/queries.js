import Prisma from "@prisma/client";
export const prisma = new Prisma.PrismaClient();
import { format } from "@formkit/tempo";
import { apiHorarios } from "../flows/agend/aiHorarios.js";

const preguntas = [
	"1. ¿Ha podido concentrarse bien en lo que hace?\n    0) Mejor que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos que lo habitual.\n    3) Mucho menos que lo habitual.",
	"2. ¿Sus preocupaciones le han hecho perder mucho el sueño?\n    0) No, en absoluto.\n    1) Igual que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.",
	"3. ¿Ha sentido que está desempeñando un papel útil en la vida?\n    0) Más que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos que lo habitual.\n    3) Mucho menos que lo habitual.",
	"4. ¿Se ha sentido capaz de tomar decisiones?\n    0) Más capaz que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos capaz que lo habitual.\n    3) Mucho menos capaz que lo habitual.",
	"5. ¿Se ha sentido constantemente agobiado y en tensión?\n    0) No, en absoluto.\n    1) Igual que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.",
	"6. ¿Ha sentido que no puede superar sus dificultades?\n    0) No, en absoluto.\n    1) Igual que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.",
	"7. ¿Ha sido capaz de disfrutar de sus actividades normales de cada día?\n    0) Más que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos que lo habitual.\n    3) Mucho menos que lo habitual.",
	"8. ¿Ha sido capaz de hacer frente adecuadamente a sus problemas?\n    0) Más capaz que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos capaz que lo habitual.\n    3) Mucho menos capaz que lo habitual.",
	"9. ¿Se ha sentido poco feliz o deprimido/a?\n    0) No, en absoluto.\n    1) No más que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.",
	"10. ¿Ha perdido confianza en sí mismo/a?\n    0) No, en absoluto.\n    1) No más que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.",
	"11. ¿Ha pensado que usted es una persona que no vale para nada?\n    0) No, en absoluto.\n    1) No más que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.",
	"12. ¿Se siente razonablemente feliz considerando todas las circunstancias?\n    0) Más feliz que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos feliz que lo habitual.\n    3) Mucho menos feliz que lo habitual.",
];

//---------------------------------------------------------------------------------------------------------

export const registrarUsuario = async (
	nombre,
	apellido,
	correo,
	tipoDocumento,
	documento,
	numero
) => {
	try {
		const user = await prisma.informacionUsuario.update({
			where: {
				telefonoPersonal: numero,
			},
			data: {
				nombre: nombre,
				apellido: apellido,
				correo: correo,
				tipoDocumento: tipoDocumento,
				documento: documento,
			},
		});
		return user;
	} catch (error) {
		console.error("Error al crear el usuario:", error);
		throw new Error("Hubo un problema al crear el usuario.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const obtenerUsuario = async (numero) => {
	try {
		let user = await prisma.informacionUsuario.findUnique({
			where: {
				telefonoPersonal: numero,
			},
		});

		// Si el usuario no existe, crearlo con un historial inicial
		if (!user) {
			user = await prisma.informacionUsuario.create({
				data: {
					telefonoPersonal: numero,
					historial: [],
				},
				select: {
					historial: true,
				},
			});
			return "";
		}
		return user;
	} catch (error) {
		console.error("Error al obtener el usuario:", error);
		throw new Error("Hubo un problema al obtener el usuario.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const obtenerHist = async (numero) => {
	try {
		// Buscar el usuario por el número de teléfono
		const user = await prisma.informacionUsuario.findUnique({
			where: {
				telefonoPersonal: numero,
			},
			select: {
				historial: true,
			},
		});

		return user.historial;
	} catch (error) {
		console.error("Error al obtener o crear el historial del usuario:", error);
		throw new Error("Hubo un problema al procesar la solicitud de historial.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const saveHist = async (numero, historial) => {
	try {
		await prisma.informacionUsuario.update({
			where: {
				telefonoPersonal: numero,
			},
			data: {
				historial: historial,
			},
		});
	} catch (error) {
		console.error("Error al guardar el historial:", error);
		throw new Error("Hubo un problema al guardar el historial.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const switchAyudaPsicologica = async (numero, opcion) => {
	try {
		await prisma.informacionUsuario.update({
			where: {
				telefonoPersonal: numero,
			},
			data: {
				ayudaPsicologica: opcion,
			},
		});
	} catch (error) {
		console.error("Error al guardar el historial:", error);
		throw new Error("Hubo un problema al guardar el historial.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const switchFlujo = async (numero, flujo) => {
	try {
		await prisma.informacionUsuario.update({
			where: {
				telefonoPersonal: numero,
			},
			data: {
				flujo: flujo,
			},
		});
	} catch (error) {
		console.error("Error al switchear el flujo:", error);
		throw new Error("Hubo un problema al switchear el flujo");
	}
};

//---------------------------------------------------------------------------------------------------------

//Guardar puntaje en usuario

export const savePuntajeUsuario = async (telefono, puntaje, jsonPreg, tipoTest) => {
	return await seleccionarModelo(tipoTest).update({
		where: { telefono },
		data: {
			Puntaje: puntaje,
			resPreg: jsonPreg,
		},
	});
};

//---------------------------------------------------------------------------------------------------------

// Obtener el puntaje y pregunta actual.
export const getEstadoCuestionario = async (telefono, tipoTest) => {
	try {
		const test = seleccionarModelo(tipoTest);
		const infoCues = await test.findUnique({
			where: { telefono },
			select: {
				Puntaje: true,
				preguntaActual: true,
				resPreg: true,
			},
		});
		if (!infoCues) {
			const infoCues = await test.create({
				data: {
					telefono: telefono,
				},
			});
			return infoCues;
		}
		return infoCues;
	} catch (error) {
		console.error("Error obteniendo el estado:", error);
		throw new Error("Hubo un problema obteniendo el estado.");
	}
};
//---------------------------------------------------------------------------------------------------------

// Obtener el puntaje y pregunta actual.
export const getInfoCuestionario = async (telefono, tipoTest) => {
	try {
		const test = seleccionarModelo(tipoTest);
		const infoCues = await test.findUnique({
			where: { telefono },
			select: {
				Puntaje: true,
				preguntaActual: true,
				resPreg: true,
			},
		});
		if (infoCues) {
			const preguntasString = preguntas.join("\n");
			const objetct = { infoCues, preguntasString };
			return objetct;
		} else {
			await test.create({
				data: {
					telefono: telefono,
				},
			});
			return;
		}
	} catch (error) {
		console.error("Error obteniendo el estado:", error);
		throw new Error("Hubo un problema obteniendo el estado.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const changeTest = async (numero, tipoTest) => {
	try {
		const change = await prisma.informacionUsuario.update({
			where: {
				telefonoPersonal: numero,
			},
			data: {
				testActual: tipoTest,
			},
		});
		return change.testActual;
	} catch (error) {
		console.error("Error cambiando el test:", error);
		throw new Error("Hubo un problema cambiando el test.");
	}
};

//---------------------------------------------------------------------------------------------------------

// Guardar el puntaje y pregunta actual.
export const saveEstadoCuestionario = async (
	telefono,
	puntaje,
	preguntaActual,
	resPreg,
	tipoTest
) => {
	return await seleccionarModelo(tipoTest).update({
		where: { telefono },
		data: {
			Puntaje: puntaje,
			preguntaActual: preguntaActual,
			resPreg: resPreg,
		},
	});
};

//---------------------------------------------------------------------------------------------------------
// Función para seleccionar el modelo adecuado basado en el tipo de test
function seleccionarModelo(tipoTest) {
	if (tipoTest != "ghq12") {
		return prisma.tests;
	} else {
		return prisma.ghq12;
	}
}

//---------------------------------------------------------------------------------------------------------

export const actualizarDisp = async (numero, disp) => {
	try {
		const change = await prisma.informacionUsuario.update({
			where: {
				telefonoPersonal: numero,
			},
			data: {
				disponibilidad: disp,
			},
		});
		return change;
	} catch (error) {
		console.error("Error cambiando el test:", error);
		throw new Error("Hubo un problema cambiando el test.");
	}
};

//---------------------------------------------------------------------------------------------------------

//* ABAJO IRAN LAS QUERIES PARA LOS ENDPONTS

//---------------------------------------------------------------------------------------------------------

export const getUsuario = async (documento) => {
	try {
		let user = await prisma.informacionUsuario.findUnique({
			where: {
				documento: documento,
			},
			select: {
				idUsuario: true,
				nombre: true,
				apellido: true,
				correo: true,
				telefonoPersonal: true,
				documento: true,
				tipoDocumento: true,
				testActual: true,
				motivo: true,
				ayudaPsicologica: true,
				tratDatos: true,
				flujo: true,
				sesion: true,
				estado: true,
				disponibilidad: true,
			},
		});

		return user;
	} catch (error) {
		console.error("Error al obtener el Usuario:", error);
		throw new Error("Hubo un problema al obtener el Usuario.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const getPracticante = async (documento) => {
	try {
		let pract = await prisma.practicante.findUnique({
			where: {
				numero_documento: documento,
			},
		});

		return pract;
	} catch (error) {
		console.error("Error al obtener el Practicante:", error);
		throw new Error("Hubo un problema al obtener el Practicante.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const addWebUser = async (
	nombre,
	apellido,
	correo,
	tipoDocumento,
	documento,
	telefonoPersonal
) => {
	try {
		const user = await prisma.informacionUsuario.create({
			data: {
				nombre: nombre,
				apellido: apellido,
				correo: correo,
				tipoDocumento: tipoDocumento,
				documento: documento,
				telefonoPersonal: telefonoPersonal,
			},
		});
		return user;
	} catch (error) {
		console.error("Error al crear el usuario:", error);
		throw new Error("Hubo un problema al crear el usuario.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const addWebPracticante = async (
	nombre,
	documento,
	tipoDocumento,
	genero,
	estrato,
	barrio,
	localidad,
	horario
) => {
	try {
		const parsedHorario = await apiHorarios(horario);
		const pract = await prisma.practicante.create({
			data: {
				nombre: nombre,
				numero_documento: documento,
				tipo_documento: tipoDocumento,
				genero: genero,
				estrato: estrato,
				barrio: barrio,
				localidad: localidad,
				horario: parsedHorario,
			},
		});
		return pract;
	} catch (error) {
		console.error("Error al crear el practicante:", error);
		throw new Error("Hubo un problema al crear el practicante.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const editWebUser = async (
	nombre,
	apellido,
	correo,
	tipoDocumento,
	documento,
	telefonoPersonal
) => {
	try {
		const user = await prisma.informacionUsuario.update({
			where: {
				OR: [
					{ telefonoPersonal: telefonoPersonal },
					{ documento: documento },
					{ correo: correo },
				],
			},
			data: {
				nombre: nombre,
				apellido: apellido,
				correo: correo,
				tipoDocumento: tipoDocumento,
				documento: documento,
			},
		});
		return user;
	} catch (error) {
		console.error("Error al editar el usuario:", error);
		throw new Error("Hubo un problema al editar el usuario.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const editWebPracticante = async (
	nombre,
	documento,
	tipoDocumento,
	genero,
	estrato,
	barrio,
	localidad
) => {
	try {
		const pract = await prisma.practicante.update({
			where: {
				numero_documento: documento,
			},
			data: {
				nombre: nombre,
				tipo_documento: tipoDocumento,
				genero: genero,
				estrato: estrato,
				barrio: barrio,
				localidad: localidad,
			},
		});
		return pract;
	} catch (error) {
		console.error("Error al editar el practicante:", error);
		throw new Error("Hubo un problema al editar el practicante.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const citaWebCheckout = async (idCita) => {
	try {
		const cita = await prisma.cita.update({
			where: {
				idCita: idCita,
			},
			data: {
				estado: "completada",
			},
		});
		return cita;
	} catch (error) {
		console.error("Error al cambiar estado de la cita:", error);
		throw new Error("Hubo un problema al crear la cita.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const getWebConsultorios = async () => {
	try {
		const consultorios = await prisma.consultorio.findMany();
		return consultorios;
	} catch (error) {
		console.error("Error al obtener los consultorios:", error);
		throw new Error("Hubo un problema al obtener los consultorios.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const ChangeWebConsultorio = async (idConsultorio) => {
	try {
		const consultorio = await prisma.consultorio.update({
			where: {
				idConsultorio: idConsultorio,
			},
			data: {
				activo: 0,
			},
		});
		return consultorio;
	} catch (error) {
		console.error("Error al cambiar estado del consultorio:", error);
		throw new Error("Hubo un problema al cambiar estado del consultorio.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const getWebCitas = async (diaActual) => {
	try {
		// Formatear la fecha actual a 'YYYY-MM-DD'
		const fechaFormateada = format(diaActual, "YYYY-MM-DD");

		// Definir el inicio y fin del día
		const inicioDelDia = new Date(`${fechaFormateada}T00:00:00`);
		const finDelDia = new Date(`${fechaFormateada}T23:59:59.999`);

		const citas = await prisma.cita.findMany({
			where: {
				fechaHora: {
					gte: inicioDelDia,
					lte: finDelDia,
				},
			},
			include: {
				usuario: true,
				practicante: true,
				consultorio: true,
			},
		});

		//ahora por cada cita mapea el usuario, el practicante y el consultorio

		return citas;
	} catch (error) {
		console.error("Error al obtener las citas:", error);
		throw new Error("Hubo un problema al obtener las citas.");
	}
};

//---------------------------------------------------------------------------------------------------------

export const citasPorPaciente = async (idPaciente) => {
	try {
		const citas = await prisma.cita.findMany({
			where: {
				idPaciente: idPaciente,
			},
		});
		return citas;
	} catch (error) {
		console.error("Error al obtener las citas:", error);
		throw new Error("Hubo un problema al obtener las citas.");
	}
};

//querie para añadir motivo en usuario
export const addMotivo = async (numero, motivo) => {
	try {
		const change = await prisma.informacionUsuario.updateMany({
			where: {
				telefonoPersonal: numero,
			},
			data: {
				motivo: motivo,
			},
		});
		return change;
	} catch (error) {
		console.error("Error cambiando el test:", error);
		throw new Error("Hubo un problema cambiando el test.");
	}
};

//quiero una query que traiga la primera cita con un id pacioente
export const getCita = async (idPaciente) => {
	try {
		const cita = await prisma.cita.findFirst({
			where: {
				idUsuario: idPaciente,
			},
			include: {
				usuario: true,
				practicante: true,
				consultorio: true,
			},
		});
		return cita;
	} catch (error) {
		console.error("Error al obtener la cita:", error);
		throw new Error("Hubo un problema al obtener la cita.");
	}
};
