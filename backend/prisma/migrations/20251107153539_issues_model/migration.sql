-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'FIXED');

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "location" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'PENDING',
    "citizenId" TEXT NOT NULL,
    "mlaId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_mlaId_fkey" FOREIGN KEY ("mlaId") REFERENCES "MLA"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
