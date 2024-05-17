-- AlterTable
ALTER TABLE "message" ADD COLUMN     "parentId" INTEGER;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
