"use client";

import dynamic from "next/dynamic";

const MlaWardMap = dynamic(() => import("@/app/_components/maps/MlaWardMap"), { ssr: false });

type MapReport = { id: string; title: string; status: string; latitude: number; longitude: number };

export default function CompareMapWrapper({ reports }: { reports: MapReport[] }) {
  return <MlaWardMap reports={reports} />;
}
