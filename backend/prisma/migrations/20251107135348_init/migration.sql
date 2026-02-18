-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MLA" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "constituency" TEXT NOT NULL DEFAULT 'Khairtabad',
    "party" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "totalComplaints" INTEGER NOT NULL DEFAULT 0,
    "resolvedComplaints" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MLA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "constituency" TEXT NOT NULL DEFAULT 'Khairtabad',
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "address" TEXT,
    "totalComplaints" INTEGER NOT NULL DEFAULT 0,
    "resolvedComplaints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CitizenMLAs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CitizenMLAs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CitizenOrganizations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CitizenOrganizations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_email_key" ON "Citizen"("email");

-- CreateIndex
CREATE INDEX "_CitizenMLAs_B_index" ON "_CitizenMLAs"("B");

-- CreateIndex
CREATE INDEX "_CitizenOrganizations_B_index" ON "_CitizenOrganizations"("B");

-- AddForeignKey
ALTER TABLE "_CitizenMLAs" ADD CONSTRAINT "_CitizenMLAs_A_fkey" FOREIGN KEY ("A") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CitizenMLAs" ADD CONSTRAINT "_CitizenMLAs_B_fkey" FOREIGN KEY ("B") REFERENCES "MLA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CitizenOrganizations" ADD CONSTRAINT "_CitizenOrganizations_A_fkey" FOREIGN KEY ("A") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CitizenOrganizations" ADD CONSTRAINT "_CitizenOrganizations_B_fkey" FOREIGN KEY ("B") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
