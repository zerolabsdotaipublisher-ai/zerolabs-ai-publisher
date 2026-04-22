"use client";

import { useEffect, useState } from "react";
import type {
  ContentSchedule,
  ContentScheduleRunRecord,
  ScheduleFrequency,
} from "@/lib/scheduling";

interface ContentSchedulePanelProps {
  structureId: string;
  websiteType: string;
  initialSchedule: ContentSchedule | null;
  initialRuns: ContentScheduleRunRecord[];
}

interface ScheduleFormState {
  title: string;
  description: string;
  executionMode: ContentSchedule["executionMode"];
  timezone: string;
  startsAtLocal: string;
  frequency: ScheduleFrequency;
  interval: string;
  weekdays: number[];
  monthDays: string;
  endAtLocal: string;
  maxOccurrences: string;
}

interface ScheduleApiResponse {
  ok: boolean;
  schedule?: ContentSchedule | null;
  runs?: ContentScheduleRunRecord[];
  error?: string;
  result?: {
    schedule: ContentSchedule;
    run: ContentScheduleRunRecord;
  };
}

const weekdayOptions = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

function toDatetimeLocalValue(value?: string): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

function createDefaultStartsAtLocal(): string {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  date.setMinutes(0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function createFormState(
  schedule: ContentSchedule | null,
  browserTimeZone?: string,
): ScheduleFormState {
  return {
    title: schedule?.title ?? "",
    description: schedule?.description ?? "",
    executionMode: schedule?.executionMode ?? "publish_existing",
    timezone: schedule?.timezone ?? browserTimeZone ?? "UTC",
    startsAtLocal: toDatetimeLocalValue(schedule?.startsAtLocal) || createDefaultStartsAtLocal(),
    frequency: schedule?.recurrence.frequency ?? "once",
    interval: String(schedule?.recurrence.interval ?? 1),
    weekdays: schedule?.recurrence.weekdays ?? [],
    monthDays: schedule?.recurrence.monthDays?.join(", ") ?? "",
    endAtLocal: toDatetimeLocalValue(schedule?.recurrence.endAtLocal),
    maxOccurrences: schedule?.recurrence.maxOccurrences ? String(schedule.recurrence.maxOccurrences) : "",
  };
}

function parseMonthDays(value: string): number[] | undefined {
  const parsed = value
    .split(",")
    .map((segment) => Number.parseInt(segment.trim(), 10))
    .filter((segment) => Number.isFinite(segment));

  return parsed.length > 0 ? parsed : undefined;
}

export function ContentSchedulePanel({
  structureId,
  websiteType,
  initialSchedule,
  initialRuns,
}: ContentSchedulePanelProps) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [runs, setRuns] = useState(initialRuns);
  const [browserTimeZone, setBrowserTimeZone] = useState("UTC");
  const [form, setForm] = useState<ScheduleFormState>(() =>
    createFormState(initialSchedule, "UTC"),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    const resolvedTimeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setBrowserTimeZone(resolvedTimeZone);
  }, []);

  useEffect(() => {
    setSchedule(initialSchedule);
    setRuns(initialRuns);
    setForm(createFormState(initialSchedule, browserTimeZone));
  }, [initialRuns, initialSchedule, browserTimeZone]);

  const supportsGeneration = websiteType === "blog" || websiteType === "article";

  async function reloadSchedule() {
    const response = await fetch(`/api/schedules?structureId=${encodeURIComponent(structureId)}`, {
      method: "GET",
    });
    const body = (await response.json()) as ScheduleApiResponse;
    if (!response.ok || !body.ok) {
      throw new Error(body.error || "Unable to load the latest schedule state.");
    }

    setSchedule(body.schedule ?? null);
    setRuns(body.runs ?? []);
    setForm(createFormState(body.schedule ?? null, browserTimeZone));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          structureId,
          title: form.title,
          description: form.description || undefined,
          executionMode: form.executionMode,
          timezone: form.timezone,
          startsAtLocal: form.startsAtLocal,
          recurrence: {
            frequency: form.frequency,
            interval: Number.parseInt(form.interval, 10) || 1,
            weekdays: form.frequency === "weekly" ? form.weekdays : undefined,
            monthDays: form.frequency === "monthly" ? parseMonthDays(form.monthDays) : undefined,
            endAtLocal: form.endAtLocal || undefined,
            maxOccurrences: form.maxOccurrences
              ? Number.parseInt(form.maxOccurrences, 10)
              : undefined,
          },
        }),
      });
      const body = (await response.json()) as ScheduleApiResponse;
      if (!response.ok || !body.ok || !body.schedule) {
        throw new Error(body.error || "Unable to save content schedule.");
      }

      setSchedule(body.schedule);
      setRuns(body.runs ?? []);
      setMessage("Content schedule saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save content schedule.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function runAction(path: string, successMessage: string) {
    setLoading(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(path, {
        method: "POST",
      });
      const body = (await response.json()) as ScheduleApiResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to update content schedule.");
      }

      await reloadSchedule();
      setMessage(successMessage);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update content schedule.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!schedule) {
      return;
    }

    const confirmed = window.confirm("Cancel this content schedule?");
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as ScheduleApiResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to cancel the content schedule.");
      }

      await reloadSchedule();
      setMessage("Content schedule cancelled.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to cancel the content schedule.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleWeekday(weekday: number, checked: boolean) {
    setForm((current) => ({
      ...current,
      weekdays: checked
        ? Array.from(new Set([...current.weekdays, weekday])).sort((left, right) => left - right)
        : current.weekdays.filter((value) => value !== weekday),
    }));
  }

  return (
    <section className="content-schedule-panel" id="content-schedule" aria-label="Content schedule management">
      <div className="content-schedule-header">
        <div>
          <h2>Content schedule</h2>
          <p>
            Schedule future publish/update runs using AI Publisher-owned rules, retries, and
            publish pipeline integration.
          </p>
        </div>
        <div className="content-schedule-status">
          <span className={`content-schedule-badge content-schedule-status-${schedule?.status ?? "unscheduled"}`}>
            {schedule?.status ?? "unscheduled"}
          </span>
          <span className="content-schedule-badge">{schedule?.executionMode ?? "not configured"}</span>
        </div>
      </div>

      {message ? (
        <p className="content-schedule-success" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="content-schedule-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="content-schedule-form" onSubmit={handleSave}>
        <label>
          <span>Title</span>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Scheduled content publishing"
          />
        </label>

        <label>
          <span>Description</span>
          <input
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Optional operator notes"
          />
        </label>

        <div className="content-schedule-grid">
          <label>
            <span>Execution mode</span>
            <select
              value={form.executionMode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  executionMode: event.target.value as ScheduleFormState["executionMode"],
                }))
              }
            >
              <option value="publish_existing">Publish current draft</option>
              <option value="generate_then_publish" disabled={!supportsGeneration}>
                Generate fresh content, then publish
              </option>
            </select>
          </label>

          <label>
            <span>Timezone</span>
            <input
              value={form.timezone}
              onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
              placeholder={browserTimeZone}
            />
          </label>

          <label>
            <span>Starts at</span>
            <input
              type="datetime-local"
              value={form.startsAtLocal}
              onChange={(event) => setForm((current) => ({ ...current, startsAtLocal: event.target.value }))}
            />
          </label>

          <label>
            <span>Frequency</span>
            <select
              value={form.frequency}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  frequency: event.target.value as ScheduleFrequency,
                }))
              }
            >
              <option value="once">One time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          <label>
            <span>Interval</span>
            <input
              type="number"
              min={1}
              value={form.interval}
              onChange={(event) => setForm((current) => ({ ...current, interval: event.target.value }))}
            />
          </label>

          <label>
            <span>End at</span>
            <input
              type="datetime-local"
              value={form.endAtLocal}
              onChange={(event) => setForm((current) => ({ ...current, endAtLocal: event.target.value }))}
            />
          </label>

          <label>
            <span>Max occurrences</span>
            <input
              type="number"
              min={1}
              value={form.maxOccurrences}
              onChange={(event) => setForm((current) => ({ ...current, maxOccurrences: event.target.value }))}
              placeholder="Optional"
            />
          </label>

          <label>
            <span>Monthly days</span>
            <input
              value={form.monthDays}
              onChange={(event) => setForm((current) => ({ ...current, monthDays: event.target.value }))}
              placeholder="1, 15, 30"
              disabled={form.frequency !== "monthly"}
            />
          </label>
        </div>

        <fieldset className="content-schedule-weekdays" disabled={form.frequency !== "weekly"}>
          <legend>Weekly days</legend>
          {weekdayOptions.map((weekday) => (
            <label key={weekday.value} className="content-schedule-weekday">
              <input
                type="checkbox"
                checked={form.weekdays.includes(weekday.value)}
                onChange={(event) => toggleWeekday(weekday.value, event.target.checked)}
              />
              <span>{weekday.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="content-schedule-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : schedule ? "Update schedule" : "Create schedule"}
          </button>
          {schedule ? (
            <>
              <button
                type="button"
                className="wizard-button-secondary"
                onClick={() =>
                  void runAction(
                    `/api/schedules/${schedule.id}/${schedule.status === "paused" ? "resume" : "pause"}`,
                    schedule.status === "paused" ? "Schedule resumed." : "Schedule paused.",
                  )
                }
                disabled={loading || schedule.status === "cancelled"}
              >
                {schedule.status === "paused" ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                className="wizard-button-secondary"
                onClick={() => void runAction(`/api/schedules/${schedule.id}/run`, "Schedule executed manually.")}
                disabled={loading || schedule.status === "cancelled"}
              >
                Run now
              </button>
              <button type="button" onClick={() => void handleDelete()} disabled={loading}>
                Cancel schedule
              </button>
            </>
          ) : null}
        </div>
      </form>

      <div className="content-schedule-summary-grid">
        <article>
          <h3>Next run</h3>
          <p>{schedule?.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : "Not scheduled"}</p>
        </article>
        <article>
          <h3>Last success</h3>
          <p>
            {schedule?.lifecycle.lastSucceededAt
              ? new Date(schedule.lifecycle.lastSucceededAt).toLocaleString()
              : "No successful runs yet"}
          </p>
        </article>
        <article>
          <h3>Retries</h3>
          <p>
            {schedule
              ? `${schedule.lifecycle.consecutiveFailures} consecutive failures, max ${schedule.retryPolicy.maxAttempts} attempts`
              : "Not configured"}
          </p>
        </article>
      </div>

      <div className="content-schedule-runs">
        <h3>Recent runs</h3>
        {runs.length === 0 ? <p>No schedule executions have been recorded yet.</p> : null}
        {runs.map((run) => (
          <article key={run.id} className="content-schedule-run">
            <div className="content-schedule-run-header">
              <strong>{run.status}</strong>
              <span>{new Date(run.scheduledFor).toLocaleString()}</span>
              <span>{run.triggerSource}</span>
            </div>
            <div className="content-schedule-run-meta">
              <span>Attempt {run.attempt}</span>
              {run.publishAction ? <span>{run.publishAction}</span> : null}
              {run.completedAt ? <span>Completed {new Date(run.completedAt).toLocaleString()}</span> : null}
              {run.nextRetryAt ? <span>Retry {new Date(run.nextRetryAt).toLocaleString()}</span> : null}
            </div>
            {run.error ? <p className="content-schedule-run-error">{run.error}</p> : null}
            {run.logs.length > 0 ? (
              <details>
                <summary>Execution log</summary>
                <ul className="content-schedule-log-list">
                  {run.logs.map((entry, index) => (
                    <li key={`${run.id}_${entry.at}_${index}`}>
                      <span>{entry.phase}</span>
                      <span>{new Date(entry.at).toLocaleString()}</span>
                      <span>{entry.message}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
