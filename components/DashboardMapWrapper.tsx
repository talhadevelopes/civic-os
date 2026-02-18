"use client";

import dynamic from "next/dynamic";

const DashboardMapClient = dynamic(
  () => import("@/components/DashboardMapClient"),
  { ssr: false }
);

import type { MapReport } from "@/components/DashboardMapClient";
import type { WardCountMap } from "@/components/DashboardMapClient";

export default function DashboardMapWrapper({
  reports,
  wardCounts,
}: {
  reports: MapReport[];
  wardCounts: WardCountMap;
}) {
  return <DashboardMapClient reports={reports} wardCounts={wardCounts} />;
}
