"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Megaphone,
  Trophy,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Shield,
  Building2,
  BarChart3,
  GitCompare,
  Bot,
} from "lucide-react";

type NavbarProps = {
  user: {
    id: string;
    name?: string | null;
    role: "CITIZEN" | "AUTHORITY";
    authorityBody?: string | null;
  } | null;
};

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/feed", label: "Feed", icon: Megaphone },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/authorities", label: "Authorities", icon: Building2 },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/assistant", label: "AI", icon: Bot },
];

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
            style={{ background: "var(--primary)", color: "var(--text-on-primary)" }}
          >
            C
          </div>
          <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            CIVICOS
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{
                color: isActive(href) ? "var(--primary)" : "var(--text-nav)",
                background: isActive(href) ? "var(--primary-light)" : "transparent",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Role badge */}
              {user.role === "AUTHORITY" && (
                <div
                  className="hidden items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium sm:flex"
                  style={{
                    background: "#eff6ff",
                    borderColor: "#93c5fd",
                    color: "#2563eb",
                  }}
                >
                  <Shield className="h-3 w-3" />
                  {user.authorityBody || "Authority"}
                </div>
              )}

              {/* Profile link */}
              <Link
                href="/profile"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
                style={{
                  color: isActive("/profile") ? "var(--primary)" : "var(--text-nav)",
                  background: isActive("/profile") ? "var(--primary-light)" : "transparent",
                }}
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{user.name?.split(" ")[0]}</span>
              </Link>

              {/* Logout */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  background: "var(--surface)",
                }}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: "var(--primary)",
                  color: "var(--text-on-primary)",
                  boxShadow: "var(--shadow-green)",
                }}
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="ml-1 rounded-lg p-2 md:hidden"
            style={{ color: "var(--text-nav)" }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div
          className="border-t px-4 pb-4 pt-2 md:hidden"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="grid gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium"
                style={{
                  color: isActive(href) ? "var(--primary)" : "var(--text-nav)",
                  background: isActive(href) ? "var(--primary-light)" : "transparent",
                }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
