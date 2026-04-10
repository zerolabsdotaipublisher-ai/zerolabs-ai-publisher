export const PREVIEW_QUERY_KEYS = {
  page: "page",
  device: "device",
  refresh: "r",
} as const;

export function createPreviewRefreshKey(): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi) {
    throw new Error("Preview refresh key generation requires Web Crypto.");
  }

  if (cryptoApi.randomUUID) {
    return `${Date.now().toString(36)}-${cryptoApi.randomUUID()}`;
  }

  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  const randomPart = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${Date.now().toString(36)}-${randomPart}`;
}
