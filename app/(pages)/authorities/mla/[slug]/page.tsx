import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMlaBySlug } from "@/lib/mlaStats";
import MlaProfileClient from "@/components/MlaProfileClient";

const UNRESOLVED = [
  "REPORTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED_PENDING_VERIFICATION",
  "REOPENED",
];

export default async function MlaProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mla = getMlaBySlug(slug);

  if (!mla) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--text-heading)" }}
          >
            MLA not found
          </h1>
          <Link
            href="/authorities"
            className="mt-4 inline-block text-sm font-medium"
            style={{ color: "var(--text-green)" }}
          >
            ← Back to Authorities
          </Link>
        </div>
      </div>
    );
  }

  const reports = await prisma.report.findMany({
    where: {
      constituencyName: mla.constituency,
      mlaName: mla.mlaName,
    },
    orderBy: { createdAt: "desc" },
    include: {
      images: { where: { isMain: true }, take: 1 },
    },
  });

  const total = reports.length;
  const confirmedFixed = reports.filter((r) => r.status === "CONFIRMED_FIXED").length;
  const pending = reports.filter((r) => UNRESOLVED.includes(r.status)).length;
  const reopened = reports.filter((r) => r.status === "REOPENED").length;
  const rejected = reports.filter((r) => r.status === "REJECTED").length;

  const resolutionRate = total > 0 ? (confirmedFixed / total) * 100 : 0;

  const confirmedReports = reports.filter((r) => r.status === "CONFIRMED_FIXED");
  const avgResolutionDays =
    confirmedReports.length > 0
      ? confirmedReports.reduce((sum, r) => {
          const days =
            (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / confirmedReports.length
      : null;

  const ignoredCount = reports.filter((r) => {
    if (!UNRESOLVED.includes(r.status)) return false;
    const days =
      (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 30;
  }).length;

  const byCategory = reports.reduce(
    (acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusBreakdown = {
    open: pending,
    resolved: confirmedFixed,
    reopened,
    rejected,
  };

  const mapReports = reports
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      latitude: r.latitude!,
      longitude: r.longitude!,
    }));

  const leaderboardMlas = await prisma.report
    .groupBy({
      by: ["mlaName", "constituencyName"],
      where: { constituencyName: { not: null } },
      _count: { id: true },
    })
    .then((groups) => {
      const withFixed = groups.map(async (g) => {
        const fixed = await prisma.report.count({
          where: {
            mlaName: g.mlaName,
            constituencyName: g.constituencyName,
            status: "CONFIRMED_FIXED",
          },
        });
        const total = g._count.id;
        return {
          mlaName: g.mlaName!,
          constituency: g.constituencyName!,
          rate: total > 0 ? (fixed / total) * 100 : 0,
        };
      });
      return Promise.all(withFixed);
    });

  const ranked = leaderboardMlas
    .sort((a, b) => b.rate - a.rate)
    .map((m, i) => ({ ...m, rank: i + 1 }));
  const myRank =
    ranked.find(
      (r) =>
        r.mlaName === mla.mlaName && r.constituency === mla.constituency
    )?.rank ?? null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <Link
          href="/authorities"
          className="text-sm font-medium"
          style={{ color: "var(--text-green)" }}
        >
          ← Back to Authorities
        </Link>

        <div
          className="mt-6 rounded-2xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold"
              style={{ background: "#eff6ff", color: "#2563eb" }}
            >
              {mla.mlaName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--text-heading)" }}
              >
                {mla.mlaName}
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-body)" }}>
                {mla.constituency}
              </p>
              {myRank != null && (
                <span
                  className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: "var(--primary-mint)",
                    borderColor: "var(--primary-border)",
                    color: "var(--primary)",
                  }}
                >
                  Leaderboard #{myRank}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Issues", value: total },
            { label: "Resolved", value: confirmedFixed },
            { label: "Pending", value: pending },
            { label: "Reopened", value: reopened },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border p-5 text-center"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--text-heading)" }}
              >
                {value}
              </div>
              <div
                className="mt-1 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div
            className="rounded-2xl border p-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--text-heading)" }}
            >
              {resolutionRate.toFixed(1)}%
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Resolution Rate
            </div>
          </div>
          <div
            className="rounded-2xl border p-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--text-heading)" }}
            >
              {avgResolutionDays != null
                ? avgResolutionDays.toFixed(1)
                : "—"}
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Avg Resolution (days)
            </div>
          </div>
        </div>

        {ignoredCount > 0 && (
          <div
            className="mt-6 flex items-center gap-2 rounded-xl border px-4 py-3"
            style={{
              background: "#fef2f2",
              borderColor: "#fca5a5",
              color: "#dc2626",
            }}
          >
            <span className="font-semibold">{ignoredCount} issues</span>
            <span>ignored beyond 30 days</span>
          </div>
        )}

        <MlaProfileClient
          byCategory={byCategory}
          statusBreakdown={statusBreakdown}
          mapReports={mapReports}
        />

        <div
          className="mt-8 rounded-2xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Recent Issues in Jurisdiction
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {reports.slice(0, 10).map((r) => {
              const main = r.images[0];
              const imgSrc = main
                ? `data:${main.mimeType};base64,${main.base64Data}`
                : null;
              return (
                <Link
                  key={r.id}
                  href={`/reports/${r.id}`}
                  className="flex gap-3 rounded-xl border p-3 transition hover:border-green-300"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-lg"
                    style={{ background: "var(--primary-light)" }}
                  >
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {r.title}
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {r.status.replace(/_/g, " ")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          {reports.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No issues reported in this jurisdiction yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
