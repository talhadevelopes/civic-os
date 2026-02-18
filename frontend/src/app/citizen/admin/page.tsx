"use client"

import { useState } from "react"

import { motion } from "framer-motion"
import { ChevronDown, Clock, User, MapPin } from "lucide-react"
import { Navbar } from "@/app/_components/navbar"
import { Footer } from "@/app/_components/footer"

interface Issue {
  id: string
  title: string
  category: string
  area: string
  status: "pending" | "assigned" | "in-progress" | "resolved"
  priority: "low" | "medium" | "high"
  reporter: string
  assignedTo?: string
  createdAt: string
  description: string
}

const mockIssues: Issue[] = [
  {
    id: "001",
    title: "Large Pothole on Main Street",
    category: "Pothole",
    area: "Jubilee Hills",
    status: "pending",
    priority: "high",
    reporter: "Rajesh Kumar",
    createdAt: "2024-11-07",
    description: "Deep pothole causing traffic hazard",
  },
  {
    id: "002",
    title: "Broken Street Light",
    category: "Street Light",
    area: "Banjara Hills",
    status: "assigned",
    priority: "medium",
    reporter: "Priya Singh",
    assignedTo: "Maintenance Team A",
    createdAt: "2024-11-06",
    description: "Non-functional street light on 5th Avenue",
  },
  {
    id: "003",
    title: "Water Leakage",
    category: "Water Supply",
    area: "Hitech City",
    status: "in-progress",
    priority: "high",
    reporter: "Amit Patel",
    assignedTo: "Water Board",
    createdAt: "2024-11-05",
    description: "Major water leakage from main pipeline",
  },
  {
    id: "004",
    title: "Drainage Blocked",
    category: "Drainage",
    area: "Gachibowli",
    status: "resolved",
    priority: "medium",
    reporter: "Sarah Ahmed",
    assignedTo: "Drainage Department",
    createdAt: "2024-11-04",
    description: "Blocked drainage causing flooding",
  },
]

const authorities = ["Maintenance Team A", "Maintenance Team B", "Water Board", "Drainage Department", "Traffic Police"]

export default function AdminDashboard() {
  const [issues, setIssues] = useState<Issue[]>(mockIssues)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")

  const filteredIssues = issues.filter((issue) => {
    const statusMatch = filterStatus === "all" || issue.status === filterStatus
    const priorityMatch = filterPriority === "all" || issue.priority === filterPriority
    return statusMatch && priorityMatch
  })

  const updateIssueStatus = (id: string, newStatus: Issue["status"]) => {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, status: newStatus } : issue)))
  }

  const assignIssue = (id: string, authority: string) => {
    setIssues((prev) =>
      prev.map((issue) => (issue.id === id ? { ...issue, assignedTo: authority, status: "assigned" } : issue)),
    )
  }

  const getStatusColor = (status: Issue["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
      case "assigned":
        return "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      case "in-progress":
        return "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
      case "resolved":
        return "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
    }
  }

  const getPriorityColor = (priority: Issue["priority"]) => {
    switch (priority) {
      case "low":
        return "text-green-600 dark:text-green-400"
      case "medium":
        return "text-yellow-600 dark:text-yellow-400"
      case "high":
        return "text-red-600 dark:text-red-400"
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Authority Dashboard</h1>
              <p className="text-muted-foreground">Manage and resolve civic issues</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Pending",
                  value: issues.filter((i) => i.status === "pending").length,
                  color: "text-yellow-600 dark:text-yellow-400",
                },
                {
                  label: "Assigned",
                  value: issues.filter((i) => i.status === "assigned").length,
                  color: "text-blue-600 dark:text-blue-400",
                },
                {
                  label: "In Progress",
                  value: issues.filter((i) => i.status === "in-progress").length,
                  color: "text-purple-600 dark:text-purple-400",
                },
                {
                  label: "Resolved",
                  value: issues.filter((i) => i.status === "resolved").length,
                  color: "text-green-600 dark:text-green-400",
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-lg p-6">
                  <p className="text-muted-foreground text-sm mb-2">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-input border border-border rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 bg-input border border-border rounded-lg text-sm"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Issues List */}
            <div className="space-y-4">
              {filteredIssues.map((issue, idx) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === issue.id ? null : issue.id)}
                    className="w-full p-6 text-left hover:bg-muted/50 transition flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{issue.title}</h3>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusColor(issue.status)}`}
                        >
                          {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                        </span>
                        <span className={`text-xs font-bold ${getPriorityColor(issue.priority)}`}>
                          {issue.priority.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          {issue.area}
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={16} />
                          {issue.reporter}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          {issue.createdAt}
                        </div>
                      </div>
                    </div>

                    <ChevronDown
                      size={24}
                      className={`text-muted-foreground transition-transform ${expandedId === issue.id ? "rotate-180" : ""}`}
                    />
                  </button>

                  {expandedId === issue.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border bg-muted/30 p-6 space-y-4"
                    >
                      <div>
                        <p className="text-sm font-semibold mb-2">Description</p>
                        <p className="text-muted-foreground">{issue.description}</p>
                      </div>

                      {issue.assignedTo && (
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Assigned to:</strong> {issue.assignedTo}
                          </p>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold block mb-2">Assign To Authority</label>
                          <select
                            value={issue.assignedTo || ""}
                            onChange={(e) => assignIssue(issue.id, e.target.value)}
                            className="w-full px-4 py-2 bg-input border border-border rounded-lg text-sm"
                          >
                            <option value="">Select authority</option>
                            {authorities.map((auth) => (
                              <option key={auth} value={auth}>
                                {auth}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-semibold block mb-2">Update Status</label>
                          <select
                            value={issue.status}
                            onChange={(e) => updateIssueStatus(issue.id, e.target.value as Issue["status"])}
                            className="w-full px-4 py-2 bg-input border border-border rounded-lg text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="assigned">Assigned</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>
                      </div>

                      <button className="w-full bg-primary-dark-blue text-white py-2 rounded-lg font-semibold hover:bg-primary-dark-blue-light transition">
                        View Full Details
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
