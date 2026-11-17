import { ProfileContent, type ProfilePublicPost, type ProfilePublicWebsite } from "@/components/profile/profile-content";
import { getProfileAppearance } from "@/lib/profile-appearance";
import { isProfileMediaReference, isSupportedProfileMediaUrl, type ProfileMediaDisplayUrls } from "@/lib/profile-media";
import { getProfileAge, getProfileVisibility } from "@/lib/profile-visibility";
import type { Profile } from "@/lib/supabase/profile";
import {
  getProfilePageBackgroundClassName,
  getProfilePageBackgroundStyle,
  ProfilePageBackgroundImage,
} from "./profile-preview";
import { ProfileSocialPreview } from "./profile-social-preview";

type ProfileLayoutVariant = "default" | "admin";

export type ProfilePresentation = Pick<
  Profile,
  | "id"
  | "full_name"
  | "avatar_url"
  | "first_name"
  | "last_name"
  | "username"
  | "country"
  | "date_of_birth"
  | "preferences"
>;

type ProfileViewProps = {
  profile: ProfilePresentation;
  layoutVariant?: ProfileLayoutVariant;
  websites?: ProfilePublicWebsite[];
  posts?: ProfilePublicPost[];
  mediaUrls?: ProfileMediaDisplayUrls;
  socialStats?: {
    followersCount: number;
    followingCount: number;
  };
  viewerUserId?: string | null;
  isFollowing?: boolean;
};

function publicText(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed && !/^(null|undefined)$/i.test(trimmed) ? trimmed : null;
}

function profileDisplayName(profile: Pick<Profile, "full_name" | "first_name" | "last_name">): string {
  const derivedName = [profile.first_name, profile.last_name].map((value) => publicText(value)).filter(Boolean).join(" ");
  return publicText(profile.full_name) ?? (derivedName || "Your profile");
}

/** Authenticated owner view. Private profile fields intentionally never enter this presentation. */
export function ProfileView({
  profile,
  layoutVariant = "default",
  websites = [],
  posts = [],
  mediaUrls,
  socialStats = { followersCount: 0, followingCount: 0 },
  viewerUserId = profile.id,
  isFollowing = false,
}: ProfileViewProps) {
  const displayName = profileDisplayName(profile);
  const appearance = getProfileAppearance(profile.preferences);
  const displayAppearance = {
    ...appearance,
    coverUrl: mediaUrls
      ? mediaUrls.coverUrl
      : isProfileMediaReference(appearance.coverUrl) || !isSupportedProfileMediaUrl(appearance.coverUrl)
        ? null
        : appearance.coverUrl,
    background: {
      ...appearance.background,
      imageUrl: mediaUrls
        ? mediaUrls.backgroundUrl ?? null
        : isProfileMediaReference(appearance.background.imageUrl) || !isSupportedProfileMediaUrl(appearance.background.imageUrl)
          ? null
          : appearance.background.imageUrl,
    },
  };
  const avatarUrl = mediaUrls
    ? mediaUrls.avatarUrl
    : isProfileMediaReference(profile.avatar_url) || !isSupportedProfileMediaUrl(profile.avatar_url)
      ? null
      : profile.avatar_url;
  const visibility = getProfileVisibility(profile.preferences);
  const age = visibility.showAge ? getProfileAge(profile.date_of_birth) : null;
  const location = visibility.showLocation ? publicText(profile.country) : null;
  const metadata = [age === null ? null : `${age} years old`, location].filter((value): value is string => Boolean(value));
  const pageClassName = layoutVariant === "admin"
    ? "profile-page profile-page-canvas profile-page-admin admin-page-shell"
    : "profile-page profile-page-canvas dashboard-home-shell";

  return (
    <section
      className={`${pageClassName} ${getProfilePageBackgroundClassName(displayAppearance)}`}
      style={getProfilePageBackgroundStyle(displayAppearance)}
      aria-label="Profile page"
    >
      <ProfilePageBackgroundImage appearance={displayAppearance} />
      <div className="profile-page-canvas-content">
        <section className="profile-view-shell" aria-label={`${displayName} profile`}>
          <ProfileSocialPreview
            appearance={displayAppearance}
            avatarUrl={avatarUrl}
            displayName={displayName}
            username={publicText(profile.username)}
            country={location}
            metadata={metadata}
            socialStats={socialStats}
            profileUserId={profile.id}
            viewerUserId={viewerUserId}
            isFollowing={isFollowing}
          />
        </section>

        <ProfileContent appearance={displayAppearance} websites={websites} posts={posts} />
      </div>
    </section>
  );
}
