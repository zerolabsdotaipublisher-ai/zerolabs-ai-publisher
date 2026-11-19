import Link from "next/link";
import { FeedAvatar } from "./avatar";

type FeedSidebarProfileIdentityProps = {
  href: string;
  displayName: string;
  email: string | null | undefined;
  avatarDisplayUrl: string | null;
  initials: string;
};

/** The signed-in Feed identity links to the owner profile without sharing Feed author-link state. */
export function FeedSidebarProfileIdentity({
  href,
  displayName,
  email,
  avatarDisplayUrl,
  initials,
}: FeedSidebarProfileIdentityProps) {
  return (
    <div className="feed-profile-card">
      <Link href={href} className="feed-profile-avatar-link" aria-label="View your profile">
        <FeedAvatar className="feed-profile-avatar" avatarDisplayUrl={avatarDisplayUrl} initials={initials} />
      </Link>
      <div className="feed-profile-copy">
        <Link href={href} className="feed-profile-name-link">{displayName}</Link>
        {email ? <span>{email}</span> : null}
      </div>
    </div>
  );
}
