"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, User, X, Filter } from "lucide-react";
import { Navbar } from "@/app/_components/navbar";

interface MapIssue {
  id: string;
  title: string;
  category: string;
  status: "pending" | "assigned" | "in-progress" | "resolved";
  priority: "low" | "medium" | "high";
  area: string;
  lat: number;
  lng: number;
  reporter: string;
  createdAt: string;
}

const mockMapIssues: MapIssue[] = [
  {
    id: "001",
    title: "Large Pothole",
    category: "Pothole",
    status: "pending",
    priority: "high",
    area: "Jubilee Hills",
    lat: 17.3699,
    lng: 78.4522,
    reporter: "Rajesh Kumar",
    createdAt: "2024-11-07",
  },
  {
    id: "002",
    title: "Broken Street Light",
    category: "Street Light",
    status: "assigned",
    priority: "medium",
    area: "Banjara Hills",
    lat: 17.3839,
    lng: 78.4543,
    reporter: "Priya Singh",
    createdAt: "2024-11-06",
  },
  {
    id: "003",
    title: "Water Leakage",
    category: "Water Supply",
    status: "in-progress",
    priority: "high",
    area: "Hitech City",
    lat: 17.3609,
    lng: 78.3488,
    reporter: "Amit Patel",
    createdAt: "2024-11-05",
  },
  {
    id: "004",
    title: "Drainage Blocked",
    category: "Drainage",
    status: "resolved",
    priority: "medium",
    area: "Gachibowli",
    lat: 17.4406,
    lng: 78.3505,
    reporter: "Sarah Ahmed",
    createdAt: "2024-11-04",
  },
  {
    id: "005",
    title: "Traffic Congestion",
    category: "Traffic",
    status: "pending",
    priority: "medium",
    area: "Kukatpally",
    lat: 17.4789,
    lng: 78.4343,
    reporter: "Vikram Singh",
    createdAt: "2024-11-03",
  },
];

export default function MapView() {
  const [selectedIssue, setSelectedIssue] = useState<MapIssue | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [issues] = useState<MapIssue[]>(mockMapIssues);
  const [mapReady, setMapReady] = useState(false);

  const filteredIssues = issues.filter((issue) => {
    const statusMatch = filterStatus === "all" || issue.status === filterStatus;
    const priorityMatch =
      filterPriority === "all" || issue.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    if (!mapReady) {
      // Dynamically import Leaflet
      import("leaflet").then((L) => {
        const map = L.default.map("map").setView([17.385, 78.4867], 12);
        L.default
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
          })
          .addTo(map);

        filteredIssues.forEach((issue) => {
          const color =
            issue.status === "pending"
              ? "#EAB308"
              : issue.status === "assigned"
              ? "#3B82F6"
              : issue.status === "in-progress"
              ? "#9333EA"
              : "#22C55E";

          const marker = L.default
            .circleMarker([issue.lat, issue.lng], {
              radius: 10,
              fillColor: color,
              color: color,
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8,
            })
            .bindPopup(`<b>${issue.title}</b><br>${issue.area}`)
            .addTo(map);

          marker.on("click", () => setSelectedIssue(issue));
        });

        setMapReady(true);
      });
    }
  }, [mapReady]);

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
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2 text-neutral-900 dark:text-white">
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-sm text-neutral-900 dark:text-white"
                >
                  <option value="all">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
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
                    <div className="flex items-start gap-2 mb-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          issue.priority === "high"
                            ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                            : issue.priority === "medium"
                            ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                            : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        }`}
                      >
                        {issue.priority.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {issue.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold line-clamp-2 text-neutral-900 dark:text-white">
                      {issue.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {issue.area}
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

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-neutral-900 dark:text-white">
                  <MapPin size={16} className="text-blue-600" />
                  <span>{selectedIssue.area}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-900 dark:text-white">
                  <User size={16} className="text-blue-600" />
                  <span>{selectedIssue.reporter}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-900 dark:text-white">
                  <Clock size={16} className="text-blue-600" />
                  <span>{selectedIssue.createdAt}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                      selectedIssue.status === "pending"
                        ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                        : selectedIssue.status === "assigned"
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                        : selectedIssue.status === "in-progress"
                        ? "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                        : "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                    }`}
                  >
                    {selectedIssue.status}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      selectedIssue.priority === "high"
                        ? "text-red-600 dark:text-red-400"
                        : selectedIssue.priority === "medium"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {selectedIssue.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                View Details
              </button>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
