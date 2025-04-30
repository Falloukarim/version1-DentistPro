/*
  Warnings:

  - A unique constraint covering the columns `[patientPhone]` on the table `consultations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "consultations_patientPhone_key" ON "consultations"("patientPhone");
