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
			description: 'Reschedule an existing appointment',
			parameters: {
				type: 'object',
				properties: {
					nuevoHorario: {
						type: 'string',
						description: 'New date and time for the appointment',
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

		const assistantMessage = response.choices[0].message
		const toolCalls = assistantMessage.tool_calls

		if (toolCalls && toolCalls.length > 0) {
			const toolCallResponses = []

			for (const call of toolCalls) {
				if (call.type === 'function') {
					const functionArgs = JSON.parse(call.function.arguments)
					let functionResult

					switch (call.function.name) {
						case 'consultarCita':
							functionResult = await consultarCita(id)
							break
						case 'reAgendarCita':
							functionResult = await modificarCita(id, functionArgs.nuevoHorario)
							break
						case 'cancelarCita': {
							const cita = await getCita(id)
							functionResult = await eliminarCita(cita.id)
							break
						}
					}

					toolCallResponses.push({
						tool_call_id: call.id,
						role: 'tool',
						name: call.function.name,
						content: JSON.stringify(functionResult),
					})
				}
			}

			conversationHistory.push(...toolCallResponses)

			const finalResponse = await aiRegister.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: conversationHistory,
				tools: tools,
				tool_choice: 'auto',
			})

			return finalResponse.choices[0].message.content
		} else {
			conversationHistory.push({ role: 'assistant', content: assistantMessage.content })
			conversationHistory.shift()
			await saveHist(numero, conversationHistory)
			return assistantMessage.content
		}
	} catch (error) {
		console.error('Error processing OpenAI request:', error)
		throw new Error('Failed to process the request.')
	}
}
