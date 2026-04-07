"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap, GeoJSON, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Maximize2, X } from "lucide-react";

if (typeof window !== "undefined") {
  (window as any).L = L;
  require("leaflet.heat");
}

// Types
export type MapReport = {
  id: string;
  title: string;
  areaName: string;
  category: string;
  status: string;
  latitude: number;
  longitude: number;
};

export type WardCountMap = Record<string, { unresolvedCount: number; totalCount: number }>;

// ── Heatmap Component ──
function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;
    
    // @ts-ignore
    if (!L.heatLayer) {
      console.warn("leaflet.heat not yet available");
      return;
    }

    // @ts-ignore
    const heat = L.heatLayer(points, {
      radius: 35,
      blur: 20,
      max: 2,
      gradient: {
        0.2: "#3b82f6", // blue
        0.4: "#10b981", // green
        0.6: "#eab308", // yellow
        0.8: "#f97316", // orange
        1.0: "#ef4444", // red
      },
    });

    heat.addTo(map);
    return () => {
      if (map && heat) {
        map.removeLayer(heat);
      }
    };
  }, [map, points]);

  return null;
}

function getCategoryColor(category: string) {
  const cat = category.toUpperCase();
  if (cat.includes("ROAD") || cat.includes("POTHOLE")) return "#ef4444";
  if (cat.includes("GARBAGE") || cat.includes("DUMPING")) return "#ea580c";
  if (cat.includes("WATER") || cat.includes("FLOOD")) return "#3b82f6";
  if (cat.includes("LIGHT") || cat.includes("TRAFFIC")) return "#eab308";
  if (cat.includes("DOG") || cat.includes("ANIMAL")) return "#8b5cf6";
  return "#10b981"; // default green
}

function getCategoryLabel(category: string) {
  const cat = category.toUpperCase();
  if (cat.includes("ROAD") || cat.includes("POTHOLE")) return "Roads";
  if (cat.includes("GARBAGE") || cat.includes("DUMPING")) return "Garbage";
  if (cat.includes("WATER") || cat.includes("FLOOD")) return "Water";
  if (cat.includes("LIGHT") || cat.includes("TRAFFIC")) return "Infra";
  if (cat.includes("DRAIN")) return "Drainage";
  if (cat.includes("ANIMAL")) return "Stray Animals";
  return "Issue";
}

const createPinIcon = (category: string) => {
  const bg = getCategoryColor(category);
  const label = getCategoryLabel(category);
  const size = 16;

  return L.divIcon({
    className: "custom-report-icon",
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        background:${bg};
        border:2px solid white;
        border-radius:50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 8],
  });
};

function MapInvalidate({ isFullScreen }: { isFullScreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 150);
    setTimeout(() => map.invalidateSize(), 350);
  }, [isFullScreen, map]);
  return null;
}

