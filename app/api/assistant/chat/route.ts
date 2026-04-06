import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMlaStatsFromReports } from "@/lib/mlaStats";

async function gatherContext(query: string): Promise<string> {
  const q = query.toLowerCase();
  const parts: string[] = [];

  const allReports = await prisma.report.findMany({
    include: { createdBy: { select: { name: true } } },
  });

  if (q.includes("kukatpally") || q.includes("unresolved") || q.includes("top") || q.includes("issue")) {
    const kukatpally = allReports.filter(
      (r : any) => r.areaName?.toLowerCase().includes("kukatpally") && !["CONFIRMED_FIXED", "REJECTED"].includes(r.status)
    );
    parts.push(`Unresolved issues in Kukatpally: ${JSON.stringify(kukatpally.slice(0, 10).map((r : any) => ({ id: r.id, title: r.title, status: r.status, area: r.areaName })))}`);
  }

  if (q.includes("mla") || q.includes("resolution") || q.includes("pothole") || q.includes("worst")) {
    const mlas = await getMlaStatsFromReports();
    const potholeByMla = await prisma.report.groupBy({
      by: ["mlaName", "constituencyName"],
      where: { category: "POTHOLES" },
      _count: { id: true },
    });
    parts.push(`MLA stats: ${JSON.stringify(mlas.slice(0, 15).map((r : any) => ({ name: r.name, constituency: r.constituencyName, potholes: r.potholes })))}`);
    parts.push(`Potholes by MLA: ${JSON.stringify(potholeByMla)}`);
  }

  if (q.includes("drainage") || q.includes("secunderabad")) {
    const drainage = allReports.filter(
      (r : any) =>
        (r.category?.includes("DRAINAGE") || r.category?.includes("SEWAGE")) &&
        r.areaName?.toLowerCase().includes("secunderabad")
    );
    parts.push(`Drainage issues in Secunderabad: ${drainage.length}. Sample: ${JSON.stringify(drainage.slice(0, 5).map((r : any) => ({ id: r.id, title: r.title, status: r.status })))}`);
  }

  if (q.includes("score") || q.includes("health") || q.includes("civic")) {
    const total = allReports.length;
    const fixed = allReports.filter((r : any ) => r.status === "CONFIRMED_FIXED").length;
    const rate = total > 0 ? (fixed / total) * 100 : 0;
    parts.push(`Civic stats: Total issues ${total}, Confirmed fixed ${fixed}, Resolution rate ${rate.toFixed(1)}%`);
  }

  if (parts.length === 0) {
    const byStatus = await prisma.report.groupBy({ by: ["status"], _count: { id: true } });
    const byArea = await prisma.report.groupBy({ by: ["areaName"], _count: { id: true } });
    const topAreas = byArea.sort((a : any, b : any) => b._count.id - a._count.id).slice(0, 10);
    parts.push(`General: total ${allReports.length} reports. By status: ${JSON.stringify(byStatus)}. Top areas: ${JSON.stringify(topAreas)}`);
  }

  return parts.join("\n\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = (body.query ?? "").trim();
    if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

    const context = await gatherContext(query);

    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCx0cIdG1lABTAWXTFgu7GFO3PRHEcg6Jw";
    if (!apiKey) {
      return NextResponse.json({
        message: "AI Assistant is not configured. Add GEMINI_API_KEY to your environment. Meanwhile, here's raw data: " + context.slice(0, 500),
      });
    }

    const systemPrompt = `You are the CIVICOS AI assistant for Hyderabad civic governance. Use ONLY the provided data to answer. 
When mentioning issues, use format: [Issue: title](/reports/ID) with the actual report ID.
When mentioning MLAs, use format: [MLA Name](/authorities/mla/SLUG) where SLUG is constituency lowercased with spaces as hyphens (e.g. kukatpally, lal-bahadur-nagar).
Be concise. Cite real numbers and IDs from the data.`;

    const userPrompt = `Data:\n${context}\n\nUser question: ${query}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${userPrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({
        message: `Unable to get AI response. Raw data: ${context.slice(0, 300)}...`,
      });
    }

    const data = await res.json();
    const message =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";

    return NextResponse.json({ message });
  } catch (e) {
    console.error("Assistant error:", e);
    return NextResponse.json({ message: "Sorry, something went wrong." }, { status: 500 });
  }
}
