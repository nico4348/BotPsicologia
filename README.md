# BOT_Psicologia - Chatbot para Apoyo Psicológico

## Descripción General del Proyecto

**BOT_Psicologia** es un chatbot diseñado para brindar apoyo psicológico inicial y facilitar el acceso a servicios de salud mental. Su propósito principal es interactuar con los usuarios a través de WhatsApp, ofreciendo herramientas de autoevaluación (cuestionarios), asistencia conversacional empática y la posibilidad de agendar citas para acompañamiento psicológico.

Este proyecto utiliza una arquitectura modular basada en Node.js y se apoya en las siguientes tecnologías clave:

* **@builderbot/bot:** Un framework para la creación de chatbots conversacionales, que facilita la definición de flujos de conversación y la gestión del estado del usuario.
* **@builderbot/provider-baileys:** Un proveedor para integrar el chatbot con la API de WhatsApp (a través de Baileys).
* **@builderbot/database-mysql:** Un adaptador para la persistencia de datos utilizando una base de datos MySQL.
* **Prisma:** Un ORM moderno para Node.js que se utiliza para interactuar con la base de datos de manera टाइप-safe y eficiente.
* **OpenAI API:** Se integra para proporcionar funcionalidades de inteligencia artificial, como procesamiento de lenguaje natural para el registro de usuarios, asistencia conversacional empática, análisis de respuestas a cuestionarios y determinación de la siguiente acción o test a realizar.
* **dotenv:** Para la gestión de variables de entorno, como la clave de la API de OpenAI y las credenciales de la base de datos.
* **axios:** Para realizar peticiones HTTP, como el envío de mensajes a través de la API de WhatsApp.

La funcionalidad principal del chatbot incluye:

* **Registro de Usuarios:** Recopilación de información básica del usuario (nombre, apellido, correo, tipo y número de documento).
* **Evaluación Psicológica Inicial:** Administración de cuestionarios estandarizados (como el GHQ-12 y otros tests de depresión, ansiedad, estrés, calidad de vida e ideación suicida) para la autoevaluación.
* **Asistencia Conversacional Empática:** Interacción con el usuario a través de un asistente virtual con una personalidad definida para brindar apoyo y contención emocional.
* **Derivación Inteligente:** Basada en las respuestas a los cuestionarios y el análisis de la IA, el bot puede determinar el siguiente cuestionario más apropiado o la necesidad de agendar una cita.
* **Agendamiento de Citas:** Facilitar la recopilación de la disponibilidad del usuario para programar citas de acompañamiento psicológico.
* **Gestión del Flujo de Conversación:** Navegación lógica a través de diferentes etapas de interacción (bienvenida, registro, test, asistencia, agendamiento, finalización).
* **Persistencia de Datos:** Almacenamiento de la información del usuario, el historial de conversaciones y los resultados de los cuestionarios en una base de datos MySQL.

## Explicación del Flujo del Proyecto

El chatbot opera a través de una serie de flujos de conversación definidos y gestionados por `@builderbot/bot`. La interacción entre los principales archivos y módulos es la siguiente:

1.  **`app.js` (Punto de Entrada):**
    * Inicializa el bot, el proveedor de WhatsApp (Baileys) y la conexión a la base de datos MySQL (a través de `@builderbot/database-mysql`).
    * Define los flujos de conversación importados desde `./flows/flows.js`.
    * Crea endpoints HTTP (`/v1/messages`, `/v1/register`, `/v1/samples`, `/v1/blacklist`) que reciben peticiones externas (por ejemplo, del proveedor de WhatsApp o de otros servicios).
    * Utiliza `handleCtx` para procesar estas peticiones y realizar acciones como enviar mensajes al usuario o activar flujos específicos.

2.  **`./flows/flows.js` (Definición de Flujos):**
    * Define la lógica conversacional del bot utilizando las funciones de `@builderbot/bot` (`addKeyword`, `utils`, `EVENTS`).
    * Cada flujo (ej., `welcomeFlow`, `registerFlow`, `assistantFlow`, `testFlow`, `agendFlow`, `finalFlow`) representa una etapa de la interacción con el usuario.
    * Los flujos utilizan acciones asíncronas para interactuar con otros módulos:
        * `obtenerUsuario`, `changeTest`, `getInfoCuestionario`, `switchFlujo` desde `./queries/queries.js` para acceder y modificar la información del usuario y el estado del bot en la base de datos.
        * `apiRegister` desde `./register/aiRegister.js` para manejar el proceso de registro utilizando la IA.
        * `apiAssistant1`, `apiAssistant2` desde `./assist/aiAssistant.js` para proporcionar asistencia conversacional empática impulsada por la IA.
        * `procesarMensaje` desde `./tests/proccesTest.js` para iniciar y gestionar los cuestionarios, delegando la lógica específica de cada cuestionario a `./cuestionario.js`.
        * `apiBack1` desde `../openAi/aiBack.js` para realizar análisis de las respuestas de los cuestionarios utilizando la IA y determinar el siguiente test.
        * `apiAgend` desde `./agend/aiAgend.js` para manejar la lógica de agendamiento de citas.

