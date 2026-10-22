"use client";

import { useRef, useState, useTransition } from "react";
import { createCommunityPost } from "./actions";
import type { PublicWebsiteRecord } from "./types";

const postTypes = [
  { value: "text", label: "Text", status: "Ready", statusClass: "is-ready", isAvailable: true },
  { value: "image", label: "Image", status: "Ready", statusClass: "is-ready", isAvailable: true },
  { value: "code", label: "Code", status: "Ready", statusClass: "is-ready", isAvailable: true },
  { value: "project", label: "Project", status: "Ready", statusClass: "is-ready", isAvailable: true },
  { value: "docs", label: "Docs", status: "Ready", statusClass: "is-ready", isAvailable: true },
  { value: "gif", label: "GIF", status: "Ready", statusClass: "is-ready", isAvailable: true },
  { value: "video", label: "Video", status: "Ready", statusClass: "is-ready", isAvailable: true },
  { value: "website", label: "Website", status: "Ready", statusClass: "is-ready", isAvailable: true },
] as const;

const filePostTypes = new Set(["image", "code", "docs", "gif", "video"]);

function getFileAccept(postType: string): string | undefined {
  if (postType === "image") return "image/jpeg,image/png,image/webp,image/avif";
  if (postType === "code") return ".txt,.md,.js,.jsx,.ts,.tsx,.json,.xml,text/plain,text/markdown,application/json,application/javascript,application/typescript,application/xml";
  if (postType === "docs") return ".pdf,.txt,.md,.doc,.docx,.xls,.xlsx,application/pdf,text/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (postType === "gif") return "image/gif";
  if (postType === "video") return "video/*";
  return undefined;
}

export function PostComposer({ websites }: { websites: PublicWebsiteRecord[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [postType, setPostType] = useState("text");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createCommunityPost(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      formRef.current?.reset();
      setMessage("Post created.");
    });
  };

  return (
    <section className="feed-panel feed-composer-card" aria-label="Create a community post">
      <div className="feed-panel-heading">
        <span className="feed-panel-kicker">Create</span>
        <h2>Share with the community</h2>
        <p>Share a build update, launch note, question, or idea.</p>
      </div>

      <div className="feed-type-row" role="group" aria-label="Post type">
        {postTypes.map(({ value, label, status, statusClass, isAvailable }) => {
          return (
            <button
              key={value}
              type="button"
              className={`feed-type-pill ${postType === value ? "is-active" : ""}`}
              onClick={isAvailable ? () => setPostType(value) : undefined}
              disabled={isPending || !isAvailable}
              aria-pressed={isAvailable ? postType === value : undefined}
              title={!isAvailable ? "This post type is not available in this workspace yet." : undefined}
            >
              <span className="feed-type-label">{label}</span>
              <span className={`feed-type-status ${statusClass}`}>{status}</span>
            </button>
          );
        })}
      </div>

      <p className="feed-form-message">All feed post types are available. Files are private at rest and appear only with posts you share publicly.</p>

      <form ref={formRef} action={handleSubmit} className="feed-composer-form" encType="multipart/form-data">
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

        <label className="feed-field">
          <span>{postType === "text" ? "Post" : "Caption"}</span>
          <textarea
            name="body"
            placeholder="Share a build update, launch note, question, or idea."
            required
            rows={4}
            className="feed-textarea"
            disabled={isPending}
          />
        </label>

        {filePostTypes.has(postType) ? (
          <label className="feed-field">
            <span>File {postType === "code" ? <em>(optional)</em> : null}</span>
            <input
              type="file"
              name="attachment"
              accept={getFileAccept(postType)}
              required={postType !== "code"}
              className="feed-input"
              disabled={isPending}
            />
          </label>
        ) : null}

        {postType === "project" ? (
          <label className="feed-field">
            <span>Project link</span>
            <input
              type="url"
              name="project_url"
              placeholder="https://example.com/project"
              required
              className="feed-input"
              disabled={isPending}
            />
          </label>
        ) : null}

        {postType === "website" ? (
          <label className="feed-field">
            <span>Published public website</span>
            <select name="website_id" required className="feed-select" disabled={isPending || websites.length === 0} defaultValue="">
              <option value="" disabled>{websites.length === 0 ? "No published public websites available" : "Select a website"}</option>
              {websites.map((website) => <option key={website.id} value={website.id}>{website.site_title || "Untitled website"}</option>)}
            </select>
            {websites.length === 0 ? <small className="feed-form-message">Publish a website and set it to public before sharing it here.</small> : null}
          </label>
        ) : null}

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
        ) : message ? (
          <p className="feed-form-message is-success" role="status">
            {message}
          </p>
        ) : (
          <p className="feed-form-message">Your post is ready to share with the community.</p>
        )}
      </form>
    </section>
  );
}
