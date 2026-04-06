"use client";

import dynamic from "next/dynamic";

import type { GlobalMapReport } from "@/app/_components/reports/ReportsGlobalMap";

const ReportsGlobalMap = dynamic(
  () => import("@/app/_components/reports/ReportsGlobalMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }
);

export default function ReportsGlobalMapClient({ reports }: { reports: GlobalMapReport[] }) {
  return <ReportsGlobalMap reports={reports} />;
}
