/*
  Warnings:

  - A unique constraint covering the columns `[cancel_token]` on the table `Cita` will be added. If there are existing duplicate values, this will fail.
  - The required column `cancel_token` was added to the `Cita` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Cita" ADD COLUMN     "cancel_token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Cita_cancel_token_key" ON "Cita"("cancel_token");