3.  **`./queries/queries.js` (Interacción con la Base de Datos):**
    * Utiliza el cliente Prisma para realizar consultas y modificaciones en la base de datos MySQL.
    * Contiene funciones para crear, leer, actualizar y eliminar información de usuarios, historial de conversaciones y resultados de cuestionarios en las tablas correspondientes.
    * La función `seleccionarModelo` determina dinámicamente la tabla a utilizar para los datos de los cuestionarios.

4.  **`./tests/` (Manejo de Cuestionarios):**
    * `cuestionario.js`: Contiene la lógica específica para cada tipo de cuestionario (GHQ-12, depresión, ansiedad, etc.), incluyendo las preguntas, los umbrales de puntuación y la evaluación de los resultados.
    * `aiCuest.js`: (Aunque no se proporcionó el contenido, se infiere que podría contener lógica de IA específica para la interacción durante los cuestionarios).
    * `proccesTest.js`: Actúa como intermediario entre los flujos y la lógica de los cuestionarios, enviando mensajes introductorios y llamando a las funciones en `cuestionario.js` para iniciar y procesar las respuestas.

5.  **`./openAi/` (Integración con OpenAI):**
    * `aiBack.js`: Maneja las llamadas a la API de OpenAI para tareas internas o de "back-end", como el análisis de datos y la determinación del siguiente flujo.
    * `aiFront.js`: Realiza llamadas a la API de OpenAI para generar respuestas directas al usuario en la conversación.
    * `aiJson.js`: Se especializa en obtener respuestas de la API de OpenAI en formato JSON.
    * `prompts.js`: Contiene definiciones de prompts que guían el comportamiento y las respuestas de los modelos de lenguaje de OpenAI en diferentes contextos (registro, asistencia, agendamiento).

6.  **`./register/` y `./assist/` y `./agend/`:**
    * Contienen lógica específica para las funcionalidades de registro, asistencia y agendamiento, respectivamente, a menudo utilizando la IA de OpenAI y la interacción con la base de datos.

## Diagramas de Flujo

