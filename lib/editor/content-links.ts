const UNSAFE_LINK_PROTOCOL = /^(?:javascript|vbscript|data):/i;

/**
 * True for content values which are rendered as navigational links. Media
 * sources are intentionally excluded: they use their own rendering path.
 */
export function isContentLinkField(path: string): boolean {
  const fieldName = path.split(".").at(-1)?.toLowerCase();
  return Boolean(fieldName && (fieldName.endsWith("href") || fieldName === "url"));
}

/**
 * Generated sites may use relative paths, fragments, mailto, tel, or absolute
 * links. Block executable protocols before a draft can be saved or previewed.
 */
export function isSafeContentLink(value: string): boolean {
  const normalized = value.trim().replace(/[\u0000-\u0020]+/g, "");
  return !UNSAFE_LINK_PROTOCOL.test(normalized);
}
