import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const bcrypt = require("bcrypt") as typeof import("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting DEMO-ONLY seed (fast!)...\n");

  // Clear all tables
  await prisma.mlaReview.deleteMany();
  await prisma.upvote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.issueTimeline.deleteMany();
  await prisma.reportImage.deleteMany();
  await prisma.report.deleteMany();
  await prisma.mla.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleared all existing data");

  const hashedPw = await bcrypt.hash("CivicOS_Demo_2026!", 10);

  // 1. Create Users (Citizen + Authority)
  const authority = await prisma.user.create({
    data: {
      name: "GHMC Authority",
      email: "authority@ghmc.gov.in",
      passwordHash: hashedPw,
      role: "AUTHORITY",
      authorityBody: "GHMC",
      authorityCode: "GHMC-HQ-001",
    },
  });
  const citizen = await prisma.user.create({
    data: {
      name: "Ahmed Khan",
      email: "ahmed.khan@gmail.com",
      passwordHash: hashedPw,
      role: "CITIZEN",
    },
  });
  console.log("✅ Created 2 users");

  // 2. Create 1 MLA (Arekapudi Gandhi)
  const mla = await prisma.mla.create({
    data: {
      name: "Arekapudi Gandhi",
      party: "BRS",
      yearsInOffice: 10,
      constituency: "Serilingampally",
    },
  });
  console.log("✅ Created 1 MLA");

  // 3. Create 1 Complete Demo Report
  const demoCreatedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
        ],
      },
    },
  });
  console.log("✅ Created demo report");

  // Full timeline for the demo report
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

  console.log("🎉 DEMO SEED COMPLETED SUCCESSFULLY!");
  console.log("──────────────────────────────────");
  console.log("Citizen:  ahmed.khan@gmail.com   / CivicOS_Demo_2026!");
  console.log("Authority: authority@ghmc.gov.in / CivicOS_Demo_2026!");
  console.log("──────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
