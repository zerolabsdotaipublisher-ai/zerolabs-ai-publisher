"use client";

import { useState } from "react";

export function VisibilityToggle({ websiteId, initialVisibility }: { websiteId: string, initialVisibility: "public" | "private" }) {
  const [visibility, setVisibility] = useState<"public" | "private">(initialVisibility);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const nextVisibility = visibility === "public" ? "private" : "public";
    try {
      const res = await fetch("/api/dashboard/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_website_visibility", payload: { websiteId, visibility: nextVisibility } })
      });
      if (res.ok) {
        setVisibility(nextVisibility);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        fontSize: "0.75rem",
        padding: "0.2rem 0.5rem",
        borderRadius: "4px",
        border: "1px solid var(--marketing-card-border)",
        background: visibility === "public" ? "var(--marketing-surface)" : "var(--background)",
        color: "var(--foreground)",
        cursor: "pointer"
      }}
    >
      {loading ? "..." : visibility === "public" ? "Public" : "Private"}
    </button>
  );
}
