"use client";

import dynamic from "next/dynamic";

import type { GlobalMapReport } from "@/components/ReportsGlobalMap";

const ReportsGlobalMap = dynamic(() => import("@/components/ReportsGlobalMap"), { ssr: false });

export default function ReportsGlobalMapClient({ reports }: { reports: GlobalMapReport[] }) {
  return <ReportsGlobalMap reports={reports} />;
}
