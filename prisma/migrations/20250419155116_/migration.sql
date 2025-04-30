-- DropForeignKey
ALTER TABLE "treatments" DROP CONSTRAINT "treatments_consultationId_fkey";

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
