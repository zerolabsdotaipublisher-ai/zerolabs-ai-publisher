"use client";

import { useEffect, useState } from "react";
import type { SocialAccountConnection, SocialAccountProvider } from "@/lib/social/accounts/types";
import type { GeneratedSocialPost } from "@/lib/social";
import type { SocialPublishHistoryJob } from "@/lib/social/history";
import type {
  SocialSchedule,
  SocialScheduleFrequency,
  SocialScheduleTarget,
} from "@/lib/social/scheduling";
import { SocialAccountManager } from "./social-account-manager";
import { SocialHistoryPanel } from "./social-history-panel";
import { SocialScheduleList, type SocialScheduleWithActivity } from "./social-schedule-list";

interface SocialSchedulePanelProps {
  structureId: string;
  socialPosts: GeneratedSocialPost[];
  initialSchedules: SocialScheduleWithActivity[];
  initialHistory: SocialPublishHistoryJob[];
  initialAccounts: SocialAccountConnection[];
  initialAccountProviders: SocialAccountProvider[];
}

interface ScheduleApiResponse {
  ok: boolean;
  schedules?: SocialScheduleWithActivity[];
  schedule?: SocialSchedule;
  error?: string;
  result?: unknown;
}

interface FormState {
  scheduleId?: string;
  socialPostId: string;
  title: string;
  description: string;
  timezone: string;
  startsAtLocal: string;
  frequency: SocialScheduleFrequency;
  interval: string;
  weekdays: number[];
  monthDays: string;
  status: "draft" | "scheduled";
  targets: SocialScheduleTarget[];
}

const PLATFORM_OPTIONS: SocialScheduleTarget["platform"][] = ["instagram", "facebook", "linkedin", "x"];

