/*
  Warnings:

  - You are about to drop the column `dentistId` on the `consultations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clerkUserId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "consultations" DROP COLUMN "dentistId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "clerkUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkUserId_key" ON "users"("clerkUserId");

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
