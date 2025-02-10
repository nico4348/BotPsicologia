/*
  Warnings:

  - You are about to alter the column `fechaHora` on the `cita` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.
  - You are about to drop the column `tratDatos` on the `informacionusuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `cita` ADD COLUMN `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `fechaHora` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `consultorio` ADD COLUMN `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `informacionusuario` DROP COLUMN `tratDatos`,
    ADD COLUMN `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `practicante` ADD COLUMN `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `registroCitas` (
    `idCita` VARCHAR(191) NOT NULL,
    `idConsultorio` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `idPracticante` VARCHAR(191) NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'pendiente',
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `registroCitas_idCita_key`(`idCita`),
    PRIMARY KEY (`idCita`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `registroCitas` ADD CONSTRAINT `registroCitas_idConsultorio_fkey` FOREIGN KEY (`idConsultorio`) REFERENCES `consultorio`(`idConsultorio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registroCitas` ADD CONSTRAINT `registroCitas_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacionUsuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registroCitas` ADD CONSTRAINT `registroCitas_idPracticante_fkey` FOREIGN KEY (`idPracticante`) REFERENCES `practicante`(`idPracticante`) ON DELETE RESTRICT ON UPDATE CASCADE;
