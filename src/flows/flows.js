//---------------------------------------------------------------------------------------------------------

import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import { obtenerUsuario, changeTest, getInfoCuestionario, switchFlujo } from '../queries/queries.js'
import { apiRegister } from './register/aiRegister.js'
import { apiAssistant1, apiAssistant2 } from './assist/aiAssistant.js'
import { procesarMensaje } from './tests/proccesTest.js'
import { apiBack1 } from '../openAi/aiBack.js'
import { apiAgend } from './agend/aiAgend.js'

//---------------------------------------------------------------------------------------------------------

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
  async (ctx, { gotoFlow, state }) => {
    const user = await obtenerUsuario(ctx.from);
    await state.update({
      user: user,
      consentimientoGHQ12: false, // Inicializar consentimiento como falso al inicio del flujo
    });
    console.log(user.flujo);
    switch (user.flujo) {
      case "assistantFlow":
        console.log("assistantFlow");
        return gotoFlow(assistantFlow);
      case "testFlow":
        console.log("testFlow");
        return gotoFlow(testFlow);
      case "agendFlow":
        console.log("agendFlow");
        return gotoFlow(agendFlow);

      case "finalFlow":
        console.log("finalFlow");
        return gotoFlow(finalFlow);

      default:
        console.log("registerFlow");
        return gotoFlow(registerFlow);
    }
  }
);

//---------------------------------------------------------------------------------------------------------

export const registerFlow = addKeyword(
  utils.setEvent("REGISTER_FLOW")
).addAction(async (ctx, { flowDynamic }) => {
  // Asumo que apiRegister también actualiza el flujo del usuario en la DB
  await flowDynamic(await apiRegister(ctx.from, ctx.body));
  // Nota: Si apiRegister no redirige o cambia el flujo del usuario,
  // este flujo podría terminar aquí. Considera añadir un gotoFlow
  // o switchFlujo al final de apiRegister si es necesario pasar a otro flujo.
});

//---------------------------------------------------------------------------------------------------------

export const assistantFlow = addKeyword(
  utils.setEvent("ASSISTANT_FLOW")
).addAction(async (ctx, { flowDynamic, gotoFlow, state }) => {
  const user = state.get("user"); // Obtener el usuario actualizado desde el estado
  // Puede ser necesario obtener el usuario de la DB de nuevo aquí si apiRegister o switchFlujo lo modificaron en otro flujo
  // const user = await obtenerUsuario(ctx.from); // Considera descomentar si necesitas datos frescos

  if (!user.ayudaPsicologica) {
    const ass2 = await apiAssistant2(ctx.from, ctx.body);
    if (ass2 == true) {
      await switchFlujo(ctx.from, "testFlow"); // Asegurar que el flujo en DB se actualice
      return gotoFlow(testFlow);
    } else {
      await flowDynamic(ass2);
      // Si apiAssistant2 no lleva a testFlow, el flujo assistantFlow debería esperar la siguiente entrada
    }
  } else {
    if (user.ayudaPsicologica == 2) {
      await switchFlujo(user.telefonoPersonal, "testFlow");
      return gotoFlow(testFlow);
    } else {
      const assist = await apiAssistant1(ctx.from, ctx.body);
      await flowDynamic(assist);
      // Si apiAssistant1 responde, el flujo assistantFlow debería esperar la siguiente entrada
    }
  }
});

//---------------------------------------------------------------------------------------------------------

