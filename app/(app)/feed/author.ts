export type FeedAuthorProfile = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

function getNonEmptyText(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getEmailPrefix(email?: string | null): string | null {
  const normalizedEmail = getNonEmptyText(email);
  if (!normalizedEmail) return null;

  const [prefix, domain] = normalizedEmail.split("@");
  return prefix && domain ? prefix : null;
}

export function getFeedAuthorDisplayName(profile?: FeedAuthorProfile | null): string {
  if (!profile) return "Community member";

  const username = getNonEmptyText(profile.username);
  if (username) return username;

  const fullName = getNonEmptyText(profile.full_name) ?? getNonEmptyText(profile.display_name);
  if (fullName) return fullName;

  const nameParts = [getNonEmptyText(profile.first_name), getNonEmptyText(profile.last_name)].filter(
    (part): part is string => Boolean(part),
  );
  if (nameParts.length > 0) return nameParts.join(" ");

  return getEmailPrefix(profile.email) ?? "Community member";
}

export function getFeedAuthorInitials(profile?: FeedAuthorProfile | null): string {
  const displayName = getFeedAuthorDisplayName(profile);
  const nameParts = displayName.split(/\s+/).filter(Boolean);

  return nameParts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "C";
}
