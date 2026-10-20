import { Metadata } from "next";
import { PostComposer } from "./post-composer";
import { PostList } from "./post-list";
import { getCommunityFeed, getPublicWebsites, getSavedCommunityItems } from "./queries";
import { PublicWebsiteList } from "./website-list";
import { routes } from "@/config/routes";
import { requireUser } from "@/lib/supabase/auth";
import { createFallbackProfile, getProfileDisplayName, getSafeProfile } from "@/lib/supabase/profile";

export const metadata: Metadata = {
  title: "Community Feed | Zero Labs AI Publisher",
  description: "See what others are building in the Zero Labs community.",
};

export default async function FeedPage() {
  const user = await requireUser(routes.feed);
  const profile = await getSafeProfile(user).catch(() => createFallbackProfile(user));

  const [posts, publicWebsites, savedItems] = await Promise.all([
    getCommunityFeed(),
    getPublicWebsites(),
    getSavedCommunityItems(user.id),
  ]);
  const savedPostIds = savedItems
    .filter((item) => item.item_type === "post")
    .map((item) => item.item_id);

  return (
    <div className="feed-shell">
      <aside className="feed-panel feed-community-panel feed-sticky-panel" aria-label="Community overview">
        <div className="feed-panel-heading">
          <span className="feed-panel-kicker">Zero Labs community</span>
          <h2>Community</h2>
          <p>A focused place to share build notes, launches, questions, and ideas.</p>
        </div>

        <div className="feed-profile-card">
          <div className="feed-profile-avatar" aria-hidden="true">
            {getProfileDisplayName(profile).charAt(0).toUpperCase()}
          </div>
          <div className="feed-profile-copy">
            <strong>{getProfileDisplayName(profile)}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <p className="feed-panel-note">
          Text posts are ready today. Attachment and website-share options reflect the workspace capabilities shown in the composer.
        </p>
      </aside>

      <main className="feed-main">
        <PostComposer websites={publicWebsites.filter((website) => website.owner_id === user.id)} />

        <section className="feed-posts-section" aria-labelledby="community-posts-heading">
          <div className="feed-panel-heading">
            <span className="feed-panel-kicker">Community posts</span>
            <h2 id="community-posts-heading">Recent posts</h2>
            <p>Public posts and your own private posts appear here when available.</p>
          </div>
          <PostList posts={posts} currentUserId={user.id} savedPostIds={savedPostIds} />
        </section>
      </main>

      <aside className="feed-panel feed-explore-panel feed-sticky-panel" aria-labelledby="public-websites-heading">
        <div className="feed-panel-heading">
          <span className="feed-panel-kicker">Explore</span>
          <h2 id="public-websites-heading">Public Websites</h2>
          <p>Discover websites other users have chosen to share publicly.</p>
        </div>
        <PublicWebsiteList websites={publicWebsites} />
      </aside>
    </div>
  );
}
