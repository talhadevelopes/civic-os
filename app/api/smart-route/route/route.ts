import { NextResponse } from "next/server";

async function geocode(place: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place + " Hyderabad India")}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "CIVICOS/1.0 civic-governance-platform" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data[0]) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export async function POST(req: Request) {
  try {
    const { source, destination } = await req.json();
    if (!source || !destination) {
      return NextResponse.json({ error: "Source and destination required" }, { status: 400 });
    }

    // Geocode both sequentially (Nominatim rate limit: 1 req/sec)
    const srcCoords = await geocode(source);
    await new Promise((r) => setTimeout(r, 1100)); // respect rate limit
    const dstCoords = await geocode(destination);

    if (!srcCoords) {
      return NextResponse.json({ error: `Could not find location: "${source}"` }, { status: 400 });
    }
    if (!dstCoords) {
      return NextResponse.json({ error: `Could not find location: "${destination}"` }, { status: 400 });
    }

    // OSRM routing
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${srcCoords.lng},${srcCoords.lat};${dstCoords.lng},${dstCoords.lat}?overview=full&geometries=geojson`;
    const osrmRes = await fetch(osrmUrl);
    const osrmData = await osrmRes.json();

    if (osrmData.code !== "Ok" || !osrmData.routes?.[0]) {
      return NextResponse.json({ error: "Could not calculate a driving route between these locations" }, { status: 400 });
    }

    const route = osrmData.routes[0];
    // OSRM returns [lng, lat] — convert to [lat, lng] for Leaflet
    const routePoints: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );

    return NextResponse.json({
      routePoints,
      totalDistance: route.distance,   // meters
      totalDuration: route.duration,   // seconds
      sourceCoords: srcCoords,
      destCoords: dstCoords,
    });
  } catch {
    return NextResponse.json({ error: "Routing failed — please try again" }, { status: 500 });
  }
}
