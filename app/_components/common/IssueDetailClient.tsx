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
  AlertCircle,
  MapPin,
  Users,
  History,
  FileText,
  Camera,
  Maximize2,
  Share2,
  Flag,
  HardHat,
  Wrench,
  CheckCircle,
  MessageCircle,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import SingleMapClient from "@/app/_components/maps/SingleMapClient";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type TimelineEntry = {
  id: string;
  actorId: string | null;
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
  url: string;
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

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  REPORTED: { label: "Reported", class: "status-reported" },
  ASSIGNED: { label: "Assigned", class: "status-assigned" },
  IN_PROGRESS: { label: "In Progress", class: "status-in_progress" },
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
    { value: "RESOLVED_PENDING_VERIFICATION", label: "✅ Resolved (Upload fix photo)" },
    { value: "REJECTED", label: "Reject" },
  ],
  IN_PROGRESS: [
    { value: "RESOLVED_PENDING_VERIFICATION", label: "✅ Resolved (Upload fix photo)" },
    { value: "REJECTED", label: "Reject" },
  ],
  REOPENED: [
    { value: "IN_PROGRESS", label: "Mark In Progress" },
    { value: "RESOLVED_PENDING_VERIFICATION", label: "✅ Resolved (Upload fix photo)" },
    { value: "REJECTED", label: "Reject" },
  ],
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function getTimelineIcon(role: string, action: string) {
  if (action.includes("report") || role === "CITIZEN") return <FileText size={12} />;
  if (action.includes("assignment") || action.includes("ASSIGN")) return <HardHat size={12} />;
  if (action.includes("status") || role === "AUTHORITY") return <Wrench size={12} />;
  return <CheckCircle size={12} />;
}

