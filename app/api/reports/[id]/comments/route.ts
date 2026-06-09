import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/authServer";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const comments = await prisma.comment.findMany({
    where: { issueId: id },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json({ comments });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  // Check if the user ID actually exists in the database to avoid foreign key errors
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  });
  const validUserId = dbUser ? user.id : null;

  const { id } = await params;
  const body = await req.json();
  const content = (body.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  // Verify issue exists
  const issue = await prisma.report.findUnique({ where: { id } });
  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const isOfficial = user.role === "AUTHORITY";

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        issueId: id,
        userId: validUserId as string, // Note: This might still fail if userId is required and null
        content,
        isOfficial,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.issueTimeline.create({
      data: {
        issueId: id,
        actorId: validUserId,
        actorName: user.name || (isOfficial ? "Authority" : "Citizen"),
        actorRole: isOfficial ? "AUTHORITY" : "CITIZEN",
        action: "COMMENT_ADDED",
        note: `Comment: "${content.slice(0, 120)}${content.length > 120 ? "..." : ""}"`,
      },
    }),
  ]);

  return NextResponse.json({ comment }, { status: 201 });
}
