import type { PublishingActivityItem, PublishingActivityTimelineGroup } from "./types";

function toDateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }
  return date.toISOString().slice(0, 10);
}

function toDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function buildPublishingActivityTimeline(items: PublishingActivityItem[]): PublishingActivityTimelineGroup[] {
  const map = new Map<string, PublishingActivityItem[]>();

  items.forEach((item) => {
    const key = toDateKey(item.occurredAt);
    const current = map.get(key) ?? [];
    current.push(item);
    map.set(key, current);
  });

  return Array.from(map.entries())
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([date, groupedItems]) => ({
      date,
      label: toDateLabel(date),
      items: groupedItems.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)),
    }));
}
