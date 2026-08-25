import { Metadata } from "next";
import { requireUser } from "@/lib/supabase/auth";
import { routes } from "@/config/routes";
import { getCommunityFeed, getPublicWebsites } from "./queries";
import { getProfileDisplayName, getSafeProfile, createFallbackProfile } from "@/lib/supabase/profile";
import { PostComposer } from "./post-composer";
import { PostList } from "./post-list";
import { PublicWebsiteList } from "./website-list";

export const metadata: Metadata = {
  title: "Community Feed | Zero Labs AI Publisher",
  description: "See what others are building in the Zero Labs community.",
};

export default async function FeedPage() {
  const user = await requireUser(routes.login);
  const profile = await getSafeProfile(user).catch(() => createFallbackProfile(user));

  const [posts, publicWebsites] = await Promise.all([
    getCommunityFeed(),
    getPublicWebsites()
  ]);

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[250px_1fr_300px] gap-6">
      {/* Left Column: Shortcuts/Profile Summary */}
      <aside className="app-card flex flex-col gap-4 h-fit sticky top-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Community</h2>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-mint-100 dark:bg-mint-900 flex items-center justify-center text-mint-700 dark:text-mint-300 font-bold">
            {getProfileDisplayName(profile).charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{getProfileDisplayName(profile)}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">
          Connect, share, and see what others are creating in the Zero Labs network.
        </div>
      </aside>

      {/* Middle Column: Feed Composer and Posts */}
      <main className="flex flex-col gap-6">
        <PostComposer />

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Posts</h2>
          <PostList posts={posts} currentUserId={user.id} />
        </div>
      </main>

      {/* Right Column: Public Websites/Saved Content */}
      <aside className="app-card flex flex-col gap-4 h-fit sticky top-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Public Websites</h2>
        <div className="text-xs text-gray-500 mb-2">Discover what others are building</div>
        <PublicWebsiteList websites={publicWebsites} />
      </aside>
    </div>
  );
}
