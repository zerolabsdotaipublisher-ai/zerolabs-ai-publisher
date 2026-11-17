import { routes } from "@/config/routes";

/**
 * Returns a routable public-profile URL only for a persisted, non-empty
 * username. Legacy profiles without a username deliberately remain unlinked.
 */
export function getPublicProfileHref(username: string | null | undefined): string | null {
  const normalizedUsername = username?.trim();
  return normalizedUsername ? routes.publicProfile(normalizedUsername) : null;
}

export function normalizePublicProfileUsername(username: string | null | undefined): string | null {
  const normalizedUsername = username?.trim();
  return normalizedUsername ? normalizedUsername : null;
}
