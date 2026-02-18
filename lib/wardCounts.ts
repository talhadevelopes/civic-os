import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { Feature, FeatureCollection, Polygon } from "geojson";

const UNRESOLVED = [
  "REPORTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED_PENDING_VERIFICATION",
  "REOPENED",
] as const;

export type ReportWithCoords = {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
};

export type WardCount = {
  wardId: string;
  wardName: string;
  unresolvedCount: number;
  totalCount: number;
};

export function computeWardCounts(
  geoJson: FeatureCollection,
  reports: ReportWithCoords[]
): WardCount[] {
  const results: WardCount[] = [];
  const features = geoJson.features as Feature<Polygon>[];

  for (const feature of features) {
    const props = feature.properties as Record<string, unknown> | null;
    const wardName = (props?.name as string) ?? "Unknown";
    const wardId = (props?.["@id"] as string) ?? feature.id ?? wardName;

    let unresolvedCount = 0;
    let totalCount = 0;

    for (const r of reports) {
      if (r.latitude == null || r.longitude == null) continue;
      const point: [number, number] = [r.longitude, r.latitude];
      if (booleanPointInPolygon(point, feature)) {
        totalCount += 1;
        if (UNRESOLVED.includes(r.status as (typeof UNRESOLVED)[number])) {
          unresolvedCount += 1;
        }
      }
    }

    results.push({
      wardId: String(wardId),
      wardName,
      unresolvedCount,
      totalCount,
    });
  }

  return results;
}
