<p align="center">
  <h1 align="center">BotPsicología</h1>
  <p align="center">Asistente Virtual para Apoyo Psicológico</p>
</p>

# BotPsicología - Asistente Virtual para Apoyo Psicológico

## Descripción General del Proyecto

BotPsicología es un chatbot de WhatsApp diseñado para proporcionar un primer acercamiento y apoyo psicológico a usuarios, permitiéndoles realizar tests psicológicos, recibir asistencia automatizada y agendar citas con profesionales. 

### Tecnologías Utilizadas

- **Framework**: BuilderBot (@builderbot/bot v1.2.2) - Framework para la creación de chatbots en WhatsApp
- **Proveedor de WhatsApp**: Baileys (@builderbot/provider-baileys v1.2.2)
- **Base de Datos**: MySQL con Prisma ORM (v6.1.0)
- **IA**: OpenAI API (v4.77.3) para procesamiento de lenguaje natural y asistencia
- **Otros**: Node.js, Express (para los endpoints API)

### Funcionalidad Principal

1. **Registro de usuarios**: Recopilación de información personal del usuario
2. **Evaluación inicial**: Realización de cuestionarios psicológicos (principalmente GHQ-12)
3. **Asistencia automatizada**: Respuestas de IA para proporcionar apoyo inicial
4. **Clasificación de casos**: Análisis de respuestas para determinar el tipo de ayuda necesaria
5. **Agendamiento de citas**: Coordinación de citas con practicantes según disponibilidad
6. **Seguimiento**: Mantenimiento de historial y progreso del usuario

## Explicación del Flujo del Proyecto

1. **Inicio (welcomeFlow)**: El punto de entrada que verifica el estado del usuario y lo dirige al flujo correspondiente.
2. **Registro (registerFlow)**: Recopila los datos del usuario si es su primera interacción.
3. **Asistencia (assistantFlow)**: Provee asistencia mediante IA, evaluando si el usuario necesita ayuda psicológica.
4. **Test (testFlow)**: Administra cuestionarios psicológicos, principalmente el GHQ-12, para evaluar el estado mental del usuario.
5. **Agendamiento (agendFlow)**: Coordina la programación de citas con practicantes según los resultados.
6. **Final (finalFlow)**: Cierra la interacción proporcionando información adicional.

### Interacción entre Archivos

- **app.js**: Inicializa el bot, configura la base de datos, el proveedor de WhatsApp y los endpoints API.
- **flows/flows.js**: Define todos los flujos de conversación y la lógica de transición entre ellos.
- **openAi/aiBack.js**: Maneja la comunicación con la API de OpenAI para procesamiento avanzado.
- **queries/queries.js**: Contiene todas las funciones para interactuar con la base de datos a través de Prisma.
- **flows/tests/proccesTest.js**: Procesa las respuestas de los usuarios a los tests psicológicos.
- **flows/assist/aiAssistant.js**: Maneja la lógica de asistencia automatizada con IA.
- **flows/agend/aiAgend.js**: Gestiona el proceso de agendamiento de citas.
- **flows/register/aiRegister.js**: Controla el proceso de registro de nuevos usuarios.

## Diagramas de Flujo

### Diagrama de Arquitectura General

```mermaid
graph TD
    A[Usuario vía WhatsApp] --> B[BaileysProvider]
    B --> C[BuilderBot Core]
    C --> D{Flujo Actual}
    D -->|Nuevo| E[registerFlow]
    D -->|Registrado| F[assistantFlow]
    F -->|Evaluación necesaria| G[testFlow]
    G -->|Test completado| H[agendFlow]
    H --> I[finalFlow]
    C <--> J[MySQL Database]
    C <--> K[OpenAI API]
```

### Flujo del Proceso de Test

```mermaid
graph TD
    A[Inicio Test] --> B[Mostrar pregunta actual]
    B --> C[Procesar respuesta]
    C --> D{¿Última pregunta?}
    D -->|No| E[Actualizar puntaje]
    E --> F[Avanzar a siguiente pregunta]
    F --> B
    D -->|Sí| G[Calcular resultado final]
    G --> H[Determinar tipo de ayuda]
    H --> I[Actualizar flujo de usuario]
    I --> J[Pasar a agendFlow]
```

