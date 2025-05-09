/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `clinics` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_clinicId_fkey";

-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "customDashboardConfig" JSONB,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT DEFAULT '#3b82f6',
ADD COLUMN     "secondaryColor" TEXT DEFAULT '#8b5cf6';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "clinicId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clinics_name_key" ON "clinics"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
