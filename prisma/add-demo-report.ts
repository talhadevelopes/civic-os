import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Adding ONLY the demo report (keeping existing data!)...\n");

  // 1. Find existing citizen/authority users (or create if missing)
  let citizen = await prisma.user.findFirst({
    where: { email: "ahmed.khan@gmail.com" },
  });
  let authority = await prisma.user.findFirst({
    where: { email: "authority@ghmc.gov.in" },
  });

  // If users don't exist (unlikely, but just in case), create them quickly
  if (!citizen) {
    const bcrypt = require("bcrypt") as typeof import("bcrypt");
    const hashedPw = await bcrypt.hash("CivicOS_Demo_2026!", 10);
    citizen = await prisma.user.create({
      data: {
        name: "Ahmed Khan",
        email: "ahmed.khan@gmail.com",
        passwordHash: hashedPw,
        role: "CITIZEN",
      },
    });
    console.log("✅ Created citizen user");
  }
  if (!authority) {
    const bcrypt = require("bcrypt") as typeof import("bcrypt");
    const hashedPw = await bcrypt.hash("CivicOS_Demo_2026!", 10);
    authority = await prisma.user.create({
      data: {
        name: "GHMC Authority",
        email: "authority@ghmc.gov.in",
        passwordHash: hashedPw,
        role: "AUTHORITY",
        authorityBody: "GHMC",
        authorityCode: "GHMC-HQ-001",
      },
    });
    console.log("✅ Created authority user");
  }

  // 2. Find existing MLA (Arekapudi Gandhi) or create if missing
  let mla = await prisma.mla.findFirst({
    where: { name: "Arekapudi Gandhi" },
  });
  if (!mla) {
    mla = await prisma.mla.create({
      data: {
        name: "Arekapudi Gandhi",
        party: "BRS",
        yearsInOffice: 10,
        constituency: "Serilingampally",
      },
    });
    console.log("✅ Created MLA");
  }

  // 3. Create the demo report (set to NOW so it shows first in feed!)
  const demoCreatedAt = new Date();
  const report = await prisma.report.create({
    data: {
      title: "Large pothole on Kukatpally flyover causing accidents",
      description: "A dangerous pothole has developed on the Kukatpally flyover near exit 3. Multiple two-wheelers have skidded here. This needs urgent repair.",
      category: "POTHOLES",
      status: "CONFIRMED_FIXED",
      areaName: "Kukatpally",
      mlaName: "Arekapudi Gandhi",
      constituencyName: "Serilingampally",
      latitude: 17.4942,
      longitude: 78.3981,
      createdById: citizen.id,
      assignedMlaId: mla.id,
      assignedAuthorityId: authority.id,
      upvoteCount: 78,
      escalated: false,
      citizenVerified: true,
      citizenPhotoUrl: "/reports/before.webp",
      fixPhotoUrl: "/reports/after_fix_1.png",
      createdAt: demoCreatedAt,
      updatedAt: new Date(),
      images: {
        create: [
          { url: "/reports/before.webp", isMain: true },
          { url: "/reports/before_2.png", isMain: false },
          { url: "/reports/under_working_in_progress.png", isMain: false },
        ],
      },
    },
  });
  console.log("✅ Created demo report");

  // Create the full timeline
  const t1 = demoCreatedAt;
  const t2 = new Date(t1.getTime() + 1 * 24 * 60 * 60 * 1000);
  const t3 = new Date(t1.getTime() + 3 * 24 * 60 * 60 * 1000);
  const t4 = new Date(t1.getTime() + 7 * 24 * 60 * 60 * 1000);
  const t5 = new Date(t1.getTime() + 10 * 24 * 60 * 60 * 1000);
  const t6 = new Date(t1.getTime() + 14 * 24 * 60 * 60 * 1000);

  await prisma.issueTimeline.createMany({
    data: [
      {
        issueId: report.id,
        actorId: citizen.id,
        actorName: citizen.name,
        actorRole: "CITIZEN",
        action: "REPORTED",
        note: "Reported the pothole issue with photos and location details.",
        createdAt: t1,
      },
      {
        issueId: report.id,
        actorId: authority.id,
        actorName: "GHMC Authority",
        actorRole: "AUTHORITY",
        action: "ASSIGNED",
        note: "Issue received. Assigned to Road Maintenance Department. MLA Arekapudi Gandhi notified.",
        createdAt: t2,
      },
      {
        issueId: report.id,
        actorId: authority.id,
        actorName: "GHMC Authority",
        actorRole: "AUTHORITY",
        action: "STATUS_CHANGED",
        note: "Work order issued. Field team on site for repair.",
        createdAt: t3,
      },
      {
        issueId: report.id,
        actorId: authority.id,
        actorName: "GHMC Authority",
        actorRole: "AUTHORITY",
        action: "STATUS_CHANGED",
        note: "Repair work in progress! Check the photo below.",
        createdAt: t4,
      },
      {
        issueId: report.id,
        actorId: authority.id,
        actorName: "GHMC Authority",
        actorRole: "AUTHORITY",
        action: "FIX_PHOTO_UPLOADED",
        note: "Pothole repaired successfully. Fix photo uploaded. Waiting for citizen verification.",
        createdAt: t5,
      },
      {
        issueId: report.id,
        actorId: citizen.id,
        actorName: citizen.name,
        actorRole: "CITIZEN",
        action: "CITIZEN_VERIFIED",
        note: "Verified! The repair is excellent. Thank you GHMC!",
        createdAt: t6,
      },
    ],
  });
  console.log("✅ Created full timeline\n");

  console.log("🎉 DEMO REPORT ADDED SUCCESSFULLY!");
  console.log("(All your existing reports/MLAs/users are still there!)");
}

main()
  .catch((e) => {
    console.error("❌ Error adding demo report:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
