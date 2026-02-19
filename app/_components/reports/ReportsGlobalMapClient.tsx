"use client";

import dynamic from "next/dynamic";

import type { GlobalMapReport } from "@/app/_components/reports/ReportsGlobalMap";

const ReportsGlobalMap = dynamic(() => import("@/app/_components/reports/ReportsGlobalMap"), { ssr: false });

export default function ReportsGlobalMapClient({ reports }: { reports: GlobalMapReport[] }) {
  return <ReportsGlobalMap reports={reports} />;
}
