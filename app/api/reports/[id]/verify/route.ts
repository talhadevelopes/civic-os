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
  const body = await req.json();
  const { verified } = body; // true = Confirmed Fixed, false = Still Broken

  if (typeof verified !== "boolean") {
    return NextResponse.json(
      { error: "verified must be true or false" },
      { status: 400 }
    );
  }

  // Get the issue
  const issue = await prisma.report.findUnique({ where: { id } });
  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  // Only the citizen who reported can verify
  if (issue.createdById !== user.id) {
    return NextResponse.json(
      { error: "Only the citizen who reported this issue can verify the fix" },
      { status: 403 }
    );
  }

  // Can only verify when status is RESOLVED_PENDING_VERIFICATION
  if (issue.status !== "RESOLVED_PENDING_VERIFICATION") {
    return NextResponse.json(
      { error: "Issue is not pending verification" },
      { status: 400 }
    );
  }

  const newStatus = verified ? "CONFIRMED_FIXED" : "REOPENED";
  const action = verified ? "CITIZEN_VERIFIED" : "CITIZEN_REOPENED";
  const noteText = verified
    ? "Fix confirmed by citizen. Issue closed."
    : "Reopened by citizen — fix not confirmed. Issue returned to In Progress.";

  const [updatedIssue] = await prisma.$transaction([
    prisma.report.update({
      where: { id },
      data: {
        status: verified ? "CONFIRMED_FIXED" : "REOPENED",
        citizenVerified: verified,
        updatedAt: new Date(),
      },
    }),
    prisma.issueTimeline.create({
      data: {
        issueId: id,
        actorId: user.id,
        actorName: user.name || "Citizen",
        actorRole: "CITIZEN",
        action,
        note: noteText,
      },
    }),
  ]);

  return NextResponse.json({ report: updatedIssue });
}