export default function DashboardMapClient({
  reports,
  wardCounts,
}: {
  reports: MapReport[];
  wardCounts: WardCountMap;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);
  const [view, setView] = useState<"heat" | "pins" | "zones">("zones");

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullScreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  // Load GeoJSON for Ward Shapes
  useEffect(() => {
    fetch("/data/ghmc-wards.geojson")
      .then(res => {
        if (!res.ok) throw new Error("GeoJSON fetch failed");
        return res.json();
      })
      .then(data => setGeoData(data))
      .catch(err => console.error("Failed to load geojson:", err));
  }, []);

  const heatPoints = useMemo<[number, number, number][]>(() => {
    return (reports || []).map((r) => [r.latitude, r.longitude, 1]);
  }, [reports]);

  // FUZZY MATCHING FOR WARD NAMES
  const getStatsForWard = (wardNameFromGeo: string) => {
    if (!wardNameFromGeo) return null;
    
    // Direct match
    if (wardCounts[wardNameFromGeo]) return wardCounts[wardNameFromGeo];
    
    // Fuzzy match
    const cleanGeoName = wardNameFromGeo.toLowerCase().replace(/ward\s+\d+\s+/i, "").trim();
    const key = Object.keys(wardCounts).find(k => {
      const cleanKey = k.toLowerCase().replace(/ward\s+\d+\s+/i, "").trim();
      return cleanKey === cleanGeoName || cleanKey.includes(cleanGeoName) || cleanGeoName.includes(cleanKey);
    });
    
    return key ? wardCounts[key] : null;
  };

  const onEachWard = (feature: any, layer: any) => {
    const wardName = feature.properties?.name || feature.properties?.ward_name;
    const stats = getStatsForWard(wardName);
    if (stats) {
      layer.bindPopup(`
        <div style="padding: 8px; font-family: sans-serif;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${wardName}</div>
          <div style="font-size: 12px; color: #374151;">Unresolved Issues: <b>${stats.unresolvedCount}</b></div>
          <div style="font-size: 12px; color: #6b7280;">Total Reports: ${stats.totalCount}</div>
        </div>
      `);
    }
  };

  const wardStyle = (feature: any) => {
    const wardName = feature.properties?.name || feature.properties?.ward_name;
    const stats = getStatsForWard(wardName);
    const count = stats?.unresolvedCount || 0;
    
    // VIBRANT COLORS FOR CHOROPLETH
    let color = "#f8fafc"; 
    let stroke = "#cbd5e1";
    let fillOpacity = 0.6;
    if (count > 15) { color = "#991b1b"; stroke = "#7f1d1d"; fillOpacity = 0.8; }
    else if (count > 10) { color = "#dc2626"; stroke = "#b91c1c"; fillOpacity = 0.8; }
    else if (count > 5) { color = "#ea580c"; stroke = "#c2410c"; fillOpacity = 0.8; }
    else if (count > 2) { color = "#f59e0b"; stroke = "#b45309"; fillOpacity = 0.8; }
    else if (count > 0) { color = "#22c55e"; stroke = "#16a34a"; fillOpacity = 0.8; }

    return {
      fillColor: color,
      weight: 2,
      opacity: 1,
      color: stroke,
      fillOpacity: fillOpacity, 
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-white overflow-hidden transition-all duration-300 ${
        isFullScreen ? "h-screen" : "h-full min-h-[500px]"
      }`}
    >
      {/* Map Controls Overlay - Center Top */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000001] flex flex-col gap-3">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-1 shadow-2xl flex gap-1">
          {[
            { id: "heat", label: "Heatmap" },
            { id: "pins", label: "Pins" },
            { id: "zones", label: "Zones" }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setView(opt.id as any)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                view === opt.id ? "bg-green-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Full Screen Button */}
      <div className="absolute top-6 right-6 z-[1000001]">
        <button
          onClick={toggleFullScreen}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-200 font-black rounded-xl shadow-2xl hover:bg-gray-50 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
        >
          {isFullScreen ? <><X size={14} /> EXIT</> : <><Maximize2 size={14} /> Full Screen</>}
        </button>
      </div>

      {/* Map Legend */}
      {view === "pins" && (
        <div className="absolute bottom-6 left-[80px] z-[1000] bg-white/95 backdrop-blur-xl shadow-xl rounded-xl p-3 border border-gray-100 flex flex-col gap-1.5 pointer-events-auto">
          <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Issue Types</h4>
          {["ROAD", "GARBAGE", "WATER", "LIGHT", "ANIMAL", "OTHER"].map((cat) => (
            <div key={cat} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm border border-white" style={{ backgroundColor: getCategoryColor(cat) }} />
              <span className="text-[10px] font-bold text-gray-700">{getCategoryLabel(cat)}</span>
            </div>
          ))}
        </div>
      )}

      <MapContainer
        center={[17.385, 78.4867]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <MapInvalidate isFullScreen={isFullScreen} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* 1. Heatmap Layer */}
        {view === "heat" && <HeatmapLayer points={heatPoints} />}

        {/* 2. Pins Layer */}
        {view === "pins" && (reports || []).map(r => (
          <Marker 
            key={r.id} 
            position={[r.latitude, r.longitude]} 
            icon={createPinIcon(r.category)}
          >
            <Popup>
              <div className="p-1">
                <div className="font-bold text-sm">{r.title}</div>
                <div className="text-xs text-gray-500">{r.areaName}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 3. Zones Layer (GeoJSON) */}
        {view === "zones" && geoData && (
          <GeoJSON 
            data={geoData} 
            style={wardStyle} 
            onEachFeature={onEachWard} 
          />
        )}
      </MapContainer>
    </div>
  );
}
