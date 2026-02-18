"use client";

import Link from "next/link";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Hide navbar on landing page
  if (pathname === "/") return null;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/citizen/report-issue", label: "Report Issue" },
    { href: "/citizen/map", label: "Map" },
    { href: "/citizen/leaderboards", label: "Leaderboard" },
    { href: "/citizen/mla-report", label: "MLA Report" },
  ];

  return (
    <nav
      className="fixed top-0 w-full z-50 backdrop-blur-md border-b"
      style={{
        background: "rgba(10, 10, 10, 0.92)",
        borderBottom: "1px solid #27272a",
        boxShadow: "0 2px 24px 0 rgba(0,0,0,0.12)",
        WebkitBackdropFilter: "blur(12px)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
              }}
            >
              <span className="font-bold text-lg" style={{ color: "#3b82f6" }}>⚡</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline group-hover:text-[#3b82f6] transition" style={{ color: "#fff", letterSpacing: "0.04em" }}>CIVICOS</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  `transition text-sm font-semibold px-3 py-1 rounded-[8px] ${
                    pathname === link.href
                      ? "bg-[#3b82f614] text-[#3b82f6] border border-[#3b82f6] shadow"
                      : "text-[#a1a1aa] hover:text-[#fff] hover:bg-[#27272a]"
                  }`
                }
                style={{ border: pathname === link.href ? '1px solid #3b82f6' : '1px solid transparent' }}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2 p-2 rounded-lg transition border border-[#27272a] bg-[#18181b] hover:bg-[#3b82f6] hover:text-white"
            >
              {theme === "dark" ? <Sun size={20} color="#fff" /> : <Moon size={20} color="#18181b" />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg border border-[#27272a] bg-[#18181b] hover:bg-[#3b82f6] hover:text-white"
            >
              {theme === "dark" ? <Sun size={20} color="#fff" /> : <Moon size={20} color="#18181b" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg border border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:bg-[#3b82f6] hover:text-white transition"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden pb-4 space-y-2 border-t border-[#27272a] pt-4"
            style={{ background: "#18181b" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2 rounded font-medium transition text-sm ${
                  pathname === link.href
                    ? "bg-[#3b82f614] text-[#3b82f6]"
                    : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
                }`}
                style={{ border: pathname === link.href ? '1px solid #3b82f6' : '1px solid transparent' }}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </nav>
  );
}
