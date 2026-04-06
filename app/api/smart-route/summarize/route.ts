import { NextResponse } from "next/server";

interface FlaggedComplaint {
  title: string;
  category: string;
  distanceFromRoute: number;
  status: string;
  areaName: string;
}

export async function POST(req: Request) {
  try {
    const { source, destination, flaggedComplaints, totalDistance, totalDuration } = await req.json();

    const distKm = (totalDistance / 1000).toFixed(1);
    const durationMin = Math.round(totalDuration / 60);

    // Fallback summary (if no API key or call fails)
    const fallback =
      flaggedComplaints.length === 0
        ? `Your route from ${source} to ${destination} (${distKm} km, ~${durationMin} min) looks clear — no open civic issues found along the way. Have a safe journey!`
        : `Your route from ${source} to ${destination} (${distKm} km, ~${durationMin} min) passes near ${flaggedComplaints.length} open civic issue(s). Review the flagged locations on the map before travelling.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ summary: fallback });
    }

    const issueList = (flaggedComplaints as FlaggedComplaint[])
      .slice(0, 12)
      .map((c) => `- ${c.title} (${c.category.replace(/_/g, " ")}, ${c.distanceFromRoute}m away, ${c.areaName})`)
      .join("\n");

    const prompt =
      flaggedComplaints.length === 0
        ? `Write a short, friendly 1-sentence route safety message for a civic app. Route: ${source} to ${destination}, ${distKm}km, ~${durationMin} minutes. No civic issues found. Be positive.`
        : `Write a 2-3 sentence plain-English route hazard warning for a civic app. Be specific and practical.
Route: ${source} to ${destination}, ${distKm}km, ~${durationMin} minutes.
Open civic complaints near this route:
${issueList}

Mention the main issue types and areas. Advise caution where appropriate.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 250, temperature: 0.6 },
        }),
      }
    );

    if (!res.ok) return NextResponse.json({ summary: fallback });
    const data = await res.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? fallback;

    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Summary generation failed" }, { status: 500 });
  }
}
