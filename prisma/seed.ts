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

function readJson(filename: string) {
  const filePath = path.join(__dirname, "..", "data", filename);
  let raw = fs.readFileSync(filePath, "utf-8").trim();
  if (raw.endsWith(".")) raw = raw.slice(0, -1);
  return JSON.parse(raw);
}

// ── Category Image Banks ──────────────────────────────────────────
const CATEGORY_IMAGES: Record<string, string[]> = {
  POTHOLES: [
    "https://upload.wikimedia.org/wikipedia/commons/0/03/Waterlogged_roads_%26_potholes_in_Kolkata_(India)_(1).jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/fe/Monsoon_floods_in_Ambala,_2010.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3e/Flood_waters_reaching_the_road_in_Fatehabad_District;_2023.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6a/Flood_waters_reaching_the_village_roads_in_Fatehabad_District;_2023.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b2/Garbej_dump_on_the_Delhi_-_Karnal_Road_01.jpg",
  ],
  GARBAGE: [
    "https://upload.wikimedia.org/wikipedia/commons/1/15/City_Garbage_Dump_-_Dhapa_-_Kolkata_2010-08-06_7017.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/f/fc/City_Garbage_Dump_-_Dhapa_-_Kolkata_2010-08-06_7017_(cropped).JPG",
    "https://upload.wikimedia.org/wikipedia/commons/d/df/Garbage_dumping_site_in_santiketan,_khoai,_Birbhum,_West_Bengal.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/84/Garbage_heap_in_Batla_House,_New_Delhi,_18_June_2024.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f6/Burning_Garbage_-_East_Kolkata_Wetlands_-_Nalban_-_Kolkata_2017-06-09_2031.JPG",
  ],
  ILLEGAL_DUMPING: [
    "https://upload.wikimedia.org/wikipedia/commons/1/15/City_Garbage_Dump_-_Dhapa_-_Kolkata_2010-08-06_7017.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/f/fc/City_Garbage_Dump_-_Dhapa_-_Kolkata_2010-08-06_7017_(cropped).JPG",
    "https://upload.wikimedia.org/wikipedia/commons/d/df/Garbage_dumping_site_in_santiketan,_khoai,_Birbhum,_West_Bengal.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/84/Garbage_heap_in_Batla_House,_New_Delhi,_18_June_2024.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f6/Burning_Garbage_-_East_Kolkata_Wetlands_-_Nalban_-_Kolkata_2017-06-09_2031.JPG",
  ],
  TRAFFIC_SIGNAL: [
    "https://upload.wikimedia.org/wikipedia/commons/f/f7/Broken_traffic_light_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/fb/Street_lighting_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/11/Traffic_signal_broken_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/34/Night_road_India_dark_streetlight.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/Non-functional_signal_India.jpg",
  ],
  STREETLIGHT: [
    "https://upload.wikimedia.org/wikipedia/commons/f/f7/Broken_traffic_light_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/fb/Street_lighting_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/11/Traffic_signal_broken_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/34/Night_road_India_dark_streetlight.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/Non-functional_signal_India.jpg",
  ],
  STRAY_ANIMALS: [
    "https://upload.wikimedia.org/wikipedia/commons/0/01/Stray_Dog_%26_Pedestrians_-_Kolkata_05903.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/b/b3/Cow_in_Street_-_Madurai_-_India.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/c/c2/Street_Cow,_Delhi_-_panoramio.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e1/India_-_Delhi_-_009_-_cows_hanging_out_on_the_road_(2129391055).jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/bb/Khajuraho_-_a_cow_on_a_street.jpg",
  ],
  BUILDING: [
    "https://upload.wikimedia.org/wikipedia/commons/9/9f/Encroachment_on_footpath_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e1/Illegal_construction_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4b/Footpath_encroachment_Mumbai.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/35/Road_encroachment_hawkers_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6e/Illegal_building_India.jpg",
  ],
  ENCROACHMENT: [
    "https://upload.wikimedia.org/wikipedia/commons/9/9f/Encroachment_on_footpath_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e1/Illegal_construction_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4b/Footpath_encroachment_Mumbai.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/35/Road_encroachment_hawkers_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6e/Illegal_building_India.jpg",
  ],
  ROAD_DAMAGE: [
    "https://upload.wikimedia.org/wikipedia/commons/0/03/Waterlogged_roads_%26_potholes_in_Kolkata_(India)_(1).jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/fe/Monsoon_floods_in_Ambala,_2010.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3e/Flood_waters_reaching_the_road_in_Fatehabad_District;_2023.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6a/Flood_waters_reaching_the_village_roads_in_Fatehabad_District;_2023.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b2/Garbej_dump_on_the_Delhi_-_Karnal_Road_01.jpg",
  ],
  WATER_LEAKAGE: [
    "https://upload.wikimedia.org/wikipedia/commons/7/7d/Angamaly_flood_2019,_Kerala,_india_IMG_20190809_091640.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/65/Kerala_Flood_2019_Angamaly,_Kerala,_India_IMG_20190812_130830.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/37/Kerala_Flood_9-8-2019_at_Kidangoor_-Mookkannoor_road_near_Angamaly.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/0b/Kerala_flood_9-8-2019_at_Kidangoor_near_Angamaly.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6a/Flood_waters_reaching_the_village_roads_in_Fatehabad_District;_2023.jpg",
  ],
  FLOODING: [
    "https://upload.wikimedia.org/wikipedia/commons/7/7d/Angamaly_flood_2019,_Kerala,_india_IMG_20190809_091640.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/65/Kerala_Flood_2019_Angamaly,_Kerala,_India_IMG_20190812_130830.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/37/Kerala_Flood_9-8-2019_at_Kidangoor_-Mookkannoor_road_near_Angamaly.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/0b/Kerala_flood_9-8-2019_at_Kidangoor_near_Angamaly.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6a/Flood_waters_reaching_the_village_roads_in_Fatehabad_District;_2023.jpg",
  ],
  DRAINAGE_SEWAGE: [
    "https://upload.wikimedia.org/wikipedia/commons/7/7d/Angamaly_flood_2019,_Kerala,_india_IMG_20190809_091640.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/65/Kerala_Flood_2019_Angamaly,_Kerala,_India_IMG_20190812_130830.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/37/Kerala_Flood_9-8-2019_at_Kidangoor_-Mookkannoor_road_near_Angamaly.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/0b/Kerala_flood_9-8-2019_at_Kidangoor_near_Angamaly.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6a/Flood_waters_reaching_the_village_roads_in_Fatehabad_District;_2023.jpg",
  ],
  OTHER: [
    "https://upload.wikimedia.org/wikipedia/commons/7/7d/Angamaly_flood_2019,_Kerala,_india_IMG_20190809_091640.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/65/Kerala_Flood_2019_Angamaly,_Kerala,_India_IMG_20190812_130830.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/37/Kerala_Flood_9-8-2019_at_Kidangoor_-Mookkannoor_road_near_Angamaly.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/0b/Kerala_flood_9-8-2019_at_Kidangoor_near_Angamaly.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6a/Flood_waters_reaching_the_village_roads_in_Fatehabad_District;_2023.jpg",
  ],
};

