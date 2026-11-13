type FeedAvatarProps = {
  className: string;
  avatarDisplayUrl: string | null | undefined;
  initials: string;
};

/** Renders only a server-resolved display URL; durable private-media references never reach img src. */
export function FeedAvatar({ className, avatarDisplayUrl, initials }: FeedAvatarProps) {
  const displayUrl = avatarDisplayUrl?.trim();

  return (
    <div className={className} aria-hidden="true">
      {displayUrl ? <img src={displayUrl} alt="" /> : initials}
    </div>
  );
}
