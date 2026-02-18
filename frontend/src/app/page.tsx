"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BarChart3, Users, Zap, MessageSquare, TrendingUp, Shield, Bell } from "lucide-react"
import { Navbar } from "./_components/navbar"
import { Footer } from "./_components/footer"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a', color: '#fff' }}>
      <Navbar />

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-6 flex justify-center">
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block px-4 py-2 rounded-full border"
                style={{ background: '#3b82f614', borderColor: '#3b82f633' }}
              >
                <span style={{ color: '#3b82f6' }} className="font-semibold text-sm">🇮🇳 Empowering Citizens, Building Better Cities</span>
              </motion.div>
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold text-balance mb-6 leading-tight" style={{ color: '#fff' }}>
              Your Voice in <br />
              <span style={{ color: '#3b82f6' }}>Urban Governance</span>
            </h1>

            <p className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: '#a1a1aa' }}>
              AI-powered civic platform connecting citizens with local representatives. 
              Report issues, track resolutions in real-time, and drive meaningful change in your community.
            </p>

            <div className="flex gap-4 justify-center flex-wrap mb-16">
              <Link
                href="/signup"
                className="group px-8 py-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                style={{ background: '#3b82f6', color: '#fff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                }}
              >
                Get Started 
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-lg font-semibold transition-all flex items-center gap-2 border"
                style={{ borderColor: '#27272a', color: '#fff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#18181b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Login
              </Link>
            </div>

            {/* Stats Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {[
                { label: "Issues Reported", value: "12,450+" },
                { label: "Issues Resolved", value: "8,320+" },
                { label: "Active Citizens", value: "25,000+" },
                { label: "Response Rate", value: "94%" },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-lg border" style={{ background: '#18181b', borderColor: '#27272a' }}>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#3b82f6' }}>{stat.value}</div>
                  <div className="text-sm" style={{ color: '#a1a1aa' }}>{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 border-y" style={{ background: '#0a0a0a', borderColor: '#27272a' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4" style={{ color: '#fff' }}>How CIVICOS Works</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: '#a1a1aa' }}>
                Simple, transparent, and effective civic engagement in three easy steps
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  number: "01", 
                  title: "Report an Issue", 
                  desc: "Snap a photo, add location, and describe the civic problem in your area",
                  icon: MessageSquare 
                },
                { 
                  number: "02", 
                  title: "Track Progress", 
                  desc: "Get real-time updates as your local MLA or officials respond and take action",
                  icon: Bell 
                },
                { 
                  number: "03", 
                  title: "See Results", 
                  desc: "Watch your issue get resolved and help build a better community together",
                  icon: TrendingUp 
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative p-8 rounded-lg border hover:shadow-xl transition-all"
                  style={{ background: '#18181b', borderColor: '#27272a' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#27272a';
                  }}
                >
                  <div 
                    className="absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{ background: '#3b82f6', color: '#fff' }}
                  >
                    {step.number}
                  </div>
                  <step.icon className="mb-4" size={40} style={{ color: '#3b82f6' }} />
                  <h3 className="font-bold text-xl mb-3" style={{ color: '#fff' }}>{step.title}</h3>
                  <p className="leading-relaxed" style={{ color: '#a1a1aa' }}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20" style={{ background: '#0a0a0a' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4" style={{ color: '#fff' }}>Why Choose CIVICOS</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: '#a1a1aa' }}>
                Cutting-edge technology meets community empowerment
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: Zap, 
                  title: "Lightning Fast", 
                  desc: "Real-time issue tracking with instant notifications when your representatives respond or take action"
                },
                { 
                  icon: BarChart3, 
                  title: "AI-Powered Insights", 
                  desc: "Smart categorization, priority scoring, and predictive analytics to resolve issues faster"
                },
                { 
                  icon: Users, 
                  title: "Community First", 
                  desc: "Vote on issues, engage in discussions, and collaborate with neighbors for collective impact"
                },
                { 
                  icon: Shield, 
                  title: "Verified & Secure", 
                  desc: "Authenticated MLAs and government officials ensure legitimate responses and accountability"
                },
                { 
                  icon: TrendingUp, 
                  title: "Performance Metrics", 
                  desc: "Track representative performance with transparent ratings and resolution statistics"
                },
                { 
                  icon: MessageSquare, 
                  title: "Open Dialogue", 
                  desc: "Direct communication channels between citizens and elected officials for true transparency"
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-6 rounded-lg border transition-all hover:shadow-lg"
                  style={{ background: '#18181b', borderColor: '#27272a' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f633';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#27272a';
                  }}
                >
                  <div 
                    className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-colors"
                    style={{ background: '#3b82f614' }}
                  >
                    <item.icon size={28} style={{ color: '#3b82f6' }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#fff' }}>{item.title}</h3>
                  <p className="leading-relaxed" style={{ color: '#a1a1aa' }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20" style={{ background: '#3b82f6' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6" style={{ color: '#fff' }}>
                Ready to Make a Difference?
              </h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Join thousands of citizens already using CIVICOS to create positive change in their communities
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/signup"
                  className="px-8 py-4 rounded-lg font-semibold transition-all shadow-lg flex items-center gap-2"
                  style={{ background: '#fff', color: '#3b82f6' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  Start Reporting Issues
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-lg font-semibold transition-all border-2"
                  style={{ borderColor: '#fff', color: '#fff' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
