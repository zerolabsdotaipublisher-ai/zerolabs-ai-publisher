"use client";

import { useRef, useState, useTransition } from "react";
import { createCommunityPost } from "./actions";
import {
  getAttachmentType,
  getAttachmentValidationError,
  getFileAccept,
  isFilePostType,
  maxAttachmentSizeLabel,
  type CommunityPostType,
} from "./post-config";
import type { PublicWebsiteRecord } from "./types";

const postTypes = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "code", label: "Code" },
  { value: "project", label: "Project" },
  { value: "docs", label: "Docs" },
  { value: "gif", label: "GIF" },
  { value: "video", label: "Video" },
  { value: "website", label: "Website" },
] as const;

export function PostComposer({ websites }: { websites: PublicWebsiteRecord[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [postType, setPostType] = useState<CommunityPostType>("text");
  const formRef = useRef<HTMLFormElement>(null);
  const isSubmittingRef = useRef(false);

  const selectPostType = (nextPostType: CommunityPostType) => {
    setPostType(nextPostType);
    setFileError(null);
    setError(null);
    setMessage(null);
  };

  const handleFileChange = (file: File | null) => {
    const attachmentType = getAttachmentType(postType);
    const validationError = file && attachmentType && attachmentType !== "project"
      ? getAttachmentValidationError(file, attachmentType)
      : null;
    setFileError(validationError);
    setError(validationError);
    setMessage(null);
  };

  const handleSubmit = (formData: FormData) => {
    if (isSubmittingRef.current) return;
    if (fileError) {
      setError(fileError);
      return;
    }

    isSubmittingRef.current = true;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await createCommunityPost(formData);
        if ("error" in result) {
          setError(result.error);
          return;
        }

        formRef.current?.reset();
        setMessage("Post created.");
      } catch {
        setError("Unable to create your post. Please try again.");
      } finally {
        isSubmittingRef.current = false;
      }
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
        {postTypes.map(({ value, label }) => {
          const isWebsiteUnavailable = value === "website" && websites.length === 0;
          const isAvailable = !isWebsiteUnavailable;
          const isSelected = postType === value;
          return (
            <button
              key={value}
              type="button"
              className={`feed-type-pill ${isSelected ? "is-active" : ""}`}
              onClick={isAvailable ? () => selectPostType(value) : undefined}
              disabled={isPending || !isAvailable}
              aria-pressed={isSelected}
              aria-label={`${label}${isSelected ? ", selected" : ""}${isWebsiteUnavailable ? ", unavailable: no published public websites" : ""}`}
              title={isWebsiteUnavailable ? "Publish a website and set it to public before sharing it to Feed." : undefined}
            >
              <span className="feed-type-label">{label}</span>
              <span className={`feed-type-status ${isWebsiteUnavailable ? "is-unavailable" : "is-ready"}`}>
                {isWebsiteUnavailable ? "No sites" : "Ready"}
              </span>
            </button>
          );
        })}
      </div>

      <p className="feed-form-message">Files are private at rest and appear only with posts you share publicly. File uploads support files up to {maxAttachmentSizeLabel}.</p>

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

        {isFilePostType(postType) ? (
          <label className="feed-field">
            <span>File {postType === "code" ? <em>(optional)</em> : null}</span>
            <input
              key={postType}
              type="file"
              name="attachment"
              accept={getFileAccept(postType)}
              required={postType !== "code"}
              className="feed-input"
              disabled={isPending}
              onChange={(event) => {
                const selectedFile = event.currentTarget.files?.[0] ?? null;
                const attachmentType = getAttachmentType(postType);
                const validationError = selectedFile && attachmentType && attachmentType !== "project"
                  ? getAttachmentValidationError(selectedFile, attachmentType)
                  : null;
                event.currentTarget.setCustomValidity(validationError ?? "");
                handleFileChange(selectedFile);
              }}
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
            <select name="website_id" required className="feed-select" disabled={isPending} defaultValue="">
              <option value="" disabled>Select a website</option>
              {websites.map((website) => <option key={website.id} value={website.id}>{website.site_title || "Untitled website"}</option>)}
            </select>
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

          <button type="submit" disabled={isPending || Boolean(fileError)} className="feed-submit-button" aria-disabled={isPending || Boolean(fileError)}>
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>

        {error ? (
          <p className="feed-form-message is-error" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : message ? (
          <p className="feed-form-message is-success" role="status" aria-live="polite">
            {message}
          </p>
        ) : (
          <p className="feed-form-message">Your post is ready to share with the community.</p>
        )}
      </form>
    </section>
  );
}
