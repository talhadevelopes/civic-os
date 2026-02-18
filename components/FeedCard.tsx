"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { useState } from "react";

type FeedCardProps = {
  id: string;
  title: string;
  areaName: string;
  category: string;
  status: string;
  upvoteCount: number;
  commentCount: number;
  imgSrc: string | null;
  isEscalated: boolean;
  userUpvoted?: boolean;
};

const STATUS_CLASS: Record<string, string> = {
  REPORTED: "status-reported",
  ASSIGNED: "status-assigned",
  IN_PROGRESS: "status-inprogress",
  RESOLVED_PENDING_VERIFICATION: "status-pending",
  CONFIRMED_FIXED: "status-confirmed",
  REOPENED: "status-reopened",
  REJECTED: "status-rejected",
};

const STATUS_LABEL: Record<string, string> = {
  REPORTED: "Reported",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED_PENDING_VERIFICATION: "Awaiting Approval",
  CONFIRMED_FIXED: "Confirmed Fixed",
  REOPENED: "Reopened",
  REJECTED: "Rejected",
};

export default function FeedCard({
  id,
  title,
  areaName,
  category,
  status,
  upvoteCount: initialUpvote,
  commentCount,
  imgSrc,
  isEscalated,
  userUpvoted: initialUpvoted = false,
}: FeedCardProps) {
  const [upvoteCount, setUpvoteCount] = useState(initialUpvote);
  const [userUpvoted, setUserUpvoted] = useState(initialUpvoted);

  async function handleUpvote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(`/api/reports/${id}/upvote`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setUserUpvoted(data.upvoted);
      setUpvoteCount(data.upvoteCount);
    }
  }

  const sc = STATUS_CLASS[status] ?? "";

  return (
    <Link
      href={`/reports/${id}`}
      className="flex gap-4 rounded-2xl border p-4 transition hover:border-green-300"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div
        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border"
        style={{ background: "var(--primary-light)", borderColor: "var(--border)" }}
      >
        {imgSrc ? <img src={imgSrc} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc}`}>
            {STATUS_LABEL[status] ?? status.replace(/_/g, " ")}
          </span>
          {isEscalated && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: "#fef2f2", color: "#dc2626" }}
            >
              Escalated
            </span>
          )}
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {areaName} · {category.replaceAll("_", " ")}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleUpvote}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
            style={{
              background: userUpvoted ? "var(--primary-mint)" : "transparent",
              color: userUpvoted ? "var(--primary)" : "var(--text-muted)",
              borderColor: userUpvoted ? "var(--primary-border)" : "var(--border)",
            }}
          >
            <ArrowUp className="h-3.5 w-3.5" />
            {upvoteCount}
          </button>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {commentCount} comments
          </span>
        </div>
      </div>
    </Link>
  );
}
