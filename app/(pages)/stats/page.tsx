import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMlaStatsFromReports } from "@/lib/mlaStats";
import StatsCharts from "@/components/StatsCharts";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default async function StatsPage() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalReports,
    confirmedThisMonth,
    confirmedLastMonth,
    byCategory,
    mlaStats,
  ] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({
      where: {
        status: "CONFIRMED_FIXED",
        updatedAt: { gte: thisMonthStart },
      },
    }),
    prisma.report.count({
      where: {
        status: "CONFIRMED_FIXED",
        updatedAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    }),
    prisma.report.groupBy({
      by: ["category"],
      _count: { id: true },
    }),
    getMlaStatsFromReports(),
  ]);

  const resolutionRate = totalReports > 0
    ? (await prisma.report.count({ where: { status: "CONFIRMED_FIXED" } }) / totalReports) * 100
    : 0;

  const confirmedReports = await prisma.report.findMany({
    where: { status: "CONFIRMED_FIXED" },
    select: { createdAt: true, updatedAt: true },
  });
  const avgDays = confirmedReports.length > 0
    ? confirmedReports.reduce(
        (s, r) => s + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24),
        0
      ) / confirmedReports.length
    : 0;

  const escalatedCount = await prisma.report.count({
    where: {
      status: { in: ["REPORTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED_PENDING_VERIFICATION", "REOPENED"] },
      createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });

  const civicScore = Math.round(
    Math.min(
      100,
      resolutionRate * 0.5 +
        (100 - Math.min(escalatedCount * 2, 50)) +
        (avgDays <= 7 ? 15 : avgDays <= 14 ? 10 : avgDays <= 30 ? 5 : 0)
    )
  );

  const monthTrend = confirmedThisMonth >= confirmedLastMonth ? "up" : "down";

  const sortedMlas = [...mlaStats].sort((a, b) => b.resolutionRate - a.resolutionRate);
  const top5 = sortedMlas.slice(0, 5);
  const bottom5 = sortedMlas.slice(-5).reverse();

  const categoryData = byCategory.map((c) => ({
    name: c.category.replace(/_/g, " "),
    count: c._count.id,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold" style={{ color: "var(--text-heading)" }}>
          Hyderabad Civic Health Score
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-body)" }}>
          This month&apos;s civic accountability snapshot
        </p>

        <div
          className="mt-8 rounded-3xl border-2 p-8 text-center"
          style={{
            borderColor: civicScore >= 70 ? "var(--primary-border)" : civicScore >= 50 ? "#f59e0b" : "#fca5a5",
            background: civicScore >= 70 ? "var(--primary-mint)" : civicScore >= 50 ? "#fffbeb" : "#fef2f2",
          }}
        >
          <div className="text-6xl font-bold" style={{ color: "var(--text-heading)" }}>
            {civicScore}/100
          </div>
          <div className="mt-2 text-lg font-medium" style={{ color: "var(--text-body)" }}>
            Civic Health Score
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {monthTrend === "up" ? (
              <TrendingUp className="h-4 w-4" style={{ color: "var(--primary)" }} />
            ) : (
              <TrendingDown className="h-4 w-4" style={{ color: "#dc2626" }} />
            )}
            {confirmedThisMonth} confirmed fixed this month
            {confirmedLastMonth > 0 && (
              <span>
                ({monthTrend === "up" ? "+" : ""}
                {Math.round(((confirmedThisMonth - confirmedLastMonth) / confirmedLastMonth) * 100)}% vs last month)
              </span>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Issues", value: totalReports },
            { label: "Resolution Rate", value: `${resolutionRate.toFixed(1)}%` },
            { label: "Avg Fix Time", value: avgDays > 0 ? `${avgDays.toFixed(1)} days` : "—" },
            { label: "Escalated (30+ days)", value: escalatedCount },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border p-6"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="text-2xl font-bold" style={{ color: "var(--text-heading)" }}>
                {value}
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div
            className="rounded-2xl border p-6"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Issues by Category
            </h2>
            <div className="mt-4">
              <StatsCharts data={categoryData} />
            </div>
          </div>

          <div
            className="rounded-2xl border p-6"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Top 5 Wards This Month
            </h2>
            <div className="mt-4 space-y-3">
              {top5.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data yet</p>
              ) : (
                top5.map((m, i) => (
                  <Link
                    key={m.slug}
                    href={`/authorities/mla/${m.slug}`}
                    className="flex items-center justify-between rounded-xl border p-3 transition hover:border-green-300"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                        style={{
                          background: i === 0 ? "#fef3c7" : i === 1 ? "#f3f4f6" : i === 2 ? "#fef3c7" : "var(--primary-mint)",
                          color: i === 0 ? "#b45309" : i === 1 ? "#6b7280" : i === 2 ? "#b45309" : "var(--primary)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {m.mlaName}
                      </span>
                    </div>
                    <span className="font-semibold" style={{ color: "var(--primary)" }}>
                      {m.resolutionRate.toFixed(0)}%
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div
          className="mt-8 rounded-2xl border p-6"
          style={{ background: "#fef2f2", borderColor: "#fca5a5" }}
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ color: "#dc2626" }}>
            <AlertTriangle className="h-5 w-5" />
            Bottom 5 Wards (Needs Attention)
          </h2>
          <div className="mt-4 space-y-3">
            {bottom5.length === 0 ? (
              <p className="text-sm" style={{ color: "#7f1d1d" }}>No data yet</p>
            ) : (
              bottom5.map((m) => (
                <Link
                  key={m.slug}
                  href={`/authorities/mla/${m.slug}`}
                  className="flex items-center justify-between rounded-xl border border-red-200 bg-white p-3 transition hover:bg-red-50"
                >
                  <span className="font-medium" style={{ color: "#991b1b" }}>
                    {m.mlaName} ({m.constituency})
                  </span>
                  <span className="font-semibold" style={{ color: "#dc2626" }}>
                    {m.resolutionRate.toFixed(0)}%
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
