import OpenAI from 'openai'
import { consultarCita, modificarCita, eliminarCita } from '../agend/agendController.js'
import { obtenerHist, saveHist, getCita } from '../../queries/queries.js'
import { assistantPrompt } from '../../openAi/prompts.js'

const aiRegister = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

const tools = [
	{
		type: 'function',
		function: {
			name: 'consultarCita',
			description: 'Retrieve details of a specific appointment',
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'reAgendarCita',
			description:
				'Re agenda una cita, el usuario tiene que proveer la informacion de el dia la hora (No de fecha). Si no tienes la informacion de la fecha de reagendamiento, no podras ejecutar esta funcion',
			parameters: {
				type: 'object',
				properties: {
					nuevoHorario: {
						type: 'string',
						description:
							'Dia/s y Hora/s a la que la cita va a ser reagendada, en lenguaje natural',
					},
				},
				required: ['nuevoHorario'],
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'cancelarCita',
			description: 'Cancel an existing appointment',
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
]

export async function apiAssistant2(numero, msg, id) {
	const conversationHistory = await obtenerHist(numero)
	conversationHistory.unshift({
		role: 'system',
		content: assistantPrompt,
	})

	conversationHistory.push({ role: 'user', content: msg })

	try {
		const response = await aiRegister.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: conversationHistory,
			tools: tools,
			tool_choice: 'auto',
		})
		const assistantResponse = response.choices[0].message.content
		const toolCalls = response.choices[0].message.tool_calls

		conversationHistory.shift()

		if (toolCalls && toolCalls.length > 0) {
			console.log('a')
			for (const call of toolCalls) {
				console.log(call)
				if (call.type === 'function') {
					if (call.function.name === 'consultarCita') {
						console.log('consultarCita')

						const cita = await getCita(numero)
						const response = await consultarCita(cita)
						return response
					}

					if (call.function.name === 'reAgendarCita') {
						console.log('reAgendarCita')
						const horario = JSON.parse(call.function.arguments)
						const nuevoHorario = horario.nuevoHorario
						console.log(horario, typeof nuevoHorario)
						const response = await modificarCita(id, nuevoHorario)
						conversationHistory.push({
							role: 'system',
							content: `Se ha Re-Agendado su cita para el ${response}`,
						})
						return response
					}

					if (call.function.name === 'cancelarCita') {
						console.log('cancelarCita')

						const response = await eliminarCita(numero)
						return response
					}
					await saveHist(numero, conversationHistory)
					return assistantResponse
				}
			}
		} else {
			console.log('else')
			await saveHist(numero, conversationHistory)
			return assistantResponse
		}
	} catch (error) {
		console.error('Error processing OpenAI request:', error)
		throw new Error('Failed to process the request.')
	}
}

// console.log(
// 	await apiAssistant2(
// 		'573022949109',
// 		'Quiero reagendar la cita para el viernes a las 10',
// 		'c691cb35-f1b6-4fd9-8fe4-46aab62a52e4'
// 	)
// )
// async function main() {
// 	const messages = [{ role: 'user', content: "What's the weather like in Boston today?" }]
// 	const tools = [
// 		{
// 			type: 'function',
// 			function: {
// 				name: 'get_current_weather',
// 				description: 'Get the current weather in a given location',
// 				parameters: {
// 					type: 'object',
// 					properties: {
// 						location: {
// 							type: 'string',
// 							description: 'The city and state, e.g. San Francisco, CA',
// 						},
// 						unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
// 					},
// 					required: ['location'],
// 				},
// 			},
// 		},
// 	]

// 	const response = await openai.chat.completions.create({
// 		model: 'gpt-4o',
// 		messages: messages,
// 		tools: tools,
// 		tool_choice: 'auto',
// 		store: true,
// 	})

// 	console.log(response)
// }

// main()
