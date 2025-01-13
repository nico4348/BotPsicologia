/*  ------------------------ processMensaje.js ------------------------
	Este archivo se encarga de manejar la logica del flujo de mensajes
	para el tratamiento de datos y cuestionarios de la aplicacion
	Aca se hacen varias validaciones para llevar al usuario al 
	Cuestionario correspondiente.
	--------------------------------------------------------------------
*/
import axios from 'axios'
import { iniciarCuestionario } from './cuestionario.js'
let esPrimeraVez = true
const mensajesTest = {
	// Objeto para enviar el mensaje de las instrucciones del test
	ghq12: 'A continuación, se le presentará el cuestionario GHQ-12 que tiene como objetivo evaluar su estado de Salud durante las últimas dos semanas. Por favor, lea detenidamente cada pregunta y seleccione la respuesta que mejor describa cómo se ha sentido o comportado en ese período de tiempo. Sus respuestas son importantes y serán tratadas con total confidencialidad.',
	dep: 'A continuación, se le presentará el Inventario de Depresión de Beck (BDI-2). Este cuestionario consta de 21 grupos de afirmaciones. Por favor, lea con atención cada uno de ellos cuidadosamente. Luego elija uno de cada grupo, el que mejor describa el modo como se ha sentido las últimas dos semanas, incluyendo el día de hoy. Si varios enunciados de un mismo grupo le parecen igualmente apropiados, marque el número más alto.',
	ans: 'A continuacion, se le presentara el Inventario de Ansiedad de Beck (BAI). Este cuestionario es una lista de sintomas comunes de a ansiedad. Lea cada uno de los items atentamente, e indique cuanto le ha afectado en la ultima semana incluyendo hoy.',
	estr: 'A continuacion, se le presentará el Inventario de Estres de escala percibida. Las preguntas hacen referencia a tus sentimientos y pensamientos durante el ultimo mes. En cada caso por favor indica como te has sentido o como has enfrentado cada situacion.',
	calvida:
		'A continuación, Este cuestionario sirve para conocer su opinión acerca de su calidad de vida, su salud y otras áreas de su vida. Por favor, conteste a todas las preguntas. Sus respuestas son importantes y serán tratadas con total confidencialidad.',
	suic: 'A continuación, se le presentará la Escala de Ideación Suicida. Esta herramienta tiene como objetivo evaluar la intencionalidad suicida o el grado de seriedad e intensidad con el que alguien ha pensado o está pensando en suicidarse. Por favor, lea cada ítem cuidadosamente y seleccione la respuesta que mejor describa cómo se ha sentido o pensado en los últimos tiempos, incluyendo el día de hoy.',
}

export async function procesarMensaje(numeroUsuario, mensaje, tipoTest) {
	console.log(`Tipo de test: ${tipoTest}`)
	console.log(esPrimeraVez)

	if (esPrimeraVez) {
		esPrimeraVez = false
		axios.post('http://localhost:3000/v1/messages', {
			number: 'numeroUsuario',
			message: `${mensajesTest[tipoTest]}`,
		})
	}

	const resultadoCuestionario = await iniciarCuestionario(numeroUsuario, mensaje, tipoTest)

	return resultadoCuestionario // Responder al usuario con el resultado del cuestionario
}
