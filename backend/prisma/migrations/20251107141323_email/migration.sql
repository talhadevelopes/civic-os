/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `MLA` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MLA_email_key" ON "MLA"("email");
