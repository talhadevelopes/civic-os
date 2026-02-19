"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ArrowUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  Shield,
  ChevronDown,
  Upload,
  MessageSquare,
} from "lucide-react";

type TimelineEntry = {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  note: string | null;
  createdAt: string;
};

type Comment = {
  id: string;
  content: string;
  isOfficial: boolean;
  createdAt: string;
  user: { id: string; name: string; role: string };
};

type ReportImage = {
  id: string;
  isMain: boolean;
  mimeType: string;
  base64Data: string;
};

type Report = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  areaName: string;
  mlaName: string | null;
  constituencyName: string | null;
  latitude: number | null;
  longitude: number | null;
  createdById: string;
  citizenPhotoUrl: string | null;
  fixPhotoUrl: string | null;
  rejectionReason: string | null;
  upvoteCount: number;
  escalated: boolean;
  citizenVerified: boolean | null;
  createdAt: string;
  updatedAt: string;
  images: ReportImage[];
  timeline: TimelineEntry[];
  comments: Comment[];
  createdBy: { id: string; name: string; role: string };
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  REPORTED: { label: "Reported", class: "status-reported" },
  ASSIGNED: { label: "Assigned", class: "status-assigned" },
  IN_PROGRESS: { label: "In Progress", class: "status-inprogress" },
  RESOLVED_PENDING_VERIFICATION: { label: "Resolved (Awaiting Citizen Approval)", class: "status-pending" },
  CONFIRMED_FIXED: { label: "Confirmed Fixed", class: "status-confirmed" },
  REOPENED: { label: "Reopened", class: "status-reopened" },
  REJECTED: { label: "Rejected", class: "status-rejected" },
};

