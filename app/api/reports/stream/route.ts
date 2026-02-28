import { NextResponse } from "next/server";
import { reportUpdates } from "@/lib/reportUpdates";

// This endpoint implements Server-Sent Events for reports. Clients can
// open an EventSource to /api/reports/stream and will receive "new" events
// when a report is created. The emitter is populated by other API routes.

export async function GET(req: Request) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  function send(data: string) {
    writer.write(encoder.encode(data));
  }

  // helper to format an event
  function sendEvent(event: string, payload: any) {
    send(`event: ${event}\n`);
    send(`data: ${JSON.stringify(payload)}\n\n`);
  }

  const onNew = (report: any) => sendEvent("new", report);
  const onUpdate = (report: any) => sendEvent("update", report);

  reportUpdates.on("new-report", onNew);
  reportUpdates.on("update-report", onUpdate);

  // clean up when client disconnects
  req.signal.addEventListener("abort", () => {
    reportUpdates.off("new-report", onNew);
    reportUpdates.off("update-report", onUpdate);
    writer.close();
  });

  const response = new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      // highest possible caching semantics
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
  return response;
}
