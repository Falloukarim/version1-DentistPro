/*
  Warnings:

  - The `status` column on the `treatments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('non payé', 'payé', 'partiel');

-- AlterTable
ALTER TABLE "treatments" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'non payé';
