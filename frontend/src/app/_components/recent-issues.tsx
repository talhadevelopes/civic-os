"use client";

import { motion } from "framer-motion";
import { BarChart3, MapPin } from "lucide-react";
import type { Issue } from "@/lib/cache";

export default function Issues({ recentIssues }: { recentIssues: Issue[] }) {
  const severityClasses = {
    CRITICAL: "bg-[#ef444414] text-[#ef4444] border border-[#ef4444]",
    HIGH: "bg-[#f9731614] text-[#f97316] border border-[#f97316]",
    MEDIUM: "bg-[#eab30814] text-[#eab308] border border-[#eab308]",
    LOW: "bg-[#10b98114] text-[#10b981] border border-[#10b981]",
  } as const;
  const statusClasses = {
    RESOLVED: "bg-[#10b98114] text-[#10b981] border border-[#10b981]",
    IN_PROGRESS: "bg-[#3b82f614] text-[#3b82f6] border border-[#3b82f6]",
    REJECTED: "bg-[#ef444414] text-[#ef4444] border border-[#ef4444]",
    PENDING: "bg-[#71717a14] text-[#71717a] border border-[#71717a]",
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-[#18181b] border border-[#27272a] rounded-[12px] p-6 shadow-md"
      style={{ color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 style={{ color: "#3b82f6" }} size={24} />
        <h2 className="text-xl font-bold" style={{ color: "#fff" }}>
          Your Recent Issues
        </h2>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {recentIssues.length === 0 ? (
          <p className="text-center py-8" style={{ color: "#71717a" }}>
            No issues reported yet
          </p>
        ) : (
          recentIssues.map((issue) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="border border-[#27272a] rounded-[10px] p-4 hover:bg-[#23232b] transition"
              style={{ background: "#18181b" }}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-base" style={{ color: "#fff" }}>
                    {issue.title}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "#a1a1aa" }}>
                    {issue.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-[6px] font-medium" style={{ background: "#27272a", color: "#d4d4d8", border: "1px solid #3f3f46" }}>
                      {issue.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-[6px] font-semibold ${severityClasses[issue.severity]}`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-sm mt-2 flex items-center gap-1" style={{ color: "#a1a1aa" }}>
                    <MapPin size={14} />
                    <span className="line-clamp-1">{issue.location}</span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#71717a" }}>
                    Reported: {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusClasses[issue.status]}`}
                  style={{ textTransform: "capitalize" }}
                >
                  {issue.status.replace("_", " ")}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <button
        className="w-full mt-6 py-2 border border-[#27272a] rounded-lg hover:bg-[#23232b] transition font-medium"
        style={{ color: "#3b82f6", background: "transparent" }}
      >
        View All Issues
      </button>
    </motion.div>
  );
}
