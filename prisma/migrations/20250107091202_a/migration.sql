/*
  Warnings:

  - A unique constraint covering the columns `[telefonoFamiliar]` on the table `informacion_usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `informacion_usuario` MODIFY `correo` VARCHAR(191) NULL,
    MODIFY `telefonoFamiliar` VARCHAR(191) NULL,
    MODIFY `testActual` VARCHAR(191) NULL DEFAULT 'ghq12';

-- CreateIndex
CREATE UNIQUE INDEX `informacion_usuario_telefonoFamiliar_key` ON `informacion_usuario`(`telefonoFamiliar`);
