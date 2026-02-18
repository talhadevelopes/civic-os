import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/authServer";
import { lookupMlaByArea } from "@/lib/areaToMla";

const REPORT_CATEGORY_VALUES = [
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
  "OTHER",
] as const;

type ReportCategoryValue = (typeof REPORT_CATEGORY_VALUES)[number];

const MAX_IMAGE_BYTES = 1_000_000;

async function fileToBase64(file: File): Promise<{ mimeType: string; base64Data: string; bytes: number }> {
  const buf = await file.arrayBuffer();
  const bytes = buf.byteLength;
  const mimeType = file.type || "application/octet-stream";
  const base64Data = Buffer.from(buf).toString("base64");
  return { mimeType, base64Data, bytes };
}

function normalizeReportImages(images: unknown) {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => {
      if (!img || typeof img !== "object") return null;
      const anyImg = img as any;
      const isMain = Boolean(anyImg.isMain);
      const mimeType = typeof anyImg.mimeType === "string" ? anyImg.mimeType : null;
      const base64Data = typeof anyImg.base64Data === "string" ? anyImg.base64Data : null;

      if (!mimeType || !base64Data) return null;
      return { isMain, mimeType, base64Data };
    })
    .filter(Boolean) as { isMain: boolean; mimeType: string; base64Data: string }[];
}

function base64ByteLength(base64: string) {
  const normalized = base64.includes(",") ? base64.split(",").pop() ?? "" : base64;
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
}

export async function GET() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      images: { where: { isMain: true }, take: 1 },
    },
  });

  return NextResponse.json({ reports });
}

export async function POST(req: Request) {
  const session = await requireServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 415 });
  }

  const form = await req.formData();

  const title = String(form.get("title") ?? "").trim();
  const areaName = String(form.get("areaName") ?? "").trim();
  const mapAreaText = String(form.get("mapAreaText") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const category = String(form.get("category") ?? "").trim();

  const latitudeRaw = String(form.get("latitude") ?? "").trim();
  const longitudeRaw = String(form.get("longitude") ?? "").trim();

  const latitude = latitudeRaw ? Number(latitudeRaw) : null;
  const longitude = longitudeRaw ? Number(longitudeRaw) : null;

  if (!title || !areaName || !description || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!REPORT_CATEGORY_VALUES.includes(category as ReportCategoryValue)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const mainImage = form.get("mainImage");
  const bodyImages = form.getAll("bodyImages");

  const imagesToCreate: { isMain: boolean; mimeType: string; base64Data: string }[] = [];

  if (mainImage instanceof File && mainImage.size > 0) {
    const img = await fileToBase64(mainImage);
    if (img.bytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Main image too large (max 1MB)" }, { status: 400 });
    }
    imagesToCreate.push({ isMain: true, mimeType: img.mimeType, base64Data: img.base64Data });
  }

  for (const entry of bodyImages.slice(0, 5)) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    const img = await fileToBase64(entry);
    if (img.bytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Body image too large (max 1MB)" }, { status: 400 });
    }
    imagesToCreate.push({ isMain: false, mimeType: img.mimeType, base64Data: img.base64Data });
  }

  const mla = lookupMlaByArea(areaName);

  const report = await prisma.report.create({
    data: {
      title,
      areaName,
      mapAreaText: mapAreaText || null,
      description,
      category: category as any,
      latitude,
      longitude,
      mlaName: mla?.mla_name ?? null,
      constituencyName: mla?.constituency ?? null,
      createdById: session.user.id,
      images: {
        create: imagesToCreate,
      },
    },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      images: true,
    },
  });

  // Create audit trail entries
  const userName = session.user.name || "Citizen";

  await prisma.issueTimeline.create({
    data: {
      issueId: report.id,
      actorId: session.user.id,
      actorName: userName,
      actorRole: "CITIZEN",
      action: "REPORTED",
      note: `Issue reported by ${userName}.`,
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
        note: `Automatically assigned to MLA ${mla.mla_name} (${mla.constituency}) based on area: ${areaName}.`,
      },
    });
  }

  return NextResponse.json({ report });
}
