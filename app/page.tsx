"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";
import Link from "next/link";
import {
  MapPin, AlertTriangle, TrendingUp, Users, Shield,
  ChevronRight, Zap, BarChart2, CheckCircle, Flag,
  Leaf, TreePine, Eye, Star
} from "lucide-react";

// ── Google Font ──────────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Arvo:ital,wght@0,400;0,700;1,400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Arvo', serif; background: #ffffff; color: #111827; }

    :root {
      --green: #16a34a;
      --green-light: #dcfce7;
      --green-mid: #86efac;
      --green-dark: #15803d;
      --text: #111827;
      --muted: #6b7280;
      --border: #e5e7eb;
      --white: #ffffff;
    }

    /* Leaf pattern background */
    .leaf-bg {
      background-color: #ffffff;
      background-image:
        radial-gradient(circle at 20% 20%, rgba(22,163,74,0.06) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(22,163,74,0.06) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(22,163,74,0.03) 0%, transparent 70%);
      position: relative;
    }

    .hero-pattern {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cellipse cx='40' cy='40' rx='6' ry='18' fill='none' stroke='%2316a34a' stroke-width='0.8' opacity='0.12' transform='rotate(30 40 40)'/%3E%3Cellipse cx='15' cy='15' rx='4' ry='12' fill='none' stroke='%2316a34a' stroke-width='0.6' opacity='0.08' transform='rotate(-20 15 15)'/%3E%3Cellipse cx='65' cy='65' rx='4' ry='12' fill='none' stroke='%2316a34a' stroke-width='0.6' opacity='0.08' transform='rotate(60 65 65)'/%3E%3C/svg%3E");
    }

    /* Carousel */
    .carousel-track {
      display: flex;
      gap: 20px;
      will-change: transform;
    }
    .carousel-wrapper {
      overflow: hidden;
      width: 100%;
      mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
    }

    /* Stat counter animation */
    @keyframes countUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }

    .btn-primary {
      background: var(--green);
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-family: 'Arvo', serif;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
      box-shadow: 0 4px 14px rgba(22,163,74,0.25);
      text-decoration: none;
    }
    .btn-primary:hover {
      background: var(--green-dark);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(22,163,74,0.35);
    }
    .btn-secondary {
      background: transparent;
      color: var(--green);
      border: 2px solid var(--green);
      padding: 12px 26px;
      border-radius: 8px;
      font-family: 'Arvo', serif;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn-secondary:hover {
      background: var(--green-light);
      transform: translateY(-1px);
    }

    /* Floating leaves */
    @keyframes floatLeaf1 {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-18px) rotate(8deg); }
    }
    @keyframes floatLeaf2 {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(-6deg); }
    }
    @keyframes floatLeaf3 {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-22px) rotate(12deg); }
    }
    .leaf-float-1 { animation: floatLeaf1 4s ease-in-out infinite; }
    .leaf-float-2 { animation: floatLeaf2 5.5s ease-in-out infinite; }
    .leaf-float-3 { animation: floatLeaf3 3.8s ease-in-out infinite; }

    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .pulse-dot::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 2px solid var(--green);
      animation: pulse-ring 1.8s ease-out infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `}</style>
);

// ── Leaf SVG ─────────────────────────────────────────────────
const LeafSVG = ({ size = 40, opacity = 0.18, rotate = 0, color = "#16a34a" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ transform: `rotate(${rotate}deg)`, opacity }}>
    <path d="M20 38C20 38 4 28 4 14C4 7.4 11.2 2 20 2C28.8 2 36 7.4 36 14C36 28 20 38 20 38Z" fill={color} />
    <path d="M20 38L20 10" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    <path d="M20 22C14 18 10 14 12 10" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.35" />
    <path d="M20 18C26 14 30 10 28 6" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.35" />
  </svg>
);

// ── Animated Counter ──────────────────────────────────────────
const Counter = ({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) => {
  const ref = useRef<any>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 2,
      ease: "easeOut",
      onUpdate(v) {
        if (ref.current) ref.current.textContent = prefix + Math.round(v).toLocaleString("en-IN") + suffix;
      }
    });
    return () => controls.stop();
  }, [inView, to, prefix, suffix]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
};

// ── Carousel Data ─────────────────────────────────────────────
const carouselItems = [
  { icon: AlertTriangle, label: "Pothole Reported", loc: "Banjara Hills, Hyd", status: "Under Review", color: "#f59e0b", bg: "#fffbeb" },
  { icon: CheckCircle, label: "Garbage Cleared", loc: "Kukatpally, Hyd", status: "Resolved ✓", color: "#16a34a", bg: "#f0fdf4" },
  { icon: Zap, label: "Street Light Fixed", loc: "Madhapur, Hyd", status: "Resolved ✓", color: "#16a34a", bg: "#f0fdf4" },
  { icon: AlertTriangle, label: "Waterlogging Issue", loc: "LB Nagar, Hyd", status: "In Progress", color: "#3b82f6", bg: "#eff6ff" },
  { icon: Shield, label: "Illegal Construction", loc: "Secunderabad", status: "Escalated", color: "#ef4444", bg: "#fef2f2" },
  { icon: MapPin, label: "Road Damage", loc: "Dilsukhnagar, Hyd", status: "Under Review", color: "#f59e0b", bg: "#fffbeb" },
  { icon: BarChart2, label: "MLA Scorecard", loc: "Jubilee Hills Ward", status: "67/100 Score", color: "#16a34a", bg: "#f0fdf4" },
  { icon: CheckCircle, label: "Drain Blocked", loc: "Ameerpet, Hyd", status: "Resolved ✓", color: "#16a34a", bg: "#f0fdf4" },
  { icon: Flag, label: "Park Encroachment", loc: "Gachibowli, Hyd", status: "Escalated", color: "#ef4444", bg: "#fef2f2" },
  { icon: Eye, label: "Bridge Inspection", loc: "Nampally, Hyd", status: "In Progress", color: "#3b82f6", bg: "#eff6ff" },
  { icon: Star, label: "Top MLA This Month", loc: "Khairatabad", status: "94/100 Score", color: "#16a34a", bg: "#f0fdf4" },
  { icon: AlertTriangle, label: "Broken Footpath", loc: "Begumpet, Hyd", status: "Under Review", color: "#f59e0b", bg: "#fffbeb" },
];

const CarouselCard = ({ item }: { item: typeof carouselItems[0] }) => {
  const Icon = item.icon;
  return (
    <div style={{
      minWidth: 260,
      background: item.bg,
      border: `1.5px solid ${item.color}22`,
      borderRadius: 14,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: item.color + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={item.color} />
        </div>
        <div>
          <div style={{ fontFamily: "Arvo, serif", fontWeight: 700, fontSize: 13, color: "#111827" }}>{item.label}</div>
          <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Arvo, serif", marginTop: 1 }}>
            <MapPin size={9} style={{ display: "inline", marginRight: 3 }} />{item.loc}
          </div>
        </div>
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: item.color + "15", borderRadius: 20,
        padding: "4px 10px", width: "fit-content",
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: "Arvo, serif" }}>{item.status}</span>
      </div>
    </div>
  );
};

// ── Infinite Carousel ─────────────────────────────────────────
const InfiniteCarousel = () => {
  const trackRef = useRef<any>(null);
  const items = [...carouselItems, ...carouselItems, ...carouselItems];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let pos = 0;
    const speed = 0.5;
    const cardWidth = 280;
    const totalWidth = carouselItems.length * cardWidth;
    let raf: number;
    const loop = () => {
      pos += speed;
      if (pos >= totalWidth) pos = 0;
      track.style.transform = `translateX(-${pos}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="carousel-wrapper">
      <div ref={trackRef} className="carousel-track">
        {items.map((item, i) => <CarouselCard key={i} item={item} />)}
      </div>
    </div>
  );
};

