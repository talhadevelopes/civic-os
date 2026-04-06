import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Haversine formula — distance between two coordinates in meters
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Shortest distance from point P to line segment A→B
function pointToSegment(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number
): number {
  const dx = bLng - aLng;
  const dy = bLat - aLat;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversine(pLat, pLng, aLat, aLng);
  const t = Math.max(0, Math.min(1, ((pLng - aLng) * dx + (pLat - aLat) * dy) / lenSq));
  return haversine(pLat, pLng, aLat + t * dy, aLng + t * dx);
}

function minDistanceToRoute(lat: number, lng: number, points: [number, number][]): number {
  let min = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const d = pointToSegment(lat, lng, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    if (d < min) min = d;
  }
  return min;
}

export async function POST(req: Request) {
  try {
    const { routePoints } = await req.json();
    if (!routePoints?.length) {
      return NextResponse.json({ error: "Route points required" }, { status: 400 });
    }

    // Fetch all open civic complaints that have coordinates
    const openReports = await prisma.report.findMany({
      where: {
        status: { notIn: ["CONFIRMED_FIXED", "REJECTED"] },
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        areaName: true,
        latitude: true,
        longitude: true,
      },
    });

    // Flag every complaint within 100m of the route
    const flagged = openReports
      .map((r: any) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        status: r.status,
        areaName: r.areaName,
        lat: r.latitude!,
        lng: r.longitude!,
        distanceFromRoute: Math.round(minDistanceToRoute(r.latitude!, r.longitude!, routePoints)),
      }))
      .filter((r: any) => r.distanceFromRoute <= 100)
      .sort((a: any, b: any) => a.distanceFromRoute - b.distanceFromRoute);

    return NextResponse.json({ flaggedComplaints: flagged });
  } catch {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
