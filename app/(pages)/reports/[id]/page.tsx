import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/authServer";
import IssueDetailClient from "@/app/_components/common/IssueDetailClient";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await requireServerSession();
  const userId = (session?.user as any)?.id ?? null;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      images: true,
      timeline: {
        orderBy: { createdAt: "asc" },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  if (!report) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          <p style={{ color: "var(--text-body)" }}>Report not found.</p>
          <Link href="/reports" style={{ color: "var(--text-green)" }} className="mt-3 inline-block">
            Back to reports
          </Link>
        </div>
      </div>
    );
  }

  // Check if current user has upvoted
  let userUpvoted = false;
  if (userId) {
    const upvote = await prisma.upvote.findUnique({
      where: { issueId_userId: { issueId: id, userId } },
    });
    userUpvoted = !!upvote;
  }

  // Serialize dates for client component
  const serializedReport = {
    ...report,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    escalatedAt: report.escalatedAt?.toISOString() ?? null,
    images: report.images.map((img) => ({
      ...img,
      createdAt: img.createdAt.toISOString(),
    })),
    timeline: report.timeline.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    comments: report.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  return (
    <IssueDetailClient
      initialReport={serializedReport as any}
      initialUserUpvoted={userUpvoted}
    />
  );
}
