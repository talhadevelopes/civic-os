import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { REPORT_CATEGORIES } from "@/lib/reportCategories";
import { AREA_TO_MLA } from "@/lib/areaToMla";
import FeedCard from "@/components/FeedCard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authServer";

const PAGE_SIZE = 12;
const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "upvoted", label: "Most Upvoted" },
  { value: "oldest-unresolved", label: "Oldest Unresolved" },
] as const;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "reopened", label: "Reopened" },
] as const;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    category?: string;
    area?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const sort = (SORT_OPTIONS.find((s) => s.value === params.sort)?.value ?? "latest") as (typeof SORT_OPTIONS)[number]["value"];
  const category = params.category ?? "";
  const area = params.area ?? "";
  const statusFilter = params.status ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id ?? null;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (area) where.areaName = area;
  if (sort === "oldest-unresolved") {
    where.status = { in: ["REPORTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED_PENDING_VERIFICATION", "REOPENED"] };
  }
  if (statusFilter === "open") {
    where.status = { in: ["REPORTED", "ASSIGNED"] };
  } else if (statusFilter === "in_progress") {
    where.status = "IN_PROGRESS";
  } else if (statusFilter === "resolved") {
    where.status = { in: ["CONFIRMED_FIXED", "RESOLVED_PENDING_VERIFICATION"] };
  } else if (statusFilter === "reopened") {
    where.status = "REOPENED";
  }

  const orderBy =
    sort === "upvoted"
      ? [{ upvoteCount: "desc" as const }, { createdAt: "desc" as const }]
      : sort === "oldest-unresolved"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        images: { where: { isMain: true }, take: 1 },
        _count: { select: { comments: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  const upvotedIds = userId
    ? (
        await prisma.upvote.findMany({
          where: {
            userId,
            issueId: { in: reports.map((r) => r.id) },
          },
          select: { issueId: true },
        })
      ).map((u) => u.issueId)
    : [];

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const uniqueAreas = [...new Set(AREA_TO_MLA.map((a) => a.area))].sort();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold" style={{ color: "var(--text-heading)" }}>
          Public Feed
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-body)" }}>
          All reported issues. Upvote, filter, and sort.
        </p>

        <form
          action="/feed"
          method="get"
          className="mt-6 flex flex-wrap gap-3 rounded-2xl border p-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <input type="hidden" name="page" value="1" />
          <select
            name="sort"
            defaultValue={sort}
            className="h-10 rounded-xl border px-3 text-sm"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={category}
            className="h-10 rounded-xl border px-3 text-sm"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <option value="">All categories</option>
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
            <option value="">All areas</option>
            {uniqueAreas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            className="h-10 rounded-xl border px-3 text-sm"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
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

        <div className="mt-8 grid gap-4">
          {reports.map((r) => {
            const main = r.images[0];
            const imgSrc = main ? `data:${main.mimeType};base64,${main.base64Data}` : null;
            const daysOpen = Math.floor(
              (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            const isEscalated =
              daysOpen >= 30 && !["CONFIRMED_FIXED", "REJECTED"].includes(r.status);

            return (
              <FeedCard
                key={r.id}
                id={r.id}
                title={r.title}
                areaName={r.areaName}
                category={r.category}
                status={r.status}
                upvoteCount={r.upvoteCount}
                commentCount={r._count.comments}
                imgSrc={imgSrc}
                isEscalated={isEscalated}
                userUpvoted={upvotedIds.includes(r.id)}
              />
            );
          })}
        </div>

        {reports.length === 0 && (
          <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No issues match your filters.
          </p>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/feed?${new URLSearchParams({
                  ...(sort && { sort }),
                  ...(category && { category }),
                  ...(area && { area }),
                  ...(statusFilter && { status: statusFilter }),
                  page: String(page - 1),
                }).toString()}`}
                className="rounded-xl border px-4 py-2 text-sm"
                style={{ borderColor: "var(--border)" }}
              >
                Previous
              </Link>
            )}
            <span className="rounded-xl border px-4 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/feed?${new URLSearchParams({
                  ...(sort && { sort }),
                  ...(category && { category }),
                  ...(area && { area }),
                  ...(statusFilter && { status: statusFilter }),
                  page: String(page + 1),
                }).toString()}`}
                className="rounded-xl border px-4 py-2 text-sm"
                style={{ borderColor: "var(--border)" }}
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
