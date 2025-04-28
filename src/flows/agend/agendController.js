import { prisma, obtenerUsuario } from "../../queries/queries.js";

/**
 * Devuelve la próxima fecha (YYYY-MM-DD) correspondiente al día de la semana dado.
 * @param {'lun'|'mar'|'mie'|'jue'|'vie'|'sab'|'dom'} diaAbrev
 */
function obtenerProximaFecha(diaAbrev) {
	const mapDias = { dom: 0, lun: 1, mar: 2, mie: 3, jue: 4, vie: 5, sab: 6 };
	const hoy = new Date();
	const hoyNum = hoy.getDay();
	const target = mapDias[diaAbrev];
	if (target === undefined) throw new Error(`Día inválido: ${diaAbrev}`);
	let diff = target - hoyNum;
	if (diff <= 0) diff += 7;
	const proxima = new Date(hoy);
	proxima.setDate(hoy.getDate() + diff);
	const yyyy = proxima.getFullYear();
	const mm = String(proxima.getMonth() + 1).padStart(2, "0");
	const dd = String(proxima.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

export async function controladorAgendamiento(datosUsuario) {
	try {
		const disponibilidadUsuario = datosUsuario.disponibilidad;
		if (!disponibilidadUsuario || Object.keys(disponibilidadUsuario).length === 0) {
			throw new Error("El usuario no tiene disponibilidad registrada");
		}

		// 1) Traer TODOS los practicantes con sesiones ≤ 70
		const candidatos = await prisma.practicante.findMany({
			where: { sesiones: { lte: 70 } },
		});

		// 2) Filtrar solo los que tengan horas coincidentes
		const disponibles = [];
		for (const prac of candidatos) {
			const coincidencias = encontrarHorariosCoincidentes(
				disponibilidadUsuario,
				prac.horario
			);
			if (coincidencias.length > 0) {
				disponibles.push({ practicante: prac, coincidencias });
			}
		}

		if (disponibles.length === 0) {
			throw new Error("No hay practicantes disponibles con ese horario y ≤ 70 sesiones");
		}

		// 3) Selección aleatoria de un practicante válido
		const idx = Math.floor(Math.random() * disponibles.length);
		const { practicante, coincidencias } = disponibles[idx];
		const horarioCoincidente = coincidencias[0]; // tomamos el primer bloque
		const dia = horarioCoincidente.dia; // ej. 'mie'
		const hora = horarioCoincidente.horas[0]; // ej. '10:00'

		// 4) Convertir día+hora en un objeto Date
		const fechaStr = obtenerProximaFecha(dia); // '2025-04-23'
		const fechaHora = new Date(`${fechaStr}T${hora}:00`);

		// 5) Buscar un consultorio libre en esa fechaHora
		const consultorios = await prisma.consultorio.findMany({ where: { activo: true } });
		let consultorioSeleccionado = null;
		for (const c of consultorios) {
			const ocupada = await prisma.cita.findFirst({
				where: {
					idConsultorio: c.idConsultorio,
					fechaHora,
				},
			});
			if (!ocupada) {
				consultorioSeleccionado = c;
				break;
			}
		}
		if (!consultorioSeleccionado) {
			throw new Error("No hay consultorios disponibles en esa franja");
		}

		// 6) Crear la cita
		const nuevaCita = await prisma.cita.create({
			data: {
				idUsuario: datosUsuario.idUsuario,
				idPracticante: practicante.idPracticante,
				idConsultorio: consultorioSeleccionado.idConsultorio,
				fechaHora,
			},
		});

		// 7) Actualizar horario del practicante (remover la hora reservada) y aumentar sesiones
		const horarioActualizado = { ...practicante.horario };
		const listaHoras = horarioActualizado[dia];
		const pos = listaHoras.indexOf(hora);
		if (pos > -1) listaHoras.splice(pos, 1);

		await prisma.practicante.update({
			where: { idPracticante: practicante.idPracticante },
			data: {
				horario: horarioActualizado,
				sesiones: { increment: 1 },
			},
		});

		// 8) Asignar PRÁCTICANTE al usuario (para futuras citas)
		await prisma.informacionUsuario.update({
			where: { idUsuario: datosUsuario.idUsuario },
			data: { practicanteAsignado: practicante.idPracticante },
		});

		return {
			success: true,
			cita: {
				...nuevaCita,
				practicante: {
					idPracticante: practicante.idPracticante,
					nombre: practicante.nombre,
				},
				consultorio: {
					idConsultorio: consultorioSeleccionado.idConsultorio,
					nombre: consultorioSeleccionado.nombre,
				},
			},
		};
	} catch (error) {
		console.error("Error en agendamiento:", error);
		throw error;
	}
}

/**
 * Recorre ambos JSON de disponibilidad y devuelve un array
 * de { dia, horas: [...] } donde intersectan.
 */
function encontrarHorariosCoincidentes(horarioUsuario, horarioPracticante) {
	const result = [];
	for (const dia in horarioUsuario) {
		if (!horarioPracticante[dia]) continue;
		const comunes = horarioUsuario[dia].filter((h) => horarioPracticante[dia].includes(h));
		if (comunes.length) {
			result.push({ dia, horas: comunes });
		}
	}
	return result;
}

const userData = await obtenerUsuario("1"); // Reemplaza "userId" con el ID del usuario que deseas consultar
console.log(await controladorAgendamiento(userData));
