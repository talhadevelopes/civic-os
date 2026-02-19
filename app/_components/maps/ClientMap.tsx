"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

export type ClientMapMarker = { lat: number; lng: number };

type Props = {
  marker: ClientMapMarker | null;
  onMarkerChange: (next: ClientMapMarker) => void;
};

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function SetView({ marker }: { marker: ClientMapMarker | null }) {
  const map = useMap();

  useEffect(() => {
    if (!marker) return;
    map.setView([marker.lat, marker.lng], Math.max(map.getZoom(), 14), { animate: true });
  }, [marker, map]);

  return null;
}

function ClickToSetMarker({ onMarkerChange }: { onMarkerChange: (next: ClientMapMarker) => void }) {
  useMapEvents({
    click(e) {
      onMarkerChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}

export default function ClientMap({ marker, onMarkerChange }: Props) {
  const center = useMemo<[number, number]>(() => {
    if (marker) return [marker.lat, marker.lng];
    return [17.385, 78.4867];
  }, [marker]);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    L.Marker.prototype.options.icon = defaultIcon;
  }, [ready]);

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      whenReady={() => setReady(true)}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickToSetMarker onMarkerChange={onMarkerChange} />
      <SetView marker={marker} />
      {marker ? <Marker position={[marker.lat, marker.lng]} /> : null}
    </MapContainer>
  );
}
