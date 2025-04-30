/*
  Warnings:

  - You are about to drop the column `isPaid` on the `consultations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_clerkUserId_key";

-- AlterTable
ALTER TABLE "consultations" DROP COLUMN "isPaid",
ADD COLUMN     "payé" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "treatments_consultationId_idx" ON "treatments"("consultationId");

-- CreateIndex
CREATE INDEX "users_clerkUserId_idx" ON "users"("clerkUserId");
