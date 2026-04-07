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
        ? `Write a detailed, friendly route safety message for a civic app.
Route: ${source} to ${destination}, ${distKm}km, ~${durationMin} minutes.
No specific civic issues (potholes, garbage, etc.) were found directly on this path.
Mention that the weather is clear for driving and encourage the user to stay alert.
Include a small tip about a landmark or area along this route if possible (e.g. "You'll be passing near the Banjara Hills area").
Start with a friendly "All Clear!" or "Smooth Sailing!"
STRICT RULE: Do NOT use any markdown, no asterisks (**), no bolding, no bullet points. Return ONLY plain text.
Keep it to 2-3 positive, professional sentences.`
        : `Write a detailed plain-English route hazard and safety report for a civic app.
Route: ${source} to ${destination}, ${distKm}km, ~${durationMin} minutes.
Open civic complaints near this route:
${issueList}

Structure the response to:
1. Briefly state the number of issues detected and give a "Safety Score" out of 100 (e.g., "Safety Score: 85/100").
2. Highlight the most critical types of issues (e.g., sewage, potholes).
3. Provide practical, professional advice for the driver (e.g., "be cautious near X area due to open sewage").
4. Mention the estimated time and distance.
STRICT RULE: Do NOT use any markdown, no asterisks (**), no bolding, no bullet points. Return ONLY plain text.
Keep it concise but very informative (3-4 sentences).`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.6 },
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
