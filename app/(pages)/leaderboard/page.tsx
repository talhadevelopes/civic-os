import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMlaStatsFromReports, type MlaStatsRow } from "@/lib/mlaStats";
import StatsCharts from "@/app/_components/common/StatsCharts";
import { PageShell } from "@/app/_components/global/AppSidebar";
import {
  Trophy,
  Bell,
  Plus,
  Filter,
  Leaf,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

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

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort = "overall" } = await searchParams;
  const sortKey = (["overall", "rate", "fixed", "ignored", "reopened"].includes(sort)
    ? sort
    : "overall") as SortKey;

  // ── Leaderboard data ──────────────────────────────────────────
  const mlas = await getMlaStatsFromReports();
  const sorted = sortMlas(mlas, sortKey);
  const top5 = [...mlas].sort((a, b) => b.resolutionRate - a.resolutionRate).slice(0, 5);
  const bottom5 = [...mlas].sort((a, b) => a.resolutionRate - b.resolutionRate).slice(0, 5);

  // ── Stats (from old Stats page) ───────────────────────────────
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalReports,
    confirmedThisMonth,
    confirmedLastMonth,
    byCategory,
  ] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({ where: { status: "CONFIRMED_FIXED", updatedAt: { gte: thisMonthStart } } }),
    prisma.report.count({ where: { status: "CONFIRMED_FIXED", updatedAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    prisma.report.groupBy({ by: ["category"], _count: { id: true } }),
  ]);

  const confirmedTotal = await prisma.report.count({ where: { status: "CONFIRMED_FIXED" } });
  const resolutionRate = totalReports > 0 ? (confirmedTotal / totalReports) * 100 : 0;

  const confirmedReports = await prisma.report.findMany({
    where: { status: "CONFIRMED_FIXED" },
    select: { createdAt: true, updatedAt: true },
  });
  const avgDays = confirmedReports.length > 0
    ? confirmedReports.reduce(
        (s : any, r : any) => s + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24),
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

  const categoryData = byCategory
    .map((c : any) => ({ name: c.category.replace(/_/g, " "), count: c._count.id }))
    .sort((a : any, b : any) => b.count - a.count);

  const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });
  const top3 = sorted.slice(0, 3);

  const tabs = [
    { key: "overall" as const, label: "Overall Score" },
    { key: "rate" as const, label: "Best Resolution Rate" },
    { key: "fixed" as const, label: "Most Fixed" },
    { key: "ignored" as const, label: "Most Ignored" },
    { key: "reopened" as const, label: "Most Reopened" },
  ];

  return (
    <PageShell>
        {/* Header */}
        <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Leaderboard</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Civic accountability rankings</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 text-gray-400 hover:text-green-600 bg-green-50 rounded-xl transition-all relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </button>
            <Link href="/report-issue" className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-xs no-underline">
              <Plus size={16} />
              New Report
            </Link>
          </div>
        </header>

        <div className="p-8">
          {/* Page title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1.5">Hyderabad Civic Health Score</h1>
              <p className="text-gray-500 text-sm font-medium">This month's snapshot</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-5 py-2.5 bg-green-50 text-green-600 text-xs font-bold rounded-xl border border-green-100">
                {monthLabel}
              </div>
            </div>
          </div>

          {/* ── CIVIC HEALTH OVERVIEW ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
            {/* Main Score Card */}
            <div className="lg:col-span-2 relative overflow-hidden p-8 rounded-[2rem] bg-green-600 text-white shadow-xl group cursor-pointer">
              <div className="absolute -bottom-10 -right-10 opacity-20 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Activity size={180} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                    <Activity size={28} />
                  </div>
                  <div className="text-[10px] font-bold bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                    LIVE STATUS
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-5xl font-bold tracking-tighter">{civicScore}</span>
                  <span className="text-xl font-bold opacity-60">/100</span>
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">Civic Health Score</h3>
                <p className="text-white/80 text-xs leading-relaxed font-medium flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  {confirmedThisMonth} confirmed fixed this month
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {[
                { label: "Total Issues", value: totalReports.toLocaleString(), icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
                { label: "Resolution Rate", value: `${resolutionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
                { label: "Avg Fix Time", value: avgDays > 0 ? `${avgDays.toFixed(1)}d` : "—", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Escalated (30+ days)", value: escalatedCount.toLocaleString(), icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white border border-gray-100 shadow-lg flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                  <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-tight">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CHARTS & LISTS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Issues by Category */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Trophy size={60} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-6 relative z-10">Issues by Category</h2>
              <div className="relative z-10">
                <StatsCharts data={categoryData} />
              </div>
            </div>

            {/* Top 5 Wards */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 relative overflow-hidden group">
              <Leaf className="absolute -top-6 -right-6 text-green-600/5 rotate-45 group-hover:scale-125 transition-transform" size={60} />
              <h2 className="text-lg font-bold text-gray-900 mb-6">Top 5 Wards This Month</h2>
              <div className="space-y-3">
                {top5.length === 0 ? (
                  <p className="text-xs text-gray-400">No MLA data yet.</p>
                ) : (
                  top5.map((mla, i) => (
                    <Link
                      key={mla.slug}
                      href={`/authorities/mla/${mla.slug}`}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-green-50 border border-green-100 hover:border-green-300 transition-all cursor-pointer group/item no-underline"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold text-[10px] shadow-md group-hover/item:scale-110 transition-transform">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{mla.mlaName}</div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{mla.constituency}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                        <ChevronUp size={14} />
                        {mla.resolutionRate.toFixed(0)}%
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Bottom 5 Wards */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 relative overflow-hidden group">
              <Leaf className="absolute -bottom-6 -left-6 text-green-600/5 -rotate-12 group-hover:scale-125 transition-transform" size={60} />
              <h2 className="text-lg font-bold text-gray-900 mb-6">Bottom 5 Wards</h2>
              <div className="space-y-3">
                {bottom5.length === 0 ? (
                  <p className="text-xs text-gray-400">No MLA data yet.</p>
                ) : (
                  bottom5.map((mla, i) => (
                    <Link
                      key={mla.slug}
                      href={`/authorities/mla/${mla.slug}`}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-red-50 border border-red-100 hover:border-red-200 transition-all cursor-pointer group/item no-underline"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center font-bold text-[10px] shadow-md group-hover/item:scale-110 transition-transform">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{mla.mlaName}</div>
                          <div className="text-[9px] font-bold text-red-500/50 uppercase tracking-widest">{mla.constituency}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs">
                        <ChevronDown size={14} />
                        {mla.resolutionRate.toFixed(0)}%
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── MLA PERFORMANCE RANKINGS ── */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">MLA Performance Rankings</h2>
              <p className="text-gray-500 text-sm font-medium">Historical performance data breakdown.</p>
            </div>
          </div>

          {/* Sort Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={`/leaderboard?sort=${tab.key}`}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all no-underline ${
                  sortKey === tab.key
                    ? "bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20"
                    : "bg-white text-gray-400 border-gray-100 hover:border-green-200 hover:text-green-600"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Top 3 Podium Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {top3.map((mla, i) => (
                <Link
                  key={mla.slug}
                  href={`/authorities/mla/${mla.slug}`}
                  className={`relative overflow-hidden p-6 rounded-[2rem] shadow-xl group cursor-pointer no-underline hover:-translate-y-2 hover:scale-[1.02] transition-all ${
                    i === 0 ? "bg-green-600 text-white" : "bg-white border border-gray-100 text-gray-900"
                  }`}
                >
                  <div className={`absolute -bottom-8 -right-8 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none ${i === 0 ? "text-white" : "text-green-600"}`}>
                    <Trophy size={140} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${i === 0 ? "bg-white/20" : "bg-green-50 text-green-600"}`}>
                        #{i + 1}
                      </div>
                      <TrendingUp size={20} className={i === 0 ? "text-white/60" : "text-green-600"} />
                    </div>
                    <h3 className="text-lg font-bold mb-0.5 tracking-tight">{mla.mlaName}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${i === 0 ? "text-white/60" : "text-gray-400"}`}>{mla.constituency}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold mb-0.5">{mla.resolutionRate.toFixed(1)}%</div>
                        <div className={`text-[9px] font-bold uppercase tracking-widest ${i === 0 ? "text-white/60" : "text-gray-400"}`}>Resolution Rate</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Full Table */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden mb-12">
            {sorted.length === 0 ? (
              <div className="p-20 text-center">
                <p className="text-gray-400 font-bold text-sm">No MLA data yet. Reports will populate the leaderboard.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-green-50/50 border-b border-gray-100">
                      {["Rank", "MLA & Ward", "Resolution %", "Fixed", "Pending", "Avg Days", "Reopened", "Ignored"].map((h) => (
                        <th key={h} className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((mla, idx) => {
                      const rank = idx + 1;
                      const isTop3 = rank <= 3;
                      return (
                        <tr
                          key={`${mla.mlaName}-${mla.constituency}`}
                          className="group hover:bg-green-50/30 transition-all cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <td className="px-6 py-4">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${isTop3 ? "bg-green-600 text-white shadow-lg" : "bg-gray-50 text-gray-900"}`}>
                              {rank}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Link href={`/authorities/mla/${mla.slug}`} className="no-underline flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-green-50 overflow-hidden flex-shrink-0 flex items-center justify-center text-green-600 font-bold text-sm border border-gray-100">
                                {mla.photoUrl ? (
                                  <img src={mla.photoUrl} alt={mla.mlaName} className="w-full h-full object-cover" />
                                ) : (
                                  mla.mlaName.charAt(0)
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-gray-900 group-hover:text-green-600 transition-colors">{mla.mlaName}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{mla.constituency}</div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-green-50 rounded-full overflow-hidden max-w-[60px]">
                                <div
                                  className="h-full bg-green-600 rounded-full transition-all duration-1000"
                                  style={{ width: `${mla.resolutionRate}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-900">{mla.resolutionRate.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                              <CheckCircle2 size={14} />
                              {mla.confirmedFixed}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                              <Clock size={14} />
                              {mla.pending}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-gray-900">
                              {mla.avgResolutionDays != null ? `${mla.avgResolutionDays.toFixed(1)}d` : "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs">
                              <AlertTriangle size={14} />
                              {mla.reopened}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-gray-400 font-bold text-xs">
                              <XCircle size={14} />
                              {mla.ignoredCount}
                            </div>
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
    </PageShell>
  );
}
