import type { CSSProperties, ReactNode } from "react";
import type { ProfileAppearance } from "@/lib/profile-appearance";

type PublicProfilePreviewProps = {
  appearance: ProfileAppearance;
  avatarUrl: string | null;
  displayName: string;
  username: string | null;
  country: string | null;
  label?: string;
  variant?: "preview" | "profile";
  metadata?: string[];
  action?: ReactNode;
};

const PAGE_BACKGROUND_PRESET_CLASS_NAMES: Record<ProfileAppearance["background"]["preset"], string> = {
  default: "profile-page-background-default",
  forest: "profile-page-background-forest",
  midnight: "profile-page-background-midnight",
  aurora: "profile-page-background-aurora",
  sunset: "profile-page-background-sunset",
  image: "profile-page-background-image",
};

function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) ?? "Z").toUpperCase();
}

function safeImageUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "blob:" ? value : null;
  } catch {
    return null;
  }
}

function getPageBackgroundFallback(appearance: ProfileAppearance): {
  type: "solid" | "gradient";
  preset: ProfileAppearance["background"]["preset"];
  color: string | null;
} {
  const { background } = appearance;
  if (background.type !== "image") {
    return { type: background.type, preset: background.preset, color: background.color ?? null };
  }

  return {
    type: background.color ? "solid" : "gradient",
    preset: background.preset === "image" ? "default" : background.preset,
    color: background.color ?? null,
  };
}

/** The page canvas is separate from the profile header's cover photo. */
export function getProfilePageBackgroundClassName(appearance: ProfileAppearance): string {
  const fallback = getPageBackgroundFallback(appearance);
  return [
    "profile-page-background",
    `profile-page-background-${fallback.type}`,
    PAGE_BACKGROUND_PRESET_CLASS_NAMES[fallback.preset],
    appearance.background.type === "image" ? "profile-page-background-image" : null,
  ].filter(Boolean).join(" ");
}

export function getProfilePageBackgroundStyle(appearance: ProfileAppearance): CSSProperties | undefined {
  const fallback = getPageBackgroundFallback(appearance);
  if (fallback.type !== "solid" || !fallback.color) return undefined;

  return { "--profile-page-solid-color": fallback.color } as CSSProperties;
}

export function ProfilePageBackgroundImage({ appearance }: { appearance: ProfileAppearance }) {
  const imageUrl = appearance.background.type === "image" ? safeImageUrl(appearance.background.imageUrl) : null;

  return imageUrl ? <img src={imageUrl} alt="" className="profile-page-background-image-layer" /> : null;
}

/** Public-facing content only: account email, birth date and internal identifiers are intentionally excluded. */
export function PublicProfilePreview({
  appearance,
  avatarUrl,
  displayName,
  username,
  country,
  label = "Live public profile preview",
  variant = "preview",
  metadata = [],
  action,
}: PublicProfilePreviewProps) {
  const safeAvatarUrl = safeImageUrl(avatarUrl);
  const safeCoverUrl = safeImageUrl(appearance.coverUrl);
  return (
    <article
      className={`profile-public-preview${variant === "profile" ? " profile-public-profile" : ""} profile-preview-style-${appearance.visualStyle} profile-preview-shape-${appearance.cardShape} profile-preview-accent-${appearance.accent} profile-preview-align-${appearance.textAlignment} profile-preview-width-${appearance.contentWidth}`}
      aria-label={label}
      data-testid="public-profile-preview"
    >
      {variant === "preview" ? <div className="profile-preview-device-label">{label}</div> : null}
      {variant === "profile" && action ? <div className="profile-profile-action">{action}</div> : null}
      <div className="profile-preview-canvas">
        <div className="profile-preview-cover">
          {safeCoverUrl ? (
            <img
              src={safeCoverUrl}
              alt={`${displayName} profile cover`}
              className="profile-preview-cover-image"
              style={{ objectPosition: `center ${appearance.coverFocalPoint}` }}
            />
          ) : null}
        </div>
        <div className="profile-preview-content">
          <div className="profile-preview-avatar" aria-label={`${displayName} profile picture`}>
            {safeAvatarUrl ? <img src={safeAvatarUrl} alt={`${displayName} profile picture`} /> : <span aria-hidden="true">{initials(displayName)}</span>}
          </div>
          <div className="profile-preview-copy">
            {variant === "profile" ? <h1>{displayName}</h1> : <h3>{displayName}</h3>}
            {username ? <p className="profile-preview-username">@{username}</p> : null}
            {metadata.length > 0 ? <ul className="profile-profile-metadata">{metadata.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            {variant === "preview" && country ? <p className="profile-preview-location">{country}</p> : null}
            {variant === "preview" ? <div className="profile-preview-card"><span>Creator profile</span><p>Share your work, ideas, and the projects you are building with Zero Labs.</p></div> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
