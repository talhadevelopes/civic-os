import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { AREA_TO_MLA } from "../lib/areaToMla";

const prisma = new PrismaClient();

const CATEGORIES = [
  "POTHOLES",
  "GARBAGE",
  "WATER_LEAKAGE",
  "DRAINAGE_SEWAGE",
  "STREETLIGHT",
  "ROAD_DAMAGE",
  "ILLEGAL_DUMPING",
  "STRAY_ANIMALS",
  "TRAFFIC_SIGNAL",
  "ENCROACHMENT",
  "BUILDING",
  "FLOODING",
  "OTHER",
] as const;

const STATUSES = [
  "REPORTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED_PENDING_VERIFICATION",
  "CONFIRMED_FIXED",
  "REOPENED",
  "REJECTED",
] as const;

// Hyderabad coordinates bounds
const HYDERABAD_BOUNDS = {
  latMin: 17.2,
  latMax: 17.6,
  lngMin: 78.2,
  lngMax: 78.6,
};

function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number) {
  const now = Date.now();
  const daysInMs = daysAgo * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * daysInMs);
}

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  console.log("🧹 Cleaning existing data...");
  await prisma.issueTimeline.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.upvote.deleteMany();
  await prisma.reportImage.deleteMany();
  await prisma.report.deleteMany();
  await prisma.mlaReview.deleteMany();
  await prisma.mla.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.user.deleteMany();

  // Create citizens
  console.log("👥 Creating citizens...");
  const citizenNames = [
    "Ahmed Khan",
    "Priya Sharma",
    "Rajesh Kumar",
    "Sneha Reddy",
    "Vikram Singh",
    "Anjali Patel",
    "Mohammed Ali",
    "Kavita Nair",
    "Rahul Mehta",
    "Deepika Iyer",
    "Arjun Desai",
    "Meera Joshi",
    "Suresh Rao",
    "Lakshmi Menon",
    "Amit Verma",
  ];

  const citizens = await Promise.all(
    citizenNames.map(async (name, i) => {
      const email = `citizen${i + 1}@civicos.in`;
      const passwordHash = await bcrypt.hash("password123", 10);
      return prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "CITIZEN",
        },
      });
    })
  );

  console.log(`✅ Created ${citizens.length} citizens`);

  // Create authorities
  console.log("🏛️ Creating authorities...");
  const authorityData = [
    { name: "GHMC Officer", email: "ghmc@civicos.in", code: "GHMC-2024", body: "GHMC" },
    { name: "MLA Office Kukatpally", email: "mla-kukatpally@civicos.in", code: "MLA-SEC-14", body: "MLA Ward 14" },
    { name: "Hyderabad Metro Water", email: "hmw@civicos.in", code: "HMW-2024", body: "HMW" },
    { name: "MLA Office Secunderabad", email: "mla-sec@civicos.in", code: "MLA-SEC-15", body: "MLA Ward 15" },
  ];

  const authorities = await Promise.all(
    authorityData.map(async ({ name, email, code, body }) => {
      const passwordHash = await bcrypt.hash("password123", 10);
      return prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "AUTHORITY",
          authorityCode: code,
          authorityBody: body,
        },
      });
    })
  );

  console.log(`✅ Created ${authorities.length} authorities`);

  // Create unique areas from AREA_TO_MLA
  const uniqueAreas = [...new Set(AREA_TO_MLA.map((a) => a.area))];
  const uniqueMlas = Array.from(
    new Map(AREA_TO_MLA.map((a) => [a.mla_name, { name: a.mla_name, constituency: a.constituency }])).values()
  );

  // Create reports
  console.log("📋 Creating reports...");
  const reportTitles = [
    "Deep pothole on main road causing accidents",
    "Garbage not collected for 3 days",
    "Water leakage from broken pipe",
    "Drainage blocked causing flooding",
    "Streetlight not working",
    "Road damage near school",
    "Illegal dumping in park",
    "Stray dogs causing nuisance",
    "Traffic signal malfunctioning",
    "Encroachment on footpath",
    "Building construction debris blocking road",
    "Severe flooding during rain",
    "Broken manhole cover",
    "Overflowing garbage bin",
    "Damaged speed breaker",
    "Missing road sign",
    "Tree branch blocking road",
    "Open drain without cover",
    "Damaged footpath tiles",
    "Water logging issue",
  ];

  const reports = [];
  const now = new Date();

  for (let i = 0; i < 150; i++) {
    const title = randomElement(reportTitles);
    const area = randomElement(uniqueAreas);
    const mla = AREA_TO_MLA.find((a) => a.area === area);
    const category = randomElement(CATEGORIES);
    const status = randomElement(STATUSES);
    const createdBy = randomElement(citizens);
    const createdAt = randomDate(90); // Last 90 days
    const updatedAt = status === "REPORTED" ? createdAt : randomDate(30);

    const report = await prisma.report.create({
      data: {
        title: `${title} (${i + 1})`,
        description: `This is a detailed description of the issue reported in ${area}. The problem has been affecting residents for some time now.`,
        category: category as any,
        status: status as any,
        areaName: area,
        mlaName: mla?.mla_name ?? null,
        constituencyName: mla?.constituency ?? null,
        latitude: randomFloat(HYDERABAD_BOUNDS.latMin, HYDERABAD_BOUNDS.latMax),
        longitude: randomFloat(HYDERABAD_BOUNDS.lngMin, HYDERABAD_BOUNDS.lngMax),
        locationText: `${area}, Hyderabad`,
        createdById: createdBy.id,
        upvoteCount: randomInt(0, 50),
        escalated: createdAt < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) && status !== "CONFIRMED_FIXED",
        escalatedAt:
          createdAt < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) && status !== "CONFIRMED_FIXED"
            ? new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
            : null,
        citizenVerified: status === "CONFIRMED_FIXED" ? true : status === "REOPENED" ? false : null,
        assignedAuthorityId: status !== "REPORTED" ? randomElement(authorities).id : null,
        createdAt,
        updatedAt,
      },
    });

    // Create timeline entries
    await prisma.issueTimeline.create({
      data: {
        issueId: report.id,
        actorId: createdBy.id,
        actorName: createdBy.name,
        actorRole: "CITIZEN",
        action: "REPORTED",
        note: `Issue reported by ${createdBy.name}.`,
      },
    });

    if (mla) {
      await prisma.issueTimeline.create({
        data: {
          issueId: report.id,
          actorId: null,
          actorName: "System",
          actorRole: "SYSTEM",
          action: "ASSIGNED",
          note: `Automatically assigned to MLA ${mla.mla_name} (${mla.constituency}) based on area: ${area}.`,
        },
      });
    }

    if (status !== "REPORTED" && report.assignedAuthorityId) {
      const authority = authorities.find((a) => a.id === report.assignedAuthorityId);
      if (authority) {
        await prisma.issueTimeline.create({
          data: {
            issueId: report.id,
            actorId: authority.id,
            actorName: authority.name,
            actorRole: "AUTHORITY",
            action: "STATUS_CHANGED",
            note: `Status changed to ${status}.`,
          },
        });
      }
    }

    if (status === "CONFIRMED_FIXED") {
      await prisma.issueTimeline.create({
        data: {
          issueId: report.id,
          actorId: createdBy.id,
          actorName: createdBy.name,
          actorRole: "CITIZEN",
          action: "CITIZEN_VERIFIED",
          note: `Fix confirmed by ${createdBy.name}.`,
        },
      });
    }

    // Add some upvotes
    const upvoteCount = randomInt(0, Math.min(20, citizens.length));
    const upvoters = citizens.sort(() => Math.random() - 0.5).slice(0, upvoteCount);
    for (const voter of upvoters) {
      await prisma.upvote.create({
        data: {
          issueId: report.id,
          userId: voter.id,
        },
      });
    }

    // Add some comments
    if (Math.random() > 0.5) {
      const commenter = randomElement(citizens);
      await prisma.comment.create({
        data: {
          issueId: report.id,
          userId: commenter.id,
          content: `This is a public comment on the issue. Hope it gets resolved soon!`,
          isOfficial: false,
        },
      });
    }

    reports.push(report);
  }

  console.log(`✅ Created ${reports.length} reports`);

  // Create some comments from authorities
  console.log("💬 Creating official comments...");
  const officialComments = reports.filter(() => Math.random() > 0.7);
  for (const report of officialComments) {
    if (report.assignedAuthorityId) {
      const authority = authorities.find((a) => a.id === report.assignedAuthorityId);
      if (authority) {
        await prisma.comment.create({
          data: {
            issueId: report.id,
            userId: authority.id,
            content: `Official response: We are looking into this matter and will update soon.`,
            isOfficial: true,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${officialComments.length} official comments`);

  console.log("🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   Citizens: ${citizens.length}`);
  console.log(`   Authorities: ${authorities.length}`);
  console.log(`   Reports: ${reports.length}`);
  console.log(`\n🔑 Login credentials:`);
  console.log(`   Citizen: citizen1@civicos.in / password123`);
  console.log(`   Authority: ghmc@civicos.in / password123`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
