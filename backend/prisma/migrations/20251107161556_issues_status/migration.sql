-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "severity" "Severity" NOT NULL DEFAULT 'LOW';