### Flujo de Agendamiento

```mermaid
graph TD
    A[Inicio Agendamiento] --> B[Obtener disponibilidad de usuario]
    B --> C[Verificar consultorios disponibles]
    C --> D[Buscar practicantes disponibles]
    D --> E[Proponer fechas/horarios]
    E --> F[Confirmar cita]
    F --> G[Registrar cita en BD]
    G --> H[Enviar recordatorio]
```

## Guía de Instalación y Ejecución

### Requisitos Previos

- Node.js v16 o superior
- MySQL Server
- Cuenta de OpenAI para acceso a API

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/BotPsicologia.git
cd BotPsicologia
```

2. **Instalar dependencias**

```bash
npm install
# O si prefieres usar Bun
bun install
```

3. **Configurar variables de entorno**

Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```
MYSQL_DB_HOST="localhost"
MYSQL_DB_USER="tu_usuario"
MYSQL_DB_NAME="bot_psicologia"
MYSQL_DB_PASSWORD="tu_contraseña"
OPENAI_API_KEY="tu_clave_api_openai"
PORT=3008
DATABASE_URL="mysql://tu_usuario:tu_contraseña@localhost:3306/bot_psicologia"
```

4. **Configurar la base de datos**

```bash
npx prisma migrate dev --name init
```

5. **Iniciar el bot**

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

6. **Escanear código QR**

Al iniciar el bot, se generará un código QR en la consola y en el archivo `bot.qr.png`. Escanéalo con WhatsApp para vincular el bot.

### Ejecución en producción con Docker

1. **Construir la imagen Docker**

```bash
docker build -t bot-psicologia .
```

2. **Ejecutar el contenedor**

```bash
docker run -d -p 3008:3008 --env-file .env --name bot-psicologia bot-psicologia
```

## Estructura de Carpetas y Archivos

```
BotPsicologia/
│
├── .deleted/              # Archivos eliminados (respaldo)
├── .git/                  # Repositorio Git
├── .qodo/                 # Configuración del entorno
├── assets/                # Recursos estáticos (imágenes, etc.)
├── bot_sessions/          # Sesiones de WhatsApp almacenadas
├── node_modules/          # Dependencias de Node.js
├── prisma/                # Configuración y migraciones de Prisma
│   └── schema.prisma      # Esquema de la base de datos
├── src/                   # Código fuente
│   ├── app.js             # Punto de entrada principal
│   ├── flows/             # Flujos de conversación
│   │   ├── flows.js       # Definición de flujos
│   │   ├── agend/         # Gestión de agendamiento
│   │   ├── assist/        # Asistencia con IA
│   │   ├── register/      # Registro de usuarios
│   │   └── tests/         # Procesamiento de tests
│   ├── openAi/            # Integración con OpenAI
│   └── queries/           # Consultas a la base de datos
│
├── .dockerignore          # Archivos ignorados en Docker
├── .env                   # Variables de entorno (no incluido en repo)
├── .env.example           # Ejemplo de variables de entorno
├── .eslintrc.json         # Configuración de ESLint
├── .gitignore             # Archivos ignorados en Git
├── Dockerfile             # Configuración de Docker
├── nodemon.json           # Configuración de Nodemon
├── package.json           # Dependencias y scripts
├── package-lock.json      # Versiones exactas de dependencias
└── README.md              # Documentación del proyecto
```

## Base de Datos

El proyecto utiliza Prisma ORM con MySQL y tiene las siguientes tablas principales:

- **informacionUsuario**: Datos personales de los usuarios
- **ghq12**: Resultados del cuestionario GHQ-12
- **tests**: Resultados de otros tests psicológicos
- **consultorio**: Información de consultorios disponibles
- **practicante**: Datos de los practicantes de psicología
- **cita**: Registro de citas programadas

## Contribución

1. Haz un fork del repositorio
2. Crea una rama para tu función (`git checkout -b feature/nueva-funcion`)
3. Haz commit de tus cambios (`git commit -m 'Añadir nueva función'`)
4. Envía tus cambios (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia ISC.