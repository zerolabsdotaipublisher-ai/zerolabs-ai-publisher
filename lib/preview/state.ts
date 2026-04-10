export const PREVIEW_QUERY_KEYS = {
  page: "page",
  device: "device",
  refresh: "r",
} as const;

export function createPreviewRefreshKey(): string {
  return Date.now().toString(36);
}
