import { routes } from "@/config/routes";

export type PublicProfileRouteIdentity = {
  id?: string | null;
  username?: string | null;
};

/**
 * Returns the canonical public-profile URL. Usernames keep friendly URLs;
 * the durable user ID gives legacy username-less profiles a stable route.
 */
export function getPublicProfileHref(profile: PublicProfileRouteIdentity | null | undefined): string | null {
  const normalizedUsername = profile?.username?.trim();
  if (normalizedUsername) return routes.publicProfile(normalizedUsername);

  return getPublicProfileIdHref(profile?.id);
}

/** Returns the stable public-profile route for a durable user identifier. */
export function getPublicProfileIdHref(userId: string | null | undefined): string | null {
  const normalizedUserId = userId?.trim();
  return normalizedUserId ? routes.publicProfileById(normalizedUserId) : null;
}

export function normalizePublicProfileUsername(username: string | null | undefined): string | null {
  const normalizedUsername = username?.trim();
  return normalizedUsername ? normalizedUsername : null;
}
