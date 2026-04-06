/**
 * CIVICOS — Prisma Seed Script
 * Reads from data/mla.json and data/report.json
 * Run: npm run seed
 */

import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const bcrypt = require("bcrypt") as typeof import("bcrypt");

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read + parse JSON files (strips trailing period if present)
function readJson(filename: string) {
  const filePath = path.join(__dirname, "..", "data", filename);
  let raw = fs.readFileSync(filePath, "utf-8").trim();
  if (raw.endsWith(".")) raw = raw.slice(0, -1);
  return JSON.parse(raw);
}

const MLA_PLACEHOLDER_IMAGES = [
  "https://randomuser.me/api/portraits/men/1.jpg",
  "https://randomuser.me/api/portraits/men/2.jpg",
  "https://randomuser.me/api/portraits/men/3.jpg",
  "https://randomuser.me/api/portraits/men/4.jpg",
  "https://randomuser.me/api/portraits/men/5.jpg",
  "https://randomuser.me/api/portraits/men/6.jpg",
  "https://randomuser.me/api/portraits/men/7.jpg",
  "https://randomuser.me/api/portraits/men/8.jpg",
  "https://randomuser.me/api/portraits/men/9.jpg",
  "https://randomuser.me/api/portraits/men/10.jpg",
];

async function main() {
  console.log("🌱 Starting CIVICOS seed...\n");

  // ── Clear all tables ──────────────────────────────────────────
  await prisma.mlaReview.deleteMany();
  await prisma.upvote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.issueTimeline.deleteMany();
  await prisma.reportImage.deleteMany();
  await prisma.report.deleteMany();
  await prisma.mla.deleteMany();
  await prisma.user.deleteMany();
  console.log("✓ Cleared all existing data");

  const hashedPw = await bcrypt.hash("password123", 10);

  // ── 1. Users ──────────────────────────────────────────────────
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

  console.log("✓ Created 2 users (1 authority, 1 citizen: Ahmed Khan)");

  // ── 2. MLAs ───────────────────────────────────────────────────
  const mlaData = readJson("mla.json");
  let mlaCount = 0;

  for (const m of mlaData) {
    const photoUrl = m.photoUrl || MLA_PLACEHOLDER_IMAGES[mlaCount % MLA_PLACEHOLDER_IMAGES.length];
    await prisma.mla.create({
      data: {
        name: m.mlaName,
        party: m.party ?? null,
        photoUrl: photoUrl,
        yearsInOffice: m.yearsInOffice ?? null,
        constituency: m.constituency ?? null,
      },
    });
    mlaCount++;
  }

  console.log(`✓ Created ${mlaCount} MLA records`);

  // ── 3. Reports + images + timelines ──────────────────────────
  const reportData = readJson("report.json");
  let reportCount = 0;

  for (const r of reportData) {
    const isAssigned = ["ASSIGNED", "IN_PROGRESS", "CONFIRMED_FIXED", "REOPENED"].includes(r.status);

    const daysAgo = Math.floor(Math.random() * 120);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const report = await prisma.report.create({
      data: {
        title: r.title,
        description: r.description,
        category: r.category,
        status: r.status,
        areaName: r.areaName,
        mlaName: r.mlaName ?? null,
        constituencyName: r.constituencyName ?? null,
        latitude: r.lat ?? null,
        longitude: r.lng ?? null,
        createdById: citizen.id,
        assignedAuthorityId: isAssigned ? authority.id : null,
        upvoteCount: Math.floor(Math.random() * 50),
        escalated: Math.random() > 0.8,
        citizenVerified: r.status === "CONFIRMED_FIXED" ? true : null,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        // Attach the image URL
        images: r.imageUrl
          ? {
              create: {
                isMain: true,
                url: r.imageUrl,
              },
            }
          : undefined,
      },
    });

    // Timeline: REPORTED
    await prisma.issueTimeline.create({
      data: {
        issueId: report.id,
        actorId: citizen.id,
        actorName: citizen.name,
        actorRole: "CITIZEN",
        action: "REPORTED",
        note: "Issue reported via CivicOS platform.",
        createdAt,
      },
    });

    // Timeline: ASSIGNED
    if (isAssigned) {
      await prisma.issueTimeline.create({
        data: {
          issueId: report.id,
          actorId: authority.id,
          actorName: "GHMC Authority",
          actorRole: "AUTHORITY",
          action: "ASSIGNED",
          note: "Assigned to field inspection team for site visit.",
          createdAt: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000),
        },
      });
    }

    reportCount++;
  }

  console.log(`✓ Created ${reportCount} reports with images and timelines`);
  console.log("\n🎉 Seed complete!\n");
  console.log("── Login credentials ──────────────────────────────");
  console.log("  Citizen:   ahmed.khan@gmail.com   / password123");
  console.log("  Authority: authority@ghmc.gov.in  / password123");
  console.log("───────────────────────────────────────────────────\n");
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
