/*  ------------------ cuestionario.js ------------------------
	Este archivo se encarga de manejar los cuestionarios
	Dependiendo del cuestionario que se elija, 
	se inicia el cuestionario y se evalua el puntaje.
	-----------------------------------------------------------
*/

import { apiCuest } from '../openai/aiResponses/aiCuest.js'
import {
	getEstadoCuestionario,
	saveEstadoCuestionario,
	savePuntajeUsuario,
} from '../prisma/funcionalidades.js'

export const iniciarCuestionario = async (numeroUsuario, msg, tipoTest) => {
	const config = cuestionariosConfig[tipoTest]
	if (!config) throw new Error('Tipo de test no reconocido')

	const { preguntas, umbrales, resPreg } = config

	try {
		let estado = await getEstadoCuestionario(numeroUsuario, tipoTest)

		// Si no hay estado, inicializamos el cuestionario
		if (estado.resPreg == null) {
			estado = {
				puntaje: 0,
				preguntaActual: 0,
				resPreg: resPreg,
			}
			await saveEstadoCuestionario(
				numeroUsuario,
				estado.Puntaje,
				estado.preguntaActual,
				estado.resPreg,
				tipoTest
			)
			return preguntas[estado.preguntaActual]
		}

		let respuesta = apiCuest(msg, tipoTest)
		respuesta = Number(respuesta)

		if (estado.preguntaActual < preguntas.length) {
			estado.Puntaje += respuesta
			console.log(estado.Puntaje)
			estado.resPreg[respuesta].push(estado.preguntaActual + 1)

			if (estado.preguntaActual + 1 >= preguntas.length) {
				await saveEstadoCuestionario(
					numeroUsuario,
					estado.Puntaje,
					estado.preguntaActual + 1,
					estado.resPreg,
					tipoTest
				)
				await savePuntajeUsuario(numeroUsuario, estado.Puntaje, estado.resPreg, tipoTest)
				return evaluarResultado(estado.Puntaje, umbrales)
			}

			estado.preguntaActual += 1
			await saveEstadoCuestionario(
				numeroUsuario,
				estado.Puntaje,
				estado.preguntaActual,
				estado.resPreg,
				tipoTest
			)

			return preguntas[estado.preguntaActual]
		} else {
			return evaluarResultado(estado.Puntaje, umbrales)
		}
	} catch (error) {
		let estado = await getEstadoCuestionario(numeroUsuario, tipoTest)
		return preguntas[estado.preguntaActual]
	}
}

const evaluarResultado = (puntaje, umbrales) => {
	if (puntaje <= umbrales.bajo.max) {
		return `El cuestionario ha terminado. Su puntaje final es: ${puntaje} 🟢 \n${umbrales.bajo.mensaje}`
	} else if (puntaje >= umbrales.medio.min && puntaje <= umbrales.medio.max) {
		return `El cuestionario ha terminado. Su puntaje final es: ${puntaje} 🟡 \n${umbrales.medio.mensaje}`
	} else if (puntaje >= umbrales.alto.min) {
		return `El cuestionario ha terminado. Su puntaje final es: ${puntaje} 🔴 \n${umbrales.alto.mensaje}`
	} else {
		return 'Hubo un error en su puntaje'
	}
}

