import Link from "next/link";
import { getMlaStatsFromReports, type MlaStatsRow } from "@/lib/mlaStats";
import { Trophy, TrendingDown, AlertTriangle } from "lucide-react";

type SortKey = "overall" | "rate" | "fixed" | "ignored" | "reopened";

function sortMlas(mlas: MlaStatsRow[], key: SortKey): MlaStatsRow[] {
  const copy = [...mlas];
  switch (key) {
    case "overall":
    case "rate":
      return copy.sort((a, b) => b.resolutionRate - a.resolutionRate);
    case "fixed":
      return copy.sort((a, b) => b.confirmedFixed - a.confirmedFixed);
    case "ignored":
      return copy.sort((a, b) => b.ignoredCount - a.ignoredCount);
    case "reopened":
      return copy.sort((a, b) => b.reopened - a.reopened);
    default:
      return copy;
  }
}

function getRankClass(rank: number, total: number): string {
  if (rank <= 3) {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    return "rank-bronze";
  }
  const bottomStart = Math.max(1, total - 9);
  if (rank >= bottomStart) return "rank-shame";
  return "";
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort = "overall" } = await searchParams;
  const sortKey = (["overall", "rate", "fixed", "ignored", "reopened"].includes(sort)
    ? sort
    : "overall") as SortKey;

  const mlas = await getMlaStatsFromReports();
  const sorted = sortMlas(mlas, sortKey);

  const tabs = [
    { key: "overall" as const, label: "Overall Score" },
    { key: "rate" as const, label: "Best Resolution Rate" },
    { key: "fixed" as const, label: "Most Confirmed Fixed" },
    { key: "ignored" as const, label: "Most Ignored (30+ days)" },
    { key: "reopened" as const, label: "Most Reopened" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--primary-mint)", color: "var(--primary)" }}
          >
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1
              className="text-3xl font-semibold"
              style={{ color: "var(--text-heading)" }}
            >
              MLA Performance Leaderboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-body)" }}>
              Ranked by civic accountability — live from platform data
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/leaderboard?sort=${tab.key}`}
              className="rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: sortKey === tab.key ? "var(--primary)" : "var(--surface)",
                color: sortKey === tab.key ? "var(--text-on-primary)" : "var(--text-body)",
                borderColor: sortKey === tab.key ? "var(--primary)" : "var(--border)",
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div
          className="mt-8 overflow-hidden rounded-2xl border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {sorted.length === 0 ? (
            <div className="p-12 text-center">
              <p style={{ color: "var(--text-muted)" }}>
                No MLA data yet. Reports will populate the leaderboard.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background: "var(--primary-light)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Rank
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      MLA
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Ward
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Resolution %
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Confirmed Fixed
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Pending
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Avg Days
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Reopened
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Ignored 30+
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((mla, idx) => {
                    const rank = idx + 1;
                    const rankClass = getRankClass(rank, sorted.length);
                    return (
                      <tr
                        key={`${mla.mlaName}-${mla.constituency}`}
                        className="transition-colors hover:bg-gray-50"
                        style={{
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${rankClass}`}
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/authorities/mla/${mla.slug}`}
                            className="font-semibold hover:underline"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {mla.mlaName}
                          </Link>
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "var(--text-body)" }}
                        >
                          {mla.constituency}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {mla.resolutionRate.toFixed(1)}%
                        </td>
                        <td
                          className="px-4 py-3 text-right text-sm"
                          style={{ color: "var(--text-body)" }}
                        >
                          {mla.confirmedFixed}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-sm"
                          style={{ color: "var(--text-body)" }}
                        >
                          {mla.pending}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-sm"
                          style={{ color: "var(--text-body)" }}
                        >
                          {mla.avgResolutionDays != null
                            ? mla.avgResolutionDays.toFixed(1)
                            : "—"}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-sm"
                          style={{
                            color: mla.reopened > 0 ? "#dc2626" : "var(--text-body)",
                          }}
                        >
                          {mla.reopened}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-sm"
                          style={{
                            color: mla.ignoredCount > 0 ? "#dc2626" : "var(--text-body)",
                          }}
                        >
                          {mla.ignoredCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
