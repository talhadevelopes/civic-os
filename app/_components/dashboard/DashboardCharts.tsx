"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type ChartData = {
  statusBreakdown: { name: string; value: number }[];
  categoryBreakdown: { name: string; count: number }[];
  monthlyTrend: { month: string; resolved: number; reported: number }[];
};

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#dc2626", "#7c3aed", "#64748b"];

export default function DashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/charts")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Status Breakdown
        </h3>
        <div style={{ height: 240 }} className="mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.statusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {data.statusBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Issues by Category
        </h3>
        <div style={{ height: 240 }} className="mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.categoryBreakdown} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Monthly Trend
        </h3>
        <div style={{ height: 240 }} className="mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthlyTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="reported" stroke="#ef4444" strokeWidth={2} name="Reported" />
              <Line type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
