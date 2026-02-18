import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/authServer";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check if current user has upvoted
  let userUpvoted = false;
  if (userId) {
    const upvote = await prisma.upvote.findUnique({
      where: { issueId_userId: { issueId: id, userId } },
    });
    userUpvoted = !!upvote;
  }

  return NextResponse.json({ report, userUpvoted });
}
