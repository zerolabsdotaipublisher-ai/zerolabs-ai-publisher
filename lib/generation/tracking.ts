export type GenerationTrackingEvent =
  | "generation_started"
  | "generation_completed"
  | "generation_failed"
  | "generation_retry_clicked"
  | "generation_preview_opened"
  | "generation_edit_inputs_clicked";

interface TrackGenerationEventPayload {
  event: GenerationTrackingEvent;
  structureId?: string;
  status?: string;
  retryCount?: number;
  message?: string;
}

export async function trackGenerationEvent(payload: TrackGenerationEventPayload): Promise<void> {
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
