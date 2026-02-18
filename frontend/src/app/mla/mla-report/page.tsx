"use client"

import { useState } from "react"

import { motion } from "framer-motion"
import { CheckCircle, Clock, BarChart3 } from "lucide-react"
import { Navbar } from "@/app/_components/navbar"

interface MLAData {
  id: string
  name: string
  constituency: string
  party: string
  contact: string
  image: string
  performanceScore: number
  issuesResolved: number
  issuesPending: number
  averageResolutionTime: number
  responseRate: number
  categories: {
    name: string
    resolved: number
    total: number
  }[]
}

const mockMLAs: MLAData[] = [
  {
    id: "1",
    name: "Shri. Rajesh Kumar",
    constituency: "Jubilee Hills",
    party: "Party A",
    contact: "rajesh@mla.gov.in",
    image: "/indian-political-leader-professional-photo.jpg",
    performanceScore: 8.5,
    issuesResolved: 156,
    issuesPending: 24,
    averageResolutionTime: 8,
    responseRate: 92,
    categories: [
      { name: "Road Damage", resolved: 42, total: 45 },
      { name: "Water Supply", resolved: 38, total: 40 },
      { name: "Street Lights", resolved: 35, total: 38 },
      { name: "Drainage", resolved: 26, total: 32 },
      { name: "Others", resolved: 15, total: 18 },
    ],
  },
  {
    id: "2",
    name: "Smt. Priya Singh",
    constituency: "Banjara Hills",
    party: "Party B",
    contact: "priya@mla.gov.in",
    image: "/indian-female-political-leader-professional.jpg",
    performanceScore: 7.8,
    issuesResolved: 128,
    issuesPending: 35,
    averageResolutionTime: 11,
    responseRate: 87,
    categories: [
      { name: "Road Damage", resolved: 35, total: 40 },
      { name: "Water Supply", resolved: 30, total: 38 },
      { name: "Street Lights", resolved: 28, total: 35 },
      { name: "Drainage", resolved: 22, total: 30 },
      { name: "Others", resolved: 13, total: 17 },
    ],
  },
  {
    id: "3",
    name: "Shri. Amit Patel",
    constituency: "Hitech City",
    party: "Party C",
    contact: "amit@mla.gov.in",
    image: "/indian-political-leader-professional-headshot.jpg",
    performanceScore: 6.9,
    issuesResolved: 92,
    issuesPending: 58,
    averageResolutionTime: 14,
    responseRate: 78,
    categories: [
      { name: "Road Damage", resolved: 25, total: 38 },
      { name: "Water Supply", resolved: 20, total: 35 },
      { name: "Street Lights", resolved: 18, total: 32 },
      { name: "Drainage", resolved: 15, total: 28 },
      { name: "Others", resolved: 14, total: 22 },
    ],
  },
]

