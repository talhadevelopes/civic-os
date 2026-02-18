"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/app/_components/navbar"
import { Footer } from "@/app/_components/footer"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react"
import axios from "axios"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Check if email is MLA or Authority
  const isMlaOrAuthority = 
    formData.email.endsWith("@mla.com") || 
    formData.email.endsWith("@authority.com")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("Attempting login with:", formData.email)
      
      // Prepare request body - only include password for citizens
      const requestBody: any = {
        email: formData.email,
      }
      
      // Only add password if it's a citizen (not MLA or Authority)
      if (!isMlaOrAuthority) {
        requestBody.password = formData.password
      }
      
      const response = await axios.post(
        "https://civiciobackend.vercel.app/api/v1/auth/login",
        requestBody
      )

      console.log("Login response:", response.data)

      // Check if we got a valid response
      if (!response.data) {
        throw new Error("No response data received")
      }

      const { token, role, citizen, user } = response.data

      // Validate response structure
      if (!token) {
        throw new Error("No token received from server")
      }

      // Store auth data
      localStorage.setItem("token", token)
      localStorage.setItem("role", role || "citizen")

      // Store user data
      const userData = citizen || user
      if (userData) {
        if (userData.id) localStorage.setItem("id", userData.id)
        if (userData.email) localStorage.setItem("email", userData.email)
        if (userData.name) localStorage.setItem("name", userData.name)
        if (userData.constituency) localStorage.setItem("constituency", userData.constituency)
      }

      console.log(`Login successful as ${role}, redirecting...`)

      // Simple role-based redirect
      if (role === "mla") {
        window.location.href = "/mla/dashboard"
      } else if (role === "authority") {
        window.location.href = "/authority/dashboard"
      } else {
        window.location.href = "/citizen/dashboard"
      }

    } catch (err: any) {
      console.error("Login error:", err)
      
      // Extract error message
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        "Login failed. Please try again."
      
      setError(errorMessage)
      setIsLoading(false)
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
          <div className="bg-card text-card-foreground border border-border rounded-lg p-8 space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground text-2xl">⚡</span>
              </div>
              <h1 className="text-2xl font-bold">Welcome Back</h1>
              <p className="text-muted-foreground mt-2">Login to your CIVICOS account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-primary" size={20} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password - Only show for citizens */}
              {!isMlaOrAuthority && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-primary" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-primary"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Info message for MLA/Authority */}
              {isMlaOrAuthority && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-4 py-3 rounded-lg text-sm">
                  No password required for MLA/Authority login
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-lg hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Don't have an account?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link
              href="/signup"
              className="block w-full border border-border text-center py-2 rounded-lg font-medium hover:bg-muted transition"
            >
              Create Account
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}