import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const mlaHandler = Router();


function generateUniqueMlaEmail(fullName: string, existingEmails: Set<string>) {
  let firstName = fullName.split(" ")[0].toLowerCase();
  let email = `${firstName}@mla.com`;
  let counter = 1;

  while (existingEmails.has(email)) {
    email = `${firstName}${counter}@mla.com`;
    counter++;
  }

  existingEmails.add(email);
  return email;
}


mlaHandler.post("/addMla", async (req, res) => {
  const mla = req.body;

  if (!mla || !mla.name || !mla.constituency || !mla.party) {
    return res.status(400).json({ message: "Request body must be a valid MLA object" });
  }

  try {
    // Generate deterministic email
    const generateEmail = (mla: any) => {
      const normalizedName = mla.name.toLowerCase().replace(/\s+/g, '');
      const normalizedConstituency = mla.constituency.toLowerCase().replace(/\s+/g, '');
      return `${normalizedName}.${normalizedConstituency}@civicos.in`;
    };

    const email = mla.email || generateEmail(mla);

    // Convert mock_history object to string
    const mockHistoryStr = mla.mock_history ? JSON.stringify(mla.mock_history) : null;

    const created = await prisma.mLA.upsert({
      where: { email },
      update: {}, 
      create: {
        name: mla.name,
        constituency: mla.constituency,
        party: mla.party,
        email,
        phone: mla.phone,
        image: mla.image,
        criminalCasesCount: mla.criminal_cases_count,
        education: mla.education,
        totalAssetsInRupees: mla.total_assets_in_rupees,
        liabilitiesInRupees: mla.liabilities_in_rupees,
        electionYear: mla.election_year,
        dataSource: mla.data_source,
        mockHistory: mockHistoryStr, // save as string
        totalComplaints: 0,
        resolvedComplaints: 0,
      },
    });

    return res.status(201).json({
      message: "MLA added successfully",
      mla: created,
    });
  } catch (error) {
    console.error("Error adding MLA:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});





mlaHandler.get("/fetchMlas", async (req, res) => {
  try {
    const mlas = await prisma.mLA.findMany({
      orderBy: { name: "asc" },
    });
    return res.status(200).json({ count: mlas.length, mlas });
  } catch (error) {
    console.error("Error fetching MLAs:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
