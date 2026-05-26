"use client";

import { useMemo, useState, useId, type FormEvent } from "react";
import { normalizeEditableProfileUpdate, validateEditableProfileUpdate, type EditableProfileFieldErrors } from "@/lib/profile-validation";
import type { Profile, ProfileUpdateData } from "@/lib/supabase/profile";

type ProfileFormProps = {
  /** The initial profile data fetched server-side. */
  profile: Profile;
};
export function ProfileForm({ profile: initialProfile }: ProfileFormProps) {
  const id = useId();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<EditableProfileFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const errorId = `${id}-error`;
  const successId = `${id}-success`;
  const fullNameErrorId = `${id}-name-error`;
  const avatarUrlErrorId = `${id}-avatar-error`;

  const formattedMemberSince = useMemo(
    () =>
      new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [profile.created_at],
  );

  const formattedUpdatedAt = useMemo(
    () =>
      new Date(profile.updated_at).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    [profile.updated_at],
  );

  const draftProfile = normalizeEditableProfileUpdate({
    full_name: fullName,
    avatar_url: avatarUrl,
  });
  const isDirty =
    draftProfile.full_name !== (profile.full_name ?? null) ||
    draftProfile.avatar_url !== (profile.avatar_url ?? null);
  const profileDisplayName = draftProfile.full_name ?? profile.full_name ?? profile.email;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updates: ProfileUpdateData = normalizeEditableProfileUpdate({
      full_name: fullName,
      avatar_url: avatarUrl,
    });
    const nextFieldErrors = validateEditableProfileUpdate(updates);

    setFieldErrors(nextFieldErrors);
    setError(null);
    setSuccess(null);

    if (Object.keys(nextFieldErrors).length > 0) {
      setError("Please fix the highlighted fields and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
          fieldErrors?: EditableProfileFieldErrors;
        };
        setFieldErrors(body.fieldErrors ?? {});
        setError(body.error ?? "Failed to save profile. Please try again.");
        return;
      }

      const body = (await response.json()) as { profile: Profile };
      setProfile(body.profile);
      setFullName(body.profile.full_name ?? "");
      setAvatarUrl(body.profile.avatar_url ?? "");
      setFieldErrors({});
      setSuccess("Profile saved successfully.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="profile-page dashboard-home-shell" aria-label="Profile page">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs workspace</span>
          <h1>Profile</h1>
          <p>Keep your logged-in workspace details current without changing your session, routes, or dashboard layout.</p>
        </div>

        <aside className="dashboard-welcome-card profile-summary-card" aria-label="Profile summary">
          <span className="dashboard-welcome-label">Account overview</span>
          <strong>{profileDisplayName}</strong>
          <p>{profile.email}</p>
          <div className="profile-identity-list">
            <div className="profile-identity-item">
              <span className="profile-identity-label">Member since</span>
              <time className="profile-identity-value" dateTime={profile.created_at}>
                {formattedMemberSince}
              </time>
            </div>
            <div className="profile-identity-item">
              <span className="profile-identity-label">Last updated</span>
              <time className="profile-identity-value" dateTime={profile.updated_at}>
                {formattedUpdatedAt}
              </time>
            </div>
          </div>
        </aside>
      </header>

      <section className="dashboard-panel-shell profile-panel" aria-label="Edit profile details">
        <header className="dashboard-section-heading">
          <div>
            <h2>Edit profile</h2>
            <p>Update your display name and avatar URL. Your email stays visible and read-only.</p>
          </div>
        </header>

        <form className="profile-form dashboard-panel" onSubmit={onSubmit} aria-label="Edit profile" noValidate>
          <div className="profile-field-grid">
            <label className={`profile-field${fieldErrors.full_name ? " profile-field-error" : ""}`} htmlFor={`${id}-name`}>
              <span>Full name</span>
              <input
                id={`${id}-name`}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                autoCapitalize="words"
                maxLength={120}
                aria-invalid={fieldErrors.full_name ? "true" : "false"}
                aria-describedby={fieldErrors.full_name ? fullNameErrorId : undefined}
              />
              {fieldErrors.full_name ? (
                <span id={fullNameErrorId} className="profile-field-message" role="alert">
                  {fieldErrors.full_name}
                </span>
              ) : (
                <span className="profile-field-hint">Use the name you want shown across your workspace.</span>
              )}
            </label>

            <label className="profile-field" htmlFor={`${id}-email`}>
              <span>Email</span>
              <input id={`${id}-email`} type="email" value={profile.email} readOnly aria-readonly="true" />
              <span className="profile-field-hint">Email changes are not available from this page.</span>
            </label>

            <label
              className={`profile-field profile-field-span${fieldErrors.avatar_url ? " profile-field-error" : ""}`}
              htmlFor={`${id}-avatar`}
            >
              <span>Avatar URL</span>
              <input
                id={`${id}-avatar`}
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                autoComplete="url"
                inputMode="url"
                maxLength={2048}
                placeholder="https://example.com/avatar.png"
                aria-invalid={fieldErrors.avatar_url ? "true" : "false"}
                aria-describedby={fieldErrors.avatar_url ? avatarUrlErrorId : undefined}
              />
              {fieldErrors.avatar_url ? (
                <span id={avatarUrlErrorId} className="profile-field-message" role="alert">
                  {fieldErrors.avatar_url}
                </span>
              ) : (
                <span className="profile-field-hint">Use a public http or https image URL for your avatar.</span>
              )}
            </label>
          </div>

          <div className="profile-form-feedback">
            {error ? (
              <p id={errorId} className="profile-error" role="alert">
                {error}
              </p>
            ) : null}

            {success ? (
              <p id={successId} className="profile-success" role="status">
                {success}
              </p>
            ) : null}
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="profile-save-button" disabled={isSubmitting || !isDirty} aria-busy={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </button>
            <p className="profile-form-note">
              {isDirty ? "Only your authenticated profile record will be updated." : "Make a change to enable saving."}
            </p>
          </div>
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {isSubmitting ? "Saving profile, please wait." : success ?? ""}
          </span>
        </form>
      </section>
    </section>
  );
}
