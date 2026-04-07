import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/authServer";
import IssueDetailClient from "@/app/_components/common/IssueDetailClient";
import { PageShell } from "@/app/_components/global/AppSidebar";
import { ChevronLeft, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await requireServerSession();
  const userId = (session?.user as any)?.id ?? null;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      images: true,
      timeline: { orderBy: { createdAt: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!report) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-screen p-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Report not found</h1>
            <Link href="/feed" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-2xl text-sm no-underline mt-4">
              <ChevronLeft size={18} /> Back to Feed
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  let userUpvoted = false;
  if (userId) {
    const upvote = await prisma.upvote.findUnique({
      where: { issueId_userId: { issueId: id, userId } },
    });
    userUpvoted = !!upvote;
  }

  const serializedReport = {
    ...report,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    escalatedAt: report.escalatedAt?.toISOString() ?? null,
    images: report.images.map((img: any) => ({ ...img, createdAt: img.createdAt.toISOString() })),
    timeline: report.timeline.map((t: any) => ({ ...t, createdAt: t.createdAt.toISOString() })),
    comments: report.comments.map((c: any) => ({ ...c, createdAt: c.createdAt.toISOString() })),
  };

  return (
    <PageShell>
      {/* Back nav */}
      <div className="px-8 pt-6">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-green-600 font-bold text-sm transition-colors no-underline group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Feed
        </Link>
      </div>

      <IssueDetailClient
        initialReport={serializedReport as any}
        initialUserUpvoted={userUpvoted}
      />
    </PageShell>
  );
}
