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
  photoUrl: string | null;
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

export async function getMlaBySlug(slug: string): Promise<{ mlaName: string; constituency: string; photoUrl: string | null } | null> {
  const match = AREA_TO_MLA.find(
    (a) => constituencyToSlug(a.constituency) === slug
  );
  if (!match) return null;
  
  const dbMla = await prisma.mla.findFirst({
    where: {
      name: match.mla_name,
      constituency: match.constituency
    }
  });

  return { 
    mlaName: match.mla_name, 
    constituency: match.constituency,
    photoUrl: dbMla?.photoUrl ?? null
  };
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
  const [reports, mlas] = await Promise.all([
    prisma.report.findMany({
      where: {
        assignedMlaId: { not: null },
      },
      select: {
        assignedMlaId: true,
        mlaName: true,
        constituencyName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.mla.findMany({
      select: {
        id: true,
        name: true,
        constituency: true,
        photoUrl: true,
      },
    }),
  ]);

  const mlaMap = new Map<string, { name: string; constituency: string; photoUrl: string | null }>();
  for (const m of mlas) {
    mlaMap.set(m.id, {
      name: m.name,
      constituency: m.constituency ?? "Unknown",
      photoUrl: m.photoUrl,
    });
  }

  const byMlaId = new Map<string, MlaStatsRow>();

  for (const r of reports) {
    const mlaId = r.assignedMlaId!;
    const mlaInfo = mlaMap.get(mlaId);
    
    if (!mlaInfo) continue;

    if (!byMlaId.has(mlaId)) {
      byMlaId.set(mlaId, {
        mlaName: mlaInfo.name,
        constituency: mlaInfo.constituency,
        photoUrl: mlaInfo.photoUrl,
        slug: constituencyToSlug(mlaInfo.constituency),
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

    const row = byMlaId.get(mlaId)!;
    row.totalIssues += 1;

    if (r.status === "CONFIRMED_FIXED") {
      row.confirmedFixed += 1;
      const days = (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      row.avgResolutionDays = row.avgResolutionDays === null ? days : (row.avgResolutionDays + days) / 2;
    } else if (UNRESOLVED_STATUSES.includes(r.status as any)) {
      row.pending += 1;
      const age = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (age >= 30) row.ignoredCount += 1;
    }

    if (r.status === "REOPENED") row.reopened += 1;
    if (r.status === "REJECTED") row.rejected += 1;
  }

  const result = Array.from(byMlaId.values());
  for (const row of result) {
    row.resolutionRate = row.totalIssues > 0 ? (row.confirmedFixed / row.totalIssues) * 100 : 0;
  }

  return result;
}
