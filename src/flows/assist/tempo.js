import { format } from '@formkit/tempo'

const cita = 'vie 16:00'
const hoy = new Date()

// Función para obtener la próxima fecha basada en el siguiente lunes
function obtenerProximaFecha(cita, hoy) {
	const diasSemana = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']

	// Dividimos la cita en día y hora
	const [diaStr, horaStr] = cita.split(' ')
	const [hora, minuto] = horaStr.split(':').map(Number)

	// Día de la semana de la cita
	const diaSemanaCita = diasSemana.indexOf(diaStr.toLowerCase())
	if (diaSemanaCita === -1) {
		throw new Error('Día de la semana inválido.')
	}

	// Encuentra el próximo lunes desde hoy
	const diaSemanaHoy = hoy.getDay()
	const diasHastaLunes = (8 - diaSemanaHoy) % 7 // Días para llegar al lunes siguiente
	const siguienteLunes = new Date(hoy)
	siguienteLunes.setDate(hoy.getDate() + diasHastaLunes)
	siguienteLunes.setHours(0, 0, 0, 0) // Ajustar a las 00:00 del próximo lunes

	// Calcula la diferencia entre el lunes y el día de la cita
	const diferenciaDias = (diaSemanaCita - 1 + 7) % 7 // Ajusta considerando lunes como base

	// Suma los días para llegar al día de la cita
	const fechaCita = new Date(siguienteLunes)
	fechaCita.setDate(siguienteLunes.getDate() + diferenciaDias)
	fechaCita.setHours(hora, minuto, 0, 0)

	return fechaCita
}

const fechaCita = obtenerProximaFecha(cita, hoy)
console.log(fechaCita) // Muestra el objeto Date
console.log(format(fechaCita, 'full')) // Muestra la fecha formateada
