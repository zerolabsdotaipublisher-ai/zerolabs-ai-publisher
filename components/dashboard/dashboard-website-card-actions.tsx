"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2, Link as LinkIcon, Globe, Lock } from "lucide-react";
import { routes } from "@/config/routes";
import type { DashboardWebsiteSummary } from "@/lib/dashboard";

interface DashboardWebsiteCardActionsProps {
  website: DashboardWebsiteSummary["generatedWebsites"][number];
}

export function DashboardWebsiteCardActions({ website }: DashboardWebsiteCardActionsProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPrivate = website.visibility === "private" || !website.visibility;

  const getPublicLink = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${website.generatedSitePath || website.previewPath}`;
    }
    return website.generatedSitePath || website.previewPath || "";
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getPublicLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link", error);
    }
  };

  return (
    <div className="dashboard-website-actions" style={{ position: "relative", overflow: "visible" }}>
      {website.previewPath ? (
        <Link href={website.previewPath} className="dashboard-website-button is-primary">
          Preview
        </Link>
      ) : null}
      {website.editorPath ? (
        <Link href={website.editorPath} className="dashboard-website-button is-secondary">
          Edit
        </Link>
      ) : null}

      <div style={{ position: "relative" }}>
        <button
          type="button"
          className="dashboard-website-button is-secondary"
          onClick={() => setShowShareMenu(!showShareMenu)}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
        >
          <Share2 size={16} />
          Share
        </button>

        {showShareMenu && (
          <div style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: "0.5rem", background: "var(--card-bg, #1a1f1c)", border: "1px solid var(--border-color, rgba(255,255,255,0.1))", borderRadius: "8px", padding: "0.5rem", minWidth: "200px", zIndex: 10, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}>
            {isPrivate ? (
              <div style={{ padding: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                <p style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.25rem", fontWeight: 600, color: "var(--warning-color, #f59e0b)" }}>
                  <Lock size={14} /> Private website
                </p>
                <p style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>Make this website public in the editor to share it to the community Feed or copy its link.</p>
                {website.editorPath && (
                  <Link href={website.editorPath} style={{ display: "inline-block", marginTop: "0.5rem", color: "var(--accent, #1f6f5f)", fontWeight: 500 }}>
                    Open Editor
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <button
                  type="button"
                  onClick={() => { handleCopyLink(); setShowShareMenu(false); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.5rem", textAlign: "left", background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover, rgba(255,255,255,0.05))")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <LinkIcon size={16} />
                  {copied ? "Copied!" : "Copy public link"}
                </button>
                <Link
                  href={routes.feed}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.5rem", textDecoration: "none", color: "var(--text-primary)", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover, rgba(255,255,255,0.05))")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Globe size={16} />
                  Share to Feed
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {showShareMenu && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9 }}
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}
