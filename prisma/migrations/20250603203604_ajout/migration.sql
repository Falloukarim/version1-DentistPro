/*
  Warnings:

  - Made the column `assistantId` on table `consultations` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_assistantId_fkey";

-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "consultationFee" DOUBLE PRECISION NOT NULL DEFAULT 3000;

-- AlterTable
ALTER TABLE "consultations" ALTER COLUMN "assistantId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
