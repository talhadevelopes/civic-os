"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  Search,
  Bell,
  Plus,
  LogOut,
  User as UserIcon,
} from "lucide-react";

type NavbarProps = {
  user: {
    id: string;
    name?: string | null;
    role: "CITIZEN" | "AUTHORITY";
    avatar?: string | null;
  } | null;
};

export default function Navbar({ user }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100/50">
      {/* Search Bar - Moved to the right of Sidebar area */}
      <div className="flex-1 max-w-lg">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-600 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search reports, areas, or categories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-green-50 border-transparent focus:border-green-200 focus:bg-white border rounded-xl outline-none transition-all text-[13px] font-medium"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <button className="p-2.5 text-gray-400 hover:text-green-600 bg-green-50 rounded-xl transition-all relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
        </button>
        
        <Link
          href="/report-issue"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-xl shadow-md shadow-green-600/10 hover:scale-105 active:scale-95 transition-all text-xs no-underline"
        >
          <Plus size={16} />
          New Report
        </Link>

        {user ? (
          <div className="flex items-center gap-3 ml-2 border-l border-gray-100 pl-4">
            <Link href="/profile" className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 overflow-hidden cursor-pointer hover:border-green-300 transition-all flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="text-green-600" size={18} />
              )}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 bg-gray-900 text-white font-bold rounded-xl text-xs no-underline ml-2"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
