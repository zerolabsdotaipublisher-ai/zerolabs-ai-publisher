"use client";

import { useTransition, useState } from "react";

import { Trash2 } from "lucide-react";
import { deleteCommunityPost } from "./actions";

export function PostList({ posts, currentUserId }: { posts: any[], currentUserId: string }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      setDeletingId(postId);
      startTransition(async () => {
        await deleteCommunityPost(postId);
        setDeletingId(null);
      });
    }
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="app-card text-center py-10 text-[var(--text-muted)]">
        No posts to display yet. Be the first to share something!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => {
        const isOwner = post.user_id === currentUserId;
        const authorName = post.author?.raw_user_meta_data?.display_name || post.author?.raw_user_meta_data?.full_name || "Anonymous User";
        const authorInitial = authorName.charAt(0).toUpperCase();

        return (
          <div key={post.id} className="app-card relative">
            {isOwner && (
              <button
                onClick={() => handleDelete(post.id)}
                disabled={isPending && deletingId === post.id}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                aria-label="Delete post"
              >
                <Trash2 size={16} />
              </button>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-mint-100 dark:bg-mint-900 flex items-center justify-center text-mint-700 dark:text-mint-300 font-bold text-sm">
                {authorInitial}
              </div>
              <div>
                <div className="font-medium text-[var(--text-primary)] text-sm">
                  {authorName}
                  {post.visibility !== 'public' && <span className="ml-2 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{post.visibility}</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(post.created_at as string).toLocaleDateString()}
                </div>
              </div>
            </div>

            {post.title && <h3 className="font-semibold text-[var(--text-primary)] mb-2">{post.title}</h3>}
            <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{post.body}</p>
          </div>
        );
      })}
    </div>
  );
}