const STATUS_OPTIONS_FOR_AUTHORITY: Record<string, { value: string; label: string }[]> = {
  REPORTED: [
    { value: "ASSIGNED", label: "Assign to me" },
    { value: "REJECTED", label: "Reject" },
  ],
  ASSIGNED: [
    { value: "IN_PROGRESS", label: "Mark In Progress" },
    { value: "RESOLVED_PENDING_VERIFICATION", label: "✅ Resolved (Upload fix photo — awaiting citizen approval)" },
    { value: "REJECTED", label: "Reject" },
  ],
  IN_PROGRESS: [
    { value: "RESOLVED_PENDING_VERIFICATION", label: "✅ Resolved (Upload fix photo — awaiting citizen approval)" },
    { value: "REJECTED", label: "Reject" },
  ],
  REOPENED: [
    { value: "IN_PROGRESS", label: "Mark In Progress" },
    { value: "RESOLVED_PENDING_VERIFICATION", label: "✅ Resolved (Upload fix photo — awaiting citizen approval)" },
    { value: "REJECTED", label: "Reject" },
  ],
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function IssueDetailClient({
  initialReport,
  initialUserUpvoted,
}: {
  initialReport: Report;
  initialUserUpvoted: boolean;
}) {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [report, setReport] = useState<Report>(initialReport);
  const [userUpvoted, setUserUpvoted] = useState(initialUserUpvoted);
  const [upvoteCount, setUpvoteCount] = useState(initialReport.upvoteCount);

  // Authority action state
  const [selectedStatus, setSelectedStatus] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [fixPhotoFile, setFixPhotoFile] = useState<File | null>(null);
  const [fixPhotoPreview, setFixPhotoPreview] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialReport.comments);

  // Verification state
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    if (!fixPhotoFile) {
      setFixPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(fixPhotoFile);
    setFixPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [fixPhotoFile]);

  const refreshReport = useCallback(async () => {
    const res = await fetch(`/api/reports/${report.id}`);
    if (res.ok) {
      const data = await res.json();
      setReport(data.report);
      setComments(data.report.comments);
      setUpvoteCount(data.report.upvoteCount);
      setUserUpvoted(data.userUpvoted);
    }
  }, [report.id]);

  // Upvote toggle
  async function handleUpvote() {
    const res = await fetch(`/api/reports/${report.id}/upvote`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setUserUpvoted(data.upvoted);
      setUpvoteCount(data.upvoteCount);
      toast.success(data.upvoted ? "Upvoted!" : "Upvote removed");
    } else {
      toast.error("Failed to upvote");
    }
  }

  // Authority status update
  async function handleStatusUpdate() {
    if (!selectedStatus) return;
    setActionLoading(true);
    setActionError(null);

    try {
      let fixPhotoUrl: string | null = null;

      if (selectedStatus === "RESOLVED_PENDING_VERIFICATION") {
        if (!fixPhotoFile) {
          setActionError("Please upload a fix photo");
          setActionLoading(false);
          return;
        }
        // Convert to base64 data URL
        const buf = await fixPhotoFile.arrayBuffer();
        const base64 = Buffer.from(buf).toString("base64");
        fixPhotoUrl = `data:${fixPhotoFile.type};base64,${base64}`;
      }

      const res = await fetch(`/api/reports/${report.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          note: actionNote || undefined,
          fixPhotoUrl: fixPhotoUrl || undefined,
          rejectionReason: selectedStatus === "REJECTED" ? rejectionReason : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      // Reset form
      setSelectedStatus("");
      setActionNote("");
      setRejectionReason("");
      setFixPhotoFile(null);

      await refreshReport();
      toast.success("Status updated successfully");
    } catch (err: any) {
      setActionError(err.message);
      toast.error(err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  }

  // Citizen verification
  async function handleVerify(verified: boolean) {
    setVerifyLoading(true);
    try {
      const res = await fetch(`/api/reports/${report.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Verification failed");
        return;
      }
      await refreshReport();
      toast.success(verified ? "Fix confirmed! Issue marked as resolved." : "Issue reopened. Authority will be notified.");
    } finally {
      setVerifyLoading(false);
    }
  }

  // Add comment
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);

    try {
      const res = await fetch(`/api/reports/${report.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setCommentText("");
        await refreshReport();
        toast.success("Comment added");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add comment");
      }
    } finally {
      setCommentLoading(false);
    }
  }

  const mainImage = report.images.find((x) => x.isMain);
  const bodyImages = report.images.filter((x) => !x.isMain);
  const mainSrc = mainImage
    ? `data:${mainImage.mimeType};base64,${mainImage.base64Data}`
    : null;
  const statusConfig = STATUS_CONFIG[report.status] ?? {
    label: report.status,
    class: "",
  };

  const isReporter = user?.id === report.createdById;
  const isAuthority = user?.role === "AUTHORITY";
  const isPendingVerification = report.status === "RESOLVED_PENDING_VERIFICATION";
  const availableTransitions = STATUS_OPTIONS_FOR_AUTHORITY[report.status] ?? [];
  const daysOpen = daysSince(report.createdAt);
  const isEscalated = report.escalated || (daysOpen >= 30 && !["CONFIRMED_FIXED", "REJECTED"].includes(report.status));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {/* Escalation banner */}
        {isEscalated && (
          <div className="alert-escalated mb-6 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            ⚠️ This issue has been unresolved for {daysOpen} days. It has been escalated.
          </div>
        )}

        {/* Header */}
        <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-heading)" }}>
                  {report.title}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.class}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm" style={{ color: "var(--text-body)" }}>
                <span>
                  Area: <strong style={{ color: "var(--text-primary)" }}>{report.areaName}</strong>
                </span>
                <span>•</span>
                <span>{report.category.replaceAll("_", " ")}</span>
                {report.mlaName && (
                  <>
                    <span>•</span>
                    <span>
                      MLA: <strong style={{ color: "var(--text-primary)" }}>{report.mlaName}</strong>
                      {report.constituencyName && (
                        <span style={{ color: "var(--text-muted)" }}> ({report.constituencyName})</span>
                      )}
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Reported by {report.createdBy.name} · {formatDate(report.createdAt)}
              </p>
            </div>

            {/* Upvote */}
            <button
              onClick={handleUpvote}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
              style={{
                borderColor: userUpvoted ? "var(--primary-border)" : "var(--border)",
                background: userUpvoted ? "var(--primary-mint)" : "var(--surface)",
                color: userUpvoted ? "var(--primary)" : "var(--text-body)",
              }}
            >
              <ArrowUp className="h-4 w-4" />
              {upvoteCount}
            </button>
          </div>

          {/* Description */}
          <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--text-body)" }}>
            {report.description}
          </p>

          {/* Rejection reason */}
          {report.status === "REJECTED" && report.rejectionReason && (
            <div
              className="mt-4 rounded-xl border px-4 py-3"
              style={{ borderColor: "#fca5a5", background: "#fef2f2" }}
            >
              <p className="text-xs font-semibold" style={{ color: "#dc2626" }}>
                Rejection Reason (Public)
              </p>
              <p className="mt-1 text-sm" style={{ color: "#7f1d1d" }}>
                {report.rejectionReason}
              </p>
            </div>
          )}
        </div>

        {/* Before vs After photos */}
        {mainSrc && (
          <div className="mt-6">
            <div
              className={`grid gap-4 ${report.fixPhotoUrl ? "sm:grid-cols-2" : ""}`}
            >
              <div className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  📷 Before — Citizen&apos;s Report
                </p>
                <div className="mt-2 overflow-hidden rounded-xl">
                  <img src={mainSrc} alt="Before" className="h-60 w-full object-cover" />
                </div>
              </div>

              {report.fixPhotoUrl && (
                <div className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    ✅ After — Authority&apos;s Fix
                  </p>
                  <div className="mt-2 overflow-hidden rounded-xl">
                    <img src={report.fixPhotoUrl} alt="After" className="h-60 w-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Body images */}
        {bodyImages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {bodyImages.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <img
                  src={`data:${img.mimeType};base64,${img.base64Data}`}
                  alt=""
                  className="h-36 w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Citizen Verification Panel */}
        {isPendingVerification && isReporter && (
          <div
            className="mt-6 rounded-2xl border p-6"
            style={{ background: "#faf5ff", borderColor: "#d8b4fe" }}
          >
            <h2 className="text-lg font-bold" style={{ color: "#7c3aed" }}>
              Your Approval Required — Verify the Fix
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#6b21a8" }}>
              The authority has marked this issue as resolved and uploaded a fix photo as proof of work
              (see Before vs After above). Please verify: Is the fix satisfactory?
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleVerify(true)}
                disabled={verifyLoading}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                style={{ background: "var(--primary)" }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmed Fixed
              </button>
              <button
                onClick={() => handleVerify(false)}
                disabled={verifyLoading}
                className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold"
                style={{ borderColor: "#fca5a5", color: "#dc2626", background: "#fef2f2" }}
              >
                <XCircle className="h-4 w-4" />
                Still Broken
              </button>
            </div>
          </div>
        )}

        {/* Authority Action Panel */}
        {isAuthority && availableTransitions.length > 0 && (
          <div
            className="mt-6 rounded-2xl border p-6"
            style={{ background: "#eff6ff", borderColor: "#93c5fd" }}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: "#2563eb" }} />
              <h2 className="text-lg font-bold" style={{ color: "#1e40af" }}>
                Authority Actions
              </h2>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm" style={{ color: "#1e40af" }}>
                Update Status
                <div className="relative">
                  <select
                    className="h-11 w-full appearance-none rounded-xl border bg-white px-3 pr-10 text-sm outline-none"
                    style={{ borderColor: "#93c5fd" }}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">— Select action —</option>
                    {availableTransitions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "#6b7280" }}
                  />
                </div>
              </label>

              {selectedStatus === "RESOLVED_PENDING_VERIFICATION" && (
                <label
                  className="grid gap-2 rounded-xl border-2 border-dashed p-4"
                  style={{ borderColor: "#93c5fd", background: "#f0f7ff" }}
                >
                  <span className="flex items-center gap-1 font-semibold" style={{ color: "#1e40af" }}>
                    <Upload className="h-4 w-4" />
                    Fix Photo — Proof of Work (required)
                  </span>
                  <p className="text-xs" style={{ color: "#3b82f6" }}>
                    Upload a photo showing the completed fix. The citizen will see this before approving.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFixPhotoFile(e.target.files?.[0] ?? null)}
                    className="h-11 rounded-xl border bg-white px-3 text-sm"
                    style={{ borderColor: "#93c5fd" }}
                  />
                  {fixPhotoPreview && (
                    <div className="overflow-hidden rounded-xl">
                      <img src={fixPhotoPreview} alt="Fix preview" className="h-40 w-full object-cover" />
                    </div>
                  )}
                </label>
              )}

              {selectedStatus === "REJECTED" && (
                <label className="grid gap-2 text-sm" style={{ color: "#1e40af" }}>
                  Rejection Reason (required, will be public)
                  <textarea
                    className="min-h-[80px] rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                    style={{ borderColor: "#93c5fd" }}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Why is this issue being rejected?"
                  />
                </label>
              )}

              <label className="grid gap-2 text-sm" style={{ color: "#1e40af" }}>
                Note (optional)
                <input
                  className="h-11 rounded-xl border bg-white px-3 text-sm outline-none"
                  style={{ borderColor: "#93c5fd" }}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="e.g. Team dispatched, expected resolution by Friday"
                />
              </label>

              {actionError && (
                <div
                  className="rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "#fca5a5", background: "#fef2f2", color: "#dc2626" }}
                >
                  {actionError}
                </div>
              )}

              <button
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || actionLoading}
                className="mt-1 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#2563eb" }}
              >
                {actionLoading ? "Updating..." : "Submit Update"}
              </button>
            </div>
          </div>
        )}

        {/* Audit Trail / Timeline */}
        <div className="mt-6 rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-heading)" }}>
            Audit Trail
          </h2>

          <div className="mt-4">
            {report.timeline.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No timeline entries yet.
              </p>
            ) : (
              <div className="relative pl-6">
                {/* Vertical line */}
                <div
                  className="absolute left-[9px] top-2 h-[calc(100%-16px)] w-0.5"
                  style={{ background: "var(--primary-border)" }}
                />

                <div className="grid gap-0">
                  {report.timeline.map((entry, i) => {
                    const isLast = i === report.timeline.length - 1;
                    return (
                      <div key={entry.id} className="relative pb-5">
                        {/* Dot */}
                        <div
                          className="absolute -left-6 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full"
                          style={{
                            background: isLast ? "var(--primary)" : "var(--primary-mint)",
                            border: isLast ? "none" : "2px solid var(--primary-border)",
                          }}
                        >
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: isLast ? "white" : "var(--primary)" }}
                          />
                        </div>

                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {entry.note || entry.action.replace(/_/g, " ")}
                          </p>
                          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                            {formatDate(entry.createdAt)} ·{" "}
                            <span
                              style={{
                                color:
                                  entry.actorRole === "AUTHORITY"
                                    ? "#2563eb"
                                    : entry.actorRole === "SYSTEM"
                                    ? "#6b7280"
                                    : "var(--primary)",
                              }}
                            >
                              {entry.actorName} ({entry.actorRole})
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="mt-6 rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            <h2 className="text-lg font-bold" style={{ color: "var(--text-heading)" }}>
              Comments ({comments.length})
            </h2>
          </div>

          <div className="mt-4 grid gap-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border px-4 py-3"
                style={{
                  borderColor: c.isOfficial ? "#93c5fd" : "var(--border)",
                  background: c.isOfficial ? "#f0f7ff" : "var(--surface)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {c.user.name}
                  </span>
                  {c.isOfficial && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "#dbeafe", color: "#2563eb" }}
                    >
                      Official Response
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm" style={{ color: "var(--text-body)" }}>
                  {c.content}
                </p>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No comments yet. Be the first to comment.
              </p>
            )}
          </div>

          {/* Add comment form */}
          {user && (
            <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
              <input
                className="h-11 flex-1 rounded-xl border px-3 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="submit"
                disabled={commentLoading || !commentText.trim()}
                className="flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-white disabled:opacity-50"
                style={{ background: "var(--primary)" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
