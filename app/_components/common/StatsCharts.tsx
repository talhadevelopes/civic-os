"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type CategoryData = { name: string; count: number }[];

export default function StatsCharts({ data }: { data: CategoryData }) {
  return (
    <div style={{ height: 280 }}>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={(v) => (v.length > 10 ? v.slice(0, 8) + "…" : v)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
          No data yet
        </div>
      )}
    </div>
  );
}
