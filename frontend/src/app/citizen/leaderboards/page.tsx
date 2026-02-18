"use client";

import { useState } from "react";
import { useUserDetails } from "@/lib/cache";
import { Filter } from "lucide-react";

export default function Leaderboard() {
  const [filterStatus, setFilterStatus] = useState<"RESOLVED" | "IN_PROGRESS" | "PENDING" | "ALL">("ALL");
  const email = typeof window !== "undefined" ? localStorage.getItem("email") : null;
  const { data: citizen, isLoading, error } = useUserDetails(email!);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b82f6]"></div>
      </div>
    );
  }

  if (error || !citizen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-2">Error loading leaderboard</p>
          <p className="text-[#a1a1aa] text-sm">{error?.message || "No data found"}</p>
        </div>
      </div>
    );
  }

  // Group issues by MLA and compute stats
  const mlaStats = citizen.issues.filter(issue => issue.mla !== null).reduce((acc, issue) => {
    const mlaId = issue.mla!.id;
    if (!acc[mlaId]) {
      acc[mlaId] = {
        mla: issue.mla,
        total: 0,
        resolved: 0,
        inProgress: 0,
        pending: 0,
      };
    }
    acc[mlaId].total++;
    if (issue.status === "RESOLVED") acc[mlaId].resolved++;
    else if (issue.status === "IN_PROGRESS") acc[mlaId].inProgress++;
    else if (issue.status === "PENDING") acc[mlaId].pending++;
    return acc;
  }, {} as Record<string, {
    mla: typeof citizen.issues[0]["mla"];
    total: number;
    resolved: number;
    inProgress: number;
    pending: number;
  }>);

  // Prepare leaderboard, sorted by resolved count
  const leaderboard = Object.values(mlaStats)
    .sort((a, b) => b.resolved - a.resolved)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Filter by user selection
  const filteredLeaderboard =
    filterStatus === "ALL"
      ? leaderboard
      : leaderboard.filter((item) => {
          if (filterStatus === "RESOLVED") return item.resolved > 0;
          if (filterStatus === "IN_PROGRESS") return item.inProgress > 0;
          if (filterStatus === "PENDING") return item.pending > 0;
          return true;
        });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <main className="pt-24 pb-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">MLA Leaderboard</h1>
            <p className="text-[#a1a1aa] text-sm">MLAs ranked by issues resolved</p>
          </div>

          {/* Filter Buttons - Dashboard style */}
          <div className="flex gap-2 mb-8 flex-wrap">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`rounded-[10px] px-5 h-[44px] border font-semibold text-sm transition-colors
                ${filterStatus === "ALL" ? "bg-[#3b82f6] text-white border-[#3b82f6]" : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:bg-[#3b82f614]"}
              `}
            >
              <Filter className="inline mr-2" size={16} /> All
            </button>
            <button
              onClick={() => setFilterStatus("RESOLVED")}
              className={`rounded-[10px] px-5 h-[44px] border font-semibold text-sm transition-colors
                ${filterStatus === "RESOLVED" ? "bg-[#10b981] text-white border-[#10b981]" : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:bg-[#10b98114]"}
              `}
            >
              Fixed
            </button>
            <button
              onClick={() => setFilterStatus("IN_PROGRESS")}
              className={`rounded-[10px] px-5 h-[44px] border font-semibold text-sm transition-colors
                ${filterStatus === "IN_PROGRESS" ? "bg-[#eab308] text-white border-[#eab308]" : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:bg-[#eab30814]"}
              `}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilterStatus("PENDING")}
              className={`rounded-[10px] px-5 h-[44px] border font-semibold text-sm transition-colors
                ${filterStatus === "PENDING" ? "bg-[#f97316] text-white border-[#f97316]" : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:bg-[#f9731614]"}
              `}
            >
              Pending
            </button>
          </div>

          {/* Leaderboard Cards (Dash-style layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredLeaderboard.map((item) => (
              <div
                key={item.mla?.id}
                className="bg-[#18181b] border border-[#27272a] rounded-[10px] p-5 hover:border-[#3f3f46] transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center gap-4 mb-4">
                  {/* Rank Badge */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl
                      ${item.rank === 1
                        ? "bg-yellow-500"
                        : item.rank === 2
                        ? "bg-gray-400"
                        : item.rank === 3
                        ? "bg-orange-600"
                        : "bg-[#3b82f6]"}
                    `}
                  >
                    {item.rank}
                  </div>
                  {/* MLA Info */}
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight ">{item.mla?.name}</h3>
                    <p className="text-xs text-[#a1a1aa] font-medium mt-1">{item.mla?.party}</p>
                  </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  <div>
                    <p className="text-2xl font-bold text-[#10b981]">{item.resolved}</p>
                    <p className="text-xs text-[#a1a1aa]">Fixed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#eab308]">{item.inProgress}</p>
                    <p className="text-xs text-[#a1a1aa]">In Progress</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#f97316]">{item.pending}</p>
                    <p className="text-xs text-[#a1a1aa]">Pending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#3b82f6]">{item.total}</p>
                    <p className="text-xs text-[#a1a1aa]">Total</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLeaderboard.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#a1a1aa]">No MLAs found for this filter.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


