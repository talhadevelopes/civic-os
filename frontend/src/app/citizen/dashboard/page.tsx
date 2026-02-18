"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/app/_components/navbar"
import { Footer } from "@/app/_components/footer"
import { motion } from "framer-motion"
import {
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  User,
  AlertTriangle,
  ExternalLink,
  Wind,
  Users,
  Activity,
  Building2,
  MessageCircle,
  X,
  Send,
  Loader,
} from "lucide-react"
import { useUserDetails } from "@/lib/cache/index"
import Issues from "@/app/_components/recent-issues"
import GlobalIssues from "@/app/_components/global-issues"

const GEMINI_API_KEY = "AIzaSyAaKTwESBKSV8QzmEFKrAvzAOVafbWo0VQ"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

interface Message {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

interface ChatContextData {
  totalIssues: number
  resolvedIssues: number
  inProgressIssues: number
  pendingIssues: number
  aqi: number
  emergencies: any[]
  userName: string
  constituency: string
  mlaName?: string
  recentIssues: any[]
  wardStats: {
    activeCitizens: string
    avgResponseTime: string
    civicInitiatives: string
  }
}

const PROMPT_TEMPLATES = [
  { label: "📊 Issue Summary", prompt: "Give me a summary of all my reported issues and their current status." },
  { label: "⚠️ Priority Issues", prompt: "What are my highest priority pending issues that need immediate attention?" },
  { label: "💡 Recommendations", prompt: "What recommendations do you have to improve my civic engagement?" },
  { label: "🌍 Air Quality", prompt: "How is the air quality in my area and what should I be aware of?" },
  { label: "🤝 Contact MLA", prompt: "How can I contact my MLA and what are the best ways to reach out?" },
  {
    label: "📈 Performance",
    prompt: "How is my ward performing compared to other areas in terms of issue resolution?",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string>("")
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState<"global" | "recent">("global")
  const [safeDismissed, setSafeDismissed] = useState<string[]>([])

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [showTemplates, setShowTemplates] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContextData = useRef<ChatContextData | null>(null)

  useEffect(() => {
    setIsClient(true)
    const storedEmail = localStorage.getItem("email")
    const token = localStorage.getItem("token")
    const id = localStorage.getItem("id")

    if (storedEmail) {
      setEmail(storedEmail)
    }

    if (!token || !id) {
      router.push("/login")
    }
  }, [router])

  const { data: user, isLoading, isError } = useUserDetails(email)

  useEffect(() => {
    if (user) {
      const totalIssues = user.issues?.length || 0
      const resolvedIssues = user.issues?.filter((i) => i.status === "RESOLVED").length || 0
      const inProgressIssues = user.issues?.filter((i) => i.status === "IN_PROGRESS").length || 0
      const pendingIssues = user.issues?.filter((i) => i.status === "PENDING").length || 0

      chatContextData.current = {
        totalIssues,
        resolvedIssues,
        inProgressIssues,
        pendingIssues,
        aqi: user.aqi || 85,
        emergencies: user.emergencies || [],
        userName: user.name,
        constituency: user.constituency,
        mlaName: user.currentMLA?.name,
        recentIssues: user.issues?.slice(0, 5) || [],
        wardStats: {
          activeCitizens: "2,847",
          avgResponseTime: "4.2 days",
          civicInitiatives: "12",
        },
      }
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleTemplateClick = (template: (typeof PROMPT_TEMPLATES)[0]) => {
    setInputValue(template.prompt)
    setShowTemplates(false)
    // Auto-send after a small delay
    setTimeout(() => {
      handleSendMessage()
    }, 100)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setShowTemplates(false)
    setChatLoading(true)

    try {
      const contextPrompt = `You are a helpful civic assistant for a citizen dashboard. Here is the current context:
      
Dashboard Context:
- User: ${chatContextData.current?.userName} from ${chatContextData.current?.constituency}
- Total Issues Reported: ${chatContextData.current?.totalIssues}
- Resolved Issues: ${chatContextData.current?.resolvedIssues}
- In Progress Issues: ${chatContextData.current?.inProgressIssues}
- Pending Issues: ${chatContextData.current?.pendingIssues}
- Air Quality Index (AQI): ${chatContextData.current?.aqi} (${getAQILabel(chatContextData.current?.aqi || 85)})
- Active Emergencies: ${chatContextData.current?.emergencies?.length || 0}
- MLA: ${chatContextData.current?.mlaName || "Not assigned"}
- Ward Active Citizens: ${chatContextData.current?.wardStats?.activeCitizens}
- Average Response Time: ${chatContextData.current?.wardStats?.avgResponseTime}

User Question: ${userMessage.text}

Please provide a helpful, concise response (max 2-3 sentences) related to their civic dashboard or the question asked.`

      const urlWithKey = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`

      console.log("[v0] Sending request to:", urlWithKey)
      console.log("[v0] Request body:", { contents: [{ parts: [{ text: contextPrompt }] }] })

      const response = await fetch(urlWithKey, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: contextPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_CIVIC_INTEGRITY",
              threshold: "BLOCK_NONE",
            },
          ],
        }),
      })

      console.log("[v0] API Response Status:", response.status)

      const data = await response.json()
      console.log("[v0] Full API Response:", JSON.stringify(data, null, 2))

      if (data.error) {
        console.error("[v0] API Error:", data.error)
        throw new Error(data.error?.message || "API Error occurred")
      }

      if (!response.ok) {
        console.error("[v0] API returned non-200 status:", response.status)
        throw new Error(`API returned status ${response.status}`)
      }

      const candidate = data.candidates?.[0]
      if (candidate?.content?.parts?.[0]?.text) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: candidate.content.parts[0].text,
          sender: "ai",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
        console.log("[v0] AI Response received successfully")
      } else if (candidate?.finishReason === "MAX_TOKENS") {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Response was too long. Please try asking a more specific question.",
          sender: "ai",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        console.error("[v0] Unexpected response structure:", data)
        throw new Error("No text content in API response")
      }
    } catch (error) {
      console.error("[v0] Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
    }
  }

  const getAQILabel = (value: number) => {
    if (value <= 50) return "Good"
    if (value <= 100) return "Moderate"
    if (value <= 150) return "Unhealthy"
    return "Hazardous"
  }

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

  const handleImSafe = (emergencyId: string) => {
    console.log("User marked safe for emergency:", emergencyId)
    setSafeDismissed([...safeDismissed, emergencyId])
  }

  if (!isClient || !email || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b82f6]"></div>
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error fetching user data. Please login again.</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-[#3b82f6] text-white rounded-[10px] hover:bg-[#2563eb] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const totalIssues = user.issues?.length || 0
  const resolvedIssues = user.issues?.filter((i) => i.status === "RESOLVED").length || 0
  const inProgressIssues = user.issues?.filter((i) => i.status === "IN_PROGRESS").length || 0
  const pendingIssues = user.issues?.filter((i) => i.status === "PENDING").length || 0

  const aqi = user.aqi || 85
  const getAQIColor = (value: number) => {
    if (value <= 50) return { bg: "#10b98114", text: "#10b981", label: "Good" }
    if (value <= 100) return { bg: "#eab30814", text: "#eab308", label: "Moderate" }
    if (value <= 150) return { bg: "#f9731614", text: "#f97316", label: "Unhealthy" }
    return { bg: "#ef444414", text: "#ef4444", label: "Hazardous" }
  }
  const aqiStyle = getAQIColor(aqi)

  const emergencies = user.emergencies || []
  const activeEmergencies = emergencies.filter((e: any) => !safeDismissed.includes(e.id))

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return { bg: "#ef444414", border: "#ef4444", text: "#ef4444" }
      case "HIGH":
        return { bg: "#eab30814", border: "#eab308", text: "#eab308" }
      default:
        return { bg: "#3b82f614", border: "#3b82f6", text: "#3b82f6" }
    }
  }

  const mockStats = [
    {
      label: "Issues Reported",
      value: totalIssues.toString(),
      icon: AlertCircle,
      color: "#ef4444",
      dotColor: "#ef4444",
    },
    {
      label: "Resolved",
      value: resolvedIssues.toString(),
      icon: CheckCircle,
      color: "#10b981",
      dotColor: "#10b981",
    },
    {
      label: "In Progress",
      value: inProgressIssues.toString(),
      icon: Clock,
      color: "#eab308",
      dotColor: "#eab308",
    },
    {
      label: "Pending",
      value: pendingIssues.toString(),
      icon: TrendingUp,
      color: "#3b82f6",
      dotColor: "#3b82f6",
    },
  ]

  const recentIssues = user.issues?.slice(0, 5) || []

  const wardData = [
    { label: "Active Citizens", value: "2,847", icon: Users },
    { label: "Avg Response Time", value: "4.2 days", icon: Activity },
    { label: "Civic Initiatives", value: "12", icon: Building2 },
  ]

  return (
    <div
      className="min-h-screen flex flex-col bg-[#0a0a0a] text-white"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {activeEmergencies.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              {activeEmergencies.slice(0, 1).map((emergency: any) => {
                const style = getSeverityStyle(emergency.severity)
                return (
                  <div
                    key={emergency.id}
                    style={{
                      backgroundColor: style.bg,
                      borderLeft: `4px solid ${style.border}`,
                    }}
                    className="rounded-[10px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    role="alert"
                    aria-live="assertive"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <AlertTriangle size={20} style={{ color: style.text }} className="shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm mb-1" style={{ color: style.text }}>
                          Emergency Updates
                        </p>
                        <p className="text-sm text-white/80 line-clamp-2">{emergency.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {emergency.detailsUrl && (
                        <a
                          href={emergency.detailsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 h-11 flex items-center gap-2 text-sm font-medium rounded-[10px] border transition-colors"
                          style={{
                            borderColor: style.border,
                            color: style.text,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = style.bg
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent"
                          }}
                        >
                          View Details
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => handleImSafe(emergency.id)}
                        className="px-4 h-11 text-sm font-medium rounded-[10px] transition-colors"
                        style={{
                          backgroundColor: style.text,
                          color: "#0a0a0a",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.9"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1"
                        }}
                      >
                        I'm Safe
                      </button>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10"
          >
            <div className="flex items-start sm:items-center gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">Civic Dashboard</h1>
                <p className="text-[#a1a1aa] text-sm mt-1.5 font-medium tracking-wide">
                  {user.constituency} · Citizen Portal
                </p>
              </div>
              <div
                className="px-3 py-1.5 rounded-[10px] border flex items-center gap-2"
                style={{
                  backgroundColor: aqiStyle.bg,
                  borderColor: aqiStyle.text,
                }}
                role="status"
                aria-label={`Air Quality Index ${aqi}, ${aqiStyle.label}`}
              >
                <Wind size={14} style={{ color: aqiStyle.text }} />
                <span className="text-xs font-semibold tracking-wide" style={{ color: aqiStyle.text }}>
                  AQI {aqi}
                </span>
                <span className="text-xs" style={{ color: aqiStyle.text }}>
                  ·
                </span>
                <span className="text-xs font-medium" style={{ color: aqiStyle.text }}>
                  {aqiStyle.label}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 h-11 rounded-[10px] border border-[#ef4444] text-[#ef4444] transition-colors hover:bg-[#ef444414] font-medium text-sm"
            >
              <LogOut size={18} />
              Logout
            </button>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {mockStats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#18181b] border border-[#27272a] rounded-[10px] p-5 hover:border-[#3f3f46] transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.dotColor }} />
                      <stat.icon size={18} style={{ color: stat.color }} className="opacity-80" />
                    </div>
                    <p className="text-[#a1a1aa] text-xs font-medium tracking-wide uppercase mb-1.5">{stat.label}</p>
                    <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#18181b] border border-[#27272a] rounded-[10px] p-6 mb-8"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-semibold text-[#a1a1aa] mb-4 uppercase tracking-wider">
                      Profile Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-[#71717a] mb-1 font-medium">NAME</p>
                        <p className="font-semibold text-base">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#71717a] mb-1 font-medium">EMAIL</p>
                        <p className="font-medium text-sm text-[#d4d4d8]">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#71717a] mb-1 font-medium">CONSTITUENCY</p>
                        <p className="font-semibold text-base">{user.constituency}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#a1a1aa] mb-4 uppercase tracking-wider">Your MLA</h3>
                    {!user.currentMLA ? (
                      <p className="text-sm text-[#71717a] font-medium">No MLA assigned</p>
                    ) : (
                      <div className="p-4 border border-[#27272a] rounded-[10px] bg-[#0a0a0a]">
                        <p className="font-bold text-lg mb-1">{user.currentMLA.name}</p>
                        <p className="text-sm text-[#a1a1aa] mb-3 font-medium">{user.currentMLA.party}</p>
                        <div className="space-y-2 text-xs">
                          <p className="text-[#d4d4d8] flex items-center gap-2 font-medium">
                            <Mail size={13} className="text-[#71717a]" />
                            {user.currentMLA.email}
                          </p>
                          {user.currentMLA.phone && (
                            <p className="text-[#d4d4d8] flex items-center gap-2 font-medium">
                              <Phone size={13} className="text-[#71717a]" />
                              {user.currentMLA.phone}
                            </p>
                          )}
                          <p className="text-[#71717a] flex items-center gap-2 font-medium">
                            <MapPin size={13} />
                            {user.currentMLA.constituency}
                          </p>
                        </div>
                        <button className="mt-4 w-full h-11 border border-[#3b82f6] text-[#3b82f6] rounded-[10px] text-sm font-semibold hover:bg-[#3b82f614] transition-colors">
                          Contact MLA
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="flex gap-1 border-b border-[#27272a] mb-6">
                  <button
                    onClick={() => setActiveTab("global")}
                    className={`flex items-center gap-2 px-6 h-[48px] font-semibold transition-colors relative text-sm ${activeTab === "global" ? "text-[#3b82f6]" : "text-[#71717a] hover:text-[#a1a1aa]"
                      }`}
                  >
                    <Globe size={18} />
                    Global Issues
                    {activeTab === "global" && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6]"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("recent")}
                    className={`flex items-center gap-2 px-6 h-[48px] font-semibold transition-colors relative text-sm ${activeTab === "recent" ? "text-[#3b82f6]" : "text-[#71717a] hover:text-[#a1a1aa]"
                      }`}
                  >
                    <User size={18} />
                    My Recent Issues
                    {activeTab === "recent" && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6]"
                      />
                    )}
                  </button>
                </div>

                <div>{activeTab === "global" ? <GlobalIssues /> : <Issues recentIssues={recentIssues} />}</div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:w-[280px] flex-shrink-0"
            >
              <div className="bg-[#18181b] border border-[#27272a] rounded-[10px] p-5 sticky top-24">
                <h3 className="text-xs font-semibold text-[#a1a1aa] mb-4 uppercase tracking-wider">Ward Snapshot</h3>
                <div className="space-y-1">
                  {wardData.map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5">
                          <item.icon size={16} className="text-[#71717a] flex-shrink-0" />
                          <span className="text-xs font-medium text-[#d4d4d8]">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold">{item.value}</span>
                      </div>
                      {i < wardData.length - 1 && <div className="h-px bg-[#27272a]" />}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => {
          setIsChatOpen(true)
          setShowTemplates(true)
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#3b82f6] text-white shadow-lg hover:bg-[#2563eb] transition-colors flex items-center justify-center z-40"
        aria-label="Open AI Chat"
      >
        <MessageCircle size={24} />
      </motion.button>

      {/* Chat Modal */}
      {isChatOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-32px)] h-[600px] bg-[#18181b] border border-[#27272a] rounded-[10px] shadow-xl flex flex-col z-50 overflow-hidden"
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#27272a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center">
                <MessageCircle size={16} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Civic Assistant</p>
                <p className="text-xs text-[#71717a]">AI Powered Help</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 hover:bg-[#27272a] rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]">
            {messages.length === 0 && showTemplates ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                <div>
                  <MessageCircle size={32} className="text-[#3b82f6] mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-[#71717a] font-medium">
                    Hi! I'm your Civic Assistant. Ask me anything about your issues, emergencies, or ward information.
                  </p>
                </div>

                <div className="w-full grid grid-cols-1 gap-2">
                  {PROMPT_TEMPLATES.map((template, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleTemplateClick(template)}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] border border-[#3f3f46] hover:border-[#3b82f6] text-xs font-medium text-[#d4d4d8] transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{template.label.split(" ")[0]}</span>
                        <span className="group-hover:text-[#3b82f6] transition-colors">
                          {template.label.substring(2)}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-4 py-2.5 rounded-lg text-sm ${msg.sender === "user"
                        ? "bg-[#3b82f6] text-white rounded-br-none"
                        : "bg-[#27272a] text-[#d4d4d8] rounded-bl-none"
                        }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#27272a] text-[#d4d4d8] px-4 py-2.5 rounded-lg rounded-bl-none flex items-center gap-2">
                      <Loader size={14} className="animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[#27272a] bg-[#0a0a0a]">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !chatLoading) {
                    handleSendMessage()
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 bg-[#27272a] border border-[#3f3f46] text-white text-sm rounded-lg px-3 py-2.5 placeholder-[#71717a] focus:outline-none focus:border-[#3b82f6] transition-colors"
                disabled={chatLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={chatLoading || !inputValue.trim()}
                className="p-2.5 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
