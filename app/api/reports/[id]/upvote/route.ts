import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/authServer";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const { id } = await params;

  // Verify issue exists
  const issue = await prisma.report.findUnique({ where: { id } });
  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  // Check if already upvoted
  const existing = await prisma.upvote.findUnique({
    where: { issueId_userId: { issueId: id, userId: user.id } },
  });

  if (existing) {
    // Remove upvote (toggle)
    await prisma.$transaction([
      prisma.upvote.delete({ where: { id: existing.id } }),
      prisma.report.update({
        where: { id },
        data: { upvoteCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ upvoted: false, upvoteCount: issue.upvoteCount - 1 });
  }

  // Add upvote
  await prisma.$transaction([
    prisma.upvote.create({
      data: { issueId: id, userId: user.id },
    }),
    prisma.report.update({
      where: { id },
      data: { upvoteCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ upvoted: true, upvoteCount: issue.upvoteCount + 1 });
}
