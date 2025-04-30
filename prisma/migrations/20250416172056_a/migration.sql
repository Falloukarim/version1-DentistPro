/*
  Warnings:

  - You are about to drop the column `payé` on the `consultations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "consultations" DROP COLUMN "payé",
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false;
