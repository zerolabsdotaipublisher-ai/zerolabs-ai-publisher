import type { PublishingActivityItem, PublishingActivityQuery } from "./types";

export function filterPublishingActivityItems(
  items: PublishingActivityItem[],
  query: Pick<PublishingActivityQuery, "platform" | "status" | "contentType" | "from" | "to">,
): PublishingActivityItem[] {
  return items.filter((item) => {
    if (query.platform !== "all" && item.platform !== query.platform) {
      return false;
    }

    if (query.status !== "all" && item.status !== query.status) {
      return false;
    }

    if (query.contentType !== "all" && item.contentType !== query.contentType) {
      return false;
    }

    if (query.from && item.occurredAt < query.from) {
      return false;
    }

    if (query.to && item.occurredAt > query.to) {
      return false;
    }

    return true;
  });
}
