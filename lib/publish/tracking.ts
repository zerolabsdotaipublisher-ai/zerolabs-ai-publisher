import type { PublishTrackingPayload } from "./types";

export async function trackPublishEvent(payload: PublishTrackingPayload): Promise<void> {
  try {
    await fetch("/api/observability/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // no-op: tracking must not block UX
  }
}
