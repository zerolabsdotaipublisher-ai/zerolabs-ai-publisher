import { PREVIEW_QUERY_KEYS } from "./state";

export function updatePreviewQuery(
  searchParams: URLSearchParams,
  changes: Partial<Record<(typeof PREVIEW_QUERY_KEYS)[keyof typeof PREVIEW_QUERY_KEYS], string | undefined>>,
): string {
  const next = new URLSearchParams(searchParams.toString());

  Object.entries(changes).forEach(([key, value]) => {
    if (!value) {
      next.delete(key);
      return;
    }
    next.set(key, value);
  });

  return next.toString();
}
