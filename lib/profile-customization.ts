import {
  getProfileAppearance,
  type ProfileAppearance,
} from "./profile-appearance";
import { getProfileVisibility, type ProfileVisibility } from "./profile-visibility";
import type { Profile } from "./supabase/profile";

/**
 * Browser object URLs and data URLs can be useful for an in-progress preview,
 * but are not durable profile media references. They must never be submitted
 * as profile data.
 */
export function isLocalPreviewUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && /^(blob:|data:|filesystem:|file:)/i.test(value.trim());
}

function retainPersistedUrl(
  candidate: string | null,
  persisted: string | null,
): string | null {
  return isLocalPreviewUrl(candidate) ? persisted : candidate;
}

export function toPersistableProfileAppearance(
  appearance: ProfileAppearance,
  preferences: Profile["preferences"],
): ProfileAppearance {
  const persisted = getProfileAppearance(preferences);

  return {
    ...appearance,
    coverUrl: retainPersistedUrl(appearance.coverUrl, persisted.coverUrl),
    background: {
      ...appearance.background,
      imageUrl: retainPersistedUrl(appearance.background.imageUrl, persisted.background.imageUrl),
    },
  };
}

export function toPersistableAvatarUrl(
  avatarUrl: string,
  persistedAvatarUrl: string | null,
): string {
  if (!isLocalPreviewUrl(avatarUrl)) return avatarUrl;
  return isLocalPreviewUrl(persistedAvatarUrl) ? "" : (persistedAvatarUrl ?? "");
}

export function getPublicProfileCustomizationPayload(input: {
  avatarUrl: string;
  appearance: ProfileAppearance;
  visibility: ProfileVisibility;
  profile: Profile;
}) {
  return {
    avatar_url: toPersistableAvatarUrl(input.avatarUrl, input.profile.avatar_url),
    profileAppearance: toPersistableProfileAppearance(input.appearance, input.profile.preferences),
    profileVisibility: input.visibility,
  };
}

export function isPublicProfileCustomizationDirty(input: {
  avatarUrl: string;
  appearance: ProfileAppearance;
  visibility: ProfileVisibility;
  profile: Profile;
}): boolean {
  const payload = getPublicProfileCustomizationPayload(input);

  return (
    payload.avatar_url.trim() !== (input.profile.avatar_url ?? "") ||
    JSON.stringify(payload.profileAppearance) !== JSON.stringify(getProfileAppearance(input.profile.preferences)) ||
    JSON.stringify(payload.profileVisibility) !== JSON.stringify(getProfileVisibility(input.profile.preferences))
  );
}
