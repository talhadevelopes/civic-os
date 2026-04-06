import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMlaBySlug } from "@/lib/mlaStats";
import MlaProfileClient from "@/app/_components/profiles/MlaProfileClient";
import { PageShell } from "@/app/_components/global/AppSidebar";
import {
  ChevronLeft, MapPin, ArrowUpRight, TrendingUp, Activity,
  Zap, AlertCircle, FileText, AlertTriangle, CheckCircle2,
  Clock, Layers, Trophy,
} from "lucide-react";

const UNRESOLVED = ["REPORTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED_PENDING_VERIFICATION", "REOPENED"];

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  REPORTED: { label: "Reported", class: "status-reported" },
  ASSIGNED: { label: "Assigned", class: "status-assigned" },
  IN_PROGRESS: { label: "In Progress", class: "status-inprogress" },
  RESOLVED_PENDING_VERIFICATION: { label: "Pending Verification", class: "status-pending" },
  CONFIRMED_FIXED: { label: "Confirmed Fixed", class: "status-confirmed" },
  REOPENED: { label: "Reopened", class: "status-reopened" },
  REJECTED: { label: "Rejected", class: "status-rejected" },
};

export default async function MlaProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mla = await getMlaBySlug(slug);

  if (!mla) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-screen p-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">MLA not found</h1>
            <Link href="/authorities" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-2xl text-sm no-underline">
              <ChevronLeft size={18} /> Back to Authorities
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const reports = await prisma.report.findMany({
    where: { constituencyName: mla.constituency, mlaName: mla.mlaName },
    orderBy: { createdAt: "desc" },
    include: { images: { where: { isMain: true }, take: 1 } },
  });

  const total = reports.length;
  const confirmedFixed = reports.filter((r: any) => r.status === "CONFIRMED_FIXED").length;
  const pending = reports.filter((r: any) => UNRESOLVED.includes(r.status)).length;
  const reopened = reports.filter((r: any) => r.status === "REOPENED").length;
  const rejected = reports.filter((r: any) => r.status === "REJECTED").length;
  const resolutionRate = total > 0 ? (confirmedFixed / total) * 100 : 0;

  const confirmedReports = reports.filter((r: any) => r.status === "CONFIRMED_FIXED");
  const avgResolutionDays =
    confirmedReports.length > 0
      ? confirmedReports.reduce((sum: number, r: any) => sum + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24), 0) / confirmedReports.length
      : null;

  const ignoredCount = reports.filter((r: any) => {
    if (!UNRESOLVED.includes(r.status)) return false;
    return (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24) >= 30;
  }).length;

  const byCategory = reports.reduce((acc: Record<string, number>, r: any) => { acc[r.category] = (acc[r.category] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const statusBreakdown = { open: pending, resolved: confirmedFixed, reopened, rejected };

  const mapReports = reports
    .filter((r: any) => r.latitude != null && r.longitude != null)
    .map((r: any) => ({ id: r.id, title: r.title, status: r.status, latitude: r.latitude!, longitude: r.longitude! }));

  const leaderboardMlas = await prisma.report
    .groupBy({ by: ["mlaName", "constituencyName"], where: { constituencyName: { not: null } }, _count: { id: true } })
    .then((groups: any[]) => Promise.all(groups.map(async (g: any) => {
      const fixed = await prisma.report.count({ where: { mlaName: g.mlaName, constituencyName: g.constituencyName, status: "CONFIRMED_FIXED" } });
      return { mlaName: g.mlaName!, constituency: g.constituencyName!, rate: g._count.id > 0 ? (fixed / g._count.id) * 100 : 0 };
    })));

  const ranked = leaderboardMlas.sort((a: any, b: any) => b.rate - a.rate).map((m: any, i: number) => ({ ...m, rank: i + 1 }));
  const myRank = ranked.find((r: any) => r.mlaName === mla.mlaName && r.constituency === mla.constituency)?.rank ?? null;

  const categoryEntries = Object.entries(byCategory).sort((a: [string, any], b: [string, any]) => (b[1] as number) - (a[1] as number));
  const maxCatCount = (categoryEntries[0]?.[1] as number) ?? 1;

  return (
    <PageShell>
      <div className="bg-gray-50/30 min-h-screen">
        {/* Hero Header */}
        <div className="relative h-64 bg-gray-900 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-green-900/50" />
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-600 rounded-full blur-3xl" />
          </div>

          <div className="absolute top-6 left-8 z-20">
            <Link href="/authorities" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-bold text-[11px] uppercase tracking-widest no-underline">
              <ChevronLeft size={16} /> Back to Authorities
            </Link>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-8 z-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 rounded-[2rem] bg-green-600 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center text-white text-4xl font-bold">
                {mla.photoUrl ? (
                  <img src={mla.photoUrl} alt={mla.mlaName} className="w-full h-full object-cover" />
                ) : (
                  mla.mlaName.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-3xl font-bold text-white tracking-tight">{mla.mlaName}</h1>
                  {myRank != null && (
                    <span className="px-2.5 py-0.5 bg-green-600 text-white rounded-full text-[9px] font-bold uppercase tracking-widest">
                      #{myRank} Ranked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-5 text-white/60 font-medium text-xs">
                  <div className="flex items-center gap-1.5"><MapPin size={14} className="text-green-400" />{mla.constituency}</div>
                  {myRank != null && (
                    <div className="flex items-center gap-1.5"><Trophy size={14} className="text-amber-400" />Ranked #{myRank} in Hyderabad</div>
                  )}
                </div>
              </div>
            </div>
            <Link href="/leaderboard" className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xs no-underline self-start md:self-auto">
              View Leaderboard <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        <div className="p-8 -mt-6 relative z-30">
          {/* Bento Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-xl flex items-center justify-between overflow-hidden relative group">
              <div className="absolute -right-8 -bottom-8 opacity-[0.04] group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Activity size={140} /></div>
              <div className="relative z-10">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Resolution Rate</p>
                <div className="text-5xl font-bold text-gray-900 tracking-tight mb-2">
                  {resolutionRate.toFixed(1)}<span className="text-xl text-gray-300">%</span>
                </div>
                <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                  <TrendingUp size={14} />{confirmedFixed} total issues resolved
                </div>
              </div>
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                <Activity size={32} className="text-green-600" />
              </div>
            </div>
            <div className="bg-green-600 p-6 rounded-3xl shadow-xl text-white flex flex-col justify-between">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4"><Zap size={20} /></div>
              <div>
                <div className="text-3xl font-bold tracking-tight mb-0.5">{avgResolutionDays != null ? `${avgResolutionDays.toFixed(1)}d` : "—"}</div>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Avg Resolution Time</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl flex flex-col justify-between">
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-4"><AlertCircle size={20} /></div>
              <div>
                <div className="text-3xl font-bold text-gray-900 tracking-tight mb-0.5">{ignoredCount}</div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Critical Backlog (30+ days)</p>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="space-y-10">
            {/* Top row: Recent Issues and Issue Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Issues */}
              <div className="lg:col-span-2 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
                    <FileText className="text-green-600" size={20} /> Recent Issues in Jurisdiction
                  </h2>
                  <Link href="/feed" className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 hover:text-green-600 hover:border-green-300 transition-colors no-underline">
                    All Issues
                  </Link>
                </div>
                <div className="space-y-4">
                  {reports.slice(0, 6).map((r: any) => {
                    const main = r.images[0];
                    const imgSrc = main ? main.url : null;
                    const sc = STATUS_CONFIG[r.status] ?? { label: r.status, class: "" };
                    return (
                      <Link key={r.id} href={`/reports/${r.id}`} className="group flex gap-4 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all no-underline">
                        <div className="w-24 h-24 flex-shrink-0 bg-green-50 overflow-hidden">
                          {imgSrc
                            ? <img src={imgSrc} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            : <div className="w-full h-full flex items-center justify-center"><FileText size={20} className="text-green-600/30" /></div>}
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                              <h3 className="text-sm font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-1">{r.title}</h3>
                              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${sc.class}`}>{sc.label}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{r.category.replaceAll("_", " ")} · {r.areaName}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                            <span className="text-[9px] text-gray-400 font-medium">
                              {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <div className="flex items-center gap-1 text-green-600 font-bold text-[10px] group-hover:gap-1.5 transition-all">
                              View Details <ArrowUpRight size={12} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {reports.length === 0 && (
                    <div className="py-10 text-center bg-white rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-400 font-bold">No issues reported in this jurisdiction yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar items */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg">
                  <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Layers size={16} className="text-green-600" /> Issue Distribution
                  </h3>
                  <div className="space-y-4">
                    {categoryEntries.slice(0, 6).map(([cat, count]: [string, any]) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{cat.replaceAll("_", " ")}</span>
                          <span className="text-[10px] font-bold text-gray-900">{(count as number)} Reports</span>
                        </div>
                        <div className="h-1 bg-green-50 rounded-full overflow-hidden">
                          <div className="h-full bg-green-600 rounded-full" style={{ width: `${((count as number) / maxCatCount) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    {categoryEntries.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No category data</p>}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg relative overflow-hidden group">
                  <h3 className="text-base font-bold text-gray-900 mb-6 relative z-10">Ward Summary</h3>
                  <div className="space-y-4 relative z-10">
                    {[
                      { label: "Total Issues", value: total, icon: FileText, color: "text-green-600", bg: "bg-green-50" },
                      { label: "Confirmed Fixed", value: confirmedFixed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                      { label: "Pending", value: pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
                      { label: "Reopened", value: reopened, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center`}>
                          <stat.icon size={16} className={stat.color} />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                          <p className="text-xs font-bold text-gray-900">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Full width Map and Charts */}
            <div className="w-full">
              <MlaProfileClient byCategory={byCategory} statusBreakdown={statusBreakdown} mapReports={mapReports} />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
