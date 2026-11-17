"use client";

import Link from "next/link";
import { useState } from "react";
import { routes } from "@/config/routes";
import type { ProfileAppearance } from "@/lib/profile-appearance";
import type { ProfileMediaDisplayUrls } from "@/lib/profile-media";
import { ProfileFollowButton } from "./profile-follow-button";
import { PublicProfilePreview } from "./profile-preview";

type ProfileSocialPreviewProps = {
  appearance: ProfileAppearance;
  avatarUrl: ProfileMediaDisplayUrls["avatarUrl"];
  displayName: string;
  username: string | null;
  country: string | null;
  metadata: string[];
  socialStats: { followersCount: number; followingCount: number };
  profileUserId: string;
  viewerUserId: string | null;
  isFollowing: boolean;
};

/** Keeps the visible follower count in sync with profile follow/unfollow actions. */
export function ProfileSocialPreview({
  appearance,
  avatarUrl,
  displayName,
  username,
  country,
  metadata,
  socialStats,
  profileUserId,
  viewerUserId,
  isFollowing,
}: ProfileSocialPreviewProps) {
  const [relationship, setRelationship] = useState(isFollowing);
  const [currentStats, setCurrentStats] = useState(socialStats);
  const isOwner = viewerUserId === profileUserId;

  const handleRelationshipChange = (nextIsFollowing: boolean) => {
    setRelationship(nextIsFollowing);
    setCurrentStats((current) => ({
      ...current,
      followersCount: Math.max(0, current.followersCount + (nextIsFollowing ? 1 : -1)),
    }));
  };

  const action = isOwner ? (
    <Link href={routes.profileCustomize} className="profile-edit-link">Edit profile</Link>
  ) : viewerUserId ? (
    <ProfileFollowButton
      profileUserId={profileUserId}
      displayName={displayName}
      isFollowing={relationship}
      onRelationshipChange={handleRelationshipChange}
    />
  ) : null;

  return (
    <PublicProfilePreview
      appearance={appearance}
      avatarUrl={avatarUrl}
      displayName={displayName}
      username={username}
      country={country}
      label={`${displayName} profile`}
      variant="profile"
      metadata={metadata}
      socialStats={currentStats}
      action={action}
    />
  );
}
