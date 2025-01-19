import OpenAI from 'openai'

const aiJson = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

export async function apiJson(msg) {
	try {
		const hist = [
			{
				role: 'system',
				content: `retorna un json con el siguiente formato: {DDD:[HH:MM,HH:MM,HH:MM]}. 
						Por ejemplo "Lunes, martes, miercoles, jueves, viernes y sabado  9 a 2" 
						retorna:
						{
							lun: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
							mar: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
							mie: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
							jue: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
							vie: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
							sab: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
						}
						
						ejemplo 2 "Lunes, Martes, Miercoles 1 a 5":
						retornar:
						{
							lun: [ "13:00", "14:00", "15:00", "16:00", "17:00" ],
							mar: [ "13:00", "14:00", "15:00", "16:00", "17:00" ],
							mie: [ "13:00", "14:00", "15:00", "16:00", "17:00" ],
						}

						Nota: ignora las tildes (en caso de miercoles: 'mie')
						Importante: Hazlo en formato 24 horas.
						teniendo en cuenta que el horario laboral va desde las 06:00 a las 18:00 de lunes a sabado (ignora los domingos)
						Si el array del horario está vacio no pongas el dia`,
			},
		]

		hist.push({ role: 'user', content: msg })

		const completion = await aiJson.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: hist,
			response_format: { type: 'json_object' },
		})

		let responseJson = completion.choices[0].message.content
		responseJson = JSON.parse(responseJson)
		return responseJson
	} catch (error) {
		console.error('Error en la API de OpenAI:', error.message)
		throw new Error('Hubo un problema al obtener la respuesta de la IA.')
	}
}
