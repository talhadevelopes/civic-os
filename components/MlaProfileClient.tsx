"use client";

import dynamic from "next/dynamic";

const MlaProfileCharts = dynamic(() => import("@/components/MlaProfileCharts"), {
  ssr: false,
});
const MlaWardMap = dynamic(() => import("@/components/MlaWardMap"), {
  ssr: false,
});

type MapReport = {
  id: string;
  title: string;
  status: string;
  latitude: number;
  longitude: number;
};

export default function MlaProfileClient({
  byCategory,
  statusBreakdown,
  mapReports,
}: {
  byCategory: Record<string, number>;
  statusBreakdown: { open: number; resolved: number; reopened: number; rejected: number };
  mapReports: MapReport[];
}) {
  return (
    <>
      <div className="mt-8">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Ward Map
        </h2>
        <div className="mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
          <MlaWardMap reports={mapReports} />
        </div>
      </div>

      <div className="mt-8">
        <MlaProfileCharts
          byCategory={byCategory}
          statusBreakdown={statusBreakdown}
        />
      </div>
    </>
  );
}
