"use client";

import { useRef, useState, useTransition } from "react";
import { createCommunityPost } from "./actions";
import type { PublicWebsiteRecord } from "./types";

const postTypes = [
  { value: "text", label: "Text", status: "Ready", statusClass: "is-ready" },
  { value: "image", label: "Image", status: "Attachment", statusClass: "is-attachment" },
  { value: "code", label: "Code", status: "Attachment", statusClass: "is-attachment" },
  { value: "project", label: "Project", status: "Link", statusClass: "is-attachment" },
  { value: "docs", label: "Docs", status: "Attachment", statusClass: "is-attachment" },
  { value: "gif", label: "GIF", status: "Attachment", statusClass: "is-attachment" },
  { value: "video", label: "Video", status: "Attachment", statusClass: "is-attachment" },
  { value: "website", label: "Website", status: "Share", statusClass: "is-share" },
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
        <p>Share an update, attach supported work, or post one of your public websites.</p>
      </div>

      <div className="feed-type-row" role="group" aria-label="Post type">
        {postTypes.map(({ value, label, status, statusClass }) => (
          <button
            key={value}
            type="button"
            className={`feed-type-pill ${postType === value ? "is-active" : ""}`}
            onClick={() => setPostType(value)}
            disabled={isPending}
            aria-pressed={postType === value}
          >
            {label}
            <span className={`feed-type-status ${statusClass}`}>{status}</span>
          </button>
        ))}
      </div>

      <form ref={formRef} action={handleSubmit} className="feed-composer-form">
        <input type="hidden" name="post_type" value={postType} />
        <label className="feed-field">
          <span>Title <em>(optional)</em></span>
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
            rows={4}
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
          <p className="feed-form-message">Attachment formats use the workspace&apos;s configured community storage and are validated before posting.</p>
        )}
      </form>
    </section>
  );
}
