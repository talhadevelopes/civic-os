import { EventEmitter } from "events";

// Global singleton emitter for report events.  API routes can emit updates
// and clients (via SSE/WebSocket) subscribe to keep dashboards in sync.
export const reportUpdates = new EventEmitter();

// Types for events
export type ReportUpdateEvent = {
  type: "NEW" | "UPDATED" | "DELETED";
  payload: any; // use a more specific type if you like
};

// ensure we don't leak too many listeners in dev
reportUpdates.setMaxListeners(50);
