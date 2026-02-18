"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, User, X, Filter, ArrowUp } from "lucide-react";
import { Navbar } from "@/app/_components/navbar";
import { useRouter } from "next/navigation";

interface Citizen {
  id: string;
  name: string;
  email: string;
  constituency: string;
}

interface MLA {
  id: string;
  name: string;
  party: string;
  constituency: string;
  email: string;
  phone: string | null;
  rating: number | null;
}

interface MapIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  mediaUrl: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  citizenId: string;
  mlaId: string | null;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
  citizen: Citizen;
  mla: MLA | null;
  organization: any | null;
  upvoteCount?: number;
}

export default function MapView() {
  const router = useRouter();
  const [selectedIssue, setSelectedIssue] = useState<MapIssue | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [issues, setIssues] = useState<MapIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://civiciobackend.vercel.app/api/v1/citizen/issues"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }

      const data = await response.json();

      if (data.success) {
        // Filter out issues without coordinates
        const issuesWithCoords = data.issues.filter(
          (issue: MapIssue) => issue.latitude && issue.longitude
        );
        setIssues(issuesWithCoords);
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    const statusMatch = filterStatus === "all" || issue.status === filterStatus;
    const severityMatch =
      filterSeverity === "all" || issue.severity === filterSeverity;
    return statusMatch && severityMatch;
  });

  useEffect(() => {
    if (typeof window === "undefined" || loading || filteredIssues.length === 0)
      return;

    if (!mapReady) {
      import("leaflet").then((L) => {
        const map = L.default.map("map").setView([17.385, 78.4867], 12);
        L.default
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
          })
          .addTo(map);

        filteredIssues.forEach((issue) => {
          if (!issue.latitude || !issue.longitude) return;

          const color =
            issue.status === "PENDING"
              ? "#EAB308"
              : issue.status === "IN_PROGRESS"
              ? "#9333EA"
              : "#22C55E";

          const marker = L.default
            .circleMarker([issue.latitude, issue.longitude], {
              radius: 10,
              fillColor: color,
              color: color,
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8,
            })
            .bindPopup(`<b>${issue.title}</b><br>${issue.location}`)
            .addTo(map);

          marker.on("click", () => setSelectedIssue(issue));
        });

        setMapReady(true);
      });
    }
  }, [mapReady, loading, filteredIssues]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewDetails = () => {
    if (selectedIssue) {
      router.push(`/global-issues/${selectedIssue.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-black">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading issues...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      <Navbar />

      <main className="flex-1 pt-20">
        <div className="h-[calc(100vh-80px)] flex">
          <div
            id="map"
            className="flex-1 relative"
            style={{ height: "100%" }}
          ></div>

          {/* Sidebar */}
          <div className="w-80 bg-white dark:bg-neutral-900 border-l border-neutral-300 dark:border-neutral-700 flex flex-col max-h-[calc(100vh-80px)] shadow-lg">
            {/* Filters */}
            <div className="p-6 border-b border-neutral-300 dark:border-neutral-700 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={20} className="text-blue-600" />
                <h2 className="font-semibold text-neutral-900 dark:text-white">
                  Filters
                </h2>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2 text-neutral-900 dark:text-white">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-sm text-neutral-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2 text-neutral-900 dark:text-white">
                  Severity
                </label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-sm text-neutral-900 dark:text-white"
                >
                  <option value="all">All Severity</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            {/* Issues List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {filteredIssues.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-8">
                  No issues found
                </p>
              ) : (
                filteredIssues.map((issue) => (
                  <motion.button
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    whileHover={{ x: 4 }}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedIssue?.id === issue.id
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-600 text-neutral-900 dark:text-white"
                        : "bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2 flex-wrap">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          issue.severity === "CRITICAL"
                            ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                            : issue.severity === "HIGH"
                            ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                            : issue.severity === "MEDIUM"
                            ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                            : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {issue.status}
                      </span>
                      {issue.upvoteCount !== undefined && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <ArrowUp size={12} />
                          {issue.upvoteCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold line-clamp-2 text-neutral-900 dark:text-white">
                      {issue.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {issue.citizen.constituency}
                    </p>
                  </motion.button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Issue Detail Modal */}
        {selectedIssue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 pt-20"
            onClick={() => setSelectedIssue(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {selectedIssue.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {selectedIssue.category}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {selectedIssue.mediaUrl && (
                <img
                  src={selectedIssue.mediaUrl}
                  alt={selectedIssue.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-neutral-900 dark:text-white">
                  <MapPin size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{selectedIssue.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-900 dark:text-white">
                  <User size={16} className="text-blue-600" />
                  <span>
                    {selectedIssue.citizen.name} ({selectedIssue.citizen.constituency})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-900 dark:text-white">
                  <Clock size={16} className="text-blue-600" />
                  <span>{formatDate(selectedIssue.createdAt)}</span>
                </div>
                {selectedIssue.upvoteCount !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-neutral-900 dark:text-white">
                    <ArrowUp size={16} className="text-blue-600" />
                    <span>{selectedIssue.upvoteCount} Upvotes</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2 flex-wrap">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                      selectedIssue.status === "PENDING"
                        ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                        : selectedIssue.status === "IN_PROGRESS"
                        ? "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                        : "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                    }`}
                  >
                    {selectedIssue.status.replace("_", " ")}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      selectedIssue.severity === "CRITICAL"
                        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"
                        : selectedIssue.severity === "HIGH"
                        ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950"
                        : selectedIssue.severity === "MEDIUM"
                        ? "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950"
                        : "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950"
                    }`}
                  >
                    {selectedIssue.severity}
                  </span>
                </div>
              </div>

              <button
                onClick={handleViewDetails}
                className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                View Full Details
              </button>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}