/*
  Warnings:

  - A unique constraint covering the columns `[contact_email]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Organization_contact_email_key" ON "Organization"("contact_email");
