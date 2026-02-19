"use client";

import dynamic from "next/dynamic";

const DashboardMapClient = dynamic(
  () => import("@/app/_components/maps/DashboardMapClient"),
  { ssr: false }
);

import type { MapReport } from "@/app/_components/maps/DashboardMapClient";
import type { WardCountMap } from "@/app/_components/maps/DashboardMapClient";

export default function DashboardMapWrapper({
  reports,
  wardCounts,
}: {
  reports: MapReport[];
  wardCounts: WardCountMap;
}) {
  return <DashboardMapClient reports={reports} wardCounts={wardCounts} />;
}
