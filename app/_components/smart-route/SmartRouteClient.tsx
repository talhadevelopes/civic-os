"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";

// Dynamic import for Leaflet map (no SSR)
const SmartRouteMap = dynamic(() => import("./SmartRouteMap"), { ssr: false });

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

  const analyze = useCallback(async (src?: string, dest?: string) => {
    const source = (src ?? sourceInput).trim();
    const destination = (dest ?? destInput).trim();
    if (!source || !destination) return;

    setLoading(true);
    setError(null);
    setResult(null);

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

  return (
    <div>
      {/* ── Input Card ── */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-600 text-white rounded-2xl flex items-center justify-center">
            <Route size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Route Input</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enter source and destination to analyze safety</p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); analyze(); }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input
                type="text"
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
                placeholder="Source (e.g. Tolichowki)"
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 bg-green-50 border border-green-100 focus:border-green-400 focus:bg-white rounded-2xl text-sm font-medium text-gray-900 outline-none transition-all disabled:opacity-60"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input
                type="text"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                placeholder="Destination (e.g. Banjara Hills)"
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 bg-blue-50 border border-blue-100 focus:border-blue-400 focus:bg-white rounded-2xl text-sm font-medium text-gray-900 outline-none transition-all disabled:opacity-60"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !sourceInput.trim() || !destInput.trim()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto self-end"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Route size={18} />}
            {loading ? "Analyzing…" : "Analyze Route"}
          </button>
        </form>

        {/* Example queries */}
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest self-center">Try:</span>
          {[
            { s: "Tolichowki", d: "Banjara Hills" },
            { s: "Kukatpally", d: "Secunderabad" },
            { s: "Mehdipatnam", d: "Jubilee Hills" },
          ].map((ex) => (
            <button
              key={`${ex.s}-${ex.d}`}
              onClick={() => { setSourceInput(ex.s); setDestInput(ex.d); analyze(ex.s, ex.d); }}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-50 hover:bg-green-50 hover:text-green-600 border border-gray-100 hover:border-green-200 text-gray-500 text-xs font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {ex.s} → {ex.d}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading Progress ── */}
      {loading && activeStep && (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Loader2 size={24} className="text-green-600 animate-spin" />
            <p className="text-base font-bold text-gray-900">{STEP_LABELS[activeStep]}</p>
          </div>
          <div className="flex gap-3">
            {(["routing", "analyzing", "summarizing"] as Step[]).map((step, i) => {
              const steps: Step[] = ["routing", "analyzing", "summarizing"];
              const currentIdx = steps.indexOf(activeStep);
              const isDone = i < currentIdx;
              const isActive = i === currentIdx;
              return (
                <div key={step} className={`flex-1 h-1.5 rounded-full transition-all ${isDone ? "bg-green-600" : isActive ? "bg-green-300 animate-pulse" : "bg-gray-100"}`} />
              );
            })}
          </div>
          <div className="flex gap-3 mt-2">
            {(["routing", "analyzing", "summarizing"] as Step[]).map((step, i) => {
              const steps: Step[] = ["routing", "analyzing", "summarizing"];
              const currentIdx = steps.indexOf(activeStep);
              return (
                <p key={step} className={`flex-1 text-[9px] font-bold uppercase tracking-widest ${i <= currentIdx ? "text-green-600" : "text-gray-300"}`}>
                  {["Routing", "Analyze", "Summary"][i]}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[2rem] p-6 mb-8 flex items-start gap-4">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800 text-sm">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="space-y-8">
          {/* Route stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "From", value: result.source, icon: MapPin, color: "text-green-600 bg-green-50 border-green-100" },
              { label: "To", value: result.destination, icon: MapPin, color: "text-gray-900 bg-gray-50 border-gray-100" },
              { label: "Distance", value: `${distKm} km`, icon: Ruler, color: "text-blue-600 bg-blue-50 border-blue-100" },
              { label: "Est. Time", value: `~${durationMin} min`, icon: Clock, color: "text-purple-600 bg-purple-50 border-purple-100" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`p-5 rounded-2xl border ${color} flex items-center gap-3`}>
                <Icon size={16} className="flex-shrink-0 opacity-70" />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">{label}</p>
                  <p className="text-sm font-bold truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* AI Summary card */}
          <div className={`rounded-3xl border p-6 ${isAllClear ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-center gap-2 mb-4">
              {isAllClear
                ? <CheckCircle2 size={20} className="text-green-600" />
                : <AlertTriangle size={20} className="text-amber-600" />
              }
              <h3 className={`font-bold text-sm ${isAllClear ? "text-green-900" : "text-amber-900"}`}>
                {isAllClear ? "All Clear" : `${result.flaggedComplaints.length} Issue${result.flaggedComplaints.length > 1 ? "s" : ""} Detected`}
              </h3>
            </div>
            <p className={`text-sm leading-relaxed ${isAllClear ? "text-green-800" : "text-amber-800"}`}>
              {result.summary}
            </p>
          </div>

          {/* Map Section - Full Width, No Border Radius */}
          <div className="bg-white border-y border-gray-100 shadow-2xl overflow-hidden min-h-[550px] -mx-10">
            <SmartRouteMap
              routePoints={result.routePoints}
              sourceCoords={result.sourceCoords}
              destCoords={result.destCoords}
              sourceName={result.source}
              destName={result.destination}
              flaggedComplaints={result.flaggedComplaints}
            />
          </div>

          {/* Flagged complaints list - Full Width */}
          {result.flaggedComplaints.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Flagged Issues on Route</h3>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                  {result.flaggedComplaints.length} issues detected
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-50">
                {result.flaggedComplaints.map((complaint) => (
                  <Link
                    key={complaint.id}
                    href={`/reports/${complaint.id}`}
                    className="flex items-start gap-4 px-6 py-5 hover:bg-gray-50 transition-colors no-underline group"
                  >
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
                        {complaint.title}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        {complaint.category.replace(/_/g, " ")} · {complaint.areaName}
                      </p>
                      <p className="text-[10px] text-amber-600 font-bold mt-1">
                        {complaint.distanceFromRoute}m from route
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-green-600 flex-shrink-0 mt-1 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !result && (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] py-20 text-center shadow-sm">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Route size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">AI Smart Route</h3>
          <p className="text-gray-400 font-medium text-sm max-w-md mx-auto">
            Type a route query above to see if your path crosses any open civic complaints — potholes, drainage issues, broken roads, and more.
          </p>
        </div>
      )}
    </div>
  );
}
