"use client";

import { useState } from "react";

interface DashboardCommunityWebsitesProps {
  publicWebsites: any[];
  savedItemIds: string[];
}

export function DashboardCommunityWebsites({ publicWebsites, savedItemIds }: DashboardCommunityWebsitesProps) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(savedItemIds));

  const handleSaveToggle = async (websiteId: string) => {
    const isSaved = savedIds.has(websiteId);
    const newSavedIds = new Set(savedIds);
    if (isSaved) {
      newSavedIds.delete(websiteId);
    } else {
      newSavedIds.add(websiteId);
    }
    setSavedIds(newSavedIds);

    try {
      if (isSaved) {
        await fetch("/api/dashboard/community/save", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content_id: websiteId, content_type: "website" }),
        });
      } else {
        await fetch("/api/dashboard/community/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content_id: websiteId, content_type: "website" }),
        });
      }
    } catch (e) {
      console.error("Failed to toggle save", e);
      const revertedIds = new Set(savedIds);
      if (isSaved) {
        revertedIds.add(websiteId);
      } else {
        revertedIds.delete(websiteId);
      }
      setSavedIds(revertedIds);
    }
  };

  return (
    <section className="dashboard-panel-shell" style={{ marginTop: "2rem" }}>
      <header className="dashboard-section-heading">
        <h2>Explore community websites</h2>
        <p className="dashboard-empty-note">Discover public websites created by the Zero Labs community.</p>
      </header>
      {publicWebsites.length === 0 ? (
        <p className="dashboard-empty-note">No public websites available right now.</p>
      ) : (
        <div className="dashboard-recent-activity-list" style={{ marginTop: "1rem" }}>
          {publicWebsites.map((site) => (
            <article key={site.id} className="dashboard-activity-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid var(--border-color, #eee)" }}>
              <div>
                <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem" }}>{site.site_title || site.title}</h3>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "var(--text-secondary, #666)" }}>
                  Type: {site.website_type || "Standard"} • {new Date(site.updated_at || site.created_at).toLocaleDateString()}
                </p>
                {site.tagline && <p style={{ margin: 0, fontSize: "0.875rem" }}>{site.tagline}</p>}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {site.generatedSitePath && (
                  <a href={site.generatedSitePath} target="_blank" rel="noopener noreferrer" className="wizard-button-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem", textDecoration: "none" }}>
                    Preview
                  </a>
                )}
                <button
                  onClick={() => handleSaveToggle(site.id)}
                  className="wizard-button-secondary"
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem" }}
                >
                  {savedIds.has(site.id) ? "Saved" : "Save"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
