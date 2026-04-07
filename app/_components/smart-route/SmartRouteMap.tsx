"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2, X } from "lucide-react";

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

interface Report {
  id: string;
  title: string;
  category: string;
  status: string;
  areaName: string;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  routePoints: [number, number][];
  sourceCoords: { lat: number; lng: number } | null;
  destCoords: { lat: number; lng: number } | null;
  sourceName: string;
  destName: string;
  flaggedComplaints: FlaggedComplaint[];
  allReports?: Report[];
}

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

export default function SmartRouteMap({
  routePoints,
  sourceCoords,
  destCoords,
  sourceName,
  destName,
  flaggedComplaints,
  allReports = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
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

  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
      setTimeout(() => {
        map.invalidateSize();
      }, 350);
    }
  }, [isFullScreen, map]);

  useEffect(() => {
    if (!mapRef.current || map) return;

    // Use a small delay to ensure container is fully dimensioned
    const initTimeout = setTimeout(() => {
      if (!mapRef.current || map) return;

      const instance = L.map(mapRef.current, { 
        zoomControl: true,
        attributionControl: false
      });
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(instance);

      // Default view for Hyderabad
      instance.setView([17.385, 78.4867], 12);
      
      // Force immediate resize check
      instance.invalidateSize();
      setMap(instance);
    }, 100);

    return () => {
      clearTimeout(initTimeout);
      if (map) {
        //@ts-ignore
        map.remove();
        setMap(null);
      }
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    
    // Clear existing layers except tile layer
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return;
      map.removeLayer(layer);
    });

    // Track IDs of flagged complaints to avoid double-rendering
    const flaggedIds = new Set(flaggedComplaints.map(c => c.id));

    allReports.forEach((report) => {
      const lat = report.latitude ?? (report as any).lat;
      const lng = report.longitude ?? (report as any).lng;
      const color = categoryColor(report.category);
      
      const coloredIcon = L.divIcon({
        className: "", 
        html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:block;opacity:1;cursor:pointer;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      if (lat && lng && !flaggedIds.has(report.id)) {
        L.marker([lat, lng], { icon: coloredIcon, zIndexOffset: 0 })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:140px; padding: 2px;">
              <p style="margin:0; font-size:9px; font-weight:700; color:${color}; text-transform:uppercase; letter-spacing:0.05em;">${getCategoryLabel(report.category)}</p>
              <p style="margin:4px 0 0 0; font-size:12px; font-weight:700; color:#374151;">${report.title}</p>
              <p style="margin:2px 0 0 0; font-size:10px; color:#64748b;">${report.areaName}</p>
            </div>
          `);
      }
    });

    // 2. Draw the route polyline if exists
    let polyline: L.Polyline | null = null;
    if (routePoints.length > 0) {
      // Glow effect for route
      L.polyline(routePoints, {
        color: "#16a34a",
        weight: 12,
        opacity: 0.1,
      }).addTo(map);

      polyline = L.polyline(routePoints, {
        color: "#16a34a",
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(map);
    }

    // 3. Source & Destination pins
    if (sourceCoords && destCoords) {
      const greenIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="width:28px;height:28px;background:#16a34a;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:14px;font-weight:bold;">A</span>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const destIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="width:28px;height:28px;background:#111827;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:14px;font-weight:bold;">B</span>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([sourceCoords.lat, sourceCoords.lng], { icon: greenIcon })
        .addTo(map)
        .bindPopup(`<strong>Start:</strong> ${sourceName}`);

      L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<strong>End:</strong> ${destName}`);
    }

    // 4. Highlighted Warning pins for flagged complaints
    flaggedComplaints.forEach((complaint) => {
      const warningIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="width:24px;height:24px;background:#f59e0b;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:12px;font-weight:bold;">!</span>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([complaint.lat, complaint.lng], { icon: warningIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:180px;">
            <strong style="color:#111827;font-size:12px;">${complaint.title}</strong><br/>
            <span style="color:#6b7280;font-size:11px;">${complaint.category.replace(/_/g, " ")}</span><br/>
            <span style="color:#6b7280;font-size:11px;">${complaint.areaName}</span><br/>
            <span style="color:#f59e0b;font-size:11px;font-weight:600;">${complaint.distanceFromRoute}m from route</span><br/>
            <a href="/reports/${complaint.id}" style="color:#16a34a;font-size:11px;font-weight:600;">View Report →</a>
          </div>`
        );
    });

    // 5. Fit to route bounds if polyline exists, otherwise fit to all reports if they exist
    if (polyline) {
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else if (allReports.length > 0 && !sourceCoords) {
      // If no route, but we have reports, ensure we can see them (center on Hyderabad)
      map.setView([17.385, 78.4867], 12);
    }

    // Force map to update its size calculation after a small delay
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

  }, [map, routePoints, sourceCoords, destCoords, sourceName, destName, flaggedComplaints, allReports]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full overflow-hidden transition-all duration-300 bg-white ${
        isFullScreen ? "h-screen" : "h-full min-h-[500px]"
      }`} 
    >
      <div ref={mapRef} className="w-full h-full relative" />
      
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
      <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-4 border border-gray-100 flex flex-col gap-2 pointer-events-auto">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Issue Types</h4>
        {["ROAD", "GARBAGE", "WATER", "LIGHT", "ANIMAL", "OTHER"].map((cat) => (
          <div key={cat} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shadow-sm border border-white" style={{ backgroundColor: categoryColor(cat) }} />
            <span className="text-[11px] font-bold text-gray-700">{getCategoryLabel(cat)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
