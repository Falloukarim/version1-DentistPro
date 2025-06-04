/*
  Warnings:

  - You are about to drop the column `isActive` on the `subscriptions` table. All the data in the column will be lost.
  - The `paymentStatus` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `treatments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('pending', 'active', 'expired');

-- CreateEnum
CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('en attente', 'payé', 'échoué');

-- CreateEnum
CREATE TYPE "TreatmentPaymentStatus" AS ENUM ('non payé', 'payé', 'partiel');

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "isActive",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'pending',
DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'en attente';

-- AlterTable
ALTER TABLE "treatments" DROP COLUMN "status",
ADD COLUMN     "status" "TreatmentPaymentStatus" NOT NULL DEFAULT 'non payé';

-- DropEnum
DROP TYPE "PaymentStatus";
