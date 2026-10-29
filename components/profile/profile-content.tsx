import Link from "next/link";
import { routes } from "@/config/routes";
import type { ProfileAppearance } from "@/lib/profile-appearance";

/* eslint-disable @next/next/no-img-element -- The validated, user-configured background cannot be statically optimized. */

export type ProfilePublicWebsite = {
  id: string;
  site_title: string | null;
};

export type ProfilePublicPost = {
  id: string;
  title: string | null;
  body: string;
  created_at: string;
};

type ProfileContentProps = {
  appearance: ProfileAppearance;
  websites: ProfilePublicWebsite[];
  posts: ProfilePublicPost[];
};

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || /^(null|undefined)$/i.test(trimmed)) return null;
  return trimmed;
}

function postExcerpt(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 220 ? `${compact.slice(0, 217).trimEnd()}…` : compact;
}

function formatPostDate(value: string): { dateTime: string; label: string } | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : { dateTime: date.toISOString(), label: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) };
}

function safeImageUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

/** Renders only persisted public items; empty content types disappear instead of leaving empty cards. */
export function ProfileContent({ appearance, websites, posts }: ProfileContentProps) {
  const publicWebsites = websites.flatMap((website) => {
    const title = cleanText(website.site_title);
    return title ? [{ id: website.id, title }] : [];
  });
  const publicPosts = posts.flatMap((post) => {
    const body = cleanText(post.body);
    return body
      ? [{ id: post.id, title: cleanText(post.title), body, createdAt: formatPostDate(post.created_at) }]
      : [];
  });

  if (publicWebsites.length === 0 && publicPosts.length === 0) return null;

  const backgroundImageUrl = appearance.background.type === "image" ? safeImageUrl(appearance.background.imageUrl) : null;

  return (
    <section
      className={`profile-content-section profile-content-style-${appearance.visualStyle} profile-content-shape-${appearance.cardShape} profile-content-accent-${appearance.accent} profile-content-align-${appearance.textAlignment} profile-content-width-${appearance.contentWidth} profile-content-background-${appearance.background.preset}`}
      aria-labelledby="profile-content-heading"
    >
      {backgroundImageUrl ? <img src={backgroundImageUrl} alt="" className="profile-content-background-image-layer" /> : null}
      <header className="profile-content-heading">
        <span className="profile-section-kicker">Public profile</span>
        <h2 id="profile-content-heading">Shared work and updates</h2>
      </header>

      {publicWebsites.length > 0 ? (
        <section className="profile-content-group" aria-labelledby="profile-websites-heading">
          <h3 id="profile-websites-heading">Websites</h3>
          <div className="profile-content-card-grid">
            {publicWebsites.map((website) => (
              <Link key={website.id} href={routes.liveSite(website.id)} className="profile-content-card profile-website-card">
                <span className="profile-content-card-kicker">Published website</span>
                <strong>{website.title}</strong>
                <span className="profile-content-card-link">Visit website</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {publicPosts.length > 0 ? (
        <section className="profile-content-group" aria-labelledby="profile-posts-heading">
          <h3 id="profile-posts-heading">Recent posts</h3>
          <div className="profile-content-card-grid">
            {publicPosts.map((post) => (
              <article key={post.id} className="profile-content-card profile-post-card" aria-label={post.title ?? "Recent community post"}>
                {post.title ? <h4>{post.title}</h4> : null}
                <p>{postExcerpt(post.body)}</p>
                {post.createdAt ? <time dateTime={post.createdAt.dateTime}>{post.createdAt.label}</time> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
