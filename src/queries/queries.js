import Prisma from '@prisma/client'
export const prisma = new Prisma.PrismaClient()

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
		})
		return user
	} catch (error) {
		console.error('Error al crear el usuario:', error)
		throw new Error('Hubo un problema al crear el usuario.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const obtenerUsuario = async (numero) => {
	try {
		let user = await prisma.informacionUsuario.findUnique({
			where: {
				telefonoPersonal: numero,
			},
		})

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
			})
			return ''
		}
		return user
	} catch (error) {
		console.error('Error al obtener el usuario:', error)
		throw new Error('Hubo un problema al obtener el usuario.')
	}
}

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
		})

		return user.historial
	} catch (error) {
		console.error('Error al obtener o crear el historial del usuario:', error)
		throw new Error('Hubo un problema al procesar la solicitud de historial.')
	}
}

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
		})
	} catch (error) {
		console.error('Error al guardar el historial:', error)
		throw new Error('Hubo un problema al guardar el historial.')
	}
}

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
		})
	} catch (error) {
		console.error('Error al guardar el historial:', error)
		throw new Error('Hubo un problema al guardar el historial.')
	}
}

//---------------------------------------------------------------------------------------------------------

//Guardar puntaje en usuario

export const savePuntajeUsuario = async (telefono, puntaje, jsonPreg, tipoTest) => {
	return await seleccionarModelo(tipoTest).update({
		where: { telefono },
		data: {
			Puntaje: puntaje,
			resPreg: jsonPreg,
		},
	})
}

//---------------------------------------------------------------------------------------------------------

// Obtener el puntaje y pregunta actual.
export const getEstadoCuestionario = async (telefono, tipoTest) => {
	const info = await seleccionarModelo(tipoTest).findUnique({
		where: { telefono },
		select: {
			Puntaje: true,
			preguntaActual: true,
			resPreg: true,
		},
	})
	return info
}

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
	})
}
//---------------------------------------------------------------------------------------------------------

// Función para seleccionar el modelo adecuado basado en el tipo de test
function seleccionarModelo(tipoTest) {
	if (tipoTest != 'ghq12') {
		return prisma.tests
	} else {
		return prisma.ghq12
	}
}

//---------------------------------------------------------------------------------------------------------
