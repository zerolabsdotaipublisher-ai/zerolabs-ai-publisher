import Link from "next/link";
import { ProfileContent, type ProfilePublicPost, type ProfilePublicWebsite } from "@/components/profile/profile-content";
import { routes } from "@/config/routes";
import { getProfileAppearance } from "@/lib/profile-appearance";
import { getProfileAge, getProfileVisibility } from "@/lib/profile-visibility";
import type { Profile } from "@/lib/supabase/profile";
import { PublicProfilePreview } from "./profile-preview";

type ProfileLayoutVariant = "default" | "admin";

type ProfileViewProps = {
  profile: Profile;
  layoutVariant?: ProfileLayoutVariant;
  websites?: ProfilePublicWebsite[];
  posts?: ProfilePublicPost[];
};

function publicText(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed && !/^(null|undefined)$/i.test(trimmed) ? trimmed : null;
}

function profileDisplayName(profile: Profile): string {
  const derivedName = [profile.first_name, profile.last_name].map((value) => publicText(value)).filter(Boolean).join(" ");
  return publicText(profile.full_name) ?? (derivedName || "Your profile");
}

/** Authenticated owner view. Private profile fields intentionally never enter this presentation. */
export function ProfileView({ profile, layoutVariant = "default", websites = [], posts = [] }: ProfileViewProps) {
  const displayName = profileDisplayName(profile);
  const appearance = getProfileAppearance(profile.preferences);
  const visibility = getProfileVisibility(profile.preferences);
  const age = visibility.showAge ? getProfileAge(profile.date_of_birth) : null;
  const location = visibility.showLocation ? publicText(profile.country) : null;
  const metadata = [age === null ? null : `${age} years old`, location].filter((value): value is string => Boolean(value));
  const pageClassName = layoutVariant === "admin" ? "profile-page profile-page-admin admin-page-shell" : "profile-page dashboard-home-shell";

  return (
    <section className={pageClassName} aria-label="Profile page">
      <section className="profile-view-shell" aria-label={`${displayName} profile`}>
        <PublicProfilePreview
          appearance={appearance}
          avatarUrl={profile.avatar_url}
          displayName={displayName}
          username={publicText(profile.username)}
          country={location}
          label={`${displayName} profile`}
          variant="profile"
          metadata={metadata}
          action={<Link href={routes.profileCustomize} className="profile-edit-link">Edit profile</Link>}
        />
      </section>

      <ProfileContent appearance={appearance} websites={websites} posts={posts} />
    </section>
  );
}