export default function MLAReportCards() {
  const [selectedMLA, setSelectedMLA] = useState<MLAData | null>(null)
  const [sortBy, setSortBy] = useState<"score" | "resolved" | "pending">("score")

  const sortedMLAs = [...mockMLAs].sort((a, b) => {
    switch (sortBy) {
      case "score":
        return b.performanceScore - a.performanceScore
      case "resolved":
        return b.issuesResolved - a.issuesResolved
      case "pending":
        return a.issuesPending - b.issuesPending
      default:
        return 0
    }
  })

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400"
    if (score >= 7) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
    if (score >= 7) return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
    return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">MLA Performance Report Cards</h1>
              <p className="text-muted-foreground">Transparent accountability for your elected representatives</p>
            </div>

            {/* Sort Options */}
            <div className="flex gap-3 mb-8">
              {[
                { value: "score", label: "Top Performers" },
                { value: "resolved", label: "Most Resolved" },
                { value: "pending", label: "Most Pending" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as typeof sortBy)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    sortBy === option.value
                      ? "bg-primary-dark-blue text-white"
                      : "bg-card border border-border hover:bg-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* MLA Cards Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {sortedMLAs.map((mla, idx) => (
                <motion.div
                  key={mla.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedMLA(mla)}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer group"
                >
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <img
                        src="/professional-headshot.png"
                        alt={mla.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{mla.name}</h3>
                        <p className="text-sm text-muted-foreground">{mla.constituency}</p>
                        <p className="text-xs text-primary-dark-blue font-semibold mt-1">{mla.party}</p>
                      </div>
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-2 ${getScoreBg(
                          mla.performanceScore,
                        )} ${getScoreColor(mla.performanceScore)}`}
                      >
                        {mla.performanceScore}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center border border-green-200 dark:border-green-800">
                        <div className="flex justify-center mb-1">
                          <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                        </div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{mla.issuesResolved}</p>
                        <p className="text-xs text-green-700 dark:text-green-300">Resolved</p>
                      </div>

                      <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
                        <div className="flex justify-center mb-1">
                          <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
                        </div>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{mla.issuesPending}</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">Pending</p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                        <div className="flex justify-center mb-1">
                          <BarChart3 className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mla.responseRate}%</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Response Rate</p>
                      </div>
                    </div>

                    {/* Performance Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold">Overall Performance</span>
                        <span className="text-xs text-muted-foreground">
                          Avg Resolution: {mla.averageResolutionTime} days
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary-dark-blue h-2 rounded-full transition-all"
                          style={{ width: `${(mla.performanceScore / 10) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    <button className="w-full py-2 bg-primary-dark-blue/10 text-primary-dark-blue font-semibold rounded-lg hover:bg-primary-dark-blue/20 transition group-hover:bg-primary-dark-blue group-hover:text-white">
                      View Full Report
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Details Modal */}
            {selectedMLA && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 pt-20"
                onClick={() => setSelectedMLA(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-8 space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <img
                          src="/professional-headshot.png"
                          alt={selectedMLA.name}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                        <div>
                          <h2 className="text-3xl font-bold">{selectedMLA.name}</h2>
                          <p className="text-muted-foreground">{selectedMLA.constituency}</p>
                          <p className="text-primary-dark-blue font-semibold mt-2">{selectedMLA.party}</p>
                          <p className="text-sm text-muted-foreground mt-2">Email: {selectedMLA.contact}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedMLA(null)}
                        className="text-muted-foreground hover:text-foreground text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm text-green-700 dark:text-green-300 font-semibold">Issues Resolved</p>
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                          {selectedMLA.issuesResolved}
                        </p>
                      </div>

                      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 font-semibold">Issues Pending</p>
                        <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                          {selectedMLA.issuesPending}
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">Avg Resolution Time</p>
                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                          {selectedMLA.averageResolutionTime}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">days</p>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <p className="text-sm text-purple-700 dark:text-purple-300 font-semibold">Response Rate</p>
                        <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                          {selectedMLA.responseRate}%
                        </p>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">Issue Category Performance</h3>
                      <div className="space-y-3">
                        {selectedMLA.categories.map((cat) => (
                          <div key={cat.name}>
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-semibold">{cat.name}</p>
                              <span className="text-sm text-muted-foreground">
                                {cat.resolved} / {cat.total}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary-dark-blue h-2 rounded-full transition-all"
                                style={{ width: `${(cat.resolved / cat.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Score */}
                    <div className={`rounded-lg p-6 border text-center ${getScoreBg(selectedMLA.performanceScore)}`}>
                      <p className="text-sm font-semibold mb-2">Overall Performance Score</p>
                      <p className={`text-5xl font-bold ${getScoreColor(selectedMLA.performanceScore)}`}>
                        {selectedMLA.performanceScore} / 10
                      </p>
                      <p className="text-sm mt-3 text-foreground">
                        {selectedMLA.performanceScore >= 8
                          ? "Excellent performance in resolving citizen issues"
                          : selectedMLA.performanceScore >= 7
                            ? "Good performance with room for improvement"
                            : "Needs significant improvement in issue resolution"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

    </div>
  )
}
