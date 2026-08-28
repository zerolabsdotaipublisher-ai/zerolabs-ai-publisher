"use client";

import { useRef, useState, useTransition } from "react";
import { createCommunityPost } from "./actions";
import type { PublicWebsiteRecord } from "./types";

const postTypes = [
  ["text", "Text"],
  ["image", "Image"],
  ["code", "Code"],
  ["project", "Project"],
  ["docs", "Docs"],
  ["gif", "GIF"],
  ["video", "Video"],
  ["website", "Website"],
] as const;

export function PostComposer({ websites }: { websites: PublicWebsiteRecord[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [postType, setPostType] = useState("text");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createCommunityPost(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      formRef.current?.reset();
    });
  };

  return (
    <section className="feed-panel feed-composer-card" aria-label="Create a community post">
      <div className="feed-panel-heading">
        <span className="feed-panel-kicker">Create</span>
        <h2>Share with the community</h2>
        <p>Share an update or use the configured community attachment storage for media, files, and website shares.</p>
      </div>

      <div className="feed-type-row" aria-label="Supported post types">
        {postTypes.map(([value, label]) => (
          <button key={value} type="button" className={`feed-type-pill ${postType === value ? "is-active" : ""}`} onClick={() => setPostType(value)} disabled={isPending}>
            {label}
            {value !== "text" ? <span>{value === "website" ? "Share" : "Attachment"}</span> : null}
          </button>
        ))}
      </div>

      <form ref={formRef} action={handleSubmit} className="feed-composer-form">
        <input type="hidden" name="post_type" value={postType} />
        <label className="feed-field">
          <span>Title</span>
          <input
            type="text"
            name="title"
            placeholder="Optional headline for your post"
            className="feed-input"
            disabled={isPending}
          />
        </label>

        {postType === "website" ? (
          <label className="feed-field">
            <span>Generated website</span>
            <select name="website_id" className="feed-select" disabled={isPending || websites.length === 0} required>
              <option value="">Select a public website</option>
              {websites.map((website) => <option key={website.id} value={website.id}>{website.site_title || "Untitled website"}</option>)}
            </select>
          </label>
        ) : null}

        {postType === "project" ? (
          <label className="feed-field">
            <span>Project link</span>
            <input type="url" name="project_url" className="feed-input" placeholder="https://example.com/project" required disabled={isPending} />
          </label>
        ) : null}

        {postType !== "text" && postType !== "website" ? (
          <label className="feed-field">
            <span>{postType === "code" ? "Code file (optional; paste code in Post)" : "Attachment"}</span>
            <input
              type="file"
              name="attachment"
              className="feed-input feed-file-input"
              accept={postType === "image" ? "image/*" : postType === "gif" ? "image/gif" : postType === "video" ? "video/*" : postType === "docs" ? ".pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.csv" : undefined}
              disabled={isPending}
              required={postType !== "code"}
            />
          </label>
        ) : null}

        <label className="feed-field">
          <span>Post</span>
          <textarea
            name="body"
            placeholder="Share a build update, launch note, question, or idea."
            required
            rows={5}
            className="feed-textarea"
            disabled={isPending}
          />
        </label>

        <div className="feed-composer-footer">
          <label className="feed-field feed-field-inline">
            <span>Visibility</span>
            <select
              name="visibility"
              className="feed-select"
              disabled={isPending}
              defaultValue="public"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>

          <button type="submit" disabled={isPending} className="feed-submit-button">
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>

        {error ? (
          <p className="feed-form-message is-error" role="alert">
            {error}
          </p>
        ) : (
          <p className="feed-form-message">Uploads are limited to the configured community attachment bucket and are validated server-side.</p>
        )}
      </form>
    </section>
  );
}