function getTimelineColors(role: string) {
  if (role === "CITIZEN") return { dot: "bg-blue-500", badge: "text-blue-600 border-blue-200" };
  if (role === "SYSTEM") return { dot: "bg-slate-500", badge: "text-slate-600 border-slate-200" };
  if (role === "AUTHORITY") return { dot: "bg-amber-500", badge: "text-amber-600 border-amber-200" };
  return { dot: "bg-green-600", badge: "text-green-600 border-green-200" };
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  // Verification
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    if (!fixPhotoFile) { setFixPhotoPreview(null); return; }
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

  async function handleStatusUpdate() {
    if (!selectedStatus) return;
    setActionLoading(true);
    setActionError(null);
    try {
      let fixPhotoUrl: string | null = null;
      if (selectedStatus === "RESOLVED_PENDING_VERIFICATION") {
        if (!fixPhotoFile) { setActionError("Please upload a fix photo"); setActionLoading(false); return; }
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
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update status"); }
      setSelectedStatus(""); setActionNote(""); setRejectionReason(""); setFixPhotoFile(null);
      await refreshReport();
      toast.success("Status updated successfully");
    } catch (err: any) {
      setActionError(err.message);
      toast.error(err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerify(verified: boolean) {
    setVerifyLoading(true);
    try {
      const res = await fetch(`/api/reports/${report.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Verification failed"); return; }
      await refreshReport();
      toast.success(verified ? "Fix confirmed! Issue marked as resolved." : "Issue reopened. Authority will be notified.");
    } finally {
      setVerifyLoading(false);
    }
  }

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

  // Derived values
  const mainImage = report.images.find((x) => x.isMain);
  const bodyImages = report.images.filter((x) => !x.isMain);
  const mainSrc = mainImage ? mainImage.url : null;
  const statusConfig = STATUS_CONFIG[report.status] ?? { label: report.status, class: "" };
  const isReporter = user?.id === report.createdById;
  const isAuthority = user?.role === "AUTHORITY";
  const isPendingVerification = report.status === "RESOLVED_PENDING_VERIFICATION";
  const availableTransitions = STATUS_OPTIONS_FOR_AUTHORITY[report.status] ?? [];
  const daysOpen = daysSince(report.createdAt);
  const isEscalated = report.escalated || (daysOpen >= 30 && !["CONFIRMED_FIXED", "REJECTED"].includes(report.status));

  // ─────────────────────────────────────────────────────────────
  // Render — new 2-column layout
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Full Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-all"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={selectedImage} 
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Top header bar ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {report.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                  {report.category.replaceAll("_", " ")}
                </span>
                {report.areaName && (
                  <>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={10} /> {report.areaName}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-base font-bold text-slate-900 leading-tight truncate max-w-lg">
                {report.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Upvote */}
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-bold transition-all ${
                userUpvoted
                  ? "bg-green-50 border-green-300 text-green-600"
                  : "bg-white border-slate-200 text-slate-500 hover:border-green-300"
              }`}
            >
              <ArrowUp className="h-4 w-4" />
              {upvoteCount}
            </button>

            {/* Status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${statusConfig.class}`}>
              <Clock size={11} />
              {statusConfig.label}
            </div>

            {/* Escalated badge */}
            {isEscalated && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-red-200">
                <AlertCircle size={11} /> Escalated · {daysOpen}d
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main 2-col grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ═══ LEFT COL (2/3): Image + Testimony + Audit Trail ═══ */}
          <div className="lg:col-span-2 space-y-6">

            {/* Main Before Image */}
            {mainSrc && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div 
                  className="aspect-video relative group cursor-pointer"
                  onClick={() => setSelectedImage(mainSrc)}
                >
                  <img
                    src={mainSrc}
                    alt="Before — Citizen's Report"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button 
                      className="p-2 bg-white/90 backdrop-blur shadow-lg rounded-lg text-slate-700 hover:text-green-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(mainSrc);
                      }}
                    >
                      <Maximize2 size={18} />
                    </button>
                    <button className="p-2 bg-white/90 backdrop-blur shadow-lg rounded-lg text-slate-700 hover:text-green-600 transition-colors">
                      <Camera size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">
                      {report.createdBy.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{report.createdBy.name}</p>
                      <p className="text-[10px] text-slate-500">{formatDate(report.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Photos Grid */}
            {report.images.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Camera size={14} /> All Photos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {report.images.map((img) => (
                    <div
                      key={img.id}
                      className="aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setSelectedImage(img.url)}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fix Photo (After) */}
            {report.fixPhotoUrl && (
              <div className="bg-white border border-green-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span className="text-xs font-bold text-green-700">After — Authority's Fix (Proof of Work)</span>
                </div>
                <div 
                  className="aspect-video cursor-pointer"
                  onClick={() => setSelectedImage(report.fixPhotoUrl)}
                >
                  <img src={report.fixPhotoUrl} alt="After fix" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Rejection reason */}
            {report.status === "REJECTED" && report.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <p className="text-xs font-bold text-red-600 mb-1">Rejection Reason (Public)</p>
                <p className="text-sm text-red-800">{report.rejectionReason}</p>
              </div>
            )}

            {/* Citizen Testimony */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageCircle size={14} /> Citizen Testimony
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm italic border-l-4 border-green-200 pl-4 py-1">
                &ldquo;{report.description}&rdquo;
              </p>
            </div>

            {/* Citizen Verification Panel */}
            {isPendingVerification && isReporter && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-purple-900 mb-2">
                  Your Approval Required — Verify the Fix
                </h2>
                <p className="text-sm text-purple-700 mb-5 leading-relaxed">
                  The authority has marked this issue as resolved and uploaded a fix photo. Is the fix satisfactory?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerify(true)}
                    disabled={verifyLoading}
                    className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} /> Confirmed Fixed
                  </button>
                  <button
                    onClick={() => handleVerify(false)}
                    disabled={verifyLoading}
                    className="flex items-center gap-2 px-8 py-4 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl disabled:opacity-50"
                  >
                    <XCircle size={16} /> Still Broken
                  </button>
                </div>
              </div>
            )}

            {/* Audit Trail */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <History size={14} /> Audit Trail
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                  Live
                </div>
              </div>

              {report.timeline.length === 0 ? (
                <p className="text-sm text-slate-400">No timeline entries yet.</p>
              ) : (
                <div className="space-y-5 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {report.timeline.map((entry, i) => {
                    const isLatest = i === report.timeline.length - 1;
                    const colors = getTimelineColors(entry.actorRole);
                    return (
                      <div key={entry.id} className="relative pl-8">
                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-lg border-2 border-white shadow-sm flex items-center justify-center text-white z-10 ${colors.dot}`}>
                          {getTimelineIcon(entry.actorRole, entry.action)}
                        </div>
                        <div className={`p-4 rounded-xl border transition-all ${isLatest ? "bg-green-50 border-green-200" : "bg-slate-50 border-transparent"}`}>
                          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{entry.actorName}</span>
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border bg-white ${colors.badge}`}>
                                {entry.actorRole}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium">{formatDate(entry.createdAt)}</span>
                          </div>
                          <p className={`text-xs leading-relaxed ${isLatest ? "text-slate-900 font-medium" : "text-slate-500"}`}>
                            {entry.note || entry.action.replace(/_/g, " ")}
                          </p>
                          {/* In-progress photo */}
                          {entry.action === "STATUS_CHANGED" && entry.note?.includes("Repair work in progress") && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-blue-100 shadow-sm max-w-sm cursor-pointer" onClick={() => setSelectedImage("/reports/under_working_in_progress.png")}>
                              <img src="/reports/under_working_in_progress.png" alt="Work in progress" className="w-full h-32 object-cover" />
                              <div className="px-3 py-1.5 bg-blue-50 text-[10px] font-bold text-blue-600 flex items-center gap-1.5">
                                <Camera size={10} /> Work In Progress Photo
                              </div>
                            </div>
                          )}

                          {/* After/fix photo */}
                          {((entry.action === "CITIZEN_VERIFIED" && report.citizenVerified) || (entry.action === "FIX_PHOTO_UPLOADED" && report.fixPhotoUrl)) && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-green-100 shadow-sm max-w-sm cursor-pointer" onClick={() => setSelectedImage(report.fixPhotoUrl || "")}>
                              <img src={report.fixPhotoUrl || ""} alt="Fix confirmation" className="w-full h-32 object-cover" />
                              <div className="px-3 py-1.5 bg-green-50 text-[10px] font-bold text-green-600 flex items-center gap-1.5">
                                <Camera size={10} /> Verified Resolution Photo
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT COL (1/3): Map + Authority + Actions + Comments ═══ */}
          <div className="space-y-5">

            {/* Location Map */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="h-44 bg-slate-100 relative">
                {(report.latitude && report.longitude) ? (
                  <SingleMapClient lat={report.latitude} lng={report.longitude} category={report.category} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400">
                    No coordinates available
                  </div>
                )}
                <div className="absolute bottom-3 right-3 pointer-events-none z-10">
                  <button className="p-2 bg-white/90 backdrop-blur shadow-lg rounded-lg text-slate-700 hover:text-green-600 transition-colors pointer-events-auto">
                    <ExternalLink size={15} />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                    <MapPin size={15} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Area</p>
                    <p className="text-xs font-bold text-slate-900">{report.areaName}</p>
                  </div>
                </div>
                {report.constituencyName && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                      <Users size={15} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Constituency</p>
                      <p className="text-xs font-bold text-slate-900">{report.constituencyName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Authority */}
            {report.mlaName && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Assigned Authority
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm">
                    {report.mlaName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 leading-tight line-clamp-1">{report.mlaName}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{report.constituencyName ?? "MLA"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Authority Action Panel */}
            {isAuthority && availableTransitions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-blue-900">Authority Actions</h3>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      className="w-full h-10 appearance-none rounded-xl border border-blue-200 bg-white px-3 pr-10 text-sm outline-none"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="">— Select action —</option>
                      {availableTransitions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>

                  {selectedStatus === "RESOLVED_PENDING_VERIFICATION" && (
                    <label className="block rounded-xl border-2 border-dashed border-blue-200 p-3 bg-blue-50/50">
                      <span className="flex items-center gap-1 font-bold text-blue-700 text-xs mb-1">
                        <Upload size={13} /> Fix Photo (required)
                      </span>
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => setFixPhotoFile(e.target.files?.[0] ?? null)}
                        className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-sm"
                      />
                      {fixPhotoPreview && (
                        <div className="mt-2 overflow-hidden rounded-lg">
                          <img src={fixPhotoPreview} alt="Fix preview" className="h-32 w-full object-cover" />
                        </div>
                      )}
                    </label>
                  )}

                  {selectedStatus === "REJECTED" && (
                    <textarea
                      className="w-full min-h-[70px] rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection (will be public)..."
                    />
                  )}

                  <input
                    className="w-full h-9 rounded-xl border border-blue-200 bg-white px-3 text-sm outline-none"
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Optional note..."
                  />

                  {actionError && <p className="text-xs text-red-600 font-medium">{actionError}</p>}

                  <button
                    onClick={handleStatusUpdate}
                    disabled={!selectedStatus || actionLoading}
                    className="w-full h-10 bg-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-50"
                  >
                    {actionLoading ? "Updating..." : "Submit Update"}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Actions</h3>
              <div className="space-y-2">
                <button className="w-full py-2.5 bg-green-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                  <Share2 size={15} /> Share Report
                </button>
                <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2">
                  <Flag size={15} /> Report Error
                </button>
                <button className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/20">
                  <AlertTriangle size={15} /> Escalate Issue
                </button>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={13} /> Comments
                </h3>
                <span className="text-[10px] font-bold text-slate-400">{comments.length}</span>
              </div>

              {comments.length > 0 && (
                <div className="space-y-3 mb-4">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-xl border px-3 py-2.5 ${c.isOfficial ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-slate-50"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{c.user.name}</span>
                        {c.isOfficial && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">
                            Official
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {comments.length === 0 && (
                <p className="text-xs text-slate-400 mb-4">No comments yet. Be the first.</p>
              )}

              {user && (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    className="flex-1 h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-medium outline-none focus:border-green-400 transition-colors"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !commentText.trim()}
                    className="w-9 h-9 bg-green-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
