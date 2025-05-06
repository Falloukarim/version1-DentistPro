/*
  Warnings:

  - A unique constraint covering the columns `[patientPhone,clinicId]` on the table `consultations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,clinicId]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clinicId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `consultations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `treatments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_assistantId_fkey";

-- DropForeignKey
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_dentistId_fkey";

-- DropIndex
DROP INDEX "consultations_patientPhone_key";

-- DropIndex
DROP INDEX "products_name_key";

-- DropIndex
DROP INDEX "treatments_consultationId_idx";

-- DropIndex
DROP INDEX "users_clerkUserId_idx";

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "clinicId" TEXT NOT NULL,
ALTER COLUMN "consultationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "consultations" ADD COLUMN     "clinicId" TEXT NOT NULL,
ALTER COLUMN "assistantId" DROP NOT NULL,
ALTER COLUMN "dentistId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "clinicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "clinicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "treatments" ADD COLUMN     "clinicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "clinicId" TEXT,
ADD COLUMN     "isClinicOwner" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consultations_patientPhone_clinicId_key" ON "consultations"("patientPhone", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_clinicId_key" ON "products"("name", "clinicId");

-- CreateIndex
CREATE INDEX "treatments_consultationId_clinicId_idx" ON "treatments"("consultationId", "clinicId");

-- CreateIndex
CREATE INDEX "users_clerkUserId_clinicId_idx" ON "users"("clerkUserId", "clinicId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
