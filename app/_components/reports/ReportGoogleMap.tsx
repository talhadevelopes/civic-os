"use client";

import React from "react";

type Props = {
  areaName: string;
  mapAreaText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
};

export default function ReportGoogleMap({ areaName, mapAreaText, latitude, longitude, title }: Props) {
  const fallbackText = (mapAreaText || areaName).trim();
  const mapQuery = latitude != null && longitude != null ? `${latitude},${longitude}` : `${fallbackText}, Hyderabad, Telangana, India`;

  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed&hl=en`;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}>
        Report Location
      </h2>
      {title ? (
        <p className="mt-2 text-sm" style={{ color: "var(--text-body)" }}>
          {title}
        </p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border" style={{ height: "420px", borderColor: "var(--border)" }}>
        <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
      </div>

      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
        {mapAreaText || areaName}
      </p>
    </div>
  );
}