```mermaid
graph TD
    subgraph Flujo de Inicio (welcomeFlow)
        A[Usuario inicia conversación en WhatsApp] --> B{¿Usuario existente?};
        B -- Sí --> C{¿Flujo guardado?};
        B -- No --> D[Crear usuario en DB];
        C -- assistantFlow --> E[Ir a assistantFlow];
        C -- testFlow --> F[Ir a testFlow];
        C -- agendFlow --> G[Ir a agendFlow];
        C -- finalFlow --> H[Ir a finalFlow];
        C -- No/registerFlow --> I[Ir a registerFlow];
        D --> I;
    end

    subgraph Flujo de Realización de Test (testFlow)
        J[Usuario interactúa en testFlow] --> K{Llamar a procesarMensaje};
        K --> L{¿Fin del cuestionario?};
        L -- Sí --> M{¿Test actual es GHQ12?};
        L -- No --> N[Mostrar siguiente pregunta];
        M -- Sí --> O[Obtener info GHQ12];
        O --> P[Analizar con OpenAI (apiBack1)];
        P --> Q[Determinar siguiente test];
        Q --> R[Cambiar test del usuario en DB];
        R --> S[Mostrar mensaje del nuevo test];
        M -- No --> T[Cambiar flujo a finalFlow];
        T --> U[Ir a finalFlow];
        N --> J;
        S --> J;
    end

    subgraph Flujo de Agendamiento (agendFlow)
        V[Usuario interactúa en agendFlow] --> W[Llamar a apiAgend con info usuario];
        W --> X[Mostrar opciones de disponibilidad/confirmación];
        X --> Y{¿Usuario proporciona disponibilidad?};
        Y -- Sí --> Z[Guardar disponibilidad en DB];
        Y -- No --> X;
        Z --> AA[Mostrar mensaje de confirmación de agendamiento];
    end
Descripción de los Diagramas:

Flujo de Inicio (welcomeFlow): Describe cómo se maneja el inicio de la conversación, verificando si el usuario existe y redirigiéndolo al flujo correspondiente según su estado o iniciándolo en el flujo de registro si es nuevo.
Flujo de Realización de Test (testFlow): Muestra cómo se procesan las respuestas del usuario durante un cuestionario, cómo se determina la siguiente acción al finalizar un test (especialmente el GHQ-12 con análisis de IA) y cómo se navega al siguiente test o al flujo final.
Flujo de Agendamiento (agendFlow): Ilustra la interacción para recopilar la disponibilidad del usuario y confirmar la programación de una cita.
Guía de Instalación y Ejecución
Sigue estos pasos para clonar, configurar y ejecutar el proyecto:

Clonar el Repositorio:

Bash

git clone [URL_DEL_REPOSITORIO]
cd BOT_Psicologia
(Reemplaza [URL_DEL_REPOSITORIO] con la URL real de tu repositorio)

Instalar Dependencias:

Bash

npm install
o

Bash

yarn install
Configurar Variables de Entorno:

Crea un archivo .env en la raíz del proyecto.
Copia el contenido de .env.example (si existe) y reemplaza los valores con tu configuración real:
Fragmento de código

PORT=3008
MYSQL_DB_HOST=localhost
MYSQL_DB_USER=tu_usuario_mysql
MYSQL_DB_NAME=nombre_de_la_base_de_datos
MYSQL_DB_PASSWORD=tu_contraseña_mysql
OPENAI_API_KEY=tu_clave_de_la_api_de_openai
Asegúrate de tener una base de datos MySQL configurada con las credenciales proporcionadas.
Configurar Prisma (si es necesario):

Si no has creado las tablas de la base de datos, es posible que necesites ejecutar las migraciones de Prisma:
Bash

npx prisma migrate dev --name initial
Esto creará las tablas definidas en el esquema de Prisma (prisma/schema.prisma).
Ejecutar el Proyecto:

Bash

npm run dev
o

Bash

yarn dev
Esto iniciará el servidor del chatbot. Asegúrate de que tu proveedor de WhatsApp (configurado con Baileys) esté conectado a este servidor para que el bot pueda interactuar con los usuarios.

Estructura de Carpetas y Archivos
BOT_Psicologia/
├── assets/
│   └── ... (recursos estáticos como imágenes, etc.)
├── bot_sessions/
│   └── ... (archivos de sesión de Baileys)
├── node_modules/
│   ├── ... (dependencias del proyecto)
├── prisma/
│   ├── schema.prisma        (Esquema de la base de datos Prisma)
│   └── migrations/        (Migraciones de la base de datos)
├── src/
│   ├── flows/
│   │   ├── agend/
│   │   │   ├── agendController.js
│   │   │   ├── aiAgend.js
│   │   │   └── aiHorarios.js
│   │   ├── assist/
│   │   │   └── aiAssistant.js
│   │   ├── register/
│   │   │   └── aiRegister.js
│   │   ├── tests/
│   │   │   ├── aiCuest.js       (Lógica de IA para cuestionarios - inferido)
│   │   │   ├── cuestionario.js  (Lógica de los cuestionarios)
│   │   │   └── proccesTest.js   (Procesamiento general de tests)
│   │   └── flows.js           (Definición principal de los flujos)
│   ├── openAi/
│   │   ├── aiBack.js          (IA para lógica interna)
│   │   ├── aiFront.js         (IA para respuestas directas)
│   │   ├── aiJson.js          (IA para respuestas en formato JSON)
│   │   └── prompts.js         (Definiciones de prompts para la IA)
│   ├── queries/
│   │   └── queries.js         (Interacciones con la base de datos usando Prisma)
│   └── app.js               (Punto de entrada de la aplicación)
├── .dockerignore
├── .env
├── .env.example
├── .eslintrc.json
├── .gitignore
├── baileys.log
├── bot.qr.png
├── bun.lockb
├── core.class.log
├── Dockerfile
├── nodemon.json
├── package-lock.json
├── package.json
├── queue.class.log
└── README.md
Explicación del Contenido:

assets/: Contiene recursos estáticos utilizados por el bot.
bot_sessions/: Almacena los archivos de sesión del proveedor Baileys para mantener la conexión con WhatsApp.
node_modules/: Contiene las dependencias instaladas por npm o yarn.
prisma/: Define el esquema de la base de datos y contiene las migraciones.
src/flows/: Define la estructura lógica de la conversación del bot, organizada en diferentes flujos para el registro, la asistencia, los tests y el agendamiento.
src/openAi/: Contiene los módulos responsables de interactuar con la API de OpenAI para diversas tareas de procesamiento de lenguaje natural.
src/queries/: Contiene las funciones que realizan las consultas y las modificaciones en la base de datos utilizando Prisma.
src/app.js: El archivo principal que inicia la aplicación, configura el bot y define los endpoints HTTP.
Archivos de Configuración (.env, .env.example, .eslintrc.json, .gitignore, nodemon.json, package.json, etc.): Archivos de configuración para el entorno, el linter, la gestión de dependencias y otros aspectos del proyecto.
README.md: Este archivo, que proporciona una descripción general y documentación del proyecto.