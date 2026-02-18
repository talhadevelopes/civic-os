"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer as PieResponsive } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  open: "#f59e0b",
  resolved: "#16a34a",
  reopened: "#f97316",
  rejected: "#6b7280",
};

const CATEGORY_COLORS = [
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#f59e0b",
  "#dc2626",
  "#0f766e",
  "#ea580c",
  "#64748b",
];

type Props = {
  byCategory: Record<string, number>;
  statusBreakdown: { open: number; resolved: number; reopened: number; rejected: number };
};

export default function MlaProfileCharts({ byCategory, statusBreakdown }: Props) {
  const categoryData = Object.entries(byCategory)
    .map(([name, count]) => ({
      name: name.replace(/_/g, " "),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const statusData = [
    { name: "Open", value: statusBreakdown.open, fill: STATUS_COLORS.open },
    { name: "Resolved", value: statusBreakdown.resolved, fill: STATUS_COLORS.resolved },
    { name: "Reopened", value: statusBreakdown.reopened, fill: STATUS_COLORS.reopened },
    { name: "Rejected", value: statusBreakdown.rejected, fill: STATUS_COLORS.rejected },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div
        className="rounded-2xl border p-6"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Issues by Category
        </h3>
        <div style={{ height: 280 }} className="mt-4">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v.length > 12 ? v.slice(0, 10) + "…" : v)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="flex h-full items-center justify-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No data
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl border p-6"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Status Breakdown
        </h3>
        <div style={{ height: 280 }} className="mt-4">
          {statusData.length > 0 ? (
            <PieResponsive width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => [v ?? 0, ""]} />
                <Legend />
              </PieChart>
            </PieResponsive>
          ) : (
            <div
              className="flex h-full items-center justify-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
