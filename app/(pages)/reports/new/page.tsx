"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import { REPORT_CATEGORIES, type ReportCategoryValue } from "@/lib/reportCategories";
import { AREA_TO_MLA } from "@/public/data/areaToMla";
import type { ClientMapMarker } from "@/app/_components/maps/ClientMap";

const ClientMap = dynamic(() => import("@/app/_components/maps/ClientMap"), { ssr: false });

export default function NewReportPage() {
  const [title, setTitle] = useState("");
  const [areaName, setAreaName] = useState(AREA_TO_MLA[0]?.area ?? "");
  const [mapAreaText, setMapAreaText] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategoryValue>("POTHOLES");

  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [marker, setMarker] = useState<ClientMapMarker | null>(null);

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [bodyImages, setBodyImages] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [previewMain, setPreviewMain] = useState<string | null>(null);
  const [previewBody, setPreviewBody] = useState<string[]>([]);

  useEffect(() => {
    if (!mainImage) {
      setPreviewMain(null);
      return;
    }
    const url = URL.createObjectURL(mainImage);
    setPreviewMain(url);
    return () => URL.revokeObjectURL(url);
  }, [mainImage]);

  useEffect(() => {
    const urls = bodyImages.map((f) => URL.createObjectURL(f));
    setPreviewBody(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [bodyImages]);

  const canSubmit = useMemo(() => {
    return Boolean(title.trim() && areaName.trim() && description.trim() && category);
  }, [title, areaName, description, category]);

  useEffect(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setMarker({ lat, lng });
  }, [latitude, longitude]);

  async function findOnMap() {
    const q = mapAreaText.trim();
    if (!q) return;
    setGeoLoading(true);
    setError(null);

    try {
      const query = encodeURIComponent(`${q}, Hyderabad, Telangana, India`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      const first = data?.[0];
      const lat = first?.lat ? Number(first.lat) : NaN;
      const lon = first?.lon ? Number(first.lon) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        throw new Error("Location not found. Try a more specific place.");
      }

      setMarker({ lat, lng: lon });
      setLatitude(String(lat));
      setLongitude(String(lon));
      toast.success("Location found on map");
    } catch (e: any) {
      const msg = e?.message || "Failed to locate area on map";
      setError(msg);
      toast.error(msg);
    } finally {
      setGeoLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const form = new FormData();
      form.set("title", title);
      form.set("areaName", areaName);
      form.set("mapAreaText", mapAreaText);
      form.set("description", description);
      form.set("category", category);
      form.set("latitude", latitude);
      form.set("longitude", longitude);

      if (mainImage) form.set("mainImage", mainImage);
      for (const file of bodyImages.slice(0, 5)) form.append("bodyImages", file);

      const res = await fetch("/api/reports", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create report");

      toast.success("Report created successfully!");
      window.location.href = `/reports/${data.report.id}`;
    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-heading)" }}>
            Create report
          </h1>

          <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              Main image (optional)
              <input
                className="h-11 rounded-xl border px-3 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                type="file"
                accept="image/*"
                onChange={(e) => setMainImage(e.target.files?.[0] ?? null)}
              />
            </label>

            {previewMain ? (
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
                <img src={previewMain} alt="" className="h-56 w-full object-cover" />
              </div>
            ) : null}

            <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              Title
              <input
                className="h-11 rounded-xl border px-3 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Huge potholes near main road"
                required
              />
            </label>

            <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              Area
              <select
                className="h-11 rounded-xl border px-3 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
              >
                {AREA_TO_MLA.map((a) => (
                  <option key={a.area} value={a.area}>
                    {a.area}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2">
              <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
                Map location (type the pothole location)
                <input
                  className="h-11 rounded-xl border px-3 text-sm outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  value={mapAreaText}
                  onChange={(e) => setMapAreaText(e.target.value)}
                  placeholder="e.g. Near IKEA junction, Hitech City"
                />
              </label>

              <button
                type="button"
                onClick={findOnMap}
                disabled={geoLoading || !mapAreaText.trim()}
                className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                {geoLoading ? "Finding..." : "Find on map"}
              </button>
            </div>

            <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              Category
              <select
                className="h-11 rounded-xl border px-3 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategoryValue)}
              >
                {REPORT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-2 rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--primary-light)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Click on the map to set the location pin, or type latitude/longitude.
              </p>

              <div className="mt-3 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
                <div className="h-72 w-full">
                  <ClientMap
                    marker={marker}
                    onMarkerChange={(next: ClientMapMarker) => {
                      setMarker(next);
                      setLatitude(String(next.lat));
                      setLongitude(String(next.lng));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
                Latitude (optional)
                <input
                  className="h-11 rounded-xl border px-3 text-sm outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="17.3850"
                />
              </label>

              <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
                Longitude (optional)
                <input
                  className="h-11 rounded-xl border px-3 text-sm outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="78.4867"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              Description
              <textarea
                className="min-h-[120px] rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue clearly..."
                required
              />
            </label>

            <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              Body images (optional, up to 5)
              <input
                className="h-11 rounded-xl border px-3 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setBodyImages(Array.from(e.target.files ?? []).slice(0, 5))}
              />
            </label>

            {previewBody.length ? (
              <div className="grid grid-cols-3 gap-2">
                {previewBody.map((src) => (
                  <div key={src} className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
                    <img src={src} alt="" className="h-24 w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#fca5a5", background: "#fef2f2", color: "#dc2626" }}>
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium"
              style={{ background: "var(--primary)", color: "var(--text-on-primary)", boxShadow: "var(--shadow-green)" }}
            >
              {submitting ? "Creating..." : "Create report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
