-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_citizenId_fkey";

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
