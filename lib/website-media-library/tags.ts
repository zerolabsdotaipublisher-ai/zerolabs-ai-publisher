const TAG_LIMIT = 12;
const TAG_LENGTH_LIMIT = 32;

export function normalizeWebsiteMediaTag(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-_\s]/g, "").replace(/\s+/g, "-").slice(0, TAG_LENGTH_LIMIT);
}

export function normalizeWebsiteMediaTags(values: string[] | undefined): string[] {
  if (!values) return [];
  return Array.from(
    new Set(
      values
        .map(normalizeWebsiteMediaTag)
        .filter(Boolean),
    ),
  ).slice(0, TAG_LIMIT);
}
