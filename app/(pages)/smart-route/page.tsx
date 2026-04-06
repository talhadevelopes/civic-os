import { PageShell } from "@/app/_components/global/AppSidebar";
import SmartRouteClient from "@/app/_components/smart-route/SmartRouteClient";
import { Route, Bell, Plus } from "lucide-react";
import Link from "next/link";

export default function SmartRoutePage() {
  return (
    <PageShell>
      {/* Header */}
      <header className="h-24 px-10 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Route size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">AI Smart Route</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Civic-aware route analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="p-3 text-gray-400 hover:text-green-600 bg-green-50 rounded-xl transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <Link
            href="/report-issue"
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-sm no-underline"
          >
            <Plus size={20} /> New Report
          </Link>
        </div>
      </header>

      <div className="p-10">
        {/* Page title */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">AI Smart Route</h1>
          <p className="text-gray-500 font-medium">
            Describe your route in plain English — we&apos;ll check it against all open civic issues and warn you of anything in your path.
          </p>
        </div>

        <SmartRouteClient />
      </div>
    </PageShell>
  );
}