// ── Nav ───────────────────────────────────────────────────────
const Nav = () => (
  <motion.nav
    initial={{ y: -30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    style={{
      position: "relative", zIndex: 100,
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: "1.5px solid #e5e7eb",
      padding: "0 48px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 64,
    }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34, background: "#16a34a",
        borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <TreePine size={18} color="white" />
      </div>
      <span style={{ fontFamily: "Arvo, serif", fontWeight: 700, fontSize: 20, color: "#111827", letterSpacing: "-0.3px" }}>
        CIVICOS
      </span>
    </div>
    <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
      <Link href="/login" style={{ fontFamily: "Arvo, serif", fontSize: 14, color: "#374151", textDecoration: "none", transition: "color 0.2s" }}>Sign In</Link>
      <Link href="/signup" style={{ fontFamily: "Arvo, serif", fontSize: 14, color: "#374151", textDecoration: "none", transition: "color 0.2s" }}>Join Platform</Link>
    </div>
    <Link href="/signup" className="btn-primary" style={{ padding: "9px 20px", fontSize: 13 }}>
      Join Now <ChevronRight size={14} />
    </Link>
  </motion.nav>
);

// ── Stats ─────────────────────────────────────────────────────
const stats = [
  { label: "Issues Reported", value: 48200, suffix: "+", icon: AlertTriangle },
  { label: "Issues Resolved", value: 31500, suffix: "+", icon: CheckCircle },
  { label: "Active Citizens", value: 12800, suffix: "+", icon: Users },
  { label: "MLAs Tracked", value: 119, suffix: "", icon: BarChart2 },
];

// ── MAIN ──────────────────────────────────────────────────────
export default function Home() {
  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: (i: number) => ({ opacity: 1, scale: 1, y: 0, transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" } as object })
  } as any;

  return (
    <>
      <FontLoader />
      <div style={{ fontFamily: "Arvo, serif", background: "#fff", minHeight: "100vh" }}>
        <Nav />

        {/* ── HERO ── */}
        <section className="leaf-bg hero-pattern" style={{ position: "relative", overflow: "hidden", paddingBottom: 80 }}>

          {/* Decorative floating leaves */}
          <div className="leaf-float-1" style={{ position: "absolute", top: 80, left: 60, zIndex: 0 }}>
            <LeafSVG size={52} opacity={0.14} rotate={-25} />
          </div>
          <div className="leaf-float-2" style={{ position: "absolute", top: 180, right: 80, zIndex: 0 }}>
            <LeafSVG size={38} opacity={0.12} rotate={40} />
          </div>
          <div className="leaf-float-3" style={{ position: "absolute", top: 40, right: 260, zIndex: 0 }}>
            <LeafSVG size={28} opacity={0.1} rotate={-10} />
          </div>
          <div className="leaf-float-1" style={{ position: "absolute", bottom: 120, left: 180, zIndex: 0 }}>
            <LeafSVG size={44} opacity={0.11} rotate={60} />
          </div>
          <div className="leaf-float-2" style={{ position: "absolute", bottom: 60, right: 140, zIndex: 0 }}>
            <LeafSVG size={32} opacity={0.1} rotate={-40} />
          </div>
          <div className="leaf-float-3" style={{ position: "absolute", top: 280, left: 320, zIndex: 0 }}>
            <LeafSVG size={22} opacity={0.08} rotate={20} />
          </div>

          {/* Large decorative background circles */}
          <div style={{
            position: "absolute", width: 600, height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(22,163,74,0.05) 0%, transparent 70%)",
            top: -200, right: -100, zIndex: 0, pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute", width: 400, height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(22,163,74,0.06) 0%, transparent 70%)",
            bottom: -100, left: -80, zIndex: 0, pointerEvents: "none"
          }} />

          {/* Hero Content */}
          <div style={{
            maxWidth: 900, margin: "0 auto",
            padding: "90px 24px 60px",
            textAlign: "center", position: "relative", zIndex: 1
          }}>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#f0fdf4", border: "1.5px solid #bbf7d0",
                borderRadius: 40, padding: "7px 16px", marginBottom: 36,
              }}>
              <div style={{ position: "relative", width: 8, height: 8 }} className="pulse-dot">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
              </div>
              <Leaf size={13} color="#16a34a" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", fontFamily: "Arvo, serif", letterSpacing: "0.5px" }}>
                LIVE · HYDERABAD CIVIC PLATFORM
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: "easeOut" }}
              style={{
                fontFamily: "Arvo, serif", fontWeight: 700,
                fontSize: "clamp(36px, 6vw, 68px)",
                lineHeight: 1.08, letterSpacing: "-1.5px",
                color: "#111827", marginBottom: 24,
              }}>
              Your City.{" "}
              <span style={{ color: "#16a34a", position: "relative" }}>
                Your Voice.
                {/* Underline accent */}
                <motion.svg
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
                  style={{ position: "absolute", bottom: -6, left: 0, width: "100%", transformOrigin: "left" }}
                  height="6" viewBox="0 0 200 6" preserveAspectRatio="none">
                  <path d="M0 4 Q50 1 100 4 Q150 7 200 4" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
                </motion.svg>
              </span>
              <br />Your Accountability.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              style={{
                fontFamily: "Arvo, serif", fontWeight: 400,
                fontSize: "clamp(15px, 2vw, 18px)", color: "#4b5563",
                lineHeight: 1.75, maxWidth: 620, margin: "0 auto 40px",
              }}>
              Report urban issues, track resolutions in real time, and hold your
              MLAs publicly accountable — all on a live civic intelligence map of Hyderabad.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.38 }}
              style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
              <Link href="/reports/new" className="btn-primary">
                Report an Issue <ChevronRight size={16} />
              </Link>
              <Link href="/feed" className="btn-secondary">
                View Live Map <MapPin size={15} />
              </Link>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.7 }}
              style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 70 }}>
              {[
                { icon: MapPin, text: "Live Heatmap" },
                { icon: BarChart2, text: "MLA Scorecards" },
                { icon: Shield, text: "Issue Tracking" },
                { icon: TrendingUp, text: "Leaderboards" },
                { icon: Zap, text: "AI-Powered" },
              ].map(({ icon: Icon, text }, i) => (
                <motion.div
                  key={text}
                  custom={i}
                  variants={badgeVariants}
                  initial="hidden"
                  animate="visible"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "#ffffff", border: "1.5px solid #e5e7eb",
                    borderRadius: 40, padding: "7px 14px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}>
                  <Icon size={13} color="#16a34a" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", fontFamily: "Arvo, serif" }}>{text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                gap: 1, background: "#e5e7eb",
                border: "1.5px solid #e5e7eb", borderRadius: 16,
                overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}>
              {stats.map(({ label, value, suffix, icon: Icon }) => (
                <div key={label} style={{
                  background: "#fff", padding: "28px 20px",
                  textAlign: "center", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 8,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 4,
                  }}>
                    <Icon size={18} color="#16a34a" />
                  </div>
                  <div style={{ fontFamily: "Arvo, serif", fontWeight: 700, fontSize: 26, color: "#16a34a" }}>
                    <Counter to={value} suffix={suffix} />
                  </div>
                  <div style={{ fontFamily: "Arvo, serif", fontSize: 12, color: "#6b7280", fontWeight: 400 }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CAROUSEL SECTION ── */}
        <section style={{
          background: "#f9fafb",
          borderTop: "1.5px solid #e5e7eb",
          borderBottom: "1.5px solid #e5e7eb",
          padding: "52px 0",
          position: "relative", overflow: "hidden"
        }}>
          {/* Decorative leaf strip top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: 3, background: "repeating-linear-gradient(90deg, #16a34a 0px, #16a34a 20px, transparent 20px, transparent 40px)"
          }} />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
              <Leaf size={15} color="#16a34a" />
              <span style={{ fontFamily: "Arvo, serif", fontSize: 12, fontWeight: 700, color: "#16a34a", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Live Activity Feed
              </span>
              <Leaf size={15} color="#16a34a" style={{ transform: "scaleX(-1)" }} />
            </div>
            <h2 style={{ fontFamily: "Arvo, serif", fontWeight: 700, fontSize: 26, color: "#111827", letterSpacing: "-0.5px" }}>
              Real Issues. Real Action. Real Hyderabad.
            </h2>
          </motion.div>

          <InfiniteCarousel />

          {/* Second row (reverse direction) */}
          <div style={{ marginTop: 18 }}>
            <InfiniteCarouselReverse />
          </div>
        </section>

        {/* ── CTA STRIP ── */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            background: "#16a34a",
            padding: "56px 24px",
            textAlign: "center",
            position: "relative", overflow: "hidden"
          }}>
          {/* Leaf decorations on CTA */}
          <div style={{ position: "absolute", left: 40, top: 20, opacity: 0.12 }}>
            <LeafSVG size={80} opacity={1} rotate={-30} color="white" />
          </div>
          <div style={{ position: "absolute", right: 60, bottom: 10, opacity: 0.1 }}>
            <LeafSVG size={60} opacity={1} rotate={50} color="white" />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{
              fontFamily: "Arvo, serif", fontWeight: 700,
              fontSize: "clamp(24px, 4vw, 40px)", color: "white",
              marginBottom: 14, letterSpacing: "-0.5px"
            }}>
              Hyderabad deserves better. Start today.
            </h2>
            <p style={{ fontFamily: "Arvo, serif", color: "rgba(255,255,255,0.82)", fontSize: 16, marginBottom: 30 }}>
              Join 12,800+ citizens building a more accountable city.
            </p>
            <Link href="/signup" style={{
              background: "white", color: "#16a34a", border: "none",
              padding: "14px 30px", borderRadius: 8,
              fontFamily: "Arvo, serif", fontWeight: 700, fontSize: 15,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)", transition: "transform 0.2s",
              textDecoration: "none"
            }}
            >
              Get Started Free <ChevronRight size={16} />
            </Link>
          </div>
        </motion.section>

        {/* Footer bar */}
        <div style={{ background: "#f9fafb", borderTop: "1.5px solid #e5e7eb", padding: "18px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, background: "#16a34a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TreePine size={12} color="white" />
            </div>
            <span style={{ fontFamily: "Arvo, serif", fontWeight: 700, fontSize: 13, color: "#111827" }}>CIVICOS</span>
          </div>
          <span style={{ fontFamily: "Arvo, serif", fontSize: 12, color: "#9ca3af" }}>© 2025 Civicos · Built for Hyderabad</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy", "Terms", "Contact"].map(t => (
              <span key={t} style={{ fontFamily: "Arvo, serif", fontSize: 12, color: "#6b7280", cursor: "pointer" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Reverse Carousel ──────────────────────────────────────────
const reverseItems = [...carouselItems].reverse();

function InfiniteCarouselReverse() {
  const trackRef = useRef<any>(null);
  const items = [...reverseItems, ...reverseItems, ...reverseItems];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const totalWidth = reverseItems.length * 280;
    let pos = totalWidth / 2;
    let raf: number;
    const loop = () => {
      pos -= 0.4;
      if (pos <= 0) pos = totalWidth;
      track.style.transform = `translateX(-${pos}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="carousel-wrapper">
      <div ref={trackRef} className="carousel-track">
        {items.map((item, i) => <CarouselCard key={i} item={item} />)}
      </div>
    </div>
  );
}
