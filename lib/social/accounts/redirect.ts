import "server-only";

export function normalizeSafeOAuthReturnTo(raw: string | null, requestOrigin: string): string | undefined {
  if (!raw) return undefined;

  try {
    const parsed = new URL(raw, requestOrigin);
    if (parsed.origin !== requestOrigin) {
      return undefined;
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function appendOAuthRedirectState(url: string | undefined, key: string, value: string): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    return undefined;
  }
}
