"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { motion } from "framer-motion"
import { Eye, EyeOff, User, Mail, Lock, MapPin } from "lucide-react"
import { Navbar } from "@/app/_components/navbar"
import { Footer } from "@/app/_components/footer"


const CONSTITUENCIES = [
  "Sirpur",
  "Khairtabad",
  "Secunderabad",
  "Musheerabad",
  "Sanathnagar",
  "Amberpet",
  "Asifnagar",
  "Karwan",
  "Bahadurpura",
  "Nampally",
  "Himayatnagar",
  "Jubilee Hills",
  "Banjara Hills",
  "Hyderabad Central",
  "Kukatpally",
  "Manikonda",
  "Madhapur",
  "Gachibowli",
  "HITEC City",
  "Ameerpet",
  "Kondapur",
  "Begumpet",
  "Kachiguda",
  "Malakpet"
]

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    constituency: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await axios.post(
        "https://civiciobackend.vercel.app/api/v1/auth/signup",
        formData
      )

      if (response.status === 201 || response.status === 200) {
        router.push("/login")
      } else {
        setError("Signup failed. Please try again.")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-dark-blue rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🇮🇳</span>
              </div>
              <h1 className="text-2xl font-bold">Join CIVICOS</h1>
              <p className="text-muted-foreground mt-2">Create your Indian Citizen account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-primary-dark-blue" size={20} />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-dark-blue"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-primary-dark-blue" size={20} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-dark-blue"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-primary-dark-blue" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-dark-blue"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-primary-dark-blue"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Constituency */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Constituency</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-primary-dark-blue" size={20} />
                  <select
                    value={formData.constituency}
                    onChange={(e) =>
                      setFormData({ ...formData, constituency: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-dark-blue appearance-none"
                    required
                  >
                    <option value="">Select your constituency</option>
                    {CONSTITUENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-primary-dark-blue text-white font-semibold py-2 rounded-lg hover:bg-primary-dark-blue-light transition"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </motion.button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full border border-border text-center py-2 rounded-lg font-medium hover:bg-muted transition"
            >
              Login
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
