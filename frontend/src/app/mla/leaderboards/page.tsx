"use client"

import { useState } from "react"

import { motion } from "framer-motion"
import { Trophy, Star, Target, Zap, TrendingUp, Award } from "lucide-react"
import { Navbar } from "@/app/_components/navbar"
import { Footer } from "@/app/_components/footer"

interface User {
  id: string
  name: string
  points: number
  issues_reported: number
  badges: Badge[]
  rank: number
}

interface Badge {
  id: string
  name: string
  icon: string
  description: string
  earnedAt: string
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Rajesh Kumar",
    points: 2850,
    issues_reported: 42,
    rank: 1,
    badges: [
      { id: "b1", name: "First Report", icon: "🎯", description: "Reported first issue", earnedAt: "2024-10-01" },
      { id: "b2", name: "Issue Master", icon: "⭐", description: "Reported 10+ issues", earnedAt: "2024-10-15" },
      { id: "b3", name: "Community Hero", icon: "🦸", description: "Reported 50+ issues", earnedAt: "2024-11-01" },
    ],
  },
  {
    id: "2",
    name: "Priya Singh",
    points: 2420,
    issues_reported: 38,
    rank: 2,
    badges: [
      { id: "b1", name: "First Report", icon: "🎯", description: "Reported first issue", earnedAt: "2024-09-15" },
      { id: "b2", name: "Issue Master", icon: "⭐", description: "Reported 10+ issues", earnedAt: "2024-10-01" },
    ],
  },
  {
    id: "3",
    name: "Amit Patel",
    points: 2150,
    issues_reported: 31,
    rank: 3,
    badges: [
      { id: "b1", name: "First Report", icon: "🎯", description: "Reported first issue", earnedAt: "2024-09-20" },
      { id: "b2", name: "Issue Master", icon: "⭐", description: "Reported 10+ issues", earnedAt: "2024-10-05" },
    ],
  },
  {
    id: "4",
    name: "Sarah Ahmed",
    points: 1980,
    issues_reported: 28,
    rank: 4,
    badges: [
      { id: "b1", name: "First Report", icon: "🎯", description: "Reported first issue", earnedAt: "2024-08-30" },
    ],
  },
  {
    id: "5",
    name: "Vikram Singh",
    points: 1750,
    issues_reported: 24,
    rank: 5,
    badges: [
      { id: "b1", name: "First Report", icon: "🎯", description: "Reported first issue", earnedAt: "2024-09-10" },
    ],
  },
]

const allBadges = [
  { id: "b1", name: "First Report", icon: "🎯", description: "Report your first issue", requirement: "1 report" },
  { id: "b2", name: "Issue Master", icon: "⭐", description: "Report 10+ civic issues", requirement: "10 reports" },
  { id: "b3", name: "Community Hero", icon: "🦸", description: "Report 50+ civic issues", requirement: "50 reports" },
  {
    id: "b4",
    name: "Quick Response",
    icon: "⚡",
    description: "Report resolved within 24h",
    requirement: "5 resolved",
  },
  {
    id: "b5",
    name: "Accuracy Star",
    icon: "🎖️",
    description: "All reports verified correct",
    requirement: "100% verified",
  },
  {
    id: "b6",
    name: "Consistency King",
    icon: "📈",
    description: "Report every week for month",
    requirement: "4 weeks",
  },
]

export default function Leaderboard() {
  const [currentUser] = useState<User>(mockUsers[0])
  const [tabView, setTabView] = useState<"leaderboard" | "badges">("leaderboard")

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Gamification & Rewards</h1>
              <p className="text-muted-foreground">Track your contributions and earn badges</p>
            </div>

            {/* Current User Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-gradient-to-br from-primary-dark-blue/10 to-primary-dark-blue/5 border border-primary-dark-blue/20 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                  <Trophy className="text-primary-dark-blue" size={20} />
                </div>
                <p className="text-3xl font-bold text-primary-dark-blue">#{currentUser.rank}</p>
              </motion.div>

              <motion.div whileHover={{ y: -4 }} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Points</p>
                  <Zap className="text-yellow-500" size={20} />
                </div>
                <p className="text-3xl font-bold">{currentUser.points}</p>
              </motion.div>

              <motion.div whileHover={{ y: -4 }} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Issues Reported</p>
                  <Target className="text-blue-500" size={20} />
                </div>
                <p className="text-3xl font-bold">{currentUser.issues_reported}</p>
              </motion.div>

              <motion.div whileHover={{ y: -4 }} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Badges Earned</p>
                  <Award className="text-purple-500" size={20} />
                </div>
                <p className="text-3xl font-bold">{currentUser.badges.length}</p>
              </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Progress to Next Badge</h3>
                  <p className="text-sm text-muted-foreground">Report 8 more issues to unlock "Issue Master"</p>
                </div>
                <Star className="text-yellow-500" size={28} />
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary-dark-blue h-2 rounded-full" style={{ width: "70%" }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">34 / 50 issues</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-border">
              <button
                onClick={() => setTabView("leaderboard")}
                className={`px-6 py-3 font-semibold border-b-2 transition ${
                  tabView === "leaderboard"
                    ? "border-primary-dark-blue text-primary-dark-blue"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="inline mr-2" size={20} />
                Leaderboard
              </button>
              <button
                onClick={() => setTabView("badges")}
                className={`px-6 py-3 font-semibold border-b-2 transition ${
                  tabView === "badges"
                    ? "border-primary-dark-blue text-primary-dark-blue"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Award className="inline mr-2" size={20} />
                Badges
              </button>
            </div>

            {/* Leaderboard View */}
            {tabView === "leaderboard" && (
              <div className="space-y-3">
                {mockUsers.map((user, idx) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-card border rounded-lg p-6 flex items-center justify-between hover:shadow-lg transition ${
                      user.id === currentUser.id ? "border-primary-dark-blue bg-primary-dark-blue/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                          user.rank === 1
                            ? "bg-yellow-500"
                            : user.rank === 2
                              ? "bg-gray-400"
                              : user.rank === 3
                                ? "bg-orange-600"
                                : "bg-primary-dark-blue"
                        }`}
                      >
                        {user.rank}
                      </div>

                      <div>
                        <h3 className="font-bold text-lg">
                          {user.name} {user.id === currentUser.id && "(You)"}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user.issues_reported} issues reported</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div className="flex gap-2">
                        {user.badges.map((badge) => (
                          <span key={badge.id} className="text-lg" title={badge.name}>
                            {badge.icon}
                          </span>
                        ))}
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary-dark-blue">{user.points}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Badges View */}
            {tabView === "badges" && (
              <div className="grid md:grid-cols-3 gap-6">
                {allBadges.map((badge, idx) => {
                  const earned = currentUser.badges.some((b) => b.id === badge.id)
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={`rounded-lg p-6 border text-center transition ${
                        earned
                          ? "bg-primary-dark-blue/10 border-primary-dark-blue shadow-lg"
                          : "bg-card border-border opacity-60"
                      }`}
                    >
                      <div className="text-5xl mb-4">{badge.icon}</div>
                      <h3 className="font-bold text-lg mb-2">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                      <p
                        className={`text-xs font-semibold px-3 py-1 rounded-full inline-block ${
                          earned
                            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {earned ? "Earned" : `${badge.requirement}`}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
