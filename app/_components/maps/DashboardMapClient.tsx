"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, GeoJSON } from "react-leaflet";
import L from "leaflet";

import "leaflet.heat";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

type LayerMode = "zones" | "heat" | "pins";

function getColorForCount(count: number): string {
  if (count === 0) return "#bbf7d0";
  if (count <= 5) return "#4ade80";
  if (count <= 15) return "#f59e0b";
  return "#ef4444";
}

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

function categoryLabel(cat: string) {
  return cat.replaceAll("_", " ");
}

function HeatLayer({ reports }: { reports: MapReport[] }) {
  const map = useMap();
  const heatRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    if (!(L as any).heatLayer) return;
    const points: [number, number, number][] = reports.map((r) => [
      r.latitude,
      r.longitude,
      0.5,
    ]);
    const layer = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1,
      gradient: { 0.4: "blue", 0.6: "lime", 0.8: "yellow", 1: "red" },
    });
    map.addLayer(layer);
    heatRef.current = layer;
    return () => {
      map.removeLayer(layer);
      heatRef.current = null;
    };
  }, [map, reports]);

  return null;
}

export default function DashboardMapClient({
  reports,
  wardCounts,
}: {
  reports: MapReport[];
  wardCounts: WardCountMap;
}) {
  const [layerMode, setLayerMode] = useState<LayerMode>("zones");
  const [geoJson, setGeoJson] = useState<GeoJSON.GeoJsonObject | null>(null);

  useEffect(() => {
    fetch("/data/ghmc-wards.geojson")
      .then((r) => r.json())
      .then(setGeoJson)
      .catch(() => setGeoJson(null));
  }, []);
  const reportsWithCoords = useMemo(
    () => reports.filter((r) => r.latitude != null && r.longitude != null),
    [reports]
  );

  const center: [number, number] = useMemo(() => {
    if (reportsWithCoords.length) {
      const lat =
        reportsWithCoords.reduce((s, r) => s + r.latitude, 0) /
        reportsWithCoords.length;
      const lng =
        reportsWithCoords.reduce((s, r) => s + r.longitude, 0) /
        reportsWithCoords.length;
      return [lat, lng];
    }
    return [17.385, 78.4867];
  }, [reportsWithCoords]);

  const geoJsonStyle = useCallback(
    (feature?: GeoJSON.Feature) => {
      if (!feature?.properties) return { fillColor: "#e5e7eb", weight: 1 };
      const name = (feature.properties as any).name as string;
      const counts = wardCounts[name] ?? { unresolvedCount: 0, totalCount: 0 };
      const fill = getColorForCount(counts.unresolvedCount);
      return {
        fillColor: fill,
        fillOpacity: 0.6,
        color: "#94a3b8",
        weight: 1,
      };
    },
    [wardCounts]
  );

  const geoJsonOnEach = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      const name = (feature?.properties as any)?.name ?? "Unknown";
      const counts = wardCounts[name] ?? { unresolvedCount: 0, totalCount: 0 };
      
      // Enhanced popup with more info
      const density = counts.totalCount > 0 ? ((counts.unresolvedCount / counts.totalCount) * 100).toFixed(0) : "0";
      const statusColor = counts.unresolvedCount === 0 ? "#16a34a" : counts.unresolvedCount <= 5 ? "#f59e0b" : "#ef4444";
      
      layer.bindPopup(
        `<div style="min-width:220px;padding:8px">
          <strong style="font-size:14px;color:#111827">${name}</strong><br/>
          <div style="margin-top:8px;font-size:12px;color:#4b5563">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span>Open Issues:</span>
              <strong style="color:${statusColor}">${counts.unresolvedCount}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span>Total Issues:</span>
              <strong>${counts.totalCount}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span>Unresolved %:</span>
              <strong style="color:${statusColor}">${density}%</strong>
            </div>
          </div>
          <a href="/reports" style="color:#16a34a;font-weight:600;font-size:12px;text-decoration:none">View all reports →</a>
        </div>`
      );

      // Add hover tooltip (tooltip instead of popup on hover)
      layer.on({
        mouseover: (e) => {
          const layer = e.target;
          layer.setStyle({
            weight: 3,
            color: "#16a34a",
            fillOpacity: 0.8,
          });
          layer.bringToFront();
        },
        mouseout: (e) => {
          const layer = e.target;
          const counts = wardCounts[name] ?? { unresolvedCount: 0, totalCount: 0 };
          const fill = getColorForCount(counts.unresolvedCount);
          layer.setStyle({
            weight: 1,
            color: "#94a3b8",
            fillOpacity: 0.6,
            fillColor: fill,
          });
        },
      });
    },
    [wardCounts]
  );

  const createPinIcon = (status: string) => {
    const c = getPinColor(status);
    return L.divIcon({
      className: "custom-pin",
      html: `<div style="width:14px;height:14px;background:${c};border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{ height: "480px", borderColor: "var(--border)" }}
    >
      <div
        className="absolute top-4 left-4 z-[1000] flex gap-1 rounded-xl border p-1 shadow-lg"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {(["zones", "heat", "pins"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setLayerMode(mode)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors"
            style={{
              background: layerMode === mode ? "var(--primary)" : "transparent",
              color: layerMode === mode ? "var(--text-on-primary)" : "var(--text-body)",
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {layerMode === "zones" && geoJson && (
          <GeoJSON
            key="zones"
            data={geoJson}
            style={geoJsonStyle as any}
            onEachFeature={geoJsonOnEach as any}
          />
        )}

        {layerMode === "heat" && <HeatLayer reports={reportsWithCoords} />}

        {layerMode === "pins" &&
          reportsWithCoords.map((r) => (
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude]}
              icon={createPinIcon(r.status)}
            >
              <Popup autoPan>
                <div style={{ minWidth: 200 }}>
                  <p style={{ fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                    {r.title}
                  </p>
                  <p style={{ fontSize: 12, color: "#4b5563" }}>
                    {r.areaName} · {categoryLabel(r.category)}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: getPinColor(r.status),
                      fontWeight: 600,
                      marginTop: 4,
                    }}
                  >
                    {r.status.replace(/_/g, " ")}
                  </p>
                  <a
                    href={`/reports/${r.id}`}
                    style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginTop: 6, display: "inline-block" }}
                  >
                    View issue →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      <div
        className="absolute bottom-4 right-4 z-[1000] rounded-xl border p-3 shadow-lg"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          {layerMode === "zones" && "Zones: color = open issue density"}
          {layerMode === "heat" && "Heat: issue clusters"}
          {layerMode === "pins" && "Pins: color = status"}
        </p>
      </div>
    </div>
  );
}

