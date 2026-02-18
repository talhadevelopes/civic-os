import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ReportsGlobalMapClient from "@/components/ReportsGlobalMapClient";
import { REPORT_CATEGORIES } from "@/lib/reportCategories";
import { AREA_TO_MLA } from "@/lib/areaToMla";
import { Search } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "REPORTED", label: "Reported" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED_PENDING_VERIFICATION", label: "Awaiting Approval" },
  { value: "CONFIRMED_FIXED", label: "Confirmed Fixed" },
  { value: "REOPENED", label: "Reopened" },
  { value: "REJECTED", label: "Rejected" },
];

const uniqueAreas = [...new Set(AREA_TO_MLA.map((a) => a.area))].sort();

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; area?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const category = params.category ?? "";
  const area = params.area ?? "";
  const status = params.status ?? "";

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (area) where.areaName = area;
  if (status) where.status = status;
  if (query) {
    where.OR = [
      { title: { contains: query } },
      { description: { contains: query } },
      { areaName: { contains: query } },
    ];
  }

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      images: { where: { isMain: true }, take: 1 },
    },
  });

  const reportsWithCoords = reports
    .filter((r) => r.latitude !== null && r.longitude !== null)
    .map((r) => ({
      id: r.id,
      title: r.title,
      areaName: r.areaName,
      category: r.category,
      latitude: r.latitude as number,
      longitude: r.longitude as number,
    }));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: "var(--text-heading)" }}>
              Reports
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-body)" }}>
              Public reports across the city.
            </p>
          </div>

          <Link
            href="/reports/new"
            className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium"
            style={{ background: "var(--primary)", color: "var(--text-on-primary)", boxShadow: "var(--shadow-green)" }}
          >
            Create report
          </Link>
        </div>

        <form
          action="/reports"
          method="get"
          className="mt-6 flex flex-wrap gap-3 rounded-2xl border p-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search reports..."
              className="h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            />
          </div>
          <select
            name="category"
            defaultValue={category}
            className="h-10 rounded-xl border px-3 text-sm"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <option value="">All Categories</option>
            {REPORT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            name="area"
            defaultValue={area}
            className="h-10 rounded-xl border px-3 text-sm"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <option value="">All Areas</option>
            {uniqueAreas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-xl border px-3 text-sm"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-10 rounded-xl px-4 text-sm font-medium"
            style={{ background: "var(--primary)", color: "var(--text-on-primary)" }}
          >
            Apply
          </button>
        </form>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <ReportsGlobalMapClient reports={reportsWithCoords} />
          </div>

          {reports.length === 0 ? (
            <div className="md:col-span-2 py-12 text-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No reports match your filters.
              </p>
            </div>
          ) : (
            reports.map((r) => {
              const main = r.images[0];
              const imgSrc = main ? `data:${main.mimeType};base64,${main.base64Data}` : null;

              return (
                <Link
                  key={r.id}
                  href={`/reports/${r.id}`}
                  className="group rounded-2xl border p-4 transition"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex gap-4">
                    <div
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border"
                      style={{ background: "var(--primary-light)", borderColor: "var(--border)" }}
                    >
                      {imgSrc ? <img src={imgSrc} alt="" className="h-full w-full object-cover" /> : null}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="truncate text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                          {r.title}
                        </h2>
                        <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                          {r.category.replaceAll("_", " ")}
                        </span>
                      </div>

                      <p className="mt-1 text-sm" style={{ color: "var(--text-body)" }}>
                        Area: <span style={{ color: "var(--text-primary)" }}>{r.areaName}</span>
                      </p>

                      <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--text-body)" }}>
                        {r.description}
                      </p>

                      <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        By {r.createdBy.name}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
