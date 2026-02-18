-- AlterTable
ALTER TABLE "MLA" ADD COLUMN     "criminalCasesCount" INTEGER,
ADD COLUMN     "dataSource" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "electionYear" INTEGER,
ADD COLUMN     "liabilitiesInRupees" DOUBLE PRECISION,
ADD COLUMN     "mockHistory" TEXT,
ADD COLUMN     "totalAssetsInRupees" DOUBLE PRECISION,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
