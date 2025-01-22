import OpenAI from 'openai'
import { consultarCita, modificarCita, eliminarCita } from '../agend/agendController.js'
import { obtenerHist, saveHist, switchAyudaPsicologica } from '../../queries/queries.js'
import { assistantPrompt } from '../../openAi/prompts.js'
import { apiBack } from '../../openAi/aiBack.js'

//---------------------------------------------------------------------------------------------------------

const aiRegister = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

//---------------------------------------------------------------------------------------------------------

async function cambiarEstado(num, hist) {
	const opcion = parseInt(
		await apiBack(
			hist,
			`Devuelve "1" si el usuario no quiere ayuda. De lo contrario, si el usuario SI quiere ayuda devuelve "2"
			IMPORTANTE: SOLO DEVOLVERAS EL NUMERO`
		)
	)
	await switchAyudaPsicologica(num, opcion)
	return {
		success: true,
		result: opcion,
		message: 'Estado del usuario cambiado',
	}
}

//---------------------------------------------------------------------------------------------------------

// Definición de herramientas
const tools = [
	{
		type: 'function',
		function: {
			name: 'cambiarEstado',
			description: `
            IMPORTANTE: Esta función SOLO debe ser llamada cuando:
            1. El usuario esté interesado en recibir ayuda Psicologia
			2. Si el usuario menciona que quiere una cita de Psicologia
            
            NO llamar esta función:
            - Si el usuario solo está conversando normalmente
            - Si el usuario menciona temas de psicología pero no en respuesta a un ofrecimiento de ayuda
            `,
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
]

//---------------------------------------------------------------------------------------------------------

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
			tool_choice: 'auto', //* Importante usar tool choice
		})

		const assistantMessage = response.choices[0].message.content
		const toolCalls = response.choices[0].message.tool_calls

		if (toolCalls && toolCalls.length > 0) {
			for (const call of toolCalls) {
				if (call.type === 'function') {
					switch (call.function.name) {
						case 'consultarCita':
							await consultarCita(id)
							cambiarEstado()
							console.log('consultarCita')
							return true

						case 'reAgendarCita':
							await modificarCita()
							console.log('reAgendarCita')
							return true

						case 'cancelarCita':
							await eliminarCita()
							console.log('cancelarCita')
							return true

						default:
							break
					}
				}
			}
		} else {
			conversationHistory.push({ role: 'assistant', content: assistantMessage })
			conversationHistory.shift()
			await saveHist(numero, conversationHistory)
			return assistantMessage
		}
	} catch (error) {
		console.error('Error al obtener la respuesta de OpenAI:', error)
		throw new Error('Hubo un error al procesar la solicitud.')
	}
}

// console.log(await consultarCita('d047ec73-a4f2-425e-a3ee-4962094bace2'))
