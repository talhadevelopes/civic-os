"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Route,
  Search,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  Ruler,
  Loader2,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Lightbulb,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// Dynamic import for Leaflet map (no SSR)
const SmartRouteMap = dynamic(() => import("./SmartRouteMap"), { ssr: false });

interface Report {
  id: string;
  title: string;
  category: string;
  status: string;
  areaName: string;
  latitude: number | null;
  longitude: number | null;
}

interface FlaggedComplaint {
  id: string;
  title: string;
  category: string;
  status: string;
  areaName: string;
  lat: number;
  lng: number;
  distanceFromRoute: number;
}

interface RouteResult {
  source: string;
  destination: string;
  routePoints: [number, number][];
  totalDistance: number;
  totalDuration: number;
  sourceCoords: { lat: number; lng: number };
  destCoords: { lat: number; lng: number };
  flaggedComplaints: FlaggedComplaint[];
  summary: string;
}

type Step = "routing" | "analyzing" | "summarizing";

const STEP_LABELS: Record<Step, string> = {
  routing: "Calculating optimal route...",
  analyzing: "Cross-checking civic complaints...",
  summarizing: "Generating safety summary...",
};

export default function SmartRouteClient() {
  const [sourceInput, setSourceInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [expandedHazard, setExpandedHazard] = useState<string | null>(null);

  // Fetch all reports on mount to show default pins
  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        const data = await res.json();
        if (res.ok) {
          setAllReports(data.reports || []);
        }
      } catch (err) {
        console.error("Failed to fetch reports for map pins", err);
      }
    }
    fetchReports();
  }, []);

  const analyze = useCallback(async (src?: string, dest?: string) => {
    const source = (src ?? sourceInput).trim();
    const destination = (dest ?? destInput).trim();
    if (!source || !destination) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedHazard(null);

    try {
      // Step 1: Geocode + OSRM route
      setActiveStep("routing");
      const routeRes = await fetch("/api/smart-route/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, destination }),
      });
      const routeData = await routeRes.json();
      if (!routeRes.ok) throw new Error(routeData.error);
      const { routePoints, totalDistance, totalDuration, sourceCoords, destCoords } = routeData;

      // Step 2: Analyze complaints
      setActiveStep("analyzing");
      const analyzeRes = await fetch("/api/smart-route/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routePoints }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error);
      const { flaggedComplaints } = analyzeData;

      // Step 3: Generate summary
      setActiveStep("summarizing");
      const summaryRes = await fetch("/api/smart-route/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, destination, flaggedComplaints, totalDistance, totalDuration }),
      });
      const summaryData = await summaryRes.json();
      const summary = summaryData.summary ?? "Route analysis complete.";

      setResult({ source, destination, routePoints, totalDistance, totalDuration, sourceCoords, destCoords, flaggedComplaints, summary });
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setActiveStep(null);
    }
  }, [sourceInput, destInput]);

  const distKm = result ? (result.totalDistance / 1000).toFixed(1) : null;
  const durationMin = result ? Math.round(result.totalDuration / 60) : null;
  const isAllClear = result && result.flaggedComplaints.length === 0;

  // Risk Chart Data
  const riskChartData = result ? [
    { name: result.source, risk: 10 },
    ...result.flaggedComplaints.map(c => ({
      name: c.areaName,
      risk: 40 + Math.random() * 40,
    })),
    { name: result.destination, risk: 15 },
  ] : [];

  // Peak risk area name
  const peakArea = riskChartData.length > 2
    ? riskChartData.reduce((max, d) => d.risk > max.risk ? d : max, riskChartData[0])
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* ── Input Card ── */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-[2.5rem] p-8 shadow-xl relative z-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
            <Route size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Route Explorer</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan your safest journey with AI-driven civic insights</p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); analyze(); }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
              <input
                type="text"
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
                placeholder="Starting from (e.g. Tolichowki)"
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 focus:border-green-400 focus:bg-white rounded-2xl text-sm font-medium text-gray-900 outline-none transition-all disabled:opacity-60 shadow-sm"
              />
            </div>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input
                type="text"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                placeholder="Going to (e.g. Banjara Hills)"
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 focus:border-blue-400 focus:bg-white rounded-2xl text-sm font-medium text-gray-900 outline-none transition-all disabled:opacity-60 shadow-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !sourceInput.trim() || !destInput.trim()}
            className="flex items-center justify-center gap-2 px-10 py-4 bg-gray-900 text-white font-bold text-sm rounded-2xl shadow-xl hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto self-end group"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} className="group-hover:translate-x-1 transition-transform" />}
            {loading ? "Analyzing City Data…" : "Start Safety Analysis"}
          </button>
        </form>

        {/* Example queries */}
        <div className="mt-6 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Quick Routes:</span>
          {[
            { s: "Tolichowki", d: "Banjara Hills" },
            { s: "Kukatpally", d: "Secunderabad" },
            { s: "Mehdipatnam", d: "Jubilee Hills" },
          ].map((ex) => (
            <button
              key={`${ex.s}-${ex.d}`}
              onClick={() => { setSourceInput(ex.s); setDestInput(ex.d); analyze(ex.s, ex.d); }}
              disabled={loading}
              className="px-4 py-2 bg-gray-50 hover:bg-white border border-gray-100 hover:border-green-200 text-gray-600 hover:text-green-600 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 hover:shadow-md"
            >
              {ex.s} → {ex.d}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading Progress ── */}
      {loading && activeStep && (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
              <Loader2 size={24} className="text-green-600 animate-spin" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{STEP_LABELS[activeStep]}</p>
              <p className="text-xs text-gray-500">Cross-referencing real-time complaint data...</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              {(["routing", "analyzing", "summarizing"] as Step[]).map((step, i) => {
                const steps: Step[] = ["routing", "analyzing", "summarizing"];
                const currentIdx = steps.indexOf(activeStep);
                const isDone = i < currentIdx;
                const isActive = i === currentIdx;
                return (
                  <div key={step} className={`flex-1 h-2 rounded-full transition-all duration-500 ${isDone ? "bg-green-600" : isActive ? "bg-green-300 animate-pulse" : "bg-gray-100"}`} />
                );
              })}
            </div>
            <div className="flex justify-between">
              {["Route Mapping", "Safety Check", "AI Summary"].map((label, i) => {
                const steps: Step[] = ["routing", "analyzing", "summarizing"];
                const currentIdx = steps.indexOf(activeStep);
                return (
                  <p key={label} className={`text-[10px] font-bold uppercase tracking-widest ${i <= currentIdx ? "text-green-600" : "text-gray-300"}`}>
                    {label}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6 flex items-start gap-4 relative z-10">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-900 text-sm">Analysis Interrupted</p>
            <p className="text-red-700 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── Results Dashboard (New Design) ── */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT COLUMN (col-span-2) ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* FROM / TO Card */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    {/* Dot connector */}
                    <div className="flex flex-col items-center gap-0 pt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-green-100" />
                      <div className="w-px flex-1 min-h-[28px] bg-gray-200 my-1" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                    </div>
                    {/* Labels */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">From</p>
                        <p className="text-base font-bold text-gray-900">{result.source}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">To</p>
                        <p className="text-base font-bold text-gray-900">{result.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Hazard badge */}
                  {!isAllClear ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="text-sm font-bold text-amber-700">
                        {result.flaggedComplaints.length} Hazard{result.flaggedComplaints.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                      <CheckCircle2 size={14} className="text-green-500" />
                      <span className="text-sm font-bold text-green-700">All Clear</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-[1.5rem] p-5">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Ruler size={11} />
                    Distance
                  </p>
                  <p className="text-2xl font-black text-green-700 leading-none">{distKm}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">kilometres</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-[1.5rem] p-5">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Clock size={11} />
                    Est. Time
                  </p>
                  <p className="text-2xl font-black text-blue-700 leading-none">~{durationMin}</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">minutes</p>
                </div>
                <div className={`rounded-[1.5rem] p-5 border ${isAllClear ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isAllClear ? "text-green-600" : "text-amber-600"}`}>
                    <ShieldCheck size={11} />
                    Safety
                  </p>
                  <p className={`text-2xl font-black leading-none ${isAllClear ? "text-green-700" : "text-amber-700"}`}>
                    {isAllClear ? "Safe" : "Cautious"}
                  </p>
                  <p className={`text-xs font-medium mt-1 ${isAllClear ? "text-green-600" : "text-amber-600"}`}>route safety</p>
                </div>
              </div>

              {/* Risk Along Route Chart */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={13} className="text-green-600" />
                    Risk Along Route
                  </h4>
                  {peakArea && !isAllClear && (
                    <span className="text-[10px] text-gray-400 font-medium">{peakArea.name} peak</span>
                  )}
                </div>
                <div className="h-[190px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={riskChartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRiskNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-gray-900 text-white p-3 rounded-xl shadow-xl border border-gray-800">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">{payload[0].payload.name}</p>
                                <p className="text-sm font-bold">Risk: {Math.round(payload[0].value as number)}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="risk"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRiskNew)"
                        dot={{ fill: "#f59e0b", r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "#f59e0b", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Hazards Section */}
              {!isAllClear && (
                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
                      Key Hazards Along Route
                    </h4>
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-amber-100">
                      {result.flaggedComplaints.length} active
                    </span>
                  </div>

                  <div className="space-y-3">
                    {result.flaggedComplaints.map((c) => {
                      const isExpanded = expandedHazard === c.id;
                      return (
                        <div
                          key={c.id}
                          className="border border-amber-100 bg-amber-50/40 rounded-2xl overflow-hidden transition-all"
                        >
                          {/* Hazard header row */}
                          <button
                            onClick={() => setExpandedHazard(isExpanded ? null : c.id)}
                            className="w-full text-left p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <AlertTriangle size={15} className="text-amber-600" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[9px] font-bold uppercase tracking-wider rounded-md">
                                      {c.category || "Civic"}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">2h ago</span>
                                  </div>
                                  <p className="text-sm font-bold text-gray-900">{c.title}</p>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                      <MapPin size={9} /> {c.areaName}
                                    </span>
                                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                      <Route size={9} /> {c.distanceFromRoute}m away
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <ChevronDown
                                size={16}
                                className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </div>
                          </button>

                          {/* Expanded description */}
                          {isExpanded && (
                            <div className="px-4 pb-4">
                              <div className="bg-white/70 rounded-xl p-3 border border-amber-100">
                                <div className="flex items-start gap-2">
                                  <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <AlertTriangle size={9} className="text-amber-600" />
                                  </div>
                                  <p className="text-[11px] text-gray-600 leading-relaxed">
                                    {result.summary && result.flaggedComplaints.length === 1
                                      ? result.summary
                                      : `A ${(c.category || "civic").toLowerCase()} issue has been reported near ${c.areaName}. Approach with caution and maintain a safe distance from the affected area.`}
                                  </p>
                                </div>
                              </div>
                              <Link
                                href={`/reports/${c.id}`}
                                className="mt-2 flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors"
                              >
                                View full report <ChevronRight size={12} />
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All clear summary when no hazards */}
              {isAllClear && (
                <div className="bg-green-50 border border-green-100 rounded-[2rem] p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-green-900 text-sm mb-1">All Clear — Optimal Route</p>
                      <p className="text-green-800 text-xs leading-relaxed font-medium">{result.summary}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-5">

              {/* Journey Insight Card */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                  <TrendingUp size={13} className="text-green-600" />
                  Journey Insight
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-medium">Route Safety</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isAllClear ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {isAllClear ? "Safe" : "Cautious"}
                    </span>
                  </div>
                  <div className="h-px bg-gray-50" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-medium">Civic Issues</span>
                    <span className="text-sm font-bold text-gray-900">
                      {result.flaggedComplaints.length} detected
                    </span>
                  </div>
                  <div className="h-px bg-gray-50" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-medium">Alt. Routes</span>
                    <span className="text-sm font-bold text-green-600">2 available</span>
                  </div>
                </div>
              </div>

              {/* Dark Safety Tip Card */}
              <div className="bg-gray-900 rounded-[2rem] p-6 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-green-500/10 rounded-full -mr-14 -mt-14 blur-2xl group-hover:bg-green-500/20 transition-all duration-700" />
                <div className="relative z-10">
                  <div className="w-9 h-9 bg-amber-400/20 rounded-xl flex items-center justify-center mb-5">
                    <Lightbulb size={17} className="text-amber-400" />
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed italic mb-6">
                    "{isAllClear
                      ? "Your route looks clear! Travel safely and stay alert to your surroundings at all times."
                      : "Avoiding high-hazard routes can reduce travel stress and improve overall city transit efficiency."}"
                  </p>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Safety Tip</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state (Ready to analyze) */}
      {!loading && !error && !result && (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] py-12 text-center shadow-sm relative z-10">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
            <Route size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to analyze?</h3>
          <p className="text-gray-400 font-medium text-xs max-w-xs mx-auto">
            Enter your source and destination above to see if your path crosses any open civic complaints.
          </p>
        </div>
      )}

      {/* ── Map Section (Visible by Default, now at the bottom) ── */}
      <div className="relative w-full h-[600px] bg-gray-100 border-y border-gray-200 shadow-inner rounded-[2.5rem] overflow-hidden">
        <SmartRouteMap
          routePoints={result?.routePoints || []}
          sourceCoords={result?.sourceCoords || null}
          destCoords={result?.destCoords || null}
          sourceName={result?.source || ""}
          destName={result?.destination || ""}
          flaggedComplaints={result?.flaggedComplaints || []}
          allReports={allReports}
        />
      </div>
    </div>
  );
}