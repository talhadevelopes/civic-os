import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/authServer";
import { Shield, User as UserIcon, Calendar, FileText, CheckCircle2, ArrowUp, MessageSquare } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  REPORTED: { label: "Reported", class: "status-reported" },
  ASSIGNED: { label: "Assigned", class: "status-assigned" },
  IN_PROGRESS: { label: "In Progress", class: "status-inprogress" },
  RESOLVED_PENDING_VERIFICATION: { label: "Pending Verification", class: "status-pending" },
  CONFIRMED_FIXED: { label: "Confirmed Fixed", class: "status-confirmed" },
  REOPENED: { label: "Reopened", class: "status-reopened" },
  REJECTED: { label: "Rejected", class: "status-rejected" },
};

export default async function ProfilePage() {
  const session = await requireServerSession();
  if (!session?.user) redirect("/login");

  const user = session.user as any;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      authorityBody: true,
      createdAt: true,
    },
  });

  if (!dbUser) redirect("/login");

  // Get user's reports
  const reports = await prisma.report.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      images: { where: { isMain: true }, take: 1 },
    },
  });

  // Impact stats
  const totalReported = reports.length;
  const confirmedFixed = reports.filter((r : any) => r.status === "CONFIRMED_FIXED").length;

  const upvotesGiven = await prisma.upvote.count({
    where: { userId: user.id },
  });

  const comments = await prisma.comment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      issue: { select: { id: true, title: true } },
    },
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {/* Profile header */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "var(--primary-mint)" }}
            >
              <UserIcon className="h-8 w-8" style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-heading)" }}>
                {dbUser.name}
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-body)" }}>
                {dbUser.email}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {dbUser.role === "AUTHORITY" ? (
                  <span
                    className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
                    style={{ background: "#eff6ff", borderColor: "#93c5fd", color: "#2563eb" }}
                  >
                    <Shield className="h-3 w-3" />
                    {dbUser.authorityBody || "Authority"}
                  </span>
                ) : (
                  <span
                    className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
                    style={{
                      background: "var(--primary-mint)",
                      borderColor: "var(--primary-border)",
                      color: "var(--primary)",
                    }}
                  >
                    <UserIcon className="h-3 w-3" />
                    Citizen
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Calendar className="h-3 w-3" />
                  Member since{" "}
                  {dbUser.createdAt.toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Impact stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div
            className="rounded-2xl border p-5 text-center"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <FileText className="h-4 w-4" style={{ color: "var(--primary)" }} />
            </div>
            <div className="mt-2 text-2xl font-bold" style={{ color: "var(--text-heading)" }}>
              {totalReported}
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Issues Reported
            </div>
          </div>
          <div
            className="rounded-2xl border p-5 text-center"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" style={{ color: "var(--primary)" }} />
            </div>
            <div className="mt-2 text-2xl font-bold" style={{ color: "var(--text-heading)" }}>
              {confirmedFixed}
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Confirmed Fixed
            </div>
          </div>
          <div
            className="rounded-2xl border p-5 text-center"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <ArrowUp className="h-4 w-4" style={{ color: "var(--primary)" }} />
            </div>
            <div className="mt-2 text-2xl font-bold" style={{ color: "var(--text-heading)" }}>
              {upvotesGiven}
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Upvotes Given
            </div>
          </div>
        </div>

        {/* User's reported issues */}
        <div
          className="mt-6 rounded-2xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--text-heading)" }}>
            Your Reported Issues
          </h2>

          <div className="mt-4 grid gap-3">
            {reports.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                You haven&apos;t reported any issues yet.{" "}
                <Link href="/reports/new" style={{ color: "var(--text-green)" }}>
                  Report one now →
                </Link>
              </p>
            )}

            {reports.map((r : any) => {
              const main = r.images[0];
              const imgSrc = main ? main.url : null;
              const sc = STATUS_CONFIG[r.status] ?? { label: r.status, class: "" };

              return (
                <Link
                  key={r.id}
                  href={`/reports/${r.id}`}
                  className="flex items-center gap-4 rounded-xl border p-4 transition-colors"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border"
                    style={{ background: "var(--primary-light)", borderColor: "var(--border)" }}
                  >
                    {imgSrc ? (
                      <img src={imgSrc} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {r.title}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {r.areaName} · {r.category.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${sc.class}`}>
                    {sc.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Comment history */}
        <div
          className="mt-6 rounded-2xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--text-heading)" }}>
            <MessageSquare className="h-5 w-5" />
            Comment History
          </h2>
          <div className="mt-4 space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                You haven&apos;t commented on any issues yet.
              </p>
            ) : (
              comments.map((c : any) => (
                <Link
                  key={c.id}
                  href={`/reports/${c.issueId}`}
                  className="block rounded-xl border p-4 transition hover:border-green-300"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {c.issue.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--text-body)" }}>
                    {c.content}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {c.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
