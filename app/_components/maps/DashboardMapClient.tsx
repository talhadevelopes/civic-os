"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap, GeoJSON, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { Maximize2, X } from "lucide-react";

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
      radius: 40,
      blur: 25,
      max: 1,
      gradient: {
        0.4: "#fbbf24", // amber
        0.6: "#f97316", // orange
        0.8: "#ef4444", // red
        1.0: "#7f1d1d", // dark red
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

// ── Icons ──
const createPinIcon = (color: string) => L.divIcon({
  className: "custom-pin",
  html: `<div style="width:14px; height:14px; background:${color}; border:2px solid white; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

export default function DashboardMapClient({
  reports,
  wardCounts,
}: {
  reports: MapReport[];
  wardCounts: WardCountMap;
}) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);
  const [view, setView] = useState<"heat" | "pins" | "zones">("zones");

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
    
    // DARKER COLORS FOR CHOROPLETH
    let color = "#f8fafc"; 
    if (count > 15) color = "#7f1d1d";      // deep dark red
    else if (count > 10) color = "#b91c1c"; // red-700
    else if (count > 5) color = "#dc2626";  // red-600
    else if (count > 2) color = "#ea580c";  // orange-600
    else if (count > 0) color = "#16a34a";  // green-600

    return {
      fillColor: color,
      weight: 1.5,
      opacity: 1,
      color: "#ffffff",
      fillOpacity: 0.8, 
    };
  };

  return (
    <div 
      className={`relative w-full bg-white overflow-hidden transition-all duration-300 ${
        isFullScreen ? "fixed inset-0 z-[1000000] !h-screen !w-screen" : "h-full min-h-[500px]"
      }`}
    >
      {/* Map Controls Overlay */}
      <div className="absolute top-6 left-6 z-[1000001] flex flex-col gap-3">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-1 shadow-2xl flex gap-1">
          {[
            { id: "heat", label: "Heatmap" },
            { id: "pins", label: "Pins" },
            { id: "zones", label: "Zones" }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setView(opt.id as any)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
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
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-black rounded-2xl shadow-2xl hover:bg-red-700 transition-all active:scale-95 text-xs uppercase tracking-widest"
        >
          {isFullScreen ? <><X size={18} /> EXIT FULL SCREEN</> : <><Maximize2 size={18} /> Full Screen</>}
        </button>
      </div>

      <MapContainer
        center={[17.385, 78.4867]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
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
            icon={createPinIcon("#16a34a")}
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
