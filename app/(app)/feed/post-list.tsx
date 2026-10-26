"use client";

import { useState, useTransition, type FormEvent } from "react";
import { MessageCircle, Heart, Bookmark, Share2, Trash2 } from "lucide-react";
import { routes } from "@/config/routes";
import { SharedContentPreview } from "@/components/feed/shared-content-preview";
import { createCommunityPostComment, deleteCommunityPost, shareCommunityPost, toggleCommunityPostReaction, toggleSavedCommunityPost } from "./actions";
import type { CommunityPostRecord } from "./types";

interface PostListProps {
  posts: CommunityPostRecord[];
  currentUserId: string;
  savedPostIds: string[];
  savedItemsAvailable: boolean;
}

function formatPostDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}

export function PostList({ posts, currentUserId, savedPostIds, savedItemsAvailable }: PostListProps) {
  const [busyPostId, setBusyPostId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; tone: "error" | "success" } | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (postId: string) => {
    if (!confirm("Delete this post?")) {
      return;
    }

    setFeedback(null);
    setBusyPostId(postId);
    startTransition(async () => {
      const result = await deleteCommunityPost(postId);
      if (result.error) {
        setFeedback({ message: result.error, tone: "error" });
      } else {
        setFeedback({ message: "Post deleted.", tone: "success" });
      }
      setBusyPostId(null);
    });
  };

  const handleToggleSave = (postId: string, save: boolean) => {
    setFeedback(null);
    setBusyPostId(postId);
    startTransition(async () => {
      const result = await toggleSavedCommunityPost(postId, save);
      if (result.error) {
        setFeedback({ message: result.error, tone: "error" });
      } else {
        setFeedback({ message: save ? "Post saved." : "Post removed from saved items.", tone: "success" });
      }
      setBusyPostId(null);
    });
  };

  const handleReaction = (postId: string, reacted: boolean) => {
    setFeedback(null);
    setBusyPostId(postId);
    startTransition(async () => {
      const result = await toggleCommunityPostReaction(postId, reacted);
      setFeedback(result.error
        ? { message: result.error, tone: "error" }
        : { message: reacted ? "Heart removed." : "Heart added.", tone: "success" });
      setBusyPostId(null);
    });
  };

  const handleShare = async (post: CommunityPostRecord) => {
    setFeedback(null);
    setBusyPostId(post.id);
    const shareUrl = `${window.location.origin}${routes.feed}#feed-post-${post.id}`;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: post.title || "Zero Labs community post",
          text: post.body,
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch {
          window.prompt("Copy this community post link:", shareUrl);
        }
      } else {
        window.prompt("Copy this community post link:", shareUrl);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setFeedback({ message: "Sharing was cancelled.", tone: "success" });
      } else {
        setFeedback({ message: "Unable to share this post.", tone: "error" });
      }
      setBusyPostId(null);
      return;
    }

    startTransition(async () => {
      const result = await shareCommunityPost(post.id);
      setFeedback(result.error
        ? { message: "Post shared, but its share count could not be recorded.", tone: "success" }
        : { message: typeof navigator.share === "function" ? "Post shared." : "Post link copied.", tone: "success" });
      setBusyPostId(null);
    });
  };

  const handleComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const postId = formData.get("post_id");
    setFeedback(null);
    setBusyPostId(typeof postId === "string" ? postId : null);
    startTransition(async () => {
      const result = await createCommunityPostComment(formData);
      if (result.error) {
        setFeedback({ message: result.error, tone: "error" });
      } else {
        form.reset();
        setFeedback({ message: "Comment added.", tone: "success" });
      }
      setBusyPostId(null);
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
      {feedback ? <p className={`feed-form-message is-${feedback.tone}`} role={feedback.tone === "error" ? "alert" : "status"}>{feedback.message}</p> : null}

      {posts.map((post) => {
        const isOwner = post.user_id === currentUserId;
        const isSaved = savedPostIds.includes(post.id);
        const isBusy = busyPostId === post.id;
        const authorUsername = post.author.username?.trim();
        const shouldShowAuthorUsername = Boolean(
          authorUsername && authorUsername.localeCompare(post.author.displayName, undefined, { sensitivity: "accent" }) !== 0,
        );

        return (
          <article key={post.id} id={`feed-post-${post.id}`} className="feed-post-card">
            <div className="feed-post-header">
              <div className="feed-post-author">
                <div className="feed-post-avatar" aria-hidden="true">
                  {post.author.initials}
                </div>

                <div className="feed-post-author-copy">
                  <strong>{post.author.displayName}</strong>
                  {shouldShowAuthorUsername ? <span>@{authorUsername}</span> : null}
                  <div className="feed-post-meta">
                    <time dateTime={post.created_at}>{formatPostDate(post.created_at)}</time>
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
                {post.attachments.map((attachment) => <SharedContentPreview key={attachment.id} attachment={attachment} />)}
              </div>
            ) : null}

            <div className={`feed-post-actions ${isBusy ? "is-busy" : ""}`} role="group" aria-label="Post actions" aria-busy={isBusy}>
              <button type="button" className={`feed-post-action ${post.reactedByCurrentUser ? "is-active" : ""}`} onClick={() => handleReaction(post.id, Boolean(post.reactedByCurrentUser))} disabled={isBusy || post.reactedByCurrentUser === null} aria-label={post.reactedByCurrentUser ? "Remove heart" : "Add heart"} aria-pressed={Boolean(post.reactedByCurrentUser)} title={post.reactedByCurrentUser === null ? "Hearts are unavailable until Feed interactions are configured." : post.reactedByCurrentUser ? "Remove heart" : "Add heart"}>
                <Heart size={16} fill={post.reactedByCurrentUser ? "currentColor" : "none"} aria-hidden="true" />
                {post.reactionCount !== null ? <em aria-hidden="true">{post.reactionCount}</em> : null}
              </button>
              <button
                type="button"
                className={`feed-post-action ${expandedPostId === post.id ? "is-active" : ""}`}
                onClick={() => setExpandedPostId((current) => current === post.id ? null : post.id)}
                disabled={post.commentCount === null}
                aria-label={expandedPostId === post.id ? "Hide comments" : "Show comments"}
                aria-expanded={expandedPostId === post.id}
                title={post.commentCount === null ? "Comments are unavailable until Feed interactions are configured." : expandedPostId === post.id ? "Hide comments" : "Show comments"}
              >
                <MessageCircle size={16} aria-hidden="true" />
                {post.commentCount !== null ? <em aria-hidden="true">{post.commentCount}</em> : null}
              </button>
              <button type="button" className="feed-post-action" onClick={() => void handleShare(post)} disabled={isBusy} aria-label="Share post" title="Share post">
                <Share2 size={16} aria-hidden="true" />
                {post.shareCount !== null ? <em aria-hidden="true">{post.shareCount}</em> : null}
              </button>
              <button
                type="button"
                className={`feed-post-action ${isSaved ? "is-active" : ""}`}
                onClick={() => handleToggleSave(post.id, !isSaved)}
                disabled={isBusy || !savedItemsAvailable}
                aria-label={isSaved ? "Remove post from saved items" : "Save post"}
                aria-pressed={isSaved}
                title={!savedItemsAvailable ? "Saved posts are unavailable until Feed interactions are configured." : isSaved ? "Remove post from saved items" : "Save post"}
              >
                <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />
              </button>
            </div>

            {expandedPostId === post.id ? (
              <div className="feed-comments">
                {post.commentCount === null ? <p className="feed-form-message">Comments are not configured yet.</p> : null}
                {post.comments.map((comment) => <p key={comment.id} className="feed-comment"><strong>{comment.user_id === currentUserId ? "You" : "Community member"}</strong>{comment.body}</p>)}
                {post.commentCount !== null ? (
                  <form onSubmit={handleComment} className="feed-comment-form">
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
