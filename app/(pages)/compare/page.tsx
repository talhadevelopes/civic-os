import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMlaStatsFromReports } from "@/lib/mlaStats";
import { AREA_TO_MLA } from "@/public/data/areaToMla";
import CompareMapWrapper from "@/app/_components/maps/CompareMapWrapper";
import { PageShell } from "@/app/_components/global/AppSidebar";
import {
  GitCompare, Bell, Plus, ArrowLeftRight,
  CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown,
} from "lucide-react";

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

  const mapReports1 = reports1
    .filter((r: any) => r.latitude != null && r.longitude != null)
    .map((r: any) => ({ id: r.id, title: r.title, status: r.status, latitude: r.latitude!, longitude: r.longitude! }));
  const mapReports2 = reports2
    .filter((r: any) => r.latitude != null && r.longitude != null)
    .map((r: any) => ({ id: r.id, title: r.title, status: r.status, latitude: r.latitude!, longitude: r.longitude! }));

  const r1 = mla1?.resolutionRate ?? 0;
  const r2 = mla2?.resolutionRate ?? 0;
  const winner = r1 > r2 ? 1 : r2 > r1 ? 2 : 0;

  return (
    <PageShell>
      {/* Header */}
      <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center shadow-lg">
            <GitCompare size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Ward Comparison</h2>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Side-by-side ward performance</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2.5 text-gray-400 hover:text-green-600 bg-green-50 rounded-xl transition-all relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
          </button>
          <Link href="/report-issue" className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-xs no-underline">
            <Plus size={16} /> New Report
          </Link>
        </div>
      </header>

      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1.5">Ward Comparison</h1>
          <p className="text-gray-500 text-sm font-medium">Compare two wards side by side — civic performance, resolution rates, and live issue maps.</p>
        </div>

        {/* Selector */}
        <form action="/compare" method="get" className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl mb-10">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Select Wards to Compare</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Ward 1</label>
              <select name="ward1" defaultValue={area1} className="w-full h-10 px-3 bg-green-50 border border-green-100 focus:border-green-400 text-xs font-bold text-gray-900 rounded-xl outline-none cursor-pointer">
                {uniqueAreas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center">
                <ArrowLeftRight size={18} />
              </div>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Ward 2</label>
              <select name="ward2" defaultValue={area2} className="w-full h-10 px-3 bg-blue-50 border border-blue-100 focus:border-blue-400 text-xs font-bold text-gray-900 rounded-xl outline-none cursor-pointer">
                {uniqueAreas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-0">
              <button type="submit" className="h-10 px-6 bg-green-600 text-white font-bold text-xs rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                Compare
              </button>
            </div>
          </div>
        </form>

        {/* Side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {([
            { area: area1, mlaData: mla1Data, mla: mla1, mapReports: mapReports1, side: 1 },
            { area: area2, mlaData: mla2Data, mla: mla2, mapReports: mapReports2, side: 2 },
          ] as const).map(({ area, mlaData, mla, mapReports, side }) => {
            const isWinner = winner === side;
            const grad = side === 1 ? "from-green-600" : "from-blue-600";
            const accent = side === 1 ? "text-green-600 bg-green-50 border-green-100" : "text-blue-600 bg-blue-50 border-blue-100";
            const barColor = side === 1 ? "bg-green-600" : "bg-blue-600";
            return (
              <div key={side} className={`relative bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden ${isWinner ? "ring-2 ring-green-500 ring-offset-4" : ""}`}>
                {isWinner && (
                  <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-green-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                    🏆 Leading
                  </div>
                )}
                <div className={`bg-gradient-to-br ${grad} to-gray-900 p-6 relative overflow-hidden`}>
                  <div className="absolute -bottom-8 -right-8 opacity-10 pointer-events-none"><GitCompare size={120} color="white" /></div>
                  <div className="relative z-10">
                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.2em] mb-1.5">Ward {side}</p>
                    <h2 className="text-xl font-bold text-white tracking-tight mb-1.5">{area}</h2>
                    <p className="text-xs text-white/60 font-medium">MLA: <span className="text-white font-bold">{mlaData?.mla_name ?? "—"}</span></p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: "Total Issues", value: mla?.totalIssues ?? 0, icon: AlertTriangle },
                      { label: "Resolved %", value: mla ? `${mla.resolutionRate.toFixed(0)}%` : "—", icon: CheckCircle2 },
                      { label: "Avg Days", value: mla?.avgResolutionDays != null ? `${mla.avgResolutionDays.toFixed(1)}d` : "—", icon: Clock },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className={`p-4 rounded-xl border ${accent} text-center`}>
                        <Icon size={14} className="mx-auto mb-1.5 opacity-60" />
                        <div className="text-lg font-bold mb-0.5">{value}</div>
                        <div className="text-[9px] font-bold opacity-60 uppercase tracking-widest leading-tight">{label}</div>
                      </div>
                    ))}
                  </div>
                  {mla && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Resolution Rate</span>
                        <div className="flex items-center gap-1">
                          {isWinner ? <TrendingUp size={12} className="text-green-600" /> : <TrendingDown size={12} className="text-red-400" />}
                          <span className="text-xs font-bold text-gray-900">{mla.resolutionRate.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${mla.resolutionRate}%` }} />
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Issue Heatmap</p>
                    <div className="rounded-xl overflow-hidden border border-gray-100" style={{ height: 180 }}>
                      <CompareMapWrapper reports={mapReports} />
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2 text-center">{mapReports.length} geo-tagged issues</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
