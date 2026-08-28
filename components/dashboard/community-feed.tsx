"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";

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

export function CommunityFeed({ currentUserId }: { currentUserId: string }) {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="dashboard-panel-shell" aria-busy="true"><p>Loading community feed...</p></div>;
  }

  const isSaved = (id: string, type: string) => savedItems.some(i => i.item_id === id && i.item_type === type);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Community Websites Section */}
      <section className="dashboard-panel-shell" aria-label="Community websites">
        <header>
          <h2>Community websites</h2>
          <p>Public website previews shared by other users.</p>
        </header>
        {websites.filter(w => w.user_id !== currentUserId).length > 0 ? (
          <ul className="dashboard-compact-list">
            {websites.filter(w => w.user_id !== currentUserId).map(website => (
              <li key={website.id}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <strong style={{ fontSize: "1.1rem" }}>{website.site_title || "Untitled"}</strong>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link href={routes.previewSite(website.id)} className="wizard-button-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", minHeight: "auto" }}>
                        Preview
                      </Link>
                      <button onClick={() => handleSaveItem(website.id, "website")} className="wizard-button-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", minHeight: "auto" }}>
                        {isSaved(website.id, "website") ? "Unsave" : "Save"}
                      </button>
                    </div>
                 </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-empty-note">No public websites yet.</p>
        )}
      </section>

      {/* Community Feed Section */}
      <section className="dashboard-panel-shell" aria-label="Community feed">
        <header>
          <h2>Community feed</h2>
          <p>Read posts from others and share your own.</p>
        </header>

        <form onSubmit={handleCreatePost} style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem", background: "var(--marketing-surface)", borderRadius: "8px", border: "1px solid var(--marketing-card-border)" }}>
           <textarea
             value={newPostContent}
             onChange={e => setNewPostContent(e.target.value)}
             placeholder="What's on your mind?"
             style={{ width: "100%", minHeight: "80px", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--marketing-card-border)", background: "var(--background)", color: "var(--foreground)" }}
             disabled={posting}
             required
           />
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <select
               value={newPostVisibility}
               onChange={e => setNewPostVisibility(e.target.value as "public" | "private")}
               style={{ padding: "0.3rem", borderRadius: "4px", border: "1px solid var(--marketing-card-border)" }}
               disabled={posting}
             >
               <option value="public">Public</option>
                <option value="private">Private</option>
             </select>
             <button type="submit" className="wizard-button-primary" disabled={posting} style={{ padding: "0.4rem 1rem", fontSize: "0.9rem", minHeight: "auto" }}>
               {posting ? "Posting..." : "Post"}
             </button>
           </div>
        </form>

        {posts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {posts.map(post => (
              <article key={post.id} style={{ padding: "1rem", borderRadius: "8px", border: "1px solid var(--marketing-card-border)", background: "var(--background)" }}>
                <p style={{ margin: "0 0 1rem 0", whiteSpace: "pre-wrap" }}>{post.body}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "var(--marketing-muted)" }}>
                  <span>{new Date(post.created_at).toLocaleString()}</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                     {post.user_id === currentUserId ? (
                       <button onClick={() => handleDeletePost(post.id)} style={{ background: "none", border: "none", color: "red", cursor: "pointer", textDecoration: "underline" }}>Delete</button>
                     ) : (
                        <button onClick={() => handleSaveItem(post.id, "post")} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>
                          {isSaved(post.id, "post") ? "Unsave" : "Save"}
                        </button>
                     )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="dashboard-empty-note">No community posts yet.</p>
        )}
      </section>

      {/* Saved Items Summary could be added here if needed, but requirements mention "if simple to include" and we have inline toggles. We can add a simple list. */}
      {savedItems.length > 0 && (
         <section className="dashboard-panel-shell" aria-label="Saved items">
            <header>
              <h2>Saved items</h2>
              <p>Your saved posts and websites.</p>
            </header>
            <p className="dashboard-empty-note">You have {savedItems.length} saved item(s).</p>
         </section>
      )}

    </div>
  );
}
