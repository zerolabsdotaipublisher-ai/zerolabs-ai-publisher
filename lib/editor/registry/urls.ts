/**
 * Limits document links to a small, explicit set of browser-safe URL forms.
 * The renderer never spreads document values onto DOM attributes.
 */
export function toSafeDocumentUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001F\u007F\s]/.test(trimmed)) return undefined;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (trimmed.startsWith("#") || trimmed.startsWith("?")) return trimmed;
  if (/^(mailto:|tel:)/i.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

export function isSafeDocumentUrl(value: unknown): value is string {
  return Boolean(toSafeDocumentUrl(value));
}
