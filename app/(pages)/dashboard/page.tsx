import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/authServer";
import { computeWardCounts } from "@/lib/wardCounts";
import DashboardMapWrapper from "@/app/_components/maps/DashboardMapWrapper";
import DashboardSearch from "@/app/_components/dashboard/DashboardSearch";
import DashboardCharts from "@/app/_components/dashboard/DashboardCharts";
import {
  FileText,
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
  MapPin,
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
      take: 15,
      include: {
        images: { where: { isMain: true }, take: 1 },
      },
    }),
  ]);

  const avgResolutionDays =
    confirmedReports.length > 0
      ? confirmedReports.reduce((sum, r) => {
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
    .then((g) => g.length);

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
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => ({
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
      counts.map((c) => [
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

  const stats = [
    {
      label: "Total Issues Reported",
      value: totalReports,
      icon: FileText,
    },
    {
      label: "Resolved This Month",
      value: resolvedThisMonth,
      icon: CheckCircle2,
    },
    {
      label: "Avg Resolution (days)",
      value: avgResolutionDays != null ? avgResolutionDays.toFixed(1) : "—",
      icon: Clock,
    },
    {
      label: "Active MLAs Tracked",
      value: mlaCount,
      icon: MapPin,
    },
    {
      label: "Citizens on Platform",
      value: userCount,
      icon: Users,
    },
    {
      label: "Issues Reopened",
      value: reopenedCount,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-3xl font-semibold"
              style={{ color: "var(--text-heading)" }}
            >
              Dashboard
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--text-body)" }}
            >
              Track what's happening across the city.
            </p>
          </div>

          <div className="flex flex-1 items-center gap-3 sm:justify-end">
            <DashboardSearch initialQuery={query} />
            <Link
              href="/reports"
              className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              View reports
            </Link>
            <Link
              href="/reports/new"
              className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium"
              style={{
                background: "var(--primary)",
                color: "var(--text-on-primary)",
                boxShadow: "var(--shadow-green)",
              }}
            >
              Create report
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <DashboardMapWrapper reports={mapReports} wardCounts={wardCounts} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border p-4"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  background: "var(--primary-mint)",
                  color: "var(--primary)",
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div
                className="mt-3 text-2xl font-bold"
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

        <div className="mt-8">
          <DashboardCharts />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl border p-6"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Recent reports
                </h2>
                <Link
                  href="/reports"
                  className="text-sm font-medium"
                  style={{ color: "var(--text-green)" }}
                >
                  See all
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {recentReports.map((r) => {
                  const main = r.images[0];
                  const imgSrc = main
                    ? `data:${main.mimeType};base64,${main.base64Data}`
                    : null;
                  const sc = STATUS_CONFIG[r.status] ?? {
                    label: r.status,
                    class: "",
                  };

                  return (
                    <Link
                      key={r.id}
                      href={`/reports/${r.id}`}
                      className="rounded-2xl border p-4 transition hover:border-green-300"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--surface)",
                      }}
                    >
                      <div className="flex gap-4">
                        <div
                          className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border"
                          style={{
                            background: "var(--primary-light)",
                            borderColor: "var(--border)",
                          }}
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
                            className="mt-1 text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {r.areaName} · {r.category.replaceAll("_", " ")}
                          </p>
                          <span
                            className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${sc.class}`}
                          >
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

          {user?.role === "AUTHORITY" && (
            <div
              className="rounded-2xl border p-6"
              style={{
                background: "#eff6ff",
                borderColor: "#93c5fd",
              }}
            >
              <h2
                className="text-lg font-semibold"
                style={{ color: "#1e40af" }}
              >
                Your Assigned Issues
              </h2>
              <p
                className="mt-1 text-sm"
                style={{ color: "#3b82f6" }}
              >
                Sorted by oldest first
              </p>

              <div className="mt-4 space-y-3">
                {authorityReports.length === 0 ? (
                  <p
                    className="text-sm"
                    style={{ color: "#6b7280" }}
                  >
                    No issues assigned to you.
                  </p>
                ) : (
                  authorityReports.map((r) => {
                    const sc = STATUS_CONFIG[r.status] ?? {
                      label: r.status,
                      class: "",
                    };
                    return (
                      <Link
                        key={r.id}
                        href={`/reports/${r.id}`}
                        className="flex items-center justify-between rounded-xl border border-blue-200 bg-white px-3 py-2 transition hover:bg-blue-50"
                        style={{ borderColor: "#93c5fd" }}
                      >
                        <span
                          className="truncate text-sm font-medium"
                          style={{ color: "#1e40af" }}
                        >
                          {r.title}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.class}`}
                        >
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
    </div>
  );
}
