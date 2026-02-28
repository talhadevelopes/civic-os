import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/authServer";
import { reportUpdates } from "@/lib/reportUpdates";

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  REPORTED: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "RESOLVED_PENDING_VERIFICATION", "REJECTED"],
  IN_PROGRESS: ["RESOLVED_PENDING_VERIFICATION", "REJECTED"],
  RESOLVED_PENDING_VERIFICATION: [], // Only citizen can move from here
  CONFIRMED_FIXED: [],
  REOPENED: ["IN_PROGRESS", "REJECTED"],
  REJECTED: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  // Only authorities can change status
  if (user.role !== "AUTHORITY") {
    return NextResponse.json(
      { error: "Only authorities can update issue status" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const { status: newStatus, note, fixPhotoUrl, rejectionReason } = body;

  if (!newStatus) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  // Get current issue
  const issue = await prisma.report.findUnique({ where: { id } });
  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[issue.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${issue.status} to ${newStatus}` },
      { status: 400 }
    );
  }

  // Validate fix photo when resolving
  if (newStatus === "RESOLVED_PENDING_VERIFICATION" && !fixPhotoUrl) {
    return NextResponse.json(
      { error: "Fix photo is required when marking as resolved" },
      { status: 400 }
    );
  }

  // Validate rejection reason
  if (newStatus === "REJECTED" && (!rejectionReason || !rejectionReason.trim())) {
    return NextResponse.json(
      { error: "Rejection reason is required" },
      { status: 400 }
    );
  }

  // Build update data
  const updateData: any = { status: newStatus, updatedAt: new Date() };

  if (newStatus === "RESOLVED_PENDING_VERIFICATION") {
    updateData.fixPhotoUrl = fixPhotoUrl;
  }

  if (newStatus === "REJECTED") {
    updateData.rejectionReason = rejectionReason.trim();
  }

  // If assigning, set the authority
  if (newStatus === "ASSIGNED" || issue.status === "REPORTED") {
    updateData.assignedAuthorityId = user.id;
  }

  // Update issue and create timeline entry in a transaction
  const [updatedIssue] = await prisma.$transaction([
    prisma.report.update({
      where: { id },
      data: updateData,
    }),
    prisma.issueTimeline.create({
      data: {
        issueId: id,
        actorId: user.id,
        actorName: user.name || "Authority",
        actorRole: "AUTHORITY",
        action: newStatus === "REJECTED" ? "REJECTED" : "STATUS_CHANGED",
        note:
          newStatus === "REJECTED"
            ? `Issue rejected. Reason: ${rejectionReason.trim()}`
            : newStatus === "RESOLVED_PENDING_VERIFICATION"
            ? `Marked as Resolved. Fix photo uploaded as proof of work. Awaiting citizen approval.${
                note ? " Note: " + note : ""
              }`
            : `Status changed to ${newStatus.replace(/_/g, " ")}.${
                note ? " Note: " + note : ""
              }`,
      },
    }),
  ]);

  // broadcast status update so maps/dashboards stay in sync
  reportUpdates.emit("update-report", updatedIssue);
  return NextResponse.json({ report: updatedIssue });
}
