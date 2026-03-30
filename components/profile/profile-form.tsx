"use client";

import { useState, useId, type FormEvent } from "react";
import type { Profile, ProfileUpdateData } from "@/lib/supabase/profile";

type ProfileFormProps = {
  /** The initial profile data fetched server-side. */
  profile: Profile;
};

/**
 * ProfileForm — client component for viewing and editing user profile data.
 *
 * Editable fields:  full_name, avatar_url
 * System fields:    id, email, created_at, updated_at  (read-only)
 *
 * Submits a PATCH request to /api/profile and reflects the updated values
 * in local state on success.
 */
export function ProfileForm({ profile: initialProfile }: ProfileFormProps) {
  const id = useId();

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const errorId = `${id}-error`;
  const successId = `${id}-success`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const updates: ProfileUpdateData = {
      full_name: fullName.trim() !== "" ? fullName.trim() : null,
      avatar_url: avatarUrl.trim() !== "" ? avatarUrl.trim() : null,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Failed to save profile. Please try again.");
        return;
      }

      const body = (await response.json()) as { profile: Profile };
      setProfile(body.profile);
      setFullName(body.profile.full_name ?? "");
      setAvatarUrl(body.profile.avatar_url ?? "");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="profile-section">
      <h1>Profile</h1>

      {/* Read-only identity fields */}
      <div className="profile-identity">
        <p>
          <strong>Email</strong>
          <br />
          <span>{profile.email}</span>
        </p>
        <p>
          <strong>Member since</strong>
          <br />
          <time dateTime={profile.created_at}>
            {new Date(profile.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </p>
      </div>

      {/* Editable fields */}
      <form className="profile-form" onSubmit={onSubmit} aria-label="Edit profile" noValidate>
        <h2>Edit profile</h2>

        <label htmlFor={`${id}-name`}>
          Full name
          <input
            id={`${id}-name`}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            autoCapitalize="words"
            aria-describedby={error ? errorId : undefined}
          />
        </label>

        <label htmlFor={`${id}-avatar`}>
          Avatar URL
          <input
            id={`${id}-avatar`}
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            autoComplete="photo"
            placeholder="https://example.com/avatar.png"
            aria-describedby={error ? errorId : undefined}
          />
        </label>

        {error ? (
          <p id={errorId} className="profile-error" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p id={successId} className="profile-success" role="status">
            Profile saved successfully.
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {isSubmitting ? "Saving profile, please wait." : ""}
        </span>
      </form>
    </section>
  );
}
