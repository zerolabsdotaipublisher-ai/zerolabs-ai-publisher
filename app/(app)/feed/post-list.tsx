"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Heart, Bookmark, Share2, Trash2 } from "lucide-react";
import { routes } from "@/config/routes";
import { createCommunityPostComment, deleteCommunityPost, shareCommunityPost, toggleCommunityPostReaction, toggleSavedCommunityPost } from "./actions";
import type { CommunityPostRecord } from "./types";

interface PostListProps {
  posts: CommunityPostRecord[];
  currentUserId: string;
  savedPostIds: string[];
}

function formatPostDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}

function resolveAuthorName(post: CommunityPostRecord, currentUserId: string): string {
  if (post.user_id === currentUserId) {
    return "You";
  }

  return post.author?.username || post.author?.full_name || "Community member";
}

export function PostList({ posts, currentUserId, savedPostIds }: PostListProps) {
  const [busyPostId, setBusyPostId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (postId: string) => {
    if (!confirm("Delete this post?")) {
      return;
    }

    setMessage(null);
    setBusyPostId(postId);
    startTransition(async () => {
      const result = await deleteCommunityPost(postId);
      if (result.error) {
        setMessage(result.error);
      }
      setBusyPostId(null);
    });
  };

  const handleToggleSave = (postId: string, save: boolean) => {
    setMessage(null);
    setBusyPostId(postId);
    startTransition(async () => {
      const result = await toggleSavedCommunityPost(postId, save);
      if (result.error) {
        setMessage(result.error);
      }
      setBusyPostId(null);
    });
  };

  const handleReaction = (postId: string, reacted: boolean) => {
    setMessage(null);
    setBusyPostId(postId);
    startTransition(async () => {
      const result = await toggleCommunityPostReaction(postId, reacted);
      if (result.error) setMessage(result.error);
      setBusyPostId(null);
    });
  };

  const handleShare = (postId: string) => {
    setMessage(null);
    setBusyPostId(postId);
    startTransition(async () => {
      const result = await shareCommunityPost(postId);
      if (result.error) setMessage(result.error);
      setBusyPostId(null);
    });
  };

  const handleComment = async (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await createCommunityPostComment(formData);
      if (result.error) setMessage(result.error);
    });
  };

  if (posts.length === 0) {
    return (
      <div className="feed-empty-state">
        <strong>No posts to display yet.</strong>
        <p>Share the first text update once the community feed is enabled for your workspace.</p>
      </div>
    );
  }

  return (
    <div className="feed-post-list">
      {message ? <p className="feed-form-message is-error">{message}</p> : null}

      {posts.map((post) => {
        const isOwner = post.user_id === currentUserId;
        const isSaved = savedPostIds.includes(post.id);
        const isBusy = isPending && busyPostId === post.id;
        const authorName = resolveAuthorName(post, currentUserId);
        const authorInitial = authorName.charAt(0).toUpperCase();

        return (
          <article key={post.id} className="feed-post-card">
            <div className="feed-post-header">
              <div className="feed-post-author">
                <div className="feed-post-avatar" aria-hidden="true">
                  {authorInitial}
                </div>

                <div className="feed-post-author-copy">
                  <strong>{authorName}</strong>
                  <div className="feed-post-meta">
                    <span>{formatPostDate(post.created_at)}</span>
                    <span className={`feed-post-visibility is-${post.visibility}`}>{post.visibility}</span>
                  </div>
                </div>
              </div>

              {isOwner ? (
                <button
                  type="button"
                  className="feed-icon-button"
                  onClick={() => handleDelete(post.id)}
                  disabled={isBusy}
                  aria-label="Delete post"
                >
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>

            {post.title ? <h3 className="feed-post-title">{post.title}</h3> : null}
            <p className="feed-post-body">{post.body}</p>

            {post.attachments.length > 0 ? (
              <div className="feed-post-attachments">
                {post.attachments.map((attachment) => {
                  const websiteId = typeof attachment.metadata?.website_id === "string" ? attachment.metadata.website_id : null;
                  if (websiteId) return <Link key={attachment.id} href={routes.previewSite(websiteId)} className="feed-attachment-link">View shared website</Link>;
                  if (!attachment.public_url) return <span key={attachment.id} className="feed-attachment-file">{attachment.file_name || "Attachment unavailable"}</span>;
                  if (attachment.attachment_type === "image" || attachment.attachment_type === "gif") return <Image key={attachment.id} src={attachment.public_url} alt={attachment.file_name || "Post attachment"} width={1200} height={800} unoptimized className="feed-attachment-image" />;
                  if (attachment.attachment_type === "video") return <video key={attachment.id} src={attachment.public_url} controls className="feed-attachment-video" />;
                  return <a key={attachment.id} href={attachment.public_url} target="_blank" rel="noreferrer" className="feed-attachment-link">{attachment.file_name || "Open attachment"}</a>;
                })}
              </div>
            ) : null}

            <div className="feed-post-actions">
              <button type="button" className={`feed-post-action ${post.reactedByCurrentUser ? "is-active" : ""}`} onClick={() => handleReaction(post.id, Boolean(post.reactedByCurrentUser))} disabled={isBusy || post.reactedByCurrentUser === null}>
                <Heart size={15} />
                <span>Heart</span>
                <em>{post.reactionCount === null ? "Not configured" : post.reactionCount}</em>
              </button>
              <button type="button" className="feed-post-action" onClick={() => setExpandedPostId((current) => current === post.id ? null : post.id)}>
                <MessageCircle size={15} />
                <span>Comment</span>
                <em>{post.commentCount === null ? "Not configured" : post.commentCount}</em>
              </button>
              <button type="button" className="feed-post-action" onClick={() => handleShare(post.id)} disabled={isBusy || post.shareCount === null}>
                <Share2 size={15} />
                <span>Share</span>
                <em>{post.shareCount === null ? "Not configured" : post.shareCount}</em>
              </button>
              <button
                type="button"
                className="feed-post-action is-save"
                onClick={() => handleToggleSave(post.id, !isSaved)}
                disabled={isBusy}
              >
                <Bookmark size={15} />
                <span>{isSaved ? "Saved" : "Save"}</span>
                <em>Stored</em>
              </button>
            </div>

            {expandedPostId === post.id ? (
              <div className="feed-comments">
                {post.commentCount === null ? <p className="feed-form-message">Comments are not configured yet.</p> : null}
                {post.comments.map((comment) => <p key={comment.id} className="feed-comment"><strong>{comment.user_id === currentUserId ? "You" : "Community member"}</strong>{comment.body}</p>)}
                {post.commentCount !== null ? (
                  <form action={handleComment} className="feed-comment-form">
                    <input type="hidden" name="post_id" value={post.id} />
                    <input name="body" className="feed-input" placeholder="Write a comment" required disabled={isPending} />
                    <button type="submit" className="feed-submit-button" disabled={isPending}>Comment</button>
                  </form>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
