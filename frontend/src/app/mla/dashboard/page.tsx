"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/app/_components/navbar"
import { Footer } from "@/app/_components/footer"
import { motion } from "framer-motion"
import { LogOut, BarChart3, AlertCircle, CheckCircle, Clock, MapPin, TrendingUp, Mail, Phone } from "lucide-react"
import { useUserDetails } from "@/lib/cache/index"


export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string>("")  // Changed from null to empty string
  const [isClient, setIsClient] = useState(false)

  // ✅ Only access localStorage after mount
  useEffect(() => {
    setIsClient(true)
    const storedEmail = localStorage.getItem("email")
    const token = localStorage.getItem("token")
    const id = localStorage.getItem("id")
    
    if (storedEmail) {
      setEmail(storedEmail)  // This will trigger the query
    }
    
    if (!token || !id) {
      router.push("/login")
    }
  }, [router])

  // FIXED: Don't pass empty string, pass email directly
  // The enabled flag will prevent the query from running until email is set
  const { data: user, isLoading, isError } = useUserDetails(email);

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("id")
    localStorage.removeItem("name")
    localStorage.removeItem("constituency")
    localStorage.removeItem("role")
    localStorage.removeItem("email")
    localStorage.removeItem("mlaId")
    router.push("/login")
  }

  // ✅ Show loading state until client-side hydration completes AND email is loaded
  if (!isClient || !email || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error fetching user data. Please login again.</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Calculate real stats from user data
  const totalIssues = user.issues?.length || 0
  const resolvedIssues = user.issues?.filter(i => i.status === "RESOLVED").length || 0
  const inProgressIssues = user.issues?.filter(i => i.status === "IN_PROGRESS").length || 0
  const pendingIssues = user.issues?.filter(i => i.status === "PENDING").length || 0

  const mockStats = [
    { label: "Issues Reported", value: totalIssues.toString(), icon: AlertCircle, color: "text-red-500" },
    { label: "Resolved", value: resolvedIssues.toString(), icon: CheckCircle, color: "text-green-500" },
    { label: "In Progress", value: inProgressIssues.toString(), icon: Clock, color: "text-yellow-500" },
    { label: "Pending", value: pendingIssues.toString(), icon: TrendingUp, color: "text-blue-500" },
  ]

  // Get recent issues (last 5)
  const recentIssues = user.issues?.slice(0, 5) || []

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold">Welcome, {user.name}! 👋</h1>
              <p className="text-muted-foreground mt-2">Track your civic contributions</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition font-medium"
            >
              <LogOut size={20} />
              Logout
            </button>
          </motion.div>

          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-lg p-6 mb-8"
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Profile Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-semibold">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-semibold">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Constituency</p>
                    <p className="font-semibold">{user.constituency}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Your MLA</h3>
                <div className="space-y-3">
                  {!user.currentMLA ? (
                    <p className="text-sm text-muted-foreground">No MLA assigned</p>
                  ) : (
                    <div className="p-4 border border-border rounded-lg bg-muted/30">
                      <p className="font-semibold text-lg">{user.currentMLA.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{user.currentMLA.party}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Mail size={12} />
                        {user.currentMLA.email}
                      </p>
                      {user.currentMLA.phone && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Phone size={12} />
                          {user.currentMLA.phone}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Constituency: {user.currentMLA.constituency}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {mockStats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <stat.icon className={`${stat.color}`} size={24} />
                </div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Issues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="text-primary-dark-blue" size={24} />
              <h2 className="text-xl font-bold">Your Recent Issues</h2>
            </div>

            <div className="space-y-4">
              {recentIssues.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No issues reported yet</p>
              ) : (
                recentIssues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            {issue.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            issue.severity === "CRITICAL" ? "bg-red-500/10 text-red-600" :
                            issue.severity === "HIGH" ? "bg-orange-500/10 text-orange-600" :
                            issue.severity === "MEDIUM" ? "bg-yellow-500/10 text-yellow-600" :
                            "bg-blue-500/10 text-blue-600"
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                          <MapPin size={14} />
                          <span className="line-clamp-1">{issue.location}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reported: {new Date(issue.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          issue.status === "RESOLVED"
                            ? "bg-green-500/10 text-green-600"
                            : issue.status === "IN_PROGRESS"
                            ? "bg-yellow-500/10 text-yellow-600"
                            : issue.status === "REJECTED"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        {issue.status.replace("_", " ")}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <button className="w-full mt-6 py-2 border border-border rounded-lg hover:bg-muted transition font-medium">
              View All Issues
            </button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}