/*  ------------------------ aiBack.js ---------------------------
	Este archivo se encarga de manejar la conexion con OpenAI
    Especificamente es para las respuestas con IA
	Back se refiere a que se usará para logica interna
    Solicita el historial (para contexto) y la acción a realizar
	--------------------------------------------------------------
*/

import OpenAI from 'openai'
import { obtenerHist, saveHist, switchAyudaPsicologica } from '../queries/queries.js'
import { assistantPrompt } from './prompts.js'
import { apiBack } from './aiBack.js'

//---------------------------------------------------------------------------------------------------------

const aiRegister = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

//---------------------------------------------------------------------------------------------------------

async function cambiarEstado(num, hist) {
	const opcion = parseInt(
		await apiBack(
			hist,
			`Devuelve "0" si el usuario no quiere ayuda. De lo contrario, si el usuario SI quiere ayuda devuelve "2"
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
			Activacion: Se llamará esta funcion cuando el usuario responda si quiere o no ayuda psicologica.
			Requisitos: Que el asistente haya ofrecido la ayuda y que el usuario haya dicho si o no (en ambas se activa)
	`,
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
]

//---------------------------------------------------------------------------------------------------------

export async function apiAssistant1(numero, msg) {
	const conversationHistory = await obtenerHist(numero)
	conversationHistory.unshift({
		role: 'system',
		content: assistantPrompt,
	})
	if (Math.floor(Math.random() * 10) <= 2) {
		conversationHistory.push({
			role: 'system',
			content: `\nIMPORTANTE:\nDEBES preguntar al usuario si quiere recibir ayuda psicológica. 
				para saber como cambiar el estado del usuario `,
		})
	}

	conversationHistory.push({ role: 'user', content: msg })

	try {
		const response = await aiRegister.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: conversationHistory,
			tools: tools,
		})

		const assistantMessage = response.choices[0].message.content
		const toolCalls = response.choices[0].message.tool_calls

		if (toolCalls && toolCalls.length > 0) {
			for (const call of toolCalls) {
				if (call.type === 'function' && call.function.name === 'cambiarEstado') {
					await cambiarEstado(numero, conversationHistory)
					const response = await aiRegister.chat.completions.create({
						model: 'gpt-4o-mini',
						messages: conversationHistory,
					})

					const assistantMessage = response.choices[0].message.content
					conversationHistory.push({ role: 'assistant', content: assistantMessage })
					conversationHistory.shift()
					await saveHist(numero, conversationHistory)
					return assistantMessage
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

//---------------------------------------------------------------------------------------------------------

export async function apiAssistant2(numero, msg) {
	const conversationHistory = await obtenerHist(numero)
	conversationHistory.unshift({ role: 'system', content: assistantPrompt })
	conversationHistory.push({ role: 'user', content: msg })
	try {
		const response = await aiRegister.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: conversationHistory,
		})

		const assistantMessage = response.choices[0].message.content

		conversationHistory.push({ role: 'assistant', content: assistantMessage })
		conversationHistory.shift()
		await saveHist(numero, conversationHistory)
		return assistantMessage
	} catch (error) {
		console.error('Error al obtener la respuesta de OpenAI:', error)
		throw new Error('Hubo un error al procesar la solicitud.')
	}
}

//---------------------------------------------------------------------------------------------------------