function createDefaultStart(): string {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  date.setMinutes(0, 0, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function parseMonthDays(value: string): number[] | undefined {
  const parsed = value
    .split(",")
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((entry) => Number.isFinite(entry) && entry >= 1 && entry <= 31);

  return parsed.length > 0 ? parsed : undefined;
}

function toFormState(
  schedule: SocialSchedule | undefined,
  fallbackPostId: string,
  timezone: string,
): FormState {
  return {
    scheduleId: schedule?.id,
    socialPostId: schedule?.socialPostId ?? fallbackPostId,
    title: schedule?.title ?? "",
    description: schedule?.description ?? "",
    timezone: schedule?.timezone ?? timezone,
    startsAtLocal: schedule?.startsAtLocal.slice(0, 16) ?? createDefaultStart(),
    frequency: schedule?.recurrence.frequency ?? "once",
    interval: String(schedule?.recurrence.interval ?? 1),
    weekdays: schedule?.recurrence.weekdays ?? [],
    monthDays: schedule?.recurrence.monthDays?.join(", ") ?? "",
    status: schedule?.status === "draft" ? "draft" : "scheduled",
    targets:
      schedule?.targets ?? [
        { platform: "instagram", enabled: true },
        { platform: "linkedin", enabled: false },
      ],
  };
}

export function SocialSchedulePanel({
  structureId,
  socialPosts,
  initialSchedules,
  initialHistory,
  initialAccounts,
  initialAccountProviders,
}: SocialSchedulePanelProps) {
  const [browserTimeZone, setBrowserTimeZone] = useState("UTC");
  const [schedules, setSchedules] = useState<SocialScheduleWithActivity[]>(initialSchedules);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>(initialSchedules[0]?.id);
  const [form, setForm] = useState<FormState>(() =>
    toFormState(initialSchedules[0], socialPosts[0]?.id ?? "", "UTC"),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setBrowserTimeZone(tz);
    setForm((current) =>
      current.timezone === "UTC"
        ? {
            ...current,
            timezone: tz,
          }
        : current,
    );
  }, []);

  async function reload() {
    const response = await fetch(`/api/social/schedules?structureId=${encodeURIComponent(structureId)}`);
    const body = (await response.json()) as ScheduleApiResponse;
    if (!response.ok || !body.ok || !body.schedules) {
      throw new Error(body.error || "Unable to reload social schedules.");
    }

    setSchedules(body.schedules);
    const active = body.schedules.find((entry) => entry.id === selectedScheduleId) ?? body.schedules[0];
    setSelectedScheduleId(active?.id);
    setForm(toFormState(active, socialPosts[0]?.id ?? "", browserTimeZone));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const path = form.scheduleId ? `/api/social/schedules/${form.scheduleId}` : "/api/social/schedules";
      const method = form.scheduleId ? "PATCH" : "POST";

      const response = await fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          socialPostId: form.socialPostId,
          title: form.title,
          description: form.description || undefined,
          timezone: form.timezone,
          startsAtLocal: form.startsAtLocal,
          recurrence: {
            frequency: form.frequency,
            interval: Number.parseInt(form.interval, 10) || 1,
            weekdays: form.frequency === "weekly" ? form.weekdays : undefined,
            monthDays: form.frequency === "monthly" ? parseMonthDays(form.monthDays) : undefined,
          },
          status: form.status,
          targets: form.targets,
        }),
      });

      const body = (await response.json()) as ScheduleApiResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to save social schedule.");
      }

      await reload();
      setMessage("Social schedule saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save social schedule.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(scheduleId: string) {
    setLoading(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const response = await fetch(`/api/social/schedules/${scheduleId}/cancel`, {
        method: "POST",
      });
      const body = (await response.json()) as ScheduleApiResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to cancel social schedule.");
      }
      await reload();
      setMessage("Social schedule canceled.");
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel social schedule.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRunNow(scheduleId: string) {
    setLoading(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const response = await fetch(`/api/social/schedules/${scheduleId}/run`, { method: "POST" });
      const body = (await response.json()) as ScheduleApiResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to run social schedule.");
      }
      await reload();
      setMessage("Social schedule executed.");
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run social schedule.");
    } finally {
      setLoading(false);
    }
  }

  function togglePlatformTarget(platform: SocialScheduleTarget["platform"], enabled: boolean) {
    setForm((current) => {
      const nextTargets = current.targets.filter((target) => target.platform !== platform);
      nextTargets.push({ platform, enabled });
      return {
        ...current,
        targets: nextTargets,
      };
    });
  }

  function startCreateNew() {
    setSelectedScheduleId(undefined);
    setForm(toFormState(undefined, socialPosts[0]?.id ?? "", browserTimeZone));
  }

  const availablePostOptions = socialPosts.map((post) => ({
    id: post.id,
    label: `${post.title} (${post.variants.map((variant) => variant.platform).join(", ")})`,
  }));

  return (
    <section className="content-schedule-panel" id="social-schedule" aria-label="Social schedule management">
      <SocialAccountManager initialAccounts={initialAccounts} initialProviders={initialAccountProviders} />
      <div className="content-schedule-header">
        <div>
          <h2>Social schedule</h2>
          <p>
            Schedule generated social posts for platform targets using AI Publisher scheduling and Instagram delivery.
          </p>
        </div>
        <div className="content-schedule-actions">
          <button type="button" className="wizard-button-secondary" onClick={startCreateNew} disabled={loading}>
            New schedule
          </button>
        </div>
      </div>

      {message ? <p className="content-schedule-success">{message}</p> : null}
      {error ? <p className="content-schedule-error">{error}</p> : null}

      {socialPosts.length === 0 ? (
        <p>Generate and save a social post first, then create a schedule.</p>
      ) : (
        <form className="content-schedule-form" onSubmit={handleSave}>
          <div className="content-schedule-grid">
            <label>
              <span>Social post</span>
              <select
                value={form.socialPostId}
                onChange={(event) => setForm((current) => ({ ...current, socialPostId: event.target.value }))}
              >
                {availablePostOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>

            <label>
              <span>Description</span>
              <input
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
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
                    frequency: event.target.value as SocialScheduleFrequency,
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
              <span>Monthly days</span>
              <input
                value={form.monthDays}
                onChange={(event) => setForm((current) => ({ ...current, monthDays: event.target.value }))}
                placeholder="1, 15, 30"
                disabled={form.frequency !== "monthly"}
              />
            </label>

            <label>
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value as FormState["status"] }))
                }
              >
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>

          <fieldset className="content-schedule-weekdays" disabled={form.frequency !== "weekly"}>
            <legend>Weekly days</legend>
            {[
              { label: "Sun", value: 0 },
              { label: "Mon", value: 1 },
              { label: "Tue", value: 2 },
              { label: "Wed", value: 3 },
              { label: "Thu", value: 4 },
              { label: "Fri", value: 5 },
              { label: "Sat", value: 6 },
            ].map((weekday) => (
              <label key={weekday.value} className="content-schedule-weekday">
                <input
                  type="checkbox"
                  checked={form.weekdays.includes(weekday.value)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      weekdays: event.target.checked
                        ? [...new Set([...current.weekdays, weekday.value])]
                        : current.weekdays.filter((value) => value !== weekday.value),
                    }))
                  }
                />
                <span>{weekday.label}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className="content-schedule-weekdays">
            <legend>Platform targets</legend>
            {PLATFORM_OPTIONS.map((platform) => {
              const selected = form.targets.find((target) => target.platform === platform)?.enabled ?? false;
              return (
                <label key={platform} className="content-schedule-weekday">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(event) => togglePlatformTarget(platform, event.target.checked)}
                  />
                  <span>{platform}</span>
                </label>
              );
            })}
          </fieldset>

          <div className="content-schedule-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : form.scheduleId ? "Update social schedule" : "Create social schedule"}
            </button>
          </div>
        </form>
      )}

      <SocialScheduleList
        schedules={schedules}
        loading={loading}
        onCancel={handleCancel}
        onRunNow={handleRunNow}
      />

      <SocialHistoryPanel initialItems={initialHistory} />
    </section>
  );
}
