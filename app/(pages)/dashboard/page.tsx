import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/authServer";
import { computeWardCounts } from "@/lib/wardCounts";
import DashboardMapWrapper from "@/app/_components/maps/DashboardMapWrapper";
import DashboardCharts from "@/app/_components/dashboard/DashboardCharts";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Map as MapIcon,
  Trophy,
  Leaf,
  TrendingUp,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  REPORTED: { label: "Reported", class: "status-reported" },
  ASSIGNED: { label: "Assigned", class: "status-assigned" },
  IN_PROGRESS: { label: "In Progress", class: "status-inprogress" },
  RESOLVED_PENDING_VERIFICATION: {
    label: "Pending Verification",
    class: "status-pending",
  },
  CONFIRMED_FIXED: { label: "Confirmed Fixed", class: "status-confirmed" },
  REOPENED: { label: "Reopened", class: "status-reopened" },
  REJECTED: { label: "Rejected", class: "status-rejected" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const session = await requireServerSession();
  const user = session?.user as { id: string; role: string } | undefined;

  const [
    totalReports,
    resolvedThisMonth,
    allReports,
    confirmedReports,
    reopenedCount,
    userCount,
    recentReports,
  ] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({
      where: {
        status: "CONFIRMED_FIXED",
        updatedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.report.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        status: true,
      },
    }),
    prisma.report.findMany({
      where: { status: "CONFIRMED_FIXED" },
      select: { createdAt: true, updatedAt: true },
    }),
    prisma.report.count({ where: { status: "REOPENED" } }),
    prisma.user.count(),
    prisma.report.findMany({
      where: query
        ? {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
              { areaName: { contains: query } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        images: { where: { isMain: true }, take: 1 },
      },
    }),
  ]);

  const avgResolutionDays =
    confirmedReports.length > 0
      ? confirmedReports.reduce((sum: number, r: any) => {
          const days =
            (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / confirmedReports.length
      : null;

  const mlaCount = await prisma.report
    .groupBy({
      by: ["constituencyName"],
      where: { constituencyName: { not: null } },
    })
    .then((g: any[]) => g.length);

  const fullReportsForMap = await prisma.report.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      title: true,
      areaName: true,
      category: true,
      status: true,
      latitude: true,
      longitude: true,
    },
  });

  const mapReports = fullReportsForMap
    .filter((r: any) => r.latitude != null && r.longitude != null)
    .map((r: any) => ({
      id: r.id,
      title: r.title,
      areaName: r.areaName,
      category: r.category,
      status: r.status,
      latitude: r.latitude!,
      longitude: r.longitude!,
    }));

  let wardCounts: Record<string, { unresolvedCount: number; totalCount: number }> = {};
  try {
    const fs = await import("fs");
    const path = await import("path");
    const geoPath = path.join(process.cwd(), "public", "data", "ghmc-wards.geojson");
    const geoRaw = fs.readFileSync(geoPath, "utf-8");
    const geoJson = JSON.parse(geoRaw);
    const counts = computeWardCounts(geoJson, allReports as any);
    wardCounts = Object.fromEntries(
      counts.map((c: any) => [
        c.wardName,
        { unresolvedCount: c.unresolvedCount, totalCount: c.totalCount },
      ])
    );
  } catch {
    wardCounts = {};
  }

  let authorityReports: typeof recentReports = [];
  if (user?.role === "AUTHORITY" && user?.id) {
    authorityReports = await prisma.report.findMany({
      where: { assignedAuthorityId: user.id },
      orderBy: { createdAt: "asc" },
      take: 20,
      include: {
        images: { where: { isMain: true }, take: 1 },
      },
    });
  }

  // Stats cards data — real data from DB
  const statCards = [
    {
      id: 1,
      label: "Total Reports",
      value: totalReports.toLocaleString(),
      icon: FileText,
      color: "bg-green-600",
      trend: "+12%",
      desc: "Active civic requests",
    },
    {
      id: 2,
      label: "Resolved",
      value: resolvedThisMonth.toLocaleString(),
      icon: CheckCircle2,
      color: "bg-green-600",
      trend: "+8%",
      desc: "Completed this month",
    },
    {
      id: 3,
      label: "Avg Resolution",
      value: avgResolutionDays != null ? `${avgResolutionDays.toFixed(1)}d` : "—",
      icon: Clock,
      color: "bg-amber-500",
      trend: "Days avg",
      desc: "Time to resolve issues",
    },
    {
      id: 4,
      label: "MLAs Tracked",
      value: mlaCount.toLocaleString(),
      icon: MapPin,
      color: "bg-gray-800",
      trend: `${userCount} citizens`,
      desc: "Active constituencies",
    },
  ];

  const now = new Date();
  const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="p-6">
      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className={`relative overflow-hidden p-5 rounded-2xl shadow-lg ${stat.color} text-white group cursor-pointer`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute -bottom-4 -right-4 opacity-20 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Icon size={80} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <div className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{stat.trend}</div>
                </div>
                <div className="text-2xl font-bold mb-1 tracking-tight">{stat.value}</div>
                <div className="text-xs font-bold opacity-90 uppercase tracking-widest">{stat.label}</div>
                <p className="text-[10px] opacity-60 mt-2">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN CONTENT */}
      <div className="space-y-8">
        {/* Live Heatmap card - Full Width */}
        <div className="bg-white overflow-hidden group">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <MapIcon size={60} />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <MapIcon size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Live Heatmap</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Zone-wise density</p>
              </div>
            </div>
            <Link
              href="/feed"
              className="relative z-10 px-4 py-2 bg-green-50 text-green-600 font-bold text-[10px] rounded-lg hover:bg-green-600 hover:text-white transition-all flex items-center gap-2 no-underline"
            >
              Expand Map ↗
            </Link>
          </div>
          <div className="h-[650px]">
            <DashboardMapWrapper reports={mapReports} wardCounts={wardCounts} />
          </div>
        </div>

        {/* Resolution Trends - Full Width */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Resolution Trends</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Performance over time</p>
            </div>
          </div>
          <div className="p-8">
            <DashboardCharts />
          </div>
        </div>

        {/* Bottom Grid: Side Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leaderboard CTA */}
          <div className="relative overflow-hidden p-8 rounded-[2.5rem] bg-green-600 text-white shadow-2xl group cursor-pointer">
            <div className="absolute -bottom-8 -right-8 opacity-20 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Trophy size={160} />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                <Trophy size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-2 tracking-tight">Leaderboard</h3>
              <p className="text-white/80 text-xs mb-8 leading-relaxed font-medium">
                See how each MLA is performing on civic resolution across Hyderabad.
              </p>
              <Link
                href="/leaderboard"
                className="inline-block px-6 py-2.5 bg-white text-green-600 font-bold text-[10px] rounded-lg shadow-xl hover:bg-green-50 transition-all active:scale-95 no-underline"
              >
                View Leaderboard
              </Link>
            </div>
          </div>

          {/* Recent Feed */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 relative overflow-hidden group">
            <Leaf className="absolute -bottom-6 -left-6 text-green-600/5 -rotate-12 group-hover:scale-125 transition-transform" size={80} />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="text-xl font-bold text-gray-900">Recent Feed</h2>
              <Link href="/feed" className="text-green-600 font-bold text-xs hover:underline">See All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
              {recentReports.slice(0, 4).map((r : any) => {
                const main = r.images[0];
                const imgSrc = main ? main.url : null;
                const sc = STATUS_CONFIG[r.status] ?? { label: r.status, class: "" };
                return (
                  <Link
                    key={r.id}
                    href={`/reports/${r.id}`}
                    className="flex gap-4 group/item cursor-pointer no-underline"
                  >
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden bg-green-50 border border-green-100">
                      {imgSrc ? (
                        <img src={imgSrc} alt="" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText size={16} className="text-green-600/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 border-b border-gray-100 pb-3 last:border-0">
                      <h3 className="text-xs font-bold text-gray-900 group-hover/item:text-green-600 transition-colors mb-1 line-clamp-1">
                        {r.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                          {r.areaName}
                        </p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${sc.class}`}>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Authority section */}
        {user?.role === "AUTHORITY" && (
          <div className="bg-blue-50 border border-blue-200 rounded-[2.5rem] p-8">
            <h2 className="text-lg font-bold text-blue-900 mb-1">Your Assigned Issues</h2>
            <p className="text-xs text-blue-500 mb-6">Sorted by oldest first</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {authorityReports.length === 0 ? (
                <p className="text-sm text-gray-400">No issues assigned to you.</p>
              ) : (
                authorityReports.slice(0, 6).map((r : any) => {
                  const sc = STATUS_CONFIG[r.status] ?? { label: r.status, class: "" };
                  return (
                    <Link
                      key={r.id}
                      href={`/reports/${r.id}`}
                      className="flex items-center justify-between rounded-xl border border-blue-200 bg-white px-3 py-2 transition hover:bg-blue-50 no-underline"
                    >
                      <span className="truncate text-xs font-medium text-blue-900">{r.title}</span>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${sc.class}`}>
                        {sc.label}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
