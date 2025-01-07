-- CreateTable
CREATE TABLE `informacion_usuario` (
    `idUsuario` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NULL,
    `correo` VARCHAR(191) NOT NULL,
    `telefonoPersonal` VARCHAR(191) NOT NULL,
    `telefonoFamiliar` VARCHAR(191) NOT NULL,
    `documento` VARCHAR(191) NOT NULL,
    `tipoDocumento` VARCHAR(191) NOT NULL DEFAULT 'CC',
    `testActual` VARCHAR(191) NULL,
    `disponibilidad` VARCHAR(191) NOT NULL DEFAULT '',

    UNIQUE INDEX `informacion_usuario_idUsuario_key`(`idUsuario`),
    UNIQUE INDEX `informacion_usuario_correo_key`(`correo`),
    UNIQUE INDEX `informacion_usuario_telefonoPersonal_key`(`telefonoPersonal`),
    UNIQUE INDEX `informacion_usuario_documento_key`(`documento`),
    PRIMARY KEY (`idUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chats` (
    `idchat` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `conversacion` JSON NOT NULL,

    UNIQUE INDEX `chats_idchat_key`(`idchat`),
    PRIMARY KEY (`idchat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credencial` (
    `idCredencial` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `usuario` VARCHAR(191) NOT NULL,
    `contrasena` VARCHAR(191) NOT NULL,
    `rol` VARCHAR(191) NOT NULL DEFAULT 'user',

    UNIQUE INDEX `credencial_idCredencial_key`(`idCredencial`),
    PRIMARY KEY (`idCredencial`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `informacionPersonal` (
    `idinformacionPersonal` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `edad` INTEGER NOT NULL,
    `sexo` VARCHAR(191) NOT NULL,
    `genero` VARCHAR(191) NOT NULL,
    `estadocivil` VARCHAR(191) NOT NULL,
    `hijosnum` INTEGER NOT NULL,
    `personascargo` INTEGER NOT NULL,
    `vivienda` VARCHAR(191) NOT NULL,
    `localidad` VARCHAR(191) NOT NULL,
    `tipovivienda` VARCHAR(191) NOT NULL,
    `familiaresnum` INTEGER NOT NULL,
    `estrato` INTEGER NOT NULL,
    `etnico` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `informacionPersonal_idinformacionPersonal_key`(`idinformacionPersonal`),
    PRIMARY KEY (`idinformacionPersonal`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `condicionesvivienda` (
    `idcondicionesvivienda` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `hacinamiento` VARCHAR(191) NOT NULL,
    `violencia` VARCHAR(191) NOT NULL,
    `servicios` JSON NOT NULL,
    `problemas` JSON NOT NULL,
    `tipozona` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `condicionesvivienda_idcondicionesvivienda_key`(`idcondicionesvivienda`),
    PRIMARY KEY (`idcondicionesvivienda`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `educacion` (
    `ideducacion` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `tipocolegio` VARCHAR(191) NOT NULL,
    `nivelescolaridad` VARCHAR(191) NOT NULL,
    `carrera` VARCHAR(191) NOT NULL,
    `periodo` VARCHAR(191) NOT NULL,
    `motivo` VARCHAR(191) NOT NULL,
    `matedificulta` JSON NOT NULL,
    `nivelingles` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `educacion_ideducacion_key`(`ideducacion`),
    PRIMARY KEY (`ideducacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `situacionlaboral` (
    `idsituacionlaboral` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `situacion` VARCHAR(191) NOT NULL,
    `ingresos` VARCHAR(191) NOT NULL,
    `sector` VARCHAR(191) NOT NULL,
    `jornada` VARCHAR(191) NOT NULL,
    `ascenso` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `situacionlaboral_idsituacionlaboral_key`(`idsituacionlaboral`),
    PRIMARY KEY (`idsituacionlaboral`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salud` (
    `idsalud` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `enfermecronica` VARCHAR(191) NOT NULL,
    `discapacidad` VARCHAR(191) NOT NULL,
    `suspsicoactivas` VARCHAR(191) NOT NULL,
    `alcohol` VARCHAR(191) NOT NULL,
    `Internet` VARCHAR(191) NOT NULL,
    `nicotina` VARCHAR(191) NOT NULL,
    `eps` VARCHAR(191) NOT NULL,
    `asispsicologo` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `salud_idsalud_key`(`idsalud`),
    PRIMARY KEY (`idsalud`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ghq12` (
    `idGhq12` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `tratDatos` VARCHAR(191) NOT NULL DEFAULT '',
    `historial` JSON NULL,
    `Puntaje` INTEGER NOT NULL DEFAULT 0,
    `preguntaActual` INTEGER NOT NULL DEFAULT 0,
    `resPreg` JSON NULL,

    UNIQUE INDEX `ghq12_idGhq12_key`(`idGhq12`),
    UNIQUE INDEX `ghq12_telefono_key`(`telefono`),
    PRIMARY KEY (`idGhq12`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tests` (
    `idTests` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `tratDatos` VARCHAR(191) NOT NULL DEFAULT '',
    `historial` JSON NULL,
    `Puntaje` INTEGER NOT NULL DEFAULT 0,
    `preguntaActual` INTEGER NOT NULL DEFAULT 0,
    `resPreg` JSON NULL,

    UNIQUE INDEX `tests_idTests_key`(`idTests`),
    UNIQUE INDEX `tests_telefono_key`(`telefono`),
    PRIMARY KEY (`idTests`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultorio` (
    `idConsultorio` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `consultorio_idConsultorio_key`(`idConsultorio`),
    PRIMARY KEY (`idConsultorio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historialAgendamiento` (
    `idHistAgendamiento` VARCHAR(191) NOT NULL,
    `numeroUsuario` VARCHAR(191) NOT NULL,
    `citaAgendada` BOOLEAN NOT NULL DEFAULT false,
    `tratDatos` VARCHAR(191) NOT NULL DEFAULT '',
    `agendamiento` BOOLEAN NOT NULL DEFAULT false,
    `historial` JSON NULL,

    UNIQUE INDEX `historialAgendamiento_idHistAgendamiento_key`(`idHistAgendamiento`),
    UNIQUE INDEX `historialAgendamiento_numeroUsuario_key`(`numeroUsuario`),
    PRIMARY KEY (`idHistAgendamiento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `practicante` (
    `idPracticante` VARCHAR(191) NOT NULL,
    `numero_documento` VARCHAR(191) NOT NULL,
    `tipo_documento` VARCHAR(191) NOT NULL DEFAULT 'CC',
    `nombre` VARCHAR(191) NOT NULL,
    `genero` VARCHAR(191) NOT NULL,
    `estrato` VARCHAR(191) NOT NULL,
    `barrio` VARCHAR(191) NOT NULL,
    `localidad` VARCHAR(191) NOT NULL,
    `horario` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `practicante_idPracticante_key`(`idPracticante`),
    UNIQUE INDEX `practicante_numero_documento_key`(`numero_documento`),
    PRIMARY KEY (`idPracticante`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cita` (
    `idCita` VARCHAR(191) NOT NULL,
    `idConsultorio` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `idPracticante` VARCHAR(191) NOT NULL,
    `fechaHora` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `cita_idCita_key`(`idCita`),
    PRIMARY KEY (`idCita`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chats` ADD CONSTRAINT `chats_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacion_usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credencial` ADD CONSTRAINT `credencial_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacion_usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `informacionPersonal` ADD CONSTRAINT `informacionPersonal_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacion_usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `condicionesvivienda` ADD CONSTRAINT `condicionesvivienda_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacion_usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `educacion` ADD CONSTRAINT `educacion_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacion_usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `situacionlaboral` ADD CONSTRAINT `situacionlaboral_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacion_usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salud` ADD CONSTRAINT `salud_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacion_usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ghq12` ADD CONSTRAINT `ghq12_telefono_fkey` FOREIGN KEY (`telefono`) REFERENCES `informacion_usuario`(`telefonoPersonal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tests` ADD CONSTRAINT `tests_telefono_fkey` FOREIGN KEY (`telefono`) REFERENCES `informacion_usuario`(`telefonoPersonal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historialAgendamiento` ADD CONSTRAINT `historialAgendamiento_numeroUsuario_fkey` FOREIGN KEY (`numeroUsuario`) REFERENCES `informacion_usuario`(`telefonoPersonal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_idConsultorio_fkey` FOREIGN KEY (`idConsultorio`) REFERENCES `consultorio`(`idConsultorio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacion_usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_idPracticante_fkey` FOREIGN KEY (`idPracticante`) REFERENCES `practicante`(`idPracticante`) ON DELETE RESTRICT ON UPDATE CASCADE;
