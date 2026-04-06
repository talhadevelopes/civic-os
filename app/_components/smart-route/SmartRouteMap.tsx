"use client";

import { useEffect, useRef } from "react";

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

interface Props {
  routePoints: [number, number][];
  sourceCoords: { lat: number; lng: number };
  destCoords: { lat: number; lng: number };
  sourceName: string;
  destName: string;
  flaggedComplaints: FlaggedComplaint[];
}

export default function SmartRouteMap({
  routePoints,
  sourceCoords,
  destCoords,
  sourceName,
  destName,
  flaggedComplaints,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      const map = L.map(mapRef.current!, { zoomControl: true });
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Draw the route polyline in brand green
      const polyline = L.polyline(routePoints, {
        color: "#16a34a",
        weight: 5,
        opacity: 0.85,
      }).addTo(map);

      // Source pin — green
      const greenIcon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;background:#16a34a;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:14px;font-weight:bold;">A</span>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      // Destination pin — dark
      const destIcon = L.divIcon({
        className: "",
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

      // Warning pins — amber/orange for flagged complaints
      flaggedComplaints.forEach((complaint) => {
        const warningIcon = L.divIcon({
          className: "",
          html: `<div style="width:24px;height:24px;background:#f59e0b;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
            <span style="color:white;font-size:12px;font-weight:bold;">!</span>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([complaint.lat, complaint.lng], { icon: warningIcon })
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

      // Fit to route bounds
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="w-full h-full rounded-[2rem]" />;
}
