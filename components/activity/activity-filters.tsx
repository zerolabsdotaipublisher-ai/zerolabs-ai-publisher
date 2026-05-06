import type {
  PublishingActivityContentType,
  PublishingActivityPlatform,
  PublishingActivityQuery,
  PublishingActivitySegment,
  PublishingActivityStatus,
} from "@/lib/activity/types";

interface ActivityFiltersProps {
  platform: PublishingActivityPlatform | "all";
  status: PublishingActivityStatus | "all";
  contentType: PublishingActivityContentType | "all";
  segment: PublishingActivitySegment;
  from: string;
  to: string;
  onPlatformChange: (value: PublishingActivityPlatform | "all") => void;
  onStatusChange: (value: PublishingActivityStatus | "all") => void;
  onContentTypeChange: (value: PublishingActivityContentType | "all") => void;
  onSegmentChange: (value: PublishingActivitySegment) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export function ActivityFilters({
  platform,
  status,
  contentType,
  segment,
  from,
  to,
  onPlatformChange,
  onStatusChange,
  onContentTypeChange,
  onSegmentChange,
  onFromChange,
  onToChange,
}: ActivityFiltersProps) {
  return (
    <section className="activity-filters" aria-label="Publishing activity filters">
      <label>
        Platform
        <select value={platform} onChange={(event) => onPlatformChange(event.target.value as PublishingActivityQuery["platform"])}>
          <option value="all">All platforms</option>
          <option value="website">Website</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="linkedin">LinkedIn</option>
          <option value="x">X</option>
        </select>
      </label>

      <label>
        Status
        <select value={status} onChange={(event) => onStatusChange(event.target.value as PublishingActivityQuery["status"])}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="publishing">Publishing</option>
          <option value="failed">Failed</option>
          <option value="retry_pending">Retry pending</option>
          <option value="canceled">Canceled</option>
        </select>
      </label>

      <label>
        Content type
        <select
          value={contentType}
          onChange={(event) => onContentTypeChange(event.target.value as PublishingActivityQuery["contentType"])}
        >
          <option value="all">All content types</option>
          <option value="website">Website</option>
          <option value="website_page">Website page</option>
          <option value="blog">Blog</option>
          <option value="article">Article</option>
          <option value="social_post">Social post</option>
        </select>
      </label>

      <label>
        Segment
        <select value={segment} onChange={(event) => onSegmentChange(event.target.value as PublishingActivitySegment)}>
          <option value="all">All activity</option>
          <option value="recent">Recent activity</option>
          <option value="upcoming">Upcoming scheduled</option>
          <option value="attention">Needs attention</option>
        </select>
      </label>

      <label>
        From
        <input type="date" value={from} onChange={(event) => onFromChange(event.target.value)} />
      </label>

      <label>
        To
        <input type="date" value={to} onChange={(event) => onToChange(event.target.value)} />
      </label>
    </section>
  );
}
