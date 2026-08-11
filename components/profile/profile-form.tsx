"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import {
  normalizeEditableProfileUpdate,
  validateEditableProfileUpdate,
  type EditableProfileFieldErrors,
} from "@/lib/profile-validation";
import type { Profile, ProfileUpdateData } from "@/lib/supabase/profile";
import { PasswordForm } from "./password-form";

type ProfileLayoutVariant = "default" | "admin";

type ProfileFormProps = {
  profile: Profile;
  layoutVariant?: ProfileLayoutVariant;
};

export function ProfileForm({
  profile: initialProfile,
  layoutVariant = "default",
}: ProfileFormProps) {
  const id = useId();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [firstName, setFirstName] = useState(initialProfile.first_name ?? "");
  const [middleName, setMiddleName] = useState(initialProfile.middle_name ?? "");
  const [lastName, setLastName] = useState(initialProfile.last_name ?? "");
  const [suffix, setSuffix] = useState(initialProfile.suffix ?? "");
  const [username, setUsername] = useState(initialProfile.username ?? "");
  const [country, setCountry] = useState(initialProfile.country ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initialProfile.date_of_birth ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<EditableProfileFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const errorId = `${id}-error`;
  const successId = `${id}-success`;
  const fullNameErrorId = `${id}-name-error`;
  const avatarUrlErrorId = `${id}-avatar-error`;
  const isAdminLayout = layoutVariant === "admin";

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
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    suffix: suffix,
    username: username,
    country: country,
    date_of_birth: dateOfBirth,
  });
  const isDirty =
    draftProfile.full_name !== (profile.full_name ?? null) ||
    draftProfile.avatar_url !== (profile.avatar_url ?? null) ||
    draftProfile.first_name !== (profile.first_name ?? null) ||
    draftProfile.middle_name !== (profile.middle_name ?? null) ||
    draftProfile.last_name !== (profile.last_name ?? null) ||
    draftProfile.suffix !== (profile.suffix ?? null) ||
    draftProfile.username !== (profile.username ?? null) ||
    draftProfile.country !== (profile.country ?? null) ||
    draftProfile.date_of_birth !== (profile.date_of_birth ?? null);
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
      setFirstName(body.profile.first_name ?? "");
      setMiddleName(body.profile.middle_name ?? "");
      setLastName(body.profile.last_name ?? "");
      setSuffix(body.profile.suffix ?? "");
      setUsername(body.profile.username ?? "");
      setCountry(body.profile.country ?? "");
      setDateOfBirth(body.profile.date_of_birth ?? "");
      setFieldErrors({});
      setSuccess("Profile saved successfully.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const profileFields = (
    <div className="profile-field-grid">

      <label className={`profile-field${fieldErrors.username ? " profile-field-error" : ""}`} htmlFor={`${id}-username`}>
        <span>Username</span>
        <input
          id={`${id}-username`}
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          maxLength={64}
        />
      </label>

      <label className={`profile-field${fieldErrors.first_name ? " profile-field-error" : ""}`} htmlFor={`${id}-first-name`}>
        <span>First name</span>
        <input
          id={`${id}-first-name`}
          type="text"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          maxLength={120}
        />
      </label>

      <label className={`profile-field${fieldErrors.middle_name ? " profile-field-error" : ""}`} htmlFor={`${id}-middle-name`}>
        <span>Middle name</span>
        <input
          id={`${id}-middle-name`}
          type="text"
          value={middleName}
          onChange={(event) => setMiddleName(event.target.value)}
          maxLength={120}
        />
      </label>

      <label className={`profile-field${fieldErrors.last_name ? " profile-field-error" : ""}`} htmlFor={`${id}-last-name`}>
        <span>Last name</span>
        <input
          id={`${id}-last-name`}
          type="text"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          maxLength={120}
        />
      </label>

      <label className={`profile-field${fieldErrors.suffix ? " profile-field-error" : ""}`} htmlFor={`${id}-suffix`}>
        <span>Suffix</span>
        <input
          id={`${id}-suffix`}
          type="text"
          value={suffix}
          onChange={(event) => setSuffix(event.target.value)}
          maxLength={120}
        />
      </label>

      <label className={`profile-field${fieldErrors.country ? " profile-field-error" : ""}`} htmlFor={`${id}-country`}>
        <span>Country</span>
        <input
          id={`${id}-country`}
          type="text"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          maxLength={120}
        />
      </label>

      <label className={`profile-field${fieldErrors.date_of_birth ? " profile-field-error" : ""}`} htmlFor={`${id}-dob`}>
        <span>Date of Birth</span>
        <input
          id={`${id}-dob`}
          type="date"
          value={dateOfBirth}
          onChange={(event) => setDateOfBirth(event.target.value)}
        />
      </label>

      <label className={`profile-field${fieldErrors.full_name ? " profile-field-error" : ""}`} htmlFor={`${id}-name`}>
        <span>Full name</span>
        <input
          id={`${id}-name`}
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
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
          onChange={(event) => setAvatarUrl(event.target.value)}
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
  );

  const formFeedback = (
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
  );

  const formBody = (
    <>
      {profileFields}
      {formFeedback}
      <div className="profile-form-actions">
        <button type="submit" className="profile-save-button" disabled={isSubmitting || !isDirty} aria-busy={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
        <p className="profile-form-note">
          {isDirty ? "Only your authenticated profile record will be updated." : "Make a change to enable saving."}
        </p>
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {isSubmitting ? "Saving profile, please wait." : success ?? ""}
      </span>
    </>
  );

  const summaryContent = (
    <>
      <strong>{profileDisplayName}</strong>
      {profile.date_of_birth && (
        <p className="profile-identity-value" style={{ marginTop: 4 }}>
          Age: {Math.floor((new Date().getTime() - new Date(profile.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))}
        </p>
      )}
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
    </>
  );

  if (isAdminLayout) {
    return (
      <section className="profile-page profile-page-admin admin-page-shell" aria-label="Profile page">
        <header className="admin-page-header profile-page-header">
          <div>
            <span className="admin-page-kicker">Admin workspace</span>
            <h1>Profile</h1>
            <p>Keep your admin workspace details current without changing customer routes or role-based access.</p>
          </div>
        </header>

        <div className="profile-admin-grid admin-content-grid">
          <section className="admin-panel profile-admin-panel" aria-label="Edit profile details">
            <header className="admin-panel-header">
              <div>
                <span className="admin-panel-kicker">Account settings</span>
                <h2>Edit profile</h2>
                <p>Update your display name and avatar URL. Your email stays visible and read-only.</p>
              </div>
            </header>

            <form className="profile-form profile-form-admin" onSubmit={onSubmit} aria-label="Edit profile" noValidate>
              {formBody}
            </form>
          </section>

          <aside className="admin-panel profile-admin-summary" aria-label="Profile summary">
            <header className="admin-panel-header">
              <div>
                <span className="admin-panel-kicker">Overview</span>
                <h2>Account overview</h2>
                <p>Signed-in identity details for the current admin workspace.</p>
              </div>
            </header>

            <article className="admin-surface-card profile-summary-card profile-summary-card-admin">
              {summaryContent}
            </article>
          </aside>
        </div>

        <div className="profile-admin-grid admin-content-grid" style={{ marginTop: 32 }}>
          <section className="admin-panel profile-admin-panel" aria-label="Change password">
            <header className="admin-panel-header">
              <div>
                <span className="admin-panel-kicker">Security</span>
                <h2>Change password</h2>
                <p>Update your account password.</p>
              </div>
            </header>

            <form className="profile-form profile-form-admin" aria-label="Change password" noValidate>
              <PasswordForm id={id} />
            </form>
          </section>
        </div>
      </section>
    );
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
          {summaryContent}
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
          {formBody}
        </form>
      </section>

      <section className="dashboard-panel-shell profile-panel" aria-label="Change password" style={{ marginTop: 32 }}>
        <header className="dashboard-section-heading">
          <div>
            <h2>Change password</h2>
            <p>Update your account password securely.</p>
          </div>
        </header>

        <form className="profile-form dashboard-panel" aria-label="Change password" noValidate>
          <PasswordForm id={id} />
        </form>
      </section>
    </section>
  );
}
