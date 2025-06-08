-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paydunyaToken" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
