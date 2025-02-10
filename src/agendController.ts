import { prisma } from './queries/queries.js'

interface user {
	idUsuario: string
	documento: string
	motivo: string
	disponibilidad: { [key: string]: string[] }
}

const asignaCita = async (usuario: user) => {
	const nombre = await prisma.informacionUsuario.findUnique({
		where: { idUsuario: usuario.idUsuario },
		select: {
			nombre: true,
		},
	})
	return nombre
}

const usuarioEjemplo: user = {
	idUsuario: '13f74330-e538-40ac-86d5-898763d67154',
	documento: '1000224056',
	motivo: '',
	disponibilidad: {
		jue: ['13:00', '14:00', '15:00', '16:00', '17:00'],
		lun: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'],
	},
}
console.log(await asignaCita(usuarioEjemplo))
