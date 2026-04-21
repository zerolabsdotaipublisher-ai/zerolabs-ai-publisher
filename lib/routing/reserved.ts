const RESERVED_ROOT_SEGMENTS = [
  "api",
  "auth",
  "dashboard",
  "editor",
  "generate",
  "generated-sites",
  "health",
  "login",
  "logout",
  "preview",
  "profile",
  "reset-password",
  "signup",
  "site",
  "websites",
] as const;

export function getReservedRoutePrefixes(): string[] {
  return RESERVED_ROOT_SEGMENTS.map((segment) => `/${segment}`);
}

export function isReservedRoutePath(path: string): boolean {
  if (path === "/") {
    return false;
  }

  const firstSegment = path.split("/").filter(Boolean)[0];
  if (!firstSegment) {
    return false;
  }

  return RESERVED_ROOT_SEGMENTS.includes(firstSegment as (typeof RESERVED_ROOT_SEGMENTS)[number]);
}
