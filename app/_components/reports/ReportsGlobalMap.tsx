"use client";

import React, { useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type GlobalMapReport = {
  id: string;
  title: string;
  areaName: string;
  category: string;
  latitude: number;
  longitude: number;
};

function FlyToLocation({ coords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap();
  if (coords) {
    map.flyTo([coords.lat, coords.lng], 14, { duration: 1.0 });
  }
  return null;
}

function categoryLabel(category: string) {
  return category.replaceAll("_", " ");
}

function categoryColor(category: string) {
  switch (category) {
    case "POTHOLES":
      return "#16a34a";
    case "GARBAGE":
      return "#111827";
    case "WATER_LEAKAGE":
      return "#2563eb";
    case "DRAINAGE_SEWAGE":
      return "#7c3aed";
    case "STREETLIGHT":
      return "#f59e0b";
    case "ROAD_DAMAGE":
      return "#dc2626";
    case "ILLEGAL_DUMPING":
      return "#0f766e";
    case "STRAY_ANIMALS":
      return "#ea580c";
    case "TRAFFIC_SIGNAL":
      return "#db2777";
    case "ENCROACHMENT":
      return "#475569";
    default:
      return "#64748b";
  }
}

function createCategoryIcon(category: string, isSelected: boolean) {
  const label = categoryLabel(category);
  const bg = isSelected ? "#16a34a" : categoryColor(category);
  const border = isSelected ? "#15803d" : "rgba(0,0,0,0.22)";
  const shadow = isSelected ? "0 6px 18px rgba(22,163,74,0.35)" : "0 4px 14px rgba(0,0,0,0.25)";
  const scale = isSelected ? 1.12 : 1;

  // IMPORTANT: fixed size + fixed anchor so it doesn't jump/disappear.
  const w = 110;
  const h = 34;

  return L.divIcon({
    className: "custom-report-icon",
    html: `
      <div style="
        width:${w}px;
        height:${h}px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:${bg};
        color:white;
        border:2px solid ${border};
        border-radius:999px;
        font-size:12px;
        font-weight:800;
        letter-spacing:0.02em;
        white-space:nowrap;
        box-shadow:${shadow};
        font-family: system-ui, sans-serif;
        transform: scale(${scale});
        transform-origin: center;
        cursor: pointer;
        user-select:none;
      ">${label}</div>
    `,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
    popupAnchor: [0, -h / 2],
  });
}

function legendItems() {
  return [
    { key: "POTHOLES", label: "Potholes" },
    { key: "GARBAGE", label: "Garbage" },
    { key: "WATER_LEAKAGE", label: "Water Leakage" },
    { key: "DRAINAGE_SEWAGE", label: "Drainage / Sewage" },
    { key: "STREETLIGHT", label: "Streetlight" },
    { key: "ROAD_DAMAGE", label: "Road Damage" },
    { key: "OTHER", label: "Other" },
  ];
}

export default function ReportsGlobalMap({ reports }: { reports: GlobalMapReport[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // live list maintained in state so we can append new reports
  const [liveReports, setLiveReports] = useState<GlobalMapReport[]>(reports);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  // initialize all categories as active once component mounts
  React.useEffect(() => {
    setActiveCategories(legendItems().map((it) => it.key));
  }, []);

  // subscribe to new-report events via SSE
  React.useEffect(() => {
    const es = new EventSource("/api/reports/stream");
    es.addEventListener("new", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data) as GlobalMapReport;
        setLiveReports((prev) => [data, ...prev]);
      } catch (err) {
        console.error("malformed event data", err);
      }
    });

    es.addEventListener("update", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data) as GlobalMapReport;
        setLiveReports((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      } catch (err) {
        console.error("malformed update event", err);
      }
    });

    es.onerror = () => {
      // if connection fails, it will retry automatically; log for debugging
      console.warn("SSE connection to /api/reports/stream closed");
    };
    return () => {
      es.close();
    };
  }, []);

  const selected = useMemo(
    () => liveReports.find((r) => r.id === selectedId) ?? null,
    [liveReports, selectedId]
  );

  const center = useMemo<[number, number]>(() => {
    if (selected) return [selected.latitude, selected.longitude];
    if (liveReports.length) return [liveReports[0].latitude, liveReports[0].longitude];
    return [17.385, 78.4867];
  }, [liveReports, selected]);

  if (!liveReports.length) {
    return (
      <div
        className="w-full rounded-2xl overflow-hidden border flex items-center justify-center"
        style={{ height: "420px", background: "var(--primary-light)", borderColor: "var(--border)" }}
      >
        <p style={{ color: "var(--text-body)" }}>No reports with location data yet.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-2xl border" style={{ height: "520px", borderColor: "var(--border)" }}>
      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        <FlyToLocation coords={selected ? { lat: selected.latitude, lng: selected.longitude } : null} />

        {liveReports
          .filter((r) => activeCategories.includes(r.category))
          .map((r) => {
            const isSelected = selectedId === r.id;
          return (
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude]}
              icon={createCategoryIcon(r.category, isSelected)}
              riseOnHover
              eventHandlers={{
                click: () => setSelectedId(isSelected ? null : r.id),
              }}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              <Popup autoPan>
                <div style={{ minWidth: 220 }}>
                  <p style={{ fontWeight: 800, color: "#111827", marginBottom: 6 }}>{r.title}</p>
                  <p style={{ fontSize: 12, color: "#4b5563" }}>Area: {r.areaName}</p>
                  <p style={{ fontSize: 12, color: "#4b5563" }}>Category: {categoryLabel(r.category)}</p>
                  <a href={`/reports/${r.id}`} style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>
                    View report
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div
        className="absolute top-4 right-4 z-[1000] rounded-2xl border p-3 shadow-xl"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <p className="text-xs font-semibold" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
          LEGEND
        </p>
        <div className="mt-2 grid gap-2">
          {legendItems().map((it) => {
            const active = activeCategories.includes(it.key);
            return (
              <button
                key={it.key}
                className="flex items-center gap-2"
                onClick={() => {
                  setActiveCategories((prev) =>
                    prev.includes(it.key)
                      ? prev.filter((c) => c !== it.key)
                      : [...prev, it.key]
                  );
                }}
                style={{ cursor: "pointer", opacity: active ? 1 : 0.4 }}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ background: categoryColor(it.key) }}
                />
                <span className="text-xs" style={{ color: "var(--text-body)" }}>
                  {it.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div
          className="absolute bottom-4 left-4 z-[1000] rounded-2xl border p-4 shadow-xl"
          style={{ width: 320, maxWidth: "calc(100% - 32px)", background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {selected.title}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {selected.areaName} · {categoryLabel(selected.category)}
          </p>
          <a href={`/reports/${selected.id}`} className="mt-3 inline-block text-sm font-semibold" style={{ color: "var(--text-green)" }}>
            Open
          </a>
        </div>
      ) : null}
    </div>
  );
}
