import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMlaStatsFromReports } from "@/lib/mlaStats";
import { AREA_TO_MLA } from "@/public/data/areaToMla";
import CompareMapWrapper from "@/app/_components/maps/CompareMapWrapper";

const uniqueAreas = [...new Set(AREA_TO_MLA.map((a) => a.area))].sort();

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ward1?: string; ward2?: string }>;
}) {
  const { ward1 = "", ward2 = "" } = await searchParams;

  const mlas = await getMlaStatsFromReports();
  const byConstituency = Object.fromEntries(mlas.map((m) => [m.constituency, m]));

  const area1 = ward1 || uniqueAreas[0];
  const area2 = ward2 || (uniqueAreas[1] ?? uniqueAreas[0]);

  const mla1Data = AREA_TO_MLA.find((a) => a.area === area1);
  const mla2Data = AREA_TO_MLA.find((a) => a.area === area2);

  const mla1 = mla1Data ? byConstituency[mla1Data.constituency] : null;
  const mla2 = mla2Data ? byConstituency[mla2Data.constituency] : null;

  const [reports1, reports2] = await Promise.all([
    mla1Data
      ? prisma.report.findMany({
          where: { constituencyName: mla1Data.constituency },
          select: { id: true, latitude: true, longitude: true, status: true, title: true },
        })
      : [],
    mla2Data
      ? prisma.report.findMany({
          where: { constituencyName: mla2Data.constituency },
          select: { id: true, latitude: true, longitude: true, status: true, title: true },
        })
      : [],
  ]);

  const mapReports1 = reports1.filter((r) => r.latitude != null && r.longitude != null).map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    latitude: r.latitude!,
    longitude: r.longitude!,
  }));
  const mapReports2 = reports2.filter((r) => r.latitude != null && r.longitude != null).map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    latitude: r.latitude!,
    longitude: r.longitude!,
  }));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold" style={{ color: "var(--text-heading)" }}>
          Ward Comparison
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-body)" }}>
          Compare two wards side by side
        </p>

        <form action="/compare" method="get" className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Ward 1:
            </label>
            <select
              name="ward1"
              defaultValue={area1}
              className="h-10 rounded-xl border px-3 text-sm"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              {uniqueAreas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Ward 2:
            </label>
            <select
              name="ward2"
              defaultValue={area2}
              className="h-10 rounded-xl border px-3 text-sm"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              {uniqueAreas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-10 rounded-xl px-4 text-sm font-medium"
            style={{ background: "var(--primary)", color: "var(--text-on-primary)" }}
          >
            Compare
          </button>
        </form>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div
            className="rounded-2xl border p-6"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {area1}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              MLA: {mla1Data?.mla_name ?? "—"}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Total", value: mla1?.totalIssues ?? 0 },
                { label: "Resolved %", value: mla1 ? `${mla1.resolutionRate.toFixed(0)}%` : "—" },
                { label: "Avg Days", value: mla1?.avgResolutionDays != null ? mla1.avgResolutionDays.toFixed(1) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border p-3 text-center" style={{ borderColor: "var(--border)" }}>
                  <div className="font-bold" style={{ color: "var(--text-heading)" }}>{value}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border" style={{ height: 200, borderColor: "var(--border)" }}>
              <CompareMapWrapper reports={mapReports1} />
            </div>
          </div>

          <div
            className="rounded-2xl border p-6"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {area2}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              MLA: {mla2Data?.mla_name ?? "—"}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Total", value: mla2?.totalIssues ?? 0 },
                { label: "Resolved %", value: mla2 ? `${mla2.resolutionRate.toFixed(0)}%` : "—" },
                { label: "Avg Days", value: mla2?.avgResolutionDays != null ? mla2.avgResolutionDays.toFixed(1) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border p-3 text-center" style={{ borderColor: "var(--border)" }}>
                  <div className="font-bold" style={{ color: "var(--text-heading)" }}>{value}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border" style={{ height: 200, borderColor: "var(--border)" }}>
              <CompareMapWrapper reports={mapReports2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
