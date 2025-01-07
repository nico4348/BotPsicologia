import Prisma from '@prisma/client'
export const prisma = new Prisma.PrismaClient()
import { register } from '../prompts.js'

//==========================================================================================================================================

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

//==========================================================================================================================================

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
					historial: [{ role: 'system', content: register }], // Cambia 'register' si es una variable externa.
				},
				select: {
					historial: true,
				},
			})
			return null
		}
		return user.apellido
	} catch (error) {
		console.error('Error al obtener el usuario:', error)
		throw new Error('Hubo un problema al obtener el usuario.')
	}
}

//==========================================================================================================================================

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

		// Devolver el historial del usuario si ya existe
		console.log(user.historial)
		return user.historial
	} catch (error) {
		console.error('Error al obtener o crear el historial del usuario:', error)
		throw new Error('Hubo un problema al procesar la solicitud de historial.')
	}
}

//==========================================================================================================================================

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
