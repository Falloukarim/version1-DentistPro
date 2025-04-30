/*
  Warnings:

  - Made the column `clerkUserId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "clerkUserId" SET NOT NULL;
