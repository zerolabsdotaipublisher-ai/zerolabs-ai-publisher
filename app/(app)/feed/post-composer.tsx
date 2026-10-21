"use client";

import { useRef, useState, useTransition } from "react";
import { createCommunityPost } from "./actions";

const postTypes = [
  { value: "text", label: "Text", status: "Ready", statusClass: "is-ready", isAvailable: true },
  { value: "image", label: "Image", status: "Unavailable", statusClass: "is-unavailable", isAvailable: false },
  { value: "code", label: "Code", status: "Unavailable", statusClass: "is-unavailable", isAvailable: false },
  { value: "project", label: "Project", status: "Unavailable", statusClass: "is-unavailable", isAvailable: false },
  { value: "docs", label: "Docs", status: "Unavailable", statusClass: "is-unavailable", isAvailable: false },
  { value: "gif", label: "GIF", status: "Unavailable", statusClass: "is-unavailable", isAvailable: false },
  { value: "video", label: "Video", status: "Unavailable", statusClass: "is-unavailable", isAvailable: false },
  { value: "website", label: "Website", status: "Unavailable", statusClass: "is-unavailable", isAvailable: false },
] as const;

export function PostComposer() {
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

      <p className="feed-form-message">Text posts are available. Attachment and website sharing are not configured for this workspace.</p>

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
        ) : message ? (
          <p className="feed-form-message is-success" role="status">
            {message}
          </p>
        ) : (
          <p className="feed-form-message">Text posts are ready to share with the community.</p>
        )}
      </form>
    </section>
  );
}
