import OpenAI from 'openai'
import { obtenerHist, saveHist, getCita } from '../../queries/queries.js'
import { assistantPrompt } from '../../openAi/prompts.js'
import { format } from '@formkit/tempo'

const aiRegister = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

const tools = [
	{
		type: 'function',
		function: {
			name: 'consultarCita',
			description: 'Da los detalles de la cita agendada',
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
			for (const call of toolCalls) {
				console.log(call)
				if (call.type === 'function') {
					if (call.function.name === 'consultarCita') {
						console.log('consultarCita')
						const dia = await getCita(id)
						const cita = format(dia[0].fechaHora, 'dddd, D MMMM HH:mm', 'es')

						conversationHistory.push({
							role: 'assistant',
							content: `Se ha registrado su cita para el día ${cita}`,
						})

						// Guardar el historial actualizado
						conversationHistory.shift() // Remover el prompt del sistema
						await saveHist(numero, conversationHistory)

						return `Su cita está agendada para el dia ${cita}`
					}
					//! -----------------------------------------------------------------------------
					if (call.function.name === 'reAgendarCita') {
						conversationHistory.push({
							role: 'assistant',
							content: `Se ha reagendado su cita para el día Solicitado`,
						})

						conversationHistory.shift() // Remover el prompt del sistema
						await saveHist(numero, conversationHistory)
						return `Se ha reagendado su cita para el día Solicitado`
					}

					if (call.function.name === 'cancelarCita') {
						conversationHistory.push({
							role: 'assistant',
							content: `Se ha sido cancelada, recuerde que a la segunda cancelada, se le cerrarra su proceso.`,
						})

						conversationHistory.shift() // Remover el prompt del sistema
						await saveHist(numero, conversationHistory)
						return `Se ha sido cancelada, recuerde que a la segunda cancelada, se le cerrarra su proceso.`
					}
					conversationHistory.shift()
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
