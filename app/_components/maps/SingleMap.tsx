"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function getCategoryColor(category?: string) {
  if (!category) return "#10b981";
  const cat = category.toUpperCase();
  if (cat.includes("ROAD") || cat.includes("POTHOLE")) return "#ef4444";
  if (cat.includes("GARBAGE") || cat.includes("DUMPING")) return "#ea580c";
  if (cat.includes("WATER") || cat.includes("FLOOD")) return "#3b82f6";
  if (cat.includes("LIGHT") || cat.includes("TRAFFIC")) return "#eab308";
  if (cat.includes("DOG") || cat.includes("ANIMAL")) return "#8b5cf6";
  return "#10b981";
}

const createPinIcon = (category?: string) => {
  const bg = getCategoryColor(category);
  const size = 18;

  return L.divIcon({
    className: "custom-report-icon",
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        background:${bg};
        border:2px solid white;
        border-radius:50%;
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function MapInvalidate() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
}

export default function SingleMap({ lat, lng, category }: { lat: number; lng: number, category?: string }) {
  if (!lat || !lng) return <div className="h-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">Location not provided</div>;

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={false}
      >
        <MapInvalidate />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <Marker position={[lat, lng]} icon={createPinIcon(category)} />
      </MapContainer>
    </div>
  );
}
