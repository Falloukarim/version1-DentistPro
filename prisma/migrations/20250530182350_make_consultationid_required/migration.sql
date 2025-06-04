/*
  Warnings:

  - Made the column `consultationId` on table `appointments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "consultationId" SET NOT NULL;
