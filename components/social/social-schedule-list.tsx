"use client";

import type {
  SocialSchedule,
  SocialScheduleEvent,
  SocialScheduleRunRecord,
} from "@/lib/social/scheduling";

export interface SocialScheduleWithActivity extends SocialSchedule {
  runs?: SocialScheduleRunRecord[];
  events?: SocialScheduleEvent[];
}

interface SocialScheduleListProps {
  schedules: SocialScheduleWithActivity[];
  loading?: boolean;
  onCancel: (scheduleId: string) => Promise<void>;
  onRunNow: (scheduleId: string) => Promise<void>;
}

export function SocialScheduleList({
  schedules,
  loading,
  onCancel,
  onRunNow,
}: SocialScheduleListProps) {
  if (schedules.length === 0) {
    return <p>No social schedules have been configured yet.</p>;
  }

  return (
    <div className="social-schedule-list">
      {schedules.map((schedule) => {
        const latestRun = schedule.runs?.[0];
        const latestEvent = schedule.events?.[0];

        return (
          <article key={schedule.id} className="social-schedule-card">
            <header className="social-schedule-card-header">
              <div>
                <h3>{schedule.title}</h3>
                <p>{schedule.description || "No description"}</p>
              </div>
              <div className="social-schedule-card-badges">
                <span className={`content-schedule-badge content-schedule-status-${schedule.status}`}>
                  {schedule.status}
                </span>
                <span className="content-schedule-badge">
                  {schedule.targets.map((target) => target.platform).join(", ")}
                </span>
              </div>
            </header>

            <div className="social-schedule-card-meta">
              <span>Next run: {schedule.scheduledFor ? new Date(schedule.scheduledFor).toLocaleString() : "None"}</span>
              <span>Timezone: {schedule.timezone}</span>
              <span>Retries: {schedule.retryPolicy.maxAttempts}</span>
            </div>

            {latestRun ? (
              <p className="social-schedule-card-run">
                Last run: {latestRun.status} ({new Date(latestRun.scheduledFor).toLocaleString()})
              </p>
            ) : null}
            {latestEvent ? (
              <p className="social-schedule-card-event">
                Latest event: {latestEvent.eventType} — {latestEvent.message}
              </p>
            ) : null}

            <div className="content-schedule-actions">
              <button
                type="button"
                className="wizard-button-secondary"
                onClick={() => void onRunNow(schedule.id)}
                disabled={loading || schedule.status === "canceled"}
              >
                Run now
              </button>
              <button
                type="button"
                onClick={() => void onCancel(schedule.id)}
                disabled={loading || schedule.status === "canceled"}
              >
                Cancel
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
