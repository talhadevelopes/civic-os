"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Maximize2, X } from "lucide-react";

export type GlobalMapReport = {
  id: string;
  title: string;
  areaName: string;
  category: string;
  latitude: number;
  longitude: number;
};

function categoryColor(category: string) {
  const cat = category.toUpperCase();
  if (cat.includes("ROAD") || cat.includes("POTHOLE")) return "#ef4444";
  if (cat.includes("GARBAGE") || cat.includes("DUMPING")) return "#ea580c";
  if (cat.includes("WATER") || cat.includes("FLOOD")) return "#3b82f6";
  if (cat.includes("LIGHT") || cat.includes("TRAFFIC")) return "#eab308";
  if (cat.includes("ANIMAL") || cat.includes("DOG")) return "#8b5cf6";
  return "#10b981"; // default green
}

function getCategoryLabel(category: string) {
  const cat = category.toUpperCase();
  if (cat.includes("ROAD") || cat.includes("POTHOLE")) return "Roads";
  if (cat.includes("GARBAGE") || cat.includes("DUMPING")) return "Garbage";
  if (cat.includes("WATER") || cat.includes("FLOOD")) return "Water";
  if (cat.includes("LIGHT") || cat.includes("TRAFFIC")) return "Traffic/Light";
  if (cat.includes("DRAIN")) return "Drainage";
  if (cat.includes("ANIMAL")) return "Stray Animals";
  if (cat.includes("ENCROACH")) return "Encroachment";
  return "City Issue";
}

function createCategoryIcon(category: string, isSelected: boolean) {
  const bg = isSelected ? "#111827" : categoryColor(category); // dark grey when selected
  const scale = isSelected ? 1.4 : 1;
  const size = 16;
  const label = getCategoryLabel(category);

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
        transform: scale(${scale});
        transform-origin: center;
        cursor: pointer;
        position: relative;
        z-index: ${isSelected ? 50 : 10};
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 10],
  });
}

function MapInvalidate({ isFullScreen }: { isFullScreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    // Wait for css transitions
    setTimeout(() => map.invalidateSize(), 150);
    setTimeout(() => map.invalidateSize(), 350);
  }, [isFullScreen, map]);
  return null;
}

export default function ReportsGlobalMap({ reports }: { reports: GlobalMapReport[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  const selected = useMemo(() => reports.find((r) => r.id === selectedId) ?? null, [reports, selectedId]);

  const center = useMemo<[number, number]>(() => {
    if (selected) return [selected.latitude, selected.longitude];
    if (reports.length) return [reports[0].latitude, reports[0].longitude];
    return [17.385, 78.4867];
  }, [reports, selected]);

  if (!reports.length) {
    return (
      <div className="w-full h-full bg-green-50 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-bold">No reports with location data yet.</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full overflow-hidden transition-all duration-300 bg-white ${
        isFullScreen ? "h-screen" : "h-full min-h-[400px]"
      }`} 
    >
      {/* Full Screen Toggle Button */}
      <div className="absolute top-6 right-6 z-[10001]">
        <button
          onClick={toggleFullScreen}
          className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 text-gray-900 font-bold text-[10px] hover:scale-105 transition-all active:scale-95 uppercase tracking-widest"
        >
          {isFullScreen ? (
            <>
              <X size={14} /> EXIT FULL SCREEN
            </>
          ) : (
            <>
              <Maximize2 size={14} /> Full Screen
            </>
          )}
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-6 left-[80px] z-[1000] bg-white/95 backdrop-blur-xl shadow-xl rounded-xl p-3 border border-gray-100 flex flex-col gap-1.5 pointer-events-auto">
        <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Issue Types</h4>
        {["ROAD", "GARBAGE", "WATER", "LIGHT", "ANIMAL", "OTHER"].map((cat) => (
          <div key={cat} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shadow-sm border border-white" style={{ backgroundColor: categoryColor(cat) }} />
            <span className="text-[10px] font-bold text-gray-700">{getCategoryLabel(cat)}</span>
          </div>
        ))}
      </div>

      <MapContainer 
        center={center} 
        zoom={11} 
        style={{ height: "100%", width: "100%" }} 
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
      >
        <MapInvalidate isFullScreen={isFullScreen} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createCategoryIcon(report.category, selectedId === report.id)}
            eventHandlers={{
              click: () => setSelectedId(report.id),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[150px]">
                <h3 className="font-bold text-sm mb-1">{report.title}</h3>
                <p className="text-xs text-gray-500 mb-2">{report.areaName}</p>
                <Link
                  href={`/reports/${report.id}`}
                  className="text-xs font-bold text-green-600 hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