export const testFlow = addKeyword(utils.setEvent('TEST_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow, state }) => {
		const user = state.get('user')
		console.log(ctx.from, '\n', user.testActual)
		// Validate procesarMensaje output
		const message = await procesarMensaje(ctx.from, ctx.body, user.testActual)

		if (!message || typeof message !== 'string') {
			console.error('Error: procesarMensaje returned an invalid value.', { message })
			await flowDynamic(
				'Ocurrió un error procesando el mensaje. Por favor, inténtelo de nuevo.'
			)
			return
		}

		await flowDynamic(message)

		if (message.includes('El cuestionario ha terminado.')) {
			if (user.testActual == 'ghq12') {
				const { infoCues, preguntasString } = await getInfoCuestionario(
					ctx.from,
					user.testActual
				)
				const historialContent = `De las preguntas ${preguntasString}, el usuario respondio asi: ${JSON.stringify(
					infoCues
				)}`

        let accion = `Debes analizar las respuestas del usuario y asignarle en lo que más grave está
                     Entre las siguientes opciones:
                     "dep"(depresión)
                     "ans"(ansiedad)
                     "estr"(estrés)
                     "suic"(ideacion suicida)
                     "calVida"(Calidad de vida)
                     Responde unicamente con "dep", "ans", "estr", "suic" o "calVida"
                 `;
        const hist = user.historial;
        hist.push({ role: "system", content: historialContent });
        let test = await apiBack1(hist, accion);
        test = test.replace(/"/g, ""); // Elimina todas las comillas

        // Cambiar el test actual del usuario en la base de datos
        const nuevoTest = await changeTest(ctx.from, test);

        // Después de completar GHQ-12 y determinar el nuevo test:
        // Reiniciar el estado de consentimiento GHQ-12 para futuras interacciones si es necesario.
        await state.update({ consentimientoGHQ12: false });

        // El flujo del usuario en la DB ya fue actualizado a testFlow por switchFlujo
        // o se mantiene en testFlow. La próxima interacción del usuario
        // con el nuevo user.testActual hará que procesarMensaje inicie el nuevo test.

        // Opcional: Enviar un mensaje de transición al siguiente test
        await flowDynamic(
          `Hemos completado el cuestionario GHQ-12. Ahora pasaremos a un breve cuestionario relacionado con "${nuevoTest}". Por favor, responde la siguiente pregunta.`
        );

        // No necesitamos gotoFlow(testFlow) aquí porque ya estamos en testFlow y
        // queremos que el siguiente mensaje del usuario sea manejado por este mismo flujo
        // para responder a la primera pregunta del nuevo test.
      } else {
        // Si otro test ha terminado, ir al flujo final
        await switchFlujo(ctx.from, "finalFlow"); // Asegurar que el flujo en DB se actualice
        return gotoFlow(finalFlow);
      }
    }
    // Si el mensaje devuelto por procesarMensaje no indica que el test ha terminado,
    // la acción simplemente finaliza y el bot espera la siguiente respuesta del usuario,
    // que será procesada por este mismo addAction en el siguiente turno.
  }
);

//---------------------------------------------------------------------------------------------------------

export const agendFlow = addKeyword(utils.setEvent("AGEND_FLOW")).addAction(
  async (ctx, { flowDynamic, state }) => {
    const user = state.get("user"); // Obtener el usuario actualizado desde el estado
    // Puede ser necesario obtener el usuario de la DB de nuevo aquí
    // const user = await obtenerUsuario(ctx.from); // Considera descomentar si necesitas datos frescos
    await flowDynamic(await apiAgend(ctx.from, ctx.body, user));
    // Si apiAgend completa su tarea y no redirige, el flujo terminará aquí.
    // Considera añadir un gotoFlow o switchFlujo si el flujo de agendamiento
    // debe llevar a otro lugar después de finalizar.
  }
);

//---------------------------------------------------------------------------------------------------------

export const finalFlow = addKeyword(utils.setEvent("FINAL_FLOW")).addAction(
  async (_, { flowDynamic }) => {
    await flowDynamic("Gracias por usar el bot, hasta luego!");
    // Este es el flujo final. No necesita redirigir a otro lugar.
  }
);

//---------------------------------------------------------------------------------------------------------

// Los flujos comentados se mantienen igual que en tu código original

// export const discordFlow = addKeyword('doc').addAnswer(
//     [
//         'You can see the documentation here',
//         '📄 https://builderbot.app/docs \n',
//         'Do you want to continue? *yes*',
//     ].join('\n'),
//     { capture: true },
//     async (ctx, { gotoFlow, flowDynamic }) => {
//         if (ctx.body.toLocaleLowerCase().includes('yes')) {
//             return gotoFlow(registerFlow)
//         }
//         await flowDynamic('Thanks!')
//         return
//     }
// )

// export const welcomeFlow = addKeyword(EVENTS.WELCOME)
//     .addAnswer(`🙌 Hello welcome to this *Chatbot*`)
//     .addAnswer(
//         [
//             'I share with you the following links of interest about the project',
//             '👉 *doc* to view the documentation',
//         ].join('\n'),
//         { delay: 800, capture: true },
//         async (ctx, { fallBack }) => {
//             if (!ctx.body.toLocaleLowerCase().includes('doc')) {
//                 return fallBack('You should type *doc*')
//             }
//             return
//         },
//         [discordFlow]
//     )

// export const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW'))
//     .addAnswer(`What is your name?`, { capture: true }, async (ctx, { state }) => {
//         await state.update({ name: ctx.body })
//     })
//     .addAnswer('What is your age?', { capture: true }, async (ctx, { state }) => {
//         await state.update({ age: ctx.body })
//     })
//     .addAction(async (_, { flowDynamic, state }) => {
//         await flowDynamic(
//             `${state.get('name')}, thanks for your information!: Your age: ${state.get('age')}`
//         )
//     })

// export const fullSamplesFlow = addKeyword(['samples', utils.setEvent('SAMPLES')])
//     .addAnswer(`💪 I'll send you a lot files...`)
//     .addAnswer(`Send image from Local`, { media: join(process.cwd(), 'assets', 'sample.png') })
//     .addAnswer(`Send video from URL`, {
//         media: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTJ0ZGdjd2syeXAwMjQ4aWdkcW04OWlqcXI3Ynh1ODkwZ25zZWZ1dCZlcD12MV9ibnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LCohAb657pSdHv0Q5h/giphy.mp4',
//     })
//     .addAnswer(`Send audio from URL`, {
//         media: 'https://cdn.freesound.org/previews/728/728142_11861866-lq.mp3',
//     })
//     .addAnswer(`Send file from URL`, {
//         media: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
//     })