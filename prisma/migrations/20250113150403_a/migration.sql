/*
  Warnings:

  - Made the column `tipoDocumento` on table `informacion_usuario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `testActual` on table `informacion_usuario` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `informacion_usuario` ADD COLUMN `ayudaPsicologica` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `motivo` VARCHAR(191) NULL,
    ADD COLUMN `tratDatos` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `tipoDocumento` VARCHAR(191) NOT NULL DEFAULT 'CC',
    MODIFY `testActual` VARCHAR(191) NOT NULL DEFAULT 'ghq12';