function getImagesForCategory(category: string, reportIndex: number): { url: string; isMain: boolean }[] {
  const bank = CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES["OTHER"];
  const images: { url: string; isMain: boolean }[] = [];

  // Distribute primary image by picking from bank using reportIndex
  const mainUrl = bank[reportIndex % bank.length];
  images.push({ url: mainUrl, isMain: true });

  // No need for extra images as per user request
  return images;
}

const FIX_IMAGES = [
  "https://upload.wikimedia.org/wikipedia/commons/d/db/Repaired_road_India.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/3/3f/Clean_street_India.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/a/ac/New_road_construction_India.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/7/77/Swachh_Bharat_clean_street_India.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/f/f8/Patched_pothole_India_road_repair.jpg",
];
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

  // ── 3. Reports + images + full audit trail ─────────────────────
  const reportData = readJson("report.json");
  let reportCount = 0;

  // Build MLA name → id lookup
  const allMlas = await prisma.mla.findMany();
  const mlaByName: Record<string, string> = {};
  for (const mla of allMlas) {
    mlaByName[mla.name] = mla.id;
  }

  for (const r of reportData) {
    const daysAgo = Math.floor(Math.random() * 60) + 10;
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Ensure assignedMlaId is always set
    let assignedMlaId = r.mlaName ? (mlaByName[r.mlaName] ?? null) : null;
    if (!assignedMlaId && allMlas.length > 0) {
      assignedMlaId = allMlas[Math.floor(Math.random() * allMlas.length)].id;
    }

    // Map original status to new simplified statuses
    let newStatus: "ASSIGNED" | "IN_PROGRESS" | "CONFIRMED_FIXED";
    switch (r.status) {
      case "REPORTED":
      case "REJECTED": // Re-evaluate rejected reports as assigned
        newStatus = "ASSIGNED";
        break;
      case "RESOLVED_PENDING_VERIFICATION":
      case "REOPENED":
        newStatus = "IN_PROGRESS";
        break;
      case "CONFIRMED_FIXED":
        newStatus = "CONFIRMED_FIXED";
        break;
      case "ASSIGNED":
      case "IN_PROGRESS":
      default:
        newStatus = r.status as "ASSIGNED" | "IN_PROGRESS" | "CONFIRMED_FIXED";
        break;
    }

    // Build image list: primary (distributed main images)
    const imageList = getImagesForCategory(r.category, reportCount);

    const report = await prisma.report.create({
      data: {
        title: r.title,
        description: r.description,
        category: r.category,
        status: newStatus,
        areaName: r.areaName,
        mlaName: r.mlaName ?? null,
        constituencyName: r.constituencyName ?? null,
        latitude: r.lat ?? null,
        longitude: r.lng ?? null,
        createdById: citizen.id,
        assignedMlaId: assignedMlaId,
        assignedAuthorityId: authority.id, // Always assign to authority
        upvoteCount: Math.floor(Math.random() * 50),
        escalated: daysAgo > 30 && newStatus !== "CONFIRMED_FIXED",
        citizenVerified: newStatus === "CONFIRMED_FIXED" ? true : null,
        fixPhotoUrl: newStatus === "CONFIRMED_FIXED" ? FIX_IMAGES[reportCount % FIX_IMAGES.length] : null,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000),
        images: {
          create: imageList,
        },
      },
    });

    // ── Chronological audit trail timestamps ──
    const t1 = createdAt;
    const t2 = new Date(t1.getTime() + 2 * 24 * 60 * 60 * 1000);
    const t3 = new Date(t1.getTime() + 5 * 24 * 60 * 60 * 1000);
    const t4 = new Date(t1.getTime() + 8 * 24 * 60 * 60 * 1000);
    const t5 = new Date(t1.getTime() + 12 * 24 * 60 * 60 * 1000);

    // Step 1: REPORTED (always)
    await prisma.issueTimeline.create({
      data: {
        issueId: report.id,
        actorId: citizen.id,
        actorName: citizen.name,
        actorRole: "CITIZEN",
        action: "REPORTED",
        note: "Issue reported via CivicOS platform.",
        createdAt: t1,
      },
    });

    // Step 2: ASSIGNED (always, as per new logic)
    await prisma.issueTimeline.create({
      data: {
        issueId: report.id,
        actorId: authority.id,
        actorName: "GHMC Authority",
        actorRole: "AUTHORITY",
        action: "ASSIGNED",
        note: `Reviewed and assigned to field inspection team. MLA ${report.mlaName} notified.`,
        createdAt: t2,
      },
    });

    // Step 3: STATUS_CHANGED (In Progress)
    if (newStatus === "IN_PROGRESS" || newStatus === "CONFIRMED_FIXED") {
      await prisma.issueTimeline.create({
        data: {
          issueId: report.id,
          actorId: authority.id,
          actorName: "GHMC Authority",
          actorRole: "AUTHORITY",
          action: "STATUS_CHANGED",
          note: "Work order initiated. Field team dispatched to the site.",
          createdAt: t3,
        },
      });
    }

    // Step 4: FIX_PHOTO_UPLOADED
    if (newStatus === "CONFIRMED_FIXED") {
      await prisma.issueTimeline.create({
        data: {
          issueId: report.id,
          actorId: authority.id,
          actorName: "GHMC Authority",
          actorRole: "AUTHORITY",
          action: "FIX_PHOTO_UPLOADED",
          note: "Repair completed. Fix photo uploaded and awaiting citizen verification.",
          createdAt: t4,
        },
      });
    }

    // Step 5: CITIZEN_VERIFIED
    if (newStatus === "CONFIRMED_FIXED") {
      await prisma.issueTimeline.create({
        data: {
          issueId: report.id,
          actorId: citizen.id,
          actorName: citizen.name,
          actorRole: "CITIZEN",
          action: "CITIZEN_VERIFIED",
          note: "Citizen confirmed the fix is satisfactory. Issue officially closed.",
          createdAt: t5,
        },
      });
    }

    reportCount++;
  }

  console.log(`✓ Created ${reportCount} reports with 3-4 images each and full audit trails`);
  console.log("\n🎉 Seed complete!\n");
  console.log("── Login credentials ──────────────────────────────");
  console.log("  Citizen:   ahmed.khan@gmail.com   / password123");
  console.log("  Authority: authority@ghmc.gov.in  / password123");
  console.log("───────────────────────────────────────────────────\n");
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
