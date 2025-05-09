/*  ------------------------ aiBack.js ---------------------------
	Este archivo se encarga de manejar la conexion con OpenAI
    Especificamente es para las respuestas con IA
	Back se refiere a que se usará para logica interna
    Solicita el historial (para contexto) y la acción a realizar
	--------------------------------------------------------------
*/

import OpenAI from 'openai'
import { obtenerHist, saveHist, registrarUsuario, switchFlujo,actualizarConsentimiento } from '../../queries/queries.js'
import { registerPrompt } from '../../openAi/prompts.js'

//---------------------------------------------------------------------------------------------------------

const aiRegister = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

//---------------------------------------------------------------------------------------------------------

async function register(conversationHistory, number) {
	const hist = [...conversationHistory]
	hist.shift()
	hist.push({
		role: 'system',
		content: `Extrae en formato json la informacion del usuario con este formato:
		{
		"nombre":"",
		"apellido":"",
		"correo":"",
		"tipoDocumento":"",
		"documento":"",
		}`,
	})
	const jsonRegister = await aiRegister.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: hist,
		response_format: { type: 'json_object' },
	})
	const responseJson = JSON.parse(jsonRegister.choices[0].message.content)

	const { nombre, apellido, correo, tipoDocumento, documento } = responseJson

	await registrarUsuario(nombre, apellido, correo, tipoDocumento, documento, number)

	return {
		success: true,
		result: responseJson,
		message: 'Usuario Registrado',
	}
}

//---------------------------------------------------------------------------------------------------------
async function procesarConsentimiento(mensaje, numero) {
    // Normalizar la respuesta para análisis
    const respuesta = mensaje.toLowerCase().trim();
    
    // Verificar si la respuesta indica consentimiento
    if (
        respuesta.includes('sí, acepto') || 
        respuesta.includes('si, acepto') || 
        respuesta.includes('si acepto') || 
        respuesta === 'si' || 
        respuesta === 'sí'
    ) {
        // Usuario aceptó el consentimiento
        await actualizarConsentimiento(numero, true);
        await switchFlujo(numero, 'assistantFlow');
        
        return "Gracias por aceptar el consentimiento. Estoy aquí para acompañarte  ¿Te gustaría contarme un poco sobre cómo te has estado sintiendo?";
    } else if (respuesta.includes('no, acepto') || 
		respuesta.includes('no, no acepto') || 
		respuesta.includes('no acepto') || 
		respuesta === 'no'
	){
        // Usuario no aceptó el consentimiento
        await actualizarConsentimiento(numero, false);
        await switchFlujo(numero, 'finalFlow');
        
        return "Entendido. Has decidido no continuar con el proceso. Respetamos tu decisión. Si en el futuro deseas retomar el servicio, estaremos aquí para ayudarte.";
    }else{
		return "Lo siento, no entendí tu respuesta. Por favor, responde con 'Si acepto' o 'No acepto' para confirmar tu consentimiento.";
	}
}
//---------------------------------------------------------------------------------------------------------

// Definición de herramientas
const tools = [
	{
		type: 'function',
		function: {
			name: 'register',
			description: `Cuando los siguientes campos esten llenos y el usuario haya confirmado, se debe registrar el usuario:
			1. Nombres
			2. Apellidos
			3. Correo
			4. Tipo de documento (CC, TI, Pasaporte)
			5. Numero de documento


	`,
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
]

//---------------------------------------------------------------------------------------------------------
export async function apiRegister(numero, msg) {
	const conversationHistory = await obtenerHist(numero)
	
    // Verificar si estamos en la etapa de consentimiento
    const ultimoMensaje = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1] : null;
    
    // Verificar si el último mensaje es el de solicitud de consentimiento
    if (ultimoMensaje && ultimoMensaje.role === 'assistant' && 
        ultimoMensaje.content.includes('Cuestionario de Salud General (GHQ-12)') && 
        ultimoMensaje.content.includes('confirme su consentimiento')) {
        
        // Estamos en la etapa de consentimiento, procesar la respuesta
        const respuestaConsentimiento = await procesarConsentimiento(msg, numero);
        
        // Agregar la respuesta del usuario al historial
        conversationHistory.push({ role: 'user', content: msg });
        
        // Agregar solo la respuesta de confirmación, sin duplicar el mensaje de consentimiento
        conversationHistory.push({ role: 'assistant', content: respuestaConsentimiento });
        
        // Guardar el historial actualizado
        await saveHist(numero, conversationHistory);
        
        return respuestaConsentimiento;
    }

	conversationHistory.unshift({ role: 'system', content: registerPrompt })
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
				if (call.type === 'function' && call.function.name === 'register') {
					await register(conversationHistory, numero)

					// Mensaje de consentimiento
					const answ =
                        'Gracias por realizar tu registro. Bienvenido!\n\n' + 
                        '¡¡¡ Porfavor Antes de iniciar !!. Se solicita su autorización para aplicar el Cuestionario de Salud General (GHQ-12), un instrumento breve diseñado para evaluar su bienestar psicológico. La información que proporcione será tratada de manera confidencial, conforme a la Ley 1090 de 2006 y a nuestras políticas de privacidad. Sus datos serán utilizados únicamente con fines evaluativos y no se compartirán con terceros sin su consentimiento.\n' +
                        'Su participación es voluntaria, y puede decidir no continuar en cualquier momento.\n' +
                        'Por favor, confirme su consentimiento respondiendo a este mensaje:\n' +
                        '- Sí, acepto la aplicación del GHQ-12 y el tratamiento de mis datos.\n' +
                        '- No, no acepto la aplicación del GHQ-12 ni el tratamiento de mis datos.';
					
					conversationHistory.push({ role: 'assistant', content: answ })
					conversationHistory.shift()
					await saveHist(numero, conversationHistory)
					return answ
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