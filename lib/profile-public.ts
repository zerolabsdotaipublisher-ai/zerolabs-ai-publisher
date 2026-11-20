import { routes } from "@/config/routes";

/** A resolved `profiles.id`, used as the durable identity for public-profile routing. */
export type ProfileUserId = string;

const PROFILE_USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Normalizes the UUID used by both `auth.users.id` and `profiles.id`. */
export function normalizePublicProfileUserId(profileUserId: string | null | undefined): ProfileUserId | null {
  const normalizedProfileUserId = profileUserId?.trim();
  return normalizedProfileUserId && PROFILE_USER_ID_PATTERN.test(normalizedProfileUserId)
    ? normalizedProfileUserId
    : null;
}

export type PublicProfileRouteIdentity = {
  profileUserId?: ProfileUserId | null;
  username?: string | null;
};

/**
 * Returns the canonical public-profile URL. Usernames keep friendly URLs;
 * the durable user ID gives legacy username-less profiles a stable route.
 */
export function getPublicProfileHref(profile: PublicProfileRouteIdentity | null | undefined): string | null {
  const normalizedUsername = profile?.username?.trim();
  if (normalizedUsername) return routes.publicProfile(normalizedUsername);

  return getPublicProfileUserIdHref(profile?.profileUserId);
}

/** Returns the stable public-profile route for a durable user identifier. */
export function getPublicProfileUserIdHref(profileUserId: ProfileUserId | null | undefined): string | null {
  const normalizedProfileUserId = normalizePublicProfileUserId(profileUserId);
  return normalizedProfileUserId ? routes.publicProfileByProfileUserId(normalizedProfileUserId) : null;
}

export function normalizePublicProfileUsername(username: string | null | undefined): string | null {
  const normalizedUsername = username?.trim();
  return normalizedUsername ? normalizedUsername : null;
}
