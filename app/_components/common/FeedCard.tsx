"use client";

import Link from "next/link";
import { ArrowUp, FileText, MapPin, MessageSquare, ChevronRight } from "lucide-react";
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
      className="flex flex-col rounded-3xl border overflow-hidden transition-all hover:border-green-400 hover:shadow-2xl hover:shadow-green-900/10 group no-underline"
      style={{ background: "white", borderColor: "var(--border)" }}
    >
      {/* Image Top Half */}
      <div
        className="h-56 w-full shrink-0 overflow-hidden bg-gray-50 relative"
      >
        {imgSrc ? (
          <img src={imgSrc} alt={title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-green-50/30">
            <FileText className="text-green-600/20" size={40} />
          </div>
        )}
        
        {/* Status Badge Over Image */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-lg ${sc}`}>
            {STATUS_LABEL[status] ?? status.replace(/_/g, " ")}
          </span>
          {isEscalated && (
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-lg bg-red-600 text-white"
            >
              Escalated
            </span>
          )}
        </div>
      </div>

      {/* Content Bottom Half */}
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-green-600 transition-colors">
            {title}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <MapPin size={12} className="text-gray-400" />
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              {areaName}
            </p>
          </div>
        </div>

        <p className="text-xs font-medium text-gray-500 mb-6">
          Category: <span className="text-gray-900 font-bold">{category.replaceAll("_", " ")}</span>
        </p>

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleUpvote}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                userUpvoted 
                ? "bg-green-600 text-white shadow-md shadow-green-600/20" 
                : "bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600 border border-gray-100"
              }`}
            >
              <ArrowUp className={`h-3.5 w-3.5 ${userUpvoted ? "animate-bounce" : ""}`} />
              {upvoteCount}
            </button>
            <div className="flex items-center gap-1.5 text-gray-400">
              <MessageSquare size={14} />
              <span className="text-[11px] font-bold">{commentCount}</span>
            </div>
          </div>
          
          <div className="text-green-600">
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
