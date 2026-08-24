"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { PublishStatusBadge } from "@/components/publish/publish-status-badge";
import { VisibilityToggle } from "./visibility-toggle";
import type { DashboardWebsiteSummary } from "@/lib/dashboard";
import { createPortal } from "react-dom";

interface Post {
  id: string;
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Website {
  id: string;
  site_title: string;
  status: string;
  updated_at: string;
  user_id: string;
}

interface SavedItem {
  item_id: string;
  item_type: string;
}

export function CommunityFeed({
  currentUserId,
  websiteSummary
}: {
  currentUserId: string,
  websiteSummary: DashboardWebsiteSummary
}) {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rightSidebarMounted, setRightSidebarMounted] = useState(false);

  // New Post State
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostVisibility, setNewPostVisibility] = useState<"public" | "private">("public");
  const [posting, setPosting] = useState(false);

  const fetchCommunityData = async () => {
    try {
      const res = await fetch("/api/dashboard/community");
      const { data } = await res.json();
      if (data) {
        setWebsites(data.websites || []);
        setPosts(data.posts || []);
        setSavedItems(data.savedItems || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
    setRightSidebarMounted(true);
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/dashboard/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_post", payload: { body: newPostContent, visibility: newPostVisibility } })
      });
      if (res.ok) {
        setNewPostContent("");
        fetchCommunityData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch("/api/dashboard/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_post", payload: { postId } })
      });
      if (res.ok) {
        fetchCommunityData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveItem = async (itemId: string, itemType: "post" | "website") => {
    const isSaved = savedItems.some(i => i.item_id === itemId && i.item_type === itemType);
    const action = isSaved ? "unsave_item" : "save_item";
    try {
      const res = await fetch("/api/dashboard/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload: { itemId, itemType } })
      });
      if (res.ok) {
        fetchCommunityData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isSaved = (id: string, type: string) => savedItems.some(i => i.item_id === id && i.item_type === type);

  const rightSidebarContent = rightSidebarMounted && document.getElementById("dashboard-right-sidebar") ? createPortal(
    <>
      <div className="dashboard-sidebar-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Saved Items</h3>
        {savedItems.length > 0 ? (
           <p className="dashboard-empty-note">You have {savedItems.length} saved item(s).</p>
        ) : (
           <p className="dashboard-empty-note">No items saved yet.</p>
        )}
      </div>

      <div className="dashboard-sidebar-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Community Websites</h3>
        {websites.filter(w => w.user_id !== currentUserId).length > 0 ? (
          <ul className="dashboard-compact-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {websites.filter(w => w.user_id !== currentUserId).map(website => (
              <li key={website.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--marketing-card-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>{website.site_title || "Untitled"}</strong>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Link href={routes.previewSite(website.id)} className="wizard-button-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", minHeight: "auto" }}>
                    Preview
                  </Link>
                  <button onClick={() => handleSaveItem(website.id, "website")} className="wizard-button-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", minHeight: "auto" }}>
                    {isSaved(website.id, "website") ? "Unsave" : "Save"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-empty-note" style={{ fontSize: '0.85rem' }}>No public websites found.</p>
        )}
      </div>
    </>,
    document.getElementById("dashboard-right-sidebar")!
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {rightSidebarContent}

      {/* Center Feed: Create Post */}
      <section className="dashboard-panel-shell" aria-label="Create a post" style={{ padding: '1.5rem', background: 'var(--marketing-surface)' }}>
        <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
           <textarea
             value={newPostContent}
             onChange={e => setNewPostContent(e.target.value)}
             placeholder="Share an update, ask a question, or post a public draft..."
             style={{ width: "100%", minHeight: "80px", padding: "1rem", borderRadius: "8px", border: "1px solid var(--marketing-card-border)", background: "var(--background)", color: "var(--foreground)", resize: "vertical", fontFamily: "inherit" }}
             disabled={posting}
             required
           />
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <select
               value={newPostVisibility}
               onChange={e => setNewPostVisibility(e.target.value as "public" | "private")}
               style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--marketing-card-border)", background: "var(--background)", color: "var(--foreground)" }}
               disabled={posting}
             >
               <option value="public">Public Post</option>
               <option value="private">Private Draft</option>
             </select>
             <button type="submit" className="wizard-button-primary" disabled={posting || !newPostContent.trim()} style={{ padding: "0.5rem 1.5rem", minHeight: "auto" }}>
               {posting ? "Posting..." : "Post"}
             </button>
           </div>
        </form>
      </section>

      {/* Center Feed: Own Websites Summary inline instead of dashboard-website-summary to fit feed */}
      <section className="dashboard-panel-shell" aria-label="My Websites">
        <header>
          <h2>My Websites</h2>
        </header>
        {websiteSummary.recentlyUpdated.length > 0 ? (
          <ul className="dashboard-compact-list">
            {websiteSummary.recentlyUpdated.map((website) => (
              <li key={website.id} style={{ padding: '1rem', border: '1px solid var(--marketing-card-border)', borderRadius: '8px', marginBottom: '1rem', background: 'var(--background)' }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <Link href={website.href} className="dashboard-inline-link" style={{ fontSize: "1.1rem", marginBottom: "0.25rem", display: "inline-block", fontWeight: '600' }}>
                      {website.title}
                    </Link>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                      <PublishStatusBadge state={website.publishStatus.uiState} />
                      <VisibilityToggle websiteId={website.id} initialVisibility={website.visibility || "private"} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <Link href={website.previewPath} className="wizard-button-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", minHeight: "auto" }}>
                      Preview
                    </Link>
                    <Link href={website.editorPath} className="wizard-button-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", minHeight: "auto" }}>
                      Open / Edit
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-empty-note">No websites found yet.</p>
        )}
      </section>

      {/* Center Feed: Community Posts */}
      <section className="dashboard-panel-shell" aria-label="Community feed">
        <header>
          <h2>Feed</h2>
        </header>

        {loading ? (
           <p className="dashboard-empty-note">Loading posts...</p>
        ) : posts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {posts.map(post => (
              <article key={post.id} style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--marketing-card-border)", background: "var(--background)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <p style={{ margin: "0 0 1rem 0", whiteSpace: "pre-wrap", fontSize: "1rem", lineHeight: "1.5" }}>{post.body}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "var(--marketing-muted)", borderTop: "1px solid var(--marketing-card-border)", paddingTop: "1rem" }}>
                  <span>{new Date(post.created_at).toLocaleString()}</span>
                  <div style={{ display: "flex", gap: "1rem" }}>
                     {post.user_id === currentUserId ? (
                       <button onClick={() => handleDeletePost(post.id)} style={{ background: "none", border: "none", color: "var(--marketing-error, red)", cursor: "pointer", fontWeight: "500" }}>Delete</button>
                     ) : (
                       <button onClick={() => handleSaveItem(post.id, "post")} style={{ background: "none", border: "none", color: "var(--marketing-ocean)", cursor: "pointer", fontWeight: "500" }}>
                         {isSaved(post.id, "post") ? "Saved" : "Save"}
                       </button>
                     )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="dashboard-empty-note">No posts in the feed yet.</p>
        )}
      </section>
    </div>
  );
}
