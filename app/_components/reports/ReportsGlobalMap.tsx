"use client";

import { useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
  const colors: Record<string, string> = {
    STREET_LIGHT: "#f59e0b",
    POTHOLE: "#ef4444",
    GARBAGE: "#10b981",
    WATER_SUPPLY: "#3b82f6",
    DRAINAGE: "#8b5cf6",
    OTHER: "#6b7280",
  };
  return colors[category] || colors.OTHER;
}

function createCategoryIcon(category: string, isSelected: boolean) {
  const bg = isSelected ? "#16a34a" : categoryColor(category);
  const scale = isSelected ? 1.4 : 1;
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
        transform: scale(${scale});
        transform-origin: center;
        cursor: pointer;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function ReportsGlobalMap({ reports }: { reports: GlobalMapReport[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

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
      className={`relative overflow-hidden transition-all duration-300 bg-white ${
        isFullScreen ? "fixed inset-0 z-[10000]" : "relative h-full"
      }`} 
    >
      {/* Full Screen Toggle Button */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[10001]">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFullScreen(!isFullScreen);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 text-gray-900 font-bold text-sm hover:scale-105 transition-all active:scale-95"
        >
          {isFullScreen ? (
            <>
              <X size={18} />
              Exit Full Screen
            </>
          ) : (
            <>
              <Maximize2 size={18} />
              View Full Map
            </>
          )}
        </button>
      </div>

      <MapContainer 
        center={center} 
        zoom={11} 
        style={{ height: "100%", width: "100%" }} 
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
      >
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
