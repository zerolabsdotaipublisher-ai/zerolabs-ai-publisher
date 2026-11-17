"use client";

import { useEffect, useRef, useState, useTransition } from "react";

type ProfileFollowButtonProps = {
  profileUserId: string;
  displayName: string;
  isFollowing: boolean;
  className?: string;
  onRelationshipChange?: (isFollowing: boolean) => void;
};

/** A responsive, reversible relationship control shared by profile and Feed. */
export function ProfileFollowButton({
  profileUserId,
  displayName,
  isFollowing,
  className = "profile-follow-button",
  onRelationshipChange,
}: ProfileFollowButtonProps) {
  const [localFollowing, setLocalFollowing] = useState(isFollowing);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setLocalFollowing(isFollowing);
  }, [isFollowing]);

  const handleRelationshipChange = () => {
    if (isSubmittingRef.current) return;

    const nextIsFollowing = !localFollowing;
    isSubmittingRef.current = true;
    setFeedback(null);
    setLocalFollowing(nextIsFollowing);

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile/follow", {
          method: nextIsFollowing ? "POST" : "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ targetUserId: profileUserId }),
        });
        const result = await response.json() as { success?: true; error?: string };

        if (!response.ok || result.error || !result.success) {
          setLocalFollowing(!nextIsFollowing);
          setFeedback(result.error ?? "Unable to update this relationship. Please try again.");
          return;
        }

        onRelationshipChange?.(nextIsFollowing);
        setFeedback(nextIsFollowing ? `Following ${displayName}.` : `Unfollowed ${displayName}.`);
      } catch {
        setLocalFollowing(!nextIsFollowing);
        setFeedback("Unable to update this relationship. Please try again.");
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  const label = localFollowing ? "Following" : "Follow";
  return (
    <>
      <button
        type="button"
        className={`${className}${localFollowing ? " is-following" : ""}`}
        onClick={handleRelationshipChange}
        disabled={isPending}
        aria-busy={isPending}
        aria-pressed={localFollowing}
        aria-label={`${label} ${displayName}`}
      >
        {isPending ? "Saving…" : label}
      </button>
      <span className="sr-only" role={feedback?.includes("Unable") || feedback?.includes("Sign in") ? "alert" : "status"} aria-live="polite" aria-atomic="true">
        {feedback}
      </span>
    </>
  );
}
