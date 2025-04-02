import { prisma } from './queries/queries.js'

const data = await prisma.practicante.findMany({
	select: {
		horario: true,
	},
})

// 2. Consolidar y ordenar horarios
const ordenDias = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab'] // Orden correcto de días

const horarioConsolidado = data.reduce((acc, { horario }) => {
	Object.entries(horario).forEach(([dia, horas]) => {
		acc[dia] = [...new Set([...(acc[dia] || []), ...horas])].sort()
	})
	return acc
}, {})

// Ordenar los días según el orden definido
const horarioOrdenado = {}
ordenDias.forEach((dia) => {
	if (horarioConsolidado[dia]) {
		horarioOrdenado[dia] = horarioConsolidado[dia]
	}
})

// Resultados
console.log('\nHorario consolidado:\n', JSON.stringify(horarioOrdenado, null, 2))
