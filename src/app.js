import { createBot, createProvider, createFlow } from '@builderbot/bot'
import { MysqlAdapter as Database } from '@builderbot/database-mysql'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { welcomeFlow, registerFlow, assistantFlow, testFlow, agendFlow } from './flows/flows.js'
import { obtenerPracticante } from './queries/queries.js'

const PORT = process.env.PORT ?? 3008

//---------------------------------------------------------------------------------------------------------

const main = async () => {
	const adapterFlow = createFlow([welcomeFlow, registerFlow, assistantFlow, testFlow, agendFlow])

	const adapterProvider = createProvider(Provider)
	const adapterDB = new Database({
		host: process.env.MYSQL_DB_HOST,
		user: process.env.MYSQL_DB_USER,
		database: process.env.MYSQL_DB_NAME,
		password: process.env.MYSQL_DB_PASSWORD,
	})

	const { handleCtx, httpServer } = await createBot({
		flow: adapterFlow,
		provider: adapterProvider,
		database: adapterDB,
	})

	//---------------------------------------------------------------------------------------------------------

	adapterProvider.server.post(
		'/v1/messages',
		handleCtx(async (bot, req, res) => {
			const { number, message, urlMedia } = req.body
			await bot.sendMessage(number, message, { media: urlMedia ?? null })
			return res.end('sended')
		})
	)

	adapterProvider.server.post(
		'/v1/register',
		handleCtx(async (bot, req, res) => {
			const { number, name } = req.body
			await bot.dispatch('REGISTER_FLOW', { from: number, name })
			return res.end('trigger')
		})
	)

	adapterProvider.server.post(
		'/v1/samples',
		handleCtx(async (bot, req, res) => {
			const { number, name } = req.body
			await bot.dispatch('SAMPLES', { from: number, name })
			return res.end('trigger')
		})
	)

	adapterProvider.server.get(
		'/v1/query/:searchQuery',
		handleCtx(async (bot, req, res) => {
			const { searchQuery } = req.params // Extrae el parámetro correctamente

			try {
				const response = await obtenerPracticante(searchQuery) // Lógica para obtener el practicante
				console.log(response)
				res.writeHead(200, { 'Content-Type': 'application/json' })
				return res.end(JSON.stringify(response))
			} catch (error) {
				// Manejo de errores
				console.error(error)
				res.writeHead(500, { 'Content-Type': 'application/json' })
				return res.end(
					JSON.stringify({
						status: 'error',
						message: 'Error al consultar la base de datos',
					})
				)
			}
		})
	)

	adapterProvider.server.post(
		'/v1/blacklist',
		handleCtx(async (bot, req, res) => {
			const { number, intent } = req.body
			if (intent === 'remove') bot.blacklist.remove(number)
			if (intent === 'add') bot.blacklist.add(number)

			res.writeHead(200, { 'Content-Type': 'application/json' })
			return res.end(JSON.stringify({ status: 'ok', number, intent }))
		})
	)

	httpServer(+PORT)
}

main()
