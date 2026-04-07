"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Trophy,
  Users,
  GitCompare,
  MessageSquare,
  ShieldCheck,
  Map as MapIcon,
  Settings,
  Leaf,
  Menu,
  X,
  Bell,
  Route,
  BarChart3
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",       href: "/dashboard",   icon: LayoutDashboard },
  { label: "Feed",      href: "/feed",     icon: FileText },
  { label: "Leaderboard",     href: "/leaderboard", icon: Trophy },
  { label: "Authorities",     href: "/authorities", icon: Users },
  { label: "Ward Comparison", href: "/compare",     icon: GitCompare },
  { label: "AI Assistant",    href: "/assistant",   icon: MessageSquare, isAssistant: true },
  { label: "Smart Route",     href: "/smart-route", icon: Route },
];

export function PageShell({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function AppSidebar({ onAssistantClick }: { onAssistantClick?: () => void }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  function isActive(href: string) {
    if (href === "/feed") return pathname.startsWith("/feed");
    return pathname === href;
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[100] lg:hidden p-2 bg-white border border-gray-100 rounded-xl shadow-lg text-gray-600"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`border-r border-gray-100 flex flex-col fixed h-full bg-white z-[60] overflow-hidden transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"
      }`}>
        {/* Subtle Leafy Background */}
        <div className="absolute -top-10 -left-10 opacity-[0.02] pointer-events-none rotate-45">
          <Leaf size={200} />
        </div>

        {/* Logo - TOP OF SIDEBAR */}
        <div className={`p-6 flex items-center gap-2.5 mb-2 relative z-10 ${!isOpen && "lg:justify-center"}`}>
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-green-600/20 flex-shrink-0">
            <ShieldCheck size={18} />
          </div>
          <span className={`text-xl font-bold tracking-tighter text-gray-900 ${!isOpen && "lg:hidden"}`}>CIVICOS</span>
        </div>

        {/* Main Menu */}
        <div className="flex-1 px-6 space-y-0.5 relative z-10 overflow-y-auto">
          <p className={`text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3 ${!isOpen && "lg:hidden"}`}>Main Menu</p>
          {NAV_ITEMS.map((item: any) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            
            if (item.isAssistant) {
              return (
                <button
                  key={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onAssistantClick?.();
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-bold text-xs no-underline border-none text-left bg-transparent ${
                    active 
                      ? "bg-green-600 text-white shadow-lg shadow-green-600/20" 
                      : "text-gray-500 hover:bg-green-50 hover:text-green-600"
                  } ${!isOpen && "lg:justify-center lg:px-0"}`}
                  title={!isOpen ? item.label : ""}
                >
                  <Icon size={18} />
                  <span className={`${!isOpen && "lg:hidden"}`}>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-bold text-xs no-underline ${
                  active 
                    ? "bg-green-600 text-white shadow-lg shadow-green-600/20" 
                    : "text-gray-500 hover:bg-green-50 hover:text-green-600"
                } ${!isOpen && "lg:justify-center lg:px-0"}`}
                title={!isOpen ? item.label : ""}
              >
                <Icon size={18} />
                <span className={`${!isOpen && "lg:hidden"}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer / Account */}
        <div className="pt-6 border-t border-gray-100 relative z-10 px-6 pb-6">
          <p className={`text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3 ${!isOpen && "lg:hidden"}`}>Account</p>
          <Link 
            href="/notifications"
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-bold text-xs text-gray-500 hover:bg-green-50 hover:text-green-600 no-underline mb-1 ${!isOpen && "lg:justify-center lg:px-0"}`}
          >
            <Bell size={18} />
            <span className={`${!isOpen && "lg:hidden"}`}>Notifications</span>
          </Link>
          <Link 
            href="/profile"
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-bold text-xs text-gray-500 hover:bg-green-50 hover:text-green-600 no-underline ${!isOpen && "lg:justify-center lg:px-0"}`}
          >
            <Settings size={18} />
            <span className={`${!isOpen && "lg:hidden"}`}>Settings</span>
          </Link>
          
          {isOpen && (
            <div className="mt-4 p-4 bg-green-50 rounded-2xl relative overflow-hidden group">
              <Leaf className="absolute -bottom-2 -right-2 text-green-600/10 rotate-45 group-hover:scale-125 transition-transform" size={40} />
              <p className="text-[10px] font-bold text-green-600 mb-1 relative z-10 uppercase tracking-wider">PRO PLAN</p>
              <p className="text-[9px] text-gray-600 mb-3 leading-relaxed relative z-10">Advanced analytics and priority support.</p>
              <button className="w-full py-2 bg-green-600 text-white text-[10px] font-bold rounded-lg shadow-sm relative z-10">Upgrade</button>
            </div>
          )}
        </div>

        {/* Toggle Button for LG Desktop */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="hidden lg:flex absolute bottom-4 right-4 p-2 text-gray-300 hover:text-green-600 transition-colors"
        >
          {isOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </aside>
    </>
  );
}
