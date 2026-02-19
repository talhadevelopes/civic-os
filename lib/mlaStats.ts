import { prisma } from "@/lib/prisma";
import { AREA_TO_MLA } from "@/public/data/areaToMla";

const UNRESOLVED_STATUSES = [
  "REPORTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED_PENDING_VERIFICATION",
  "REOPENED",
] as const;

export type MlaStatsRow = {
  mlaName: string;
  constituency: string;
  slug: string;
  totalIssues: number;
  confirmedFixed: number;
  pending: number;
  reopened: number;
  rejected: number;
  resolutionRate: number;
  avgResolutionDays: number | null;
  ignoredCount: number; // issues open 30+ days
};

function constituencyToSlug(constituency: string): string {
  return constituency
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function slugToConstituency(slug: string): string | null {
  const match = AREA_TO_MLA.find(
    (a) => constituencyToSlug(a.constituency) === slug
  );
  return match?.constituency ?? null;
}

export function getMlaBySlug(slug: string): { mlaName: string; constituency: string } | null {
  const match = AREA_TO_MLA.find(
    (a) => constituencyToSlug(a.constituency) === slug
  );
  if (!match) return null;
  return { mlaName: match.mla_name, constituency: match.constituency };
}

export function getConstituencySlugs(): string[] {
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const a of AREA_TO_MLA) {
    const s = constituencyToSlug(a.constituency);
    if (!seen.has(s)) {
      seen.add(s);
      slugs.push(s);
    }
  }
  return slugs;
}

export async function getMlaStatsFromReports(): Promise<MlaStatsRow[]> {
  const reports = await prisma.report.findMany({
    where: {
      mlaName: { not: null },
      constituencyName: { not: null },
    },
    select: {
      mlaName: true,
      constituencyName: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const byKey = new Map<string, MlaStatsRow>();

  for (const r of reports) {
    const mlaName = r.mlaName ?? "Unknown";
    const constituency = r.constituencyName ?? "Unknown";
    const key = `${mlaName}|${constituency}`;

    if (!byKey.has(key)) {
      byKey.set(key, {
        mlaName,
        constituency,
        slug: constituencyToSlug(constituency),
        totalIssues: 0,
        confirmedFixed: 0,
        pending: 0,
        reopened: 0,
        rejected: 0,
        resolutionRate: 0,
        avgResolutionDays: null,
        ignoredCount: 0,
      });
    }

    const row = byKey.get(key)!;
    row.totalIssues += 1;

    if (r.status === "CONFIRMED_FIXED") row.confirmedFixed += 1;
    else if (UNRESOLVED_STATUSES.includes(r.status as any)) {
      row.pending += 1;
      const daysOpen =
        (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOpen >= 30) row.ignoredCount += 1;
    } else if (r.status === "REOPENED") row.reopened += 1;
    else if (r.status === "REJECTED") row.rejected += 1;
  }

  // Compute resolution rate and avg days
  for (const row of byKey.values()) {
    row.resolutionRate =
      row.totalIssues > 0 ? (row.confirmedFixed / row.totalIssues) * 100 : 0;
  }

  // Avg resolution time: need confirmed issues with updatedAt - createdAt
  const confirmedReports = await prisma.report.findMany({
    where: {
      status: "CONFIRMED_FIXED",
      mlaName: { not: null },
      constituencyName: { not: null },
    },
    select: {
      mlaName: true,
      constituencyName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const resolutionDaysByKey = new Map<string, number[]>();
  for (const r of confirmedReports) {
    const key = `${r.mlaName}|${r.constituencyName}`;
    const days =
      (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);
    if (!resolutionDaysByKey.has(key)) resolutionDaysByKey.set(key, []);
    resolutionDaysByKey.get(key)!.push(days);
  }

  for (const row of byKey.values()) {
    const key = `${row.mlaName}|${row.constituency}`;
    const days = resolutionDaysByKey.get(key);
    if (days && days.length > 0) {
      row.avgResolutionDays =
        days.reduce((a, b) => a + b, 0) / days.length;
    }
  }

  return Array.from(byKey.values());
}
