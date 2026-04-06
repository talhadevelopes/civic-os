import Link from "next/link";
import { getMlaStatsFromReports } from "@/lib/mlaStats";
import { PageShell } from "@/app/_components/global/AppSidebar";
import {
  Bell, Plus, Users, Shield, Building2, Search,
  Trophy, CheckCircle2, Clock, ChevronRight, ArrowUpRight,
} from "lucide-react";

const MUNICIPAL_BODIES = [
  {
    name: "GHMC",
    fullName: "Greater Hyderabad Municipal Corporation",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    iconBg: "bg-blue-100",
    desc: "Civil infrastructure, roads, sanitation, parks",
  },
  {
    name: "Hyderabad Metro Water",
    fullName: "HMWSSB",
    color: "bg-cyan-50 text-cyan-600 border-cyan-100",
    iconBg: "bg-cyan-100",
    desc: "Water supply & sewerage across Hyderabad",
  },
  {
    name: "TSSPDCL",
    fullName: "Telangana State Southern Power Distribution",
    color: "bg-amber-50 text-amber-600 border-amber-100",
    iconBg: "bg-amber-100",
    desc: "Electricity distribution, street lighting, outages",
  },
];

export default async function AuthoritiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = String(q).trim().toLowerCase();

  const mlas = await getMlaStatsFromReports();
  const filtered = query
    ? mlas.filter((m) => m.mlaName.toLowerCase().includes(query) || m.constituency.toLowerCase().includes(query))
    : mlas;
  const sorted = [...filtered].sort((a, b) => b.resolutionRate - a.resolutionRate);

  return (
    <PageShell>
      {/* Header */}
      <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Authorities & MLAs</h2>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Government bodies and performance overview</p>
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1.5">Authorities & MLAs</h1>
          <p className="text-gray-500 text-sm font-medium">Track municipal bodies and elected representative performance.</p>
        </div>

        {/* Municipal Bodies */}
        <div className="mb-12">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-gray-900 text-white rounded-xl flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Municipal Bodies</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Government infrastructure agencies</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MUNICIPAL_BODIES.map((body) => (
              <div key={body.name} className={`relative overflow-hidden p-6 rounded-3xl border shadow-xl group hover:-translate-y-1 transition-all cursor-pointer ${body.color}`}>
                <div className="absolute -bottom-8 -right-8 opacity-[0.06] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <Shield size={120} />
                </div>
                <div className="relative z-10">
                  <div className={`w-12 h-12 ${body.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Shield size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-0.5 tracking-tight">{body.name}</h3>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-3">{body.fullName}</p>
                  <p className="text-xs font-medium opacity-70 leading-relaxed">{body.desc}</p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold opacity-70">View Reports <ArrowUpRight size={12} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracked MLAs */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-green-600 text-white rounded-xl flex items-center justify-center">
                <Trophy size={18} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">MLAs Being Tracked</h2>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{sorted.length} representatives found</p>
              </div>
            </div>
            <form action="/authorities" method="get" className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="search" name="q" defaultValue={q}
                placeholder="Search by name or ward..."
                className="pl-10 pr-4 py-2 bg-green-50 border border-green-100 focus:border-green-300 rounded-xl text-xs font-medium outline-none transition-all w-64"
              />
            </form>
          </div>

          {sorted.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 font-bold text-sm">{query ? "No MLAs match your search." : "No MLA data yet."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map((mla, idx) => (
                <Link
                  key={`${mla.mlaName}-${mla.constituency}`}
                  href={`/authorities/mla/${mla.slug}`}
                  className="group relative overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:border-green-200 transition-all no-underline cursor-pointer"
                >
                  <div className="absolute -bottom-8 -right-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <Trophy size={120} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 bg-green-600 rounded-xl overflow-hidden flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                        {mla.photoUrl ? (
                          <img src={mla.photoUrl} alt={mla.mlaName} className="w-full h-full object-cover" />
                        ) : (
                          mla.mlaName.charAt(0)
                        )}
                      </div>
                      {idx < 3 && (
                        <div className="w-7 h-7 bg-amber-400 text-white rounded-lg flex items-center justify-center font-bold text-[10px] shadow-lg">
                          #{idx + 1}
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-0.5 tracking-tight">{mla.mlaName}</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-6">{mla.constituency}</p>
                    <div className="space-y-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Resolution</span>
                          <span className="text-xs font-bold text-green-600">{mla.resolutionRate.toFixed(0)}%</span>
                        </div>
                        <div className="h-1 bg-green-50 rounded-full overflow-hidden">
                          <div className="h-full bg-green-600 rounded-full" style={{ width: `${mla.resolutionRate}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <CheckCircle2 size={12} className="text-green-600" />
                          <span className="text-[10px] font-bold">{mla.confirmedFixed} fixed</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock size={12} className="text-amber-500" />
                          <span className="text-[10px] font-bold">{mla.pending} pending</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] group-hover:gap-2 transition-all">
                          View <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
