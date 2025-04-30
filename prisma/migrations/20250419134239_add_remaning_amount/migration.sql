/*
  Warnings:

  - Added the required column `updatedAt` to the `treatments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "treatments" ADD COLUMN     "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
