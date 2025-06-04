/*
  Warnings:

  - The values [en attente,payé,échoué] on the enum `SubscriptionPaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionPaymentStatus_new" AS ENUM ('PENDING', 'PAYED', 'FAILED');
ALTER TABLE "subscriptions" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "paymentStatus" TYPE "SubscriptionPaymentStatus_new" USING ("paymentStatus"::text::"SubscriptionPaymentStatus_new");
ALTER TYPE "SubscriptionPaymentStatus" RENAME TO "SubscriptionPaymentStatus_old";
ALTER TYPE "SubscriptionPaymentStatus_new" RENAME TO "SubscriptionPaymentStatus";
DROP TYPE "SubscriptionPaymentStatus_old";
ALTER TABLE "subscriptions" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
