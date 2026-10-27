import type { ProfileAppearance } from "@/lib/profile-appearance";

type PublicProfilePreviewProps = {
  appearance: ProfileAppearance;
  avatarUrl: string | null;
  displayName: string;
  username: string | null;
  country: string | null;
};

const BACKGROUND_CLASS_NAMES: Record<ProfileAppearance["background"]["preset"], string> = {
  default: "profile-preview-background-default",
  forest: "profile-preview-background-forest",
  midnight: "profile-preview-background-midnight",
  aurora: "profile-preview-background-aurora",
  sunset: "profile-preview-background-sunset",
  image: "profile-preview-background-image",
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

/** Public-facing content only: account email, birth date and internal identifiers are intentionally excluded. */
export function PublicProfilePreview({
  appearance,
  avatarUrl,
  displayName,
  username,
  country,
}: PublicProfilePreviewProps) {
  const safeAvatarUrl = safeImageUrl(avatarUrl);
  const safeCoverUrl = safeImageUrl(appearance.coverUrl);
  const safeBackgroundImageUrl = appearance.background.type === "image" ? safeImageUrl(appearance.background.imageUrl) : null;

  return (
    <article
      className={`profile-public-preview profile-preview-style-${appearance.visualStyle} profile-preview-shape-${appearance.cardShape} profile-preview-accent-${appearance.accent} profile-preview-align-${appearance.textAlignment} profile-preview-width-${appearance.contentWidth} ${BACKGROUND_CLASS_NAMES[appearance.background.preset]}`}
      aria-label="Live public profile preview"
      data-testid="public-profile-preview"
    >
      <div className="profile-preview-device-label">Live public profile preview</div>
      <div className="profile-preview-canvas">
        {safeBackgroundImageUrl ? <img src={safeBackgroundImageUrl} alt="" className="profile-preview-background-image-layer" /> : null}
        <div className="profile-preview-cover">
          {safeCoverUrl ? (
            <img
              src={safeCoverUrl}
              alt="Profile cover"
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
            <h3>{displayName}</h3>
            {username ? <p className="profile-preview-username">@{username}</p> : null}
            {country ? <p className="profile-preview-location">{country}</p> : null}
            <div className="profile-preview-card">
              <span>Creator profile</span>
              <p>Share your work, ideas, and the projects you are building with Zero Labs.</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