const cuestionariosConfig = {
	ghq12: {
		preguntas: [
			'1. ¿Ha podido concentrarse bien en lo que hace?\n    0) Mejor que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos que lo habitual.\n    3) Mucho menos que lo habitual.',
			'2. ¿Sus preocupaciones le han hecho perder mucho el sueño?\n    0) No, en absoluto.\n    1) Igual que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
			'3. ¿Ha sentido que está desempeñando un papel útil en la vida?\n    0) Más que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos que lo habitual.\n    3) Mucho menos que lo habitual.',
			'4. ¿Se ha sentido capaz de tomar decisiones?\n    0) Más capaz que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos capaz que lo habitual.\n    3) Mucho menos capaz que lo habitual.',
			'5. ¿Se ha sentido constantemente agobiado y en tensión?\n    0) No, en absoluto.\n    1) Igual que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
			'6. ¿Ha sentido que no puede superar sus dificultades?\n    0) No, en absoluto.\n    1) Igual que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
			'7. ¿Ha sido capaz de disfrutar de sus actividades normales de cada día?\n    0) Más que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos que lo habitual.\n    3) Mucho menos que lo habitual.',
			'8. ¿Ha sido capaz de hacer frente adecuadamente a sus problemas?\n    0) Más capaz que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos capaz que lo habitual.\n    3) Mucho menos capaz que lo habitual.',
			'9. ¿Se ha sentido poco feliz o deprimido/a?\n    0) No, en absoluto.\n    1) No más que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
			'10. ¿Ha perdido confianza en sí mismo/a?\n    0) No, en absoluto.\n    1) No más que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
			'11. ¿Ha pensado que usted es una persona que no vale para nada?\n    0) No, en absoluto.\n    1) No más que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
			'12. ¿Se siente razonablemente feliz considerando todas las circunstancias?\n    0) Más feliz que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos feliz que lo habitual.\n    3) Mucho menos feliz que lo habitual.',
		],
		umbrales: {
			bajo: {
				max: 11,
				mensaje: 'No hay presencia de síntomas significativos de malestar psicológico 🟢',
			},
			medio: { min: 12, max: 18, mensaje: 'Hay cierto grado de preocupación emocional 🟡' },
			alto: { min: 19, mensaje: 'Hay un indicador de malestar psicológico significativo 🔴' },
		},
		resPreg: {
			0: [],
			1: [],
			2: [],
			3: [],
		},
	},

	dep: {
		preguntas: [
			'1. Tristeza\n    0) No me siento triste.\n    1) Me siento triste gran parte del tiempo.\n    2) Me siento triste todo el tiempo.\n    3) Me siento tan triste o soy tan infeliz que no puedo soportarlo.',
			'2. Pesimismo\n    0) No estoy desalentado respecto de mi futuro.\n    1) Me siento más desalentado respecto de mi futuro que lo que solía estarlo.\n    2) No espero que las cosas funcionen para mi.\n    3) Siento que no hay esperanza para mi futuro y que sólo puede empeorar.',
			'3. Fracaso\n    0) No me siento como un fracasado.\n    1) He fracasado más de lo que hubiera debido.\n    2) Cuando miro hacia atrás, veo muchos fracasos.\n    3) Siento que como persona soy un fracaso total.',
			'4. Pérdida de Placer\n    0) Obtengo tanto placer como siempre por las cosas de las que disfruto.\n    1) No disfruto tanto de las cosas como solía hacerlo.\n    2) Obtengo muy poco placer de las cosas que solía disfrutar.\n    3) No puedo obtener ningún placer de las cosas de las que solía disfrutar.',
			'5. Sentimientos de Culpa\n    0) No me siento particularmente culpable.\n    1) Me siento culpable respecto de varias cosas que he hecho o que debería haber hecho.\n    2) Me siento bastante culpable la mayor parte del tiempo.\n    3) Me siento culpable todo el tiempo.',
			'6. Sentimientos de Castigo\n    0) No siento que estoy siendo castigado\n    1) Siento que tal vez pueda ser castigado.\n    2) Espero ser castigado.\n    3) Siento que estoy siendo castigado.',
			'7. Disconformidad con uno mismo\n    0) Siento acerca de mi lo mismo que siempre.\n    1) He perdido la confianza en mí mismo.\n    2) Estoy decepcionado conmigo mismo.\n    3) No me gusto a mí mismo.',
			'8. Autocrítica\n    0) No me critico ni me culpo más de lo habitual\n    1) Estoy más crítico conmigo mismo de lo que solía estarlo\n    2) Me critico a mí mismo por todos mis errores\n    3) Me culpo a mí mismo por todo lo malo que sucede.',
			'9. Pensamientos o Deseos Suicidas\n    0) No tengo ningún pensamiento de matarme.\n    1) He tenido pensamientos de matarme, pero no lo haría\n    2) Querría matarme\n    3) Me mataría si tuviera la oportunidad de hacerlo.',
			'10. Llanto\n    0) No lloro más de lo que solía hacerlo.\n    1) Lloro más de lo que solía hacerlo.\n    2) Lloro por cualquier pequeñez.\n    3) Siento ganas de llorar pero no puedo.',
			'11. Agitación\n    0) No estoy más inquieto o tenso que lo habitual.\n    1) Me siento más inquieto o tenso que lo habitual.\n    2) Estoy tan inquieto o agitado que me es difícil quedarme quieto\n    3) Estoy tan inquieto o agitado que tengo que estar siempre en movimiento o haciendo algo.',
			'12. Pérdida de Interés\n    0) No he perdido el interés en otras actividades o personas.\n    1) Estoy menos interesado que antes en otras personas o cosas.\n    2) He perdido casi todo el interés en otras personas o cosas.\n    3) Me es difícil interesarme por algo.',
			'13. Indecisión\n    0) Tomo mis propias decisiones tan bien como siempre.\n    1) Me resulta más difícil que de costumbre tomar decisiones\n    2) Encuentro mucha más dificultad que antes para tomar decisiones.\n    3) Tengo problemas para tomar cualquier decisión.',
			'14. Desvalorización\n    0) No siento que yo no sea valioso\n    1) No me considero a mí mismo tan valioso y útil como solía considerarme\n    2) Me siento menos valioso cuando me comparo con otros.\n    3) Siento que no valgo nada.',
			'15. Pérdida de Energía\n    0) Tengo tanta energía como siempre.\n    1) Tengo menos energía que la que solía tener.\n    2) No tengo suficiente energía para hacer demasiado\n    3) No tengo energía suficiente para hacer nada.',
			'16. Cambios en los Hábitos de Sueño\n    0) No he experimentado ningún cambio en mis hábitos de sueño.\n    1) Duermo un poco más/menos que lo habitual.\n    2. Duermo mucho más/menos que lo habitual.\n    3) Duermo la mayor parte del día o Me despierto 1-2 horas más temprano y no puedo volver a dormirme.',
			'17. Irritabilidad\n    0) No estoy tan irritable que lo habitual.\n    1) Estoy más irritable que lo habitual.\n    2) Estoy mucho más irritable que lo habitual.\n    3) Estoy irritable todo el tiempo.',
			'18. Cambios en el Apetito\n    0) No he experimentado ningún cambio en mi apetito.\n    1) Mi apetito es un poco mayor/menor que lo habitual.\n    2) Mi apetito es mucho mayor/menor que antes.\n    3) No tengo/Tengo mucho apetito en todo el día.',
			'19. Dificultad de Concentración\n    0) Puedo concentrarme tan bien como siempre.\n    1) No puedo concentrarme tan bien como habitualmente.\n    2) Me es difícil mantener la mente en algo por mucho tiempo.\n    3) Encuentro que no puedo concentrarme en nada.',
			'20. Cansancio o Fatiga\n    0) No estoy más cansado o fatigado que lo habitual.\n    1) Me fatigo o me canso más fácilmente que lo habitual.\n    2) Estoy demasiado fatigado o cansado para hacer muchas de las cosas que solía hacer.\n    3) Estoy demasiado fatigado o cansado para hacer la mayoría de las cosas que solía hacer.',
			'21. Pérdida de Interés en el Sexo\n    0) No he notado ningún cambio reciente en mi interés por el sexo.\n    1) Estoy menos interesado en el sexo de lo que solía estarlo.\n    2) Estoy mucho menos interesado en el sexo.\n    3) He perdido completamente el interés en el sexo.',
		],
		umbrales: {
			bajo: { max: 5, mensaje: 'Estado emocional saludable 🟢' },
			medio: { min: 6, max: 10, mensaje: 'Posible depresión leve 🟡' },
			alto: { min: 11, mensaje: 'Posible depresión grave 🔴' },
		},
		resPreg: {
			0: [],
			1: [],
			2: [],
			3: [],
		},
	},
	// Otros cuestionarios...
	ans: {
		preguntas: [
			'1. Torpe o entumecido.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'2. Acalorado.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'3. Con temblor en las piernas.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'4. Incapaz de relajarse\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'5. Con temor a que ocurra lo peor.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'6. Mareado, o que se le va la cabeza\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'7. Con latidos del corazón fuertes y acelerados.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'8. Inestable.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'9. Atemorizado o asustado\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'10. Nervioso.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'11. Con sensación de bloqueo.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'12. Con temblores en las manos.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'13. Inquieto, inseguro.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'14. Con miedo a perder el control.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'15. Con sensación de ahogo.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'16. Con temor a morir.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'17. Con miedo.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'18. Con problemas digestivos\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'19. Con desvanecimientos\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'20. Con rubor facial.\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
			'21. Con sudores, frios o calientes\n    0) En absoluto.\n    1) Levemente.\n    2) Moderadamente.\n    3) Severamente.',
		],
		umbrales: {
			bajo: { max: 21, mensaje: 'Ansiedad saludable 🟢' },
			medio: { min: 22, max: 36, mensaje: 'Ansiedad moderada 🟡' },
			alto: { min: 36, mensaje: 'Ansiedad severa 🔴' },
		},
		resPreg: {
			0: [],
			1: [],
			2: [],
			3: [],
		},
	},
	estr: {
		preguntas: [
			'1. ¿Con qué frecuencia te has sentido afectado por algo que ocurrió inesperadamente?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'2. ¿Con qué frecuencia te has sentido incapaz de controlar las cosas importantes en tu vida?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'3. ¿Con qué frecuencia te has sentido nervioso o estresado?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'4. ¿Con qué frecuencia has manejado con éxito los pequeños problemas irritantes de la vida?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'5. ¿Con qué frecuencia has sentido que has afrontado efectivamente los cambios importantes que han estado ocurriendo en tu vida?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'6. ¿Con qué frecuencia has estado seguro sobre tu capacidad para manejar tus problemas personales?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'7. ¿Con qué frecuencia has sentido que las cosas van bien?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'8. ¿Con qué frecuencia has sentido que no podías afrontar todas las cosas que tenías que hacer?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'9. ¿Con qué frecuencia has podido controlar las dificultades de tu vida?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'10. ¿Con qué frecuencia has sentido que tenías todo bajo control?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'11. ¿Con qué frecuencia has estado enfadado porque las cosas que te han ocurrido estaban fuera de tu control?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'12. ¿Con qué frecuencia has pensado sobre las cosas que te faltan por hacer?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'13. ¿Con qué frecuencia has podido controlar la forma de pasar el tiempo?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
			'14. ¿Con qué frecuencia has sentido que las dificultades se acumulan tanto que no puedes superarlas?\n    0) Nunca.\n    1) Casi nunca.\n    2) De vez en cuando.\n    3) A menudo.\n    4) Muy a menudo.',
		],
		umbrales: {
			bajo: { max: 19, mensaje: 'Estres saludable 🟢' },
			medio: { min: 20, max: 25, mensaje: 'Estres moderado 🟡' },
			alto: { min: 56, mensaje: 'Estres severo 🔴' },
		},
		resPreg: {
			0: [],
			1: [],
			2: [],
			3: [],
			4: [],
		},
	},
	suic: {
		preguntas: [
			'1. Deseo de vivir\n    0) Moderado a fuerte.\n    1) Débil.\n    2) Ninguno ',
			'2. Deseo de morir\n    0) Ninguno.\n    1) Débil.\n    2) Moderado a fuerte',
			'3. Razones para vivir/morir\n    0) Porque seguir viviendo vale más que morir.\n    1) Aproximadamente iguales.\n    2) Porque la muerte vale más que seguir viviendo.',
			'4. Deseo de intentar activamente el suicidio\n    0) Ninguno.\n    1) Débil.\n    2) Moderado a fuerte',
			'5. Deseos pasivos de suicidio\n    0) Puede tomar precauciones para salvaguardar la vida.\n    1) Puede dejar de vivir/morir por casualidad.\n    2) Puede evitar las etapas necesarias para seguir con vida.',
			'6. Dimensión temporal (duración de la ideación/deseo suicida)\n    0) Breve, períodos pasajeros\n    1) Por amplios períodos de tiempo.\n    2) Continuo (crónico) o casi continuo.',
			'7. Dimensión temporal (frecuencia del suicidio)\n    0) Raro, ocasional.\n    1) Intermitente.\n    2) Persistente o continuo.',
			'8. Actitud hacia la ideación/deseo\n    0) Rechazo\n    1) Ambivalente, indiferente\n    2) Aceptación.',
			'9. Control sobre la actividad suicida/deseos de acting out\n    0) Tiene sentido del control.\n    1) Inseguro.\n    2) No tiene sentido del control.',
			'10. Disuasivos para un intento activo (familia, religión, irreversibilidad)\n    0) Puede no intentarlo a causa de un disuasivo.\n    1) Alguna preocupación sobre los medios pueden disuadirlo.\n    2) Mínima o ninguna preocupación o interés por ellos.',
			'11. Razones para el intento contemplado\n    0) Manipular el entorno, llamar la atención, vengarse.\n    1) Combinación de 0 y 2.\n    2) Escapar, solucionar los problemas, finalizar de forma absoluta.',
			'12. Método (especificidad/planificación del intento contemplado)\n    0) No considerado.\n    1) Considerado, pero detalles no calculados.\n    2) Detalles calculados/bien formulados.',
			'13. Método (accesibilidad/oportunidad para el intento contemplado)\n    0) Método no disponible, inaccesible. No hay oportunidad.\n    1) El método puede tomar tiempo o esfuerzo. Oportunidad escasa.\n    2) Futura oportunidad o accesibilidad del método previsto.',
			'14. Sentido de «capacidad» para llevar adelante el intento\n    0) No tiene valor, demasiado débil, miedoso, incompetente.\n    1) Inseguridad sobre su valor.\n    2) Seguros de su valor, capacidad.',
			'15. Expectativas/espera del intento actual\n    0) No.\n    1) Incierto.\n    2) Sí.',
			'16. Preparación actual para el intento contemplado\n    0) Ninguna.\n    1) Parcial (p. ej., empieza a almacenar pastillas, etc.).\n    2) Completa (p. ej., tiene las pastillas, pistola cargada, etc.).',
			'17. Nota suicida\n    0) Ninguna.\n    1) Piensa sobre ella o comenzada y no terminada.\n    2) Nota terminada.',
			'18. Actos finales en anticipación de la muerte (p. ej., testamento, póliza de seguros, etc.)\n    0) Ninguno.\n    1) Piensa sobre ello o hace algunos arreglos.\n    2) Hace planes definitivos o terminó los arreglos finales.',
			'19. Engaño/encubrimiento del intento contemplado\n    0) Reveló las ideas abiertamente.\n    1) Frenó lo que estaba expresando.\n    2) Intentó engañar, ocultar, mentir.',
		],
		umbrales: {
			bajo: { max: 1, mensaje: 'Sin indicativo de suicido 🟢' },
			medio: { min: 2, max: 10, mensaje: 'Riesgo de suicido 🟡' },
			alto: { min: 38, mensaje: 'Alto riesgo de suicido 🔴' },
		},
		resPreg: {
			0: [],
			1: [],
			2: [],
		},
	},
	calvida: {
		preguntas: [
			'1. ¿Como puntuaria su calidad de vida?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'2. ¿Cuan satisfecho esta con su salud?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'3. ¿En que medida piensa que el dolor (fisico) le impide hacer lo que necesita?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'4. ¿Cuanto necesita de cualquier tratamiento medico para funcionar en su vida diaria?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'5. ¿Cuanto disfrutas de la vida?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'6. ¿En que medida siente que su vida tiene sentido?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'7. ¿Cual es su capacidad de concentracion?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'8. ¿Cuanta seguridad siente en su vida diaria?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'9. ¿Cuan saludable es el ambiente fisico a su alrededor?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'10. ¿Tiene energia suficiente para la vida diaria?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'11. ¿Es capaz de aceptar su apariencia fisica?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'12. ¿Tiene suficiente dinero para cubrir sus necesidades?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'13. ¿Que disponibilidad tiene de la informacion que necesita en su vida diaria?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'14. ¿Hasta que punto tiene oportunidad para realizar actividades de ocio?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'15. ¿Es capaz de desplazarse de un lugar a otro?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'16. ¿Cuan satisfecho/a esta con su sueño?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'17. ¿Cuan satisfecho/a esta con su habilidad para realizar sus actividades de la vida diaria?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'18. ¿Cuan satisfecho/a esta con su capacidad de trabajo?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'19. ¿Cuan satisfecho/a esta de si mismo?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'20. ¿Cuan satisfecho/a esta con sus relaciones personales?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'21. ¿Cuan satisfecho/a esta con su vida sexual?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'22. ¿Cuan satisfecho/a esta con el apoyo que obtiene de sus amigos?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'23. ¿Cuan satisfecho/a esta de las condiciones del lugar donde vive?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'24. ¿Cuan satisfecho/a esta con el acceso que tiene a los servicios sanitarios?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'25. ¿Cuan satisfecho/a esta con su transporte?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
			'26. ¿Con que frecuencia tiene sentimientos negativos, tales como tristeza, desesperanza, ansiedad depresion?\n    1) Nada.\n    2) Poco.\n    3) Lo normal.\n    4) Bastante.\n    5) Muchisimo.',
		],
		umbrales: {
			bajo: { max: 33, mensaje: 'Calidad de vida baja 🔴' },
			medio: { min: 34, max: 68, mensaje: 'Calidad de vida estable 🟡' },
			alto: { min: 130, mensaje: 'Calidad de vida excelente 🟢' },
		},
		resPreg: {
			1: [],
			2: [],
			3: [],
			4: [],
			5: [],
		},
	},
}
