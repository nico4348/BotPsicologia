-- AlterTable
ALTER TABLE `informacion_usuario` ADD COLUMN `historial` JSON NULL,
    MODIFY `nombre` VARCHAR(191) NULL,
    MODIFY `documento` VARCHAR(191) NULL,
    MODIFY `tipoDocumento` VARCHAR(191) NULL DEFAULT 'CC';
