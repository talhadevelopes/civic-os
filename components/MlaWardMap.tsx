"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type MapReport = {
  id: string;
  title: string;
  status: string;
  latitude: number;
  longitude: number;
};

function getPinColor(status: string): string {
  switch (status) {
    case "REPORTED":
    case "ASSIGNED":
      return "#ef4444";
    case "IN_PROGRESS":
    case "REOPENED":
      return "#f59e0b";
    case "RESOLVED_PENDING_VERIFICATION":
      return "#a855f7";
    case "CONFIRMED_FIXED":
      return "#16a34a";
    case "REJECTED":
      return "#6b7280";
    default:
      return "#64748b";
  }
}

export default function MlaWardMap({ reports }: { reports: MapReport[] }) {
  const center: [number, number] =
    reports.length > 0
      ? [
          reports.reduce((s, r) => s + r.latitude, 0) / reports.length,
          reports.reduce((s, r) => s + r.longitude, 0) / reports.length,
        ]
      : [17.385, 78.4867];

  const createIcon = (status: string) => {
    const c = getPinColor(status);
    return L.divIcon({
      className: "custom-pin",
      html: `<div style="width:12px;height:12px;background:${c};border:2px solid white;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,0.3)"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  };

  return (
    <div style={{ height: "320px" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {reports.map((r) => (
          <Marker
            key={r.id}
            position={[r.latitude, r.longitude]}
            icon={createIcon(r.status)}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>{r.title}</p>
                <p style={{ fontSize: 12, color: "#6b7280" }}>
                  {r.status.replace(/_/g, " ")}
                </p>
                <a
                  href={`/reports/${r.id}`}
                  style={{
                    fontSize: 12,
                    color: "#16a34a",
                    fontWeight: 600,
                    marginTop: 6,
                    display: "inline-block",
                  }}
                >
                  View issue →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
