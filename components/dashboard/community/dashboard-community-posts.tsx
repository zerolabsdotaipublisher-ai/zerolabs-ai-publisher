"use client";

import { useState } from "react";
import type { CommunityPost } from "@/lib/community/types";

interface DashboardCommunityPostsProps {
  initialPosts: CommunityPost[];
  userPosts: CommunityPost[];
  savedItemIds: string[];
}

export function DashboardCommunityPosts({ initialPosts, userPosts, savedItemIds }: DashboardCommunityPostsProps) {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [myPosts, setMyPosts] = useState<CommunityPost[]>(userPosts);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(savedItemIds));
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"draft" | "public">("public");

  const handleSaveToggle = async (postId: string) => {
    const isSaved = savedIds.has(postId);
    const newSavedIds = new Set(savedIds);
    if (isSaved) {
      newSavedIds.delete(postId);
    } else {
      newSavedIds.add(postId);
    }
    setSavedIds(newSavedIds);

    try {
      if (isSaved) {
        await fetch("/api/dashboard/community/save", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content_id: postId, content_type: "post" }),
        });
      } else {
        await fetch("/api/dashboard/community/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content_id: postId, content_type: "post" }),
        });
      }
    } catch (e) {
      console.error("Failed to toggle save", e);
      // Revert on error
      const revertedIds = new Set(savedIds);
      if (isSaved) {
        revertedIds.add(postId);
      } else {
        revertedIds.delete(postId);
      }
      setSavedIds(revertedIds);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/dashboard/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, visibility }),
      });
      if (res.ok) {
        const newPost = await res.json();
        setMyPosts([newPost, ...myPosts]);
        if (newPost.visibility === "public") {
          setPosts([newPost, ...posts]);
        }
        setTitle("");
        setContent("");
        setVisibility("public");
      }
    } catch (e) {
      console.error("Failed to create post", e);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="dashboard-community-section">
      <section className="dashboard-panel-shell">
        <header className="dashboard-section-heading">
          <h2>Create a post</h2>
        </header>
        <form onSubmit={handleCreatePost} className="community-post-form">
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="post-title" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Title</label>
            <input
              id="post-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-color, #ccc)" }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="post-content" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Content</label>
            <textarea
              id="post-content"
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-color, #ccc)" }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="post-visibility" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Visibility</label>
            <select
              id="post-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "draft" | "public")}
              style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-color, #ccc)" }}
            >
              <option value="public">Public (Community)</option>
              <option value="draft">Draft (Private)</option>
            </select>
          </div>
          <button type="submit" disabled={isCreating} className="wizard-button-primary">
            {isCreating ? "Posting..." : "Post"}
          </button>
        </form>
      </section>

      <section className="dashboard-panel-shell" style={{ marginTop: "2rem" }}>
        <header className="dashboard-section-heading">
          <h2>Community blog posts</h2>
          <p className="dashboard-empty-note">Explore public posts from other Zero Labs users.</p>
        </header>
        {posts.length === 0 ? (
          <p className="dashboard-empty-note">No public posts available yet.</p>
        ) : (
          <div className="dashboard-recent-activity-list" style={{ marginTop: "1rem" }}>
            {posts.map((post) => (
              <article key={post.id} className="dashboard-activity-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid var(--border-color, #eee)" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem" }}>{post.title}</h3>
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "var(--text-secondary, #666)" }}>
                    By {post.author_name || "Anonymous"} • {new Date(post.created_at).toLocaleDateString()}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.875rem" }}>{post.content.substring(0, 100)}{post.content.length > 100 ? "..." : ""}</p>
                </div>
                <div>
                  <button
                    onClick={() => handleSaveToggle(post.id)}
                    className="wizard-button-secondary"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem" }}
                  >
                    {savedIds.has(post.id) ? "Saved" : "Save"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel-shell" style={{ marginTop: "2rem" }}>
        <header className="dashboard-section-heading">
          <h2>Your posts</h2>
        </header>
        {myPosts.length === 0 ? (
          <p className="dashboard-empty-note">You haven&apos;t created any posts yet.</p>
        ) : (
          <div className="dashboard-recent-activity-list" style={{ marginTop: "1rem" }}>
            {myPosts.map((post) => (
              <article key={post.id} className="dashboard-activity-item" style={{ padding: "1rem", borderBottom: "1px solid var(--border-color, #eee)" }}>
                <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem" }}>{post.title}</h3>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "var(--text-secondary, #666)" }}>
                  Status: {post.visibility} • {new Date(post.created_at).toLocaleDateString()}
                </p>
                <p style={{ margin: 0, fontSize: "0.875rem" }}>{post.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
