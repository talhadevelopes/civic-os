-- CreateEnum
CREATE TYPE "CommentAuthorType" AS ENUM ('CITIZEN', 'MLA', 'ORGANIZATION');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "upvoteCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "authorType" "CommentAuthorType" NOT NULL,
    "authorId" TEXT NOT NULL,
    "citizenAuthorId" TEXT,
    "mlaAuthorId" TEXT,
    "orgAuthorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upvote" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upvote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_issueId_idx" ON "Comment"("issueId");

-- CreateIndex
CREATE INDEX "Comment_authorType_authorId_idx" ON "Comment"("authorType", "authorId");

-- CreateIndex
CREATE INDEX "Upvote_issueId_idx" ON "Upvote"("issueId");

-- CreateIndex
CREATE INDEX "Upvote_citizenId_idx" ON "Upvote"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "Upvote_issueId_citizenId_key" ON "Upvote"("issueId", "citizenId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_citizenAuthorId_fkey" FOREIGN KEY ("citizenAuthorId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_mlaAuthorId_fkey" FOREIGN KEY ("mlaAuthorId") REFERENCES "MLA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_orgAuthorId_fkey" FOREIGN KEY ("orgAuthorId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
