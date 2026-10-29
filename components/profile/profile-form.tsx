"use client";

import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import {
  getProfileAppearance,
  validateProfileAppearance,
  type ProfileAccent,
  type ProfileAppearance,
  type ProfileBackgroundPreset,
  type ProfileCardShape,
  type ProfileContentWidth,
  type ProfileCoverFocalPoint,
  type ProfileTextAlignment,
  type ProfileVisualStyle,
} from "@/lib/profile-appearance";
import {
  normalizeEditableProfileUpdate,
  validateEditableProfileUpdate,
  type EditableProfileFieldErrors,
} from "@/lib/profile-validation";
import {
  getProfileVisibility,
  type ProfileVisibility,
} from "@/lib/profile-visibility";
import type { Profile, ProfileUpdateData } from "@/lib/supabase/profile";
import { PasswordForm } from "./password-form";
import { PublicProfilePreview } from "./profile-preview";

type ProfileLayoutVariant = "default" | "admin";

type ProfileFormProps = {
  profile: Profile;
  layoutVariant?: ProfileLayoutVariant;
};

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const BACKGROUND_OPTIONS: Array<{ label: string; preset: ProfileBackgroundPreset; type: ProfileAppearance["background"]["type"] }> = [
  { label: "Default", preset: "default", type: "gradient" },
  { label: "Forest", preset: "forest", type: "solid" },
  { label: "Midnight", preset: "midnight", type: "solid" },
  { label: "Aurora", preset: "aurora", type: "gradient" },
  { label: "Sunset", preset: "sunset", type: "gradient" },
];

function validateSelectedImage(file: File): string | null {
  if (!IMAGE_MIME_TYPES.has(file.type)) return "Choose a JPG, PNG, WebP, or GIF image.";
  if (file.size < 1) return "Choose an image file with content.";
  if (file.size > PROFILE_IMAGE_MAX_BYTES) return "Choose an image smaller than 5 MB.";
  return null;
}

function isDisplayableImageUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:" || protocol === "blob:";
  } catch {
    return false;
  }
}

function updateAppearance<K extends keyof ProfileAppearance>(
  appearance: ProfileAppearance,
  key: K,
  value: ProfileAppearance[K],
): ProfileAppearance {
  return { ...appearance, [key]: value };
}

function OptionButton({
  label,
  selected,
  onClick,
  swatchClass,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  swatchClass?: string;
}) {
  return (
    <button type="button" className={`profile-option-button${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={onClick}>
      {swatchClass ? <span className={`profile-option-swatch ${swatchClass}`} aria-hidden="true" /> : null}
      <span>{label}</span>
    </button>
  );
}

function ImageUrlField({
  id,
  label,
  value,
  placeholder,
  onChange,
  onRemove,
  error,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  error?: string;
}) {
  return (
    <label className={`profile-field profile-field-span${error ? " profile-field-error" : ""}`} htmlFor={id}>
      <span>{label}</span>
      <div className="profile-media-url-row">
        <input
          id={id}
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="url"
          inputMode="url"
          maxLength={2048}
          placeholder={placeholder}
          aria-invalid={error ? "true" : "false"}
        />
        <button type="button" className="profile-inline-action" onClick={onRemove} disabled={!value}>
          Remove
        </button>
      </div>
      {error ? <span className="profile-field-message" role="alert">{error}</span> : null}
    </label>
  );
}

export function ProfileForm({ profile: initialProfile, layoutVariant = "default" }: ProfileFormProps) {
  const id = useId();
  const isAdminLayout = layoutVariant === "admin";
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
  const [appearance, setAppearance] = useState<ProfileAppearance>(() => getProfileAppearance(initialProfile.preferences));
  const [visibility, setVisibility] = useState<ProfileVisibility>(() => getProfileVisibility(initialProfile.preferences));
  const [avatarLocalPreviewUrl, setAvatarLocalPreviewUrl] = useState<string | null>(null);
  const [coverLocalPreviewUrl, setCoverLocalPreviewUrl] = useState<string | null>(null);
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [appearanceSubmitting, setAppearanceSubmitting] = useState(false);
  const [accountFieldErrors, setAccountFieldErrors] = useState<EditableProfileFieldErrors>({});
  const [appearanceError, setAppearanceError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [appearanceSuccess, setAppearanceSuccess] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [localMediaMessage, setLocalMediaMessage] = useState<string | null>(null);

  useEffect(() => () => {
    if (avatarLocalPreviewUrl) URL.revokeObjectURL(avatarLocalPreviewUrl);
  }, [avatarLocalPreviewUrl]);
  useEffect(() => () => {
    if (coverLocalPreviewUrl) URL.revokeObjectURL(coverLocalPreviewUrl);
  }, [coverLocalPreviewUrl]);

  const accountDraft = normalizeEditableProfileUpdate({
    full_name: fullName,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    suffix,
    username,
    country,
    date_of_birth: dateOfBirth,
  });
  const accountDirty = (
    accountDraft.full_name !== (profile.full_name ?? null) ||
    accountDraft.first_name !== (profile.first_name ?? null) ||
    accountDraft.middle_name !== (profile.middle_name ?? null) ||
    accountDraft.last_name !== (profile.last_name ?? null) ||
    accountDraft.suffix !== (profile.suffix ?? null) ||
    accountDraft.username !== (profile.username ?? null) ||
    accountDraft.country !== (profile.country ?? null) ||
    accountDraft.date_of_birth !== (profile.date_of_birth ?? null)
  );
  const appearanceDirty = (
    avatarUrl.trim() !== (profile.avatar_url ?? "") ||
    JSON.stringify(appearance) !== JSON.stringify(getProfileAppearance(profile.preferences)) ||
    JSON.stringify(visibility) !== JSON.stringify(getProfileVisibility(profile.preferences))
  );
  const displayName = fullName.trim() || profile.full_name || [firstName, lastName].filter(Boolean).join(" ") || "Your profile";
  const previewAppearance = coverLocalPreviewUrl ? { ...appearance, coverUrl: coverLocalPreviewUrl } : appearance;
  const previewAvatarUrl = avatarLocalPreviewUrl ?? (avatarUrl.trim() || null);
  const formattedMemberSince = useMemo(
    () => new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
    [profile.created_at],
  );

  function applySavedProfile(nextProfile: Profile): void {
    setProfile(nextProfile);
    setFullName(nextProfile.full_name ?? "");
    setFirstName(nextProfile.first_name ?? "");
    setMiddleName(nextProfile.middle_name ?? "");
    setLastName(nextProfile.last_name ?? "");
    setSuffix(nextProfile.suffix ?? "");
    setUsername(nextProfile.username ?? "");
    setCountry(nextProfile.country ?? "");
    setDateOfBirth(nextProfile.date_of_birth ?? "");
    setAvatarUrl(nextProfile.avatar_url ?? "");
    setAppearance(getProfileAppearance(nextProfile.preferences));
    setVisibility(getProfileVisibility(nextProfile.preferences));
  }

  async function saveProfile(body: ProfileUpdateData & { profileAppearance?: ProfileAppearance; profileVisibility?: ProfileVisibility }): Promise<Profile> {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      profile?: Profile;
      error?: string;
      fieldErrors?: EditableProfileFieldErrors;
    };
    if (!response.ok || !payload.profile) {
      const error = new Error(payload.error ?? "Failed to save profile. Please try again.");
      Object.assign(error, { fieldErrors: payload.fieldErrors });
      throw error;
    }
    return payload.profile;
  }

  async function onAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateEditableProfileUpdate(accountDraft);
    setAccountFieldErrors(nextErrors);
    setAccountError(null);
    setAccountSuccess(null);
    if (Object.keys(nextErrors).length > 0) {
      setAccountError("Please fix the highlighted fields and try again.");
      return;
    }

    setAccountSubmitting(true);
    try {
      const nextProfile = await saveProfile(accountDraft);
      applySavedProfile(nextProfile);
      setAccountFieldErrors({});
      setAccountSuccess("Account information saved.");
    } catch (error) {
      const fieldErrors = error instanceof Error && "fieldErrors" in error
        ? (error.fieldErrors as EditableProfileFieldErrors | undefined)
        : undefined;
      setAccountFieldErrors(fieldErrors ?? {});
      setAccountError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setAccountSubmitting(false);
    }
  }

  async function onAppearanceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const avatarErrors = validateEditableProfileUpdate(normalizeEditableProfileUpdate({ avatar_url: avatarUrl }));
    const nextAppearanceErrors = validateProfileAppearance(appearance);
    setAppearanceError(null);
    setAppearanceSuccess(null);
    if (avatarErrors.avatar_url || Object.keys(nextAppearanceErrors).length > 0) {
      setAppearanceError(avatarErrors.avatar_url ?? Object.values(nextAppearanceErrors)[0] ?? "Please fix the appearance settings.");
      return;
    }

    setAppearanceSubmitting(true);
    try {
      const nextProfile = await saveProfile({
        ...normalizeEditableProfileUpdate({ avatar_url: avatarUrl }),
        profileAppearance: appearance,
        profileVisibility: visibility,
      });
      applySavedProfile(nextProfile);
      setAvatarLocalPreviewUrl(null);
      setCoverLocalPreviewUrl(null);
      setAppearanceSuccess("Public profile settings saved.");
    } catch (error) {
      setAppearanceError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setAppearanceSubmitting(false);
    }
  }

  function chooseLocalImage(event: ChangeEvent<HTMLInputElement>, target: "avatar" | "cover") {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const validationError = validateSelectedImage(file);
    if (validationError) {
      setLocalMediaMessage(validationError);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    if (target === "avatar") {
      setAvatarLocalPreviewUrl(previewUrl);
    } else {
      setCoverLocalPreviewUrl(previewUrl);
    }
    setLocalMediaMessage(`${file.name} is shown as a local preview only. Private workspace storage cannot safely persist it as a public profile image; add an HTTPS image URL before saving.`);
  }

  const accountField = (
    label: string,
    name: keyof EditableProfileFieldErrors,
    value: string,
    setValue: (value: string) => void,
    options: { type?: "text" | "date"; maxLength?: number; hint?: string } = {},
  ) => (
    <label className={`profile-field${accountFieldErrors[name] ? " profile-field-error" : ""}`} htmlFor={`${id}-${name}`}>
      <span>{label}</span>
      <input id={`${id}-${name}`} type={options.type ?? "text"} value={value} onChange={(event) => setValue(event.target.value)} maxLength={options.maxLength} aria-invalid={accountFieldErrors[name] ? "true" : "false"} />
      {accountFieldErrors[name] ? <span className="profile-field-message" role="alert">{accountFieldErrors[name]}</span> : options.hint ? <span className="profile-field-hint">{options.hint}</span> : null}
    </label>
  );

  const pageClassName = isAdminLayout ? "profile-page profile-page-admin admin-page-shell" : "profile-page dashboard-home-shell";

  return (
    <section className={pageClassName} aria-label="Profile page">
      <header className={isAdminLayout ? "admin-page-header profile-page-header" : "dashboard-home-header"}>
        <div className={isAdminLayout ? "profile-page-heading" : "dashboard-hero-panel profile-page-heading"}>
          <span className={isAdminLayout ? "admin-page-kicker" : "dashboard-eyebrow"}>{isAdminLayout ? "Admin workspace" : "Zero Labs workspace"}</span>
          <h1>Customize profile</h1>
          <p>Update your public profile, account information, and password in separate sections.</p>
        </div>
        <div className="profile-page-header-actions"><Link href={routes.profile} className="profile-secondary-link">Back to profile</Link></div>
      </header>

      <section className="profile-customization-shell" aria-labelledby={`${id}-customization-heading`}>
        <header className="profile-section-heading">
          <div>
            <span className="profile-section-kicker">Public-facing profile</span>
            <h2 id={`${id}-customization-heading`}>Profile customization</h2>
            <p>Preview changes live. Save when the appearance feels right.</p>
          </div>
          <span className={`profile-save-state${appearanceDirty ? " is-unsaved" : ""}`} role="status">
            {appearanceSubmitting ? "Saving…" : appearanceError ? "Could not save" : appearanceDirty ? "Unsaved changes" : appearanceSuccess ? "Saved" : "Up to date"}
          </span>
        </header>

        <div className="profile-customization-grid">
          <div className="profile-preview-column">
            <PublicProfilePreview appearance={previewAppearance} avatarUrl={previewAvatarUrl} displayName={displayName} username={username.trim() || null} country={country.trim() || null} />
          </div>

          <form className="profile-appearance-form" onSubmit={onAppearanceSubmit} aria-label="Profile appearance" noValidate>
            <section className="profile-control-panel" aria-labelledby={`${id}-media-heading`}>
              <div className="profile-control-heading"><span className="profile-section-kicker">Media</span><h3 id={`${id}-media-heading`}>Picture and cover</h3></div>
              <div className="profile-media-controls">
                <div className="profile-media-thumbnail profile-media-thumbnail-avatar" aria-hidden="true">{isDisplayableImageUrl(previewAvatarUrl) ? <img src={previewAvatarUrl} alt="" /> : <span>{displayName.slice(0, 1).toUpperCase()}</span>}</div>
                <div><strong>Profile picture</strong><p>Use a public HTTPS image URL, or test a local image before choosing its hosted URL.</p><label className="profile-upload-trigger"><span>Preview a local image</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseLocalImage(event, "avatar")} /></label></div>
              </div>
              <ImageUrlField id={`${id}-avatar-url`} label="Profile picture URL" value={avatarUrl} placeholder="https://example.com/profile.jpg" onChange={setAvatarUrl} onRemove={() => { setAvatarUrl(""); setAvatarLocalPreviewUrl(null); }} />
              <div className="profile-media-controls">
                <div className="profile-media-thumbnail profile-media-thumbnail-cover" aria-hidden="true">{isDisplayableImageUrl(previewAppearance.coverUrl) ? <img src={previewAppearance.coverUrl} alt="" /> : null}</div>
                <div><strong>Cover photo</strong><p>Landscape images work best. Choose where the cover is focused.</p><label className="profile-upload-trigger"><span>Preview a local cover</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseLocalImage(event, "cover")} /></label></div>
              </div>
              <ImageUrlField id={`${id}-cover-url`} label="Cover photo URL" value={appearance.coverUrl ?? ""} placeholder="https://example.com/cover.jpg" onChange={(coverUrl) => setAppearance((current) => updateAppearance(current, "coverUrl", coverUrl.trim() || null))} onRemove={() => { setAppearance((current) => updateAppearance(current, "coverUrl", null)); setCoverLocalPreviewUrl(null); }} />
              <fieldset className="profile-option-group"><legend>Cover focal point</legend><div className="profile-option-row">{(["top", "center", "bottom"] as ProfileCoverFocalPoint[]).map((point) => <OptionButton key={point} label={point[0].toUpperCase() + point.slice(1)} selected={appearance.coverFocalPoint === point} onClick={() => setAppearance((current) => updateAppearance(current, "coverFocalPoint", point))} />)}</div></fieldset>
            </section>

            <section className="profile-control-panel" aria-labelledby={`${id}-appearance-heading`}>
              <div className="profile-control-heading"><span className="profile-section-kicker">Appearance</span><h3 id={`${id}-appearance-heading`}>Surface and styling</h3></div>
              <fieldset className="profile-option-group"><legend>Profile background</legend><div className="profile-option-row profile-background-options">{BACKGROUND_OPTIONS.map((option) => <OptionButton key={option.preset} label={option.label} swatchClass={`profile-option-swatch-${option.preset}`} selected={appearance.background.preset === option.preset && appearance.background.type === option.type} onClick={() => setAppearance((current) => ({ ...current, background: { ...current.background, type: option.type, preset: option.preset, imageUrl: null } }))} />)}</div></fieldset>
              <ImageUrlField id={`${id}-background-url`} label="Background image URL (optional)" value={appearance.background.imageUrl ?? ""} placeholder="https://example.com/background.jpg" onChange={(imageUrl) => setAppearance((current) => ({ ...current, background: { ...current.background, type: imageUrl.trim() ? "image" : "gradient", preset: imageUrl.trim() ? "image" : "default", imageUrl: imageUrl.trim() || null } }))} onRemove={() => setAppearance((current) => ({ ...current, background: { ...current.background, type: "gradient", preset: "default", imageUrl: null } }))} />
              <fieldset className="profile-option-group"><legend>Visual style</legend><div className="profile-option-row">{(["minimal", "soft", "glass", "bold"] as ProfileVisualStyle[]).map((style) => <OptionButton key={style} label={style[0].toUpperCase() + style.slice(1)} selected={appearance.visualStyle === style} onClick={() => setAppearance((current) => updateAppearance(current, "visualStyle", style))} />)}</div></fieldset>
              <fieldset className="profile-option-group"><legend>Card shape</legend><div className="profile-option-row">{(["square", "rounded", "pill-soft"] as ProfileCardShape[]).map((shape) => <OptionButton key={shape} label={shape === "pill-soft" ? "Soft / Pill" : shape[0].toUpperCase() + shape.slice(1)} selected={appearance.cardShape === shape} onClick={() => setAppearance((current) => updateAppearance(current, "cardShape", shape))} />)}</div></fieldset>
              <fieldset className="profile-option-group"><legend>Accent</legend><div className="profile-option-row">{(["mint", "emerald", "blue", "violet", "amber", "neutral"] as ProfileAccent[]).map((accent) => <OptionButton key={accent} label={accent[0].toUpperCase() + accent.slice(1)} swatchClass={`profile-option-swatch-accent-${accent}`} selected={appearance.accent === accent} onClick={() => setAppearance((current) => updateAppearance(current, "accent", accent))} />)}</div></fieldset>
              <fieldset className="profile-option-group"><legend>Text alignment</legend><div className="profile-option-row">{(["left", "center"] as ProfileTextAlignment[]).map((alignment) => <OptionButton key={alignment} label={alignment[0].toUpperCase() + alignment.slice(1)} selected={appearance.textAlignment === alignment} onClick={() => setAppearance((current) => updateAppearance(current, "textAlignment", alignment))} />)}</div></fieldset>
              <fieldset className="profile-option-group"><legend>Content width</legend><div className="profile-option-row">{(["compact", "standard", "wide"] as ProfileContentWidth[]).map((width) => <OptionButton key={width} label={width[0].toUpperCase() + width.slice(1)} selected={appearance.contentWidth === width} onClick={() => setAppearance((current) => updateAppearance(current, "contentWidth", width))} />)}</div></fieldset>
            </section>

            <section className="profile-control-panel" aria-labelledby={`${id}-privacy-heading`}>
              <div className="profile-control-heading"><span className="profile-section-kicker">Privacy</span><h3 id={`${id}-privacy-heading`}>Public details</h3></div>
              <p className="profile-control-copy">Older profiles stay private by default. Choose only the details you want to show on your profile.</p>
              <div className="profile-visibility-options">
                <label className="profile-visibility-option"><input type="checkbox" checked={visibility.showAge} onChange={(event) => setVisibility((current) => ({ ...current, showAge: event.target.checked }))} /><span><strong>Show age</strong><small>Your exact date of birth stays private.</small></span></label>
                <label className="profile-visibility-option"><input type="checkbox" checked={visibility.showLocation} onChange={(event) => setVisibility((current) => ({ ...current, showLocation: event.target.checked }))} /><span><strong>Show location</strong><small>Show your country on your public profile.</small></span></label>
              </div>
            </section>

            {localMediaMessage ? <p className="profile-local-media-message" role="status">{localMediaMessage}</p> : null}
            {appearanceError ? <p className="profile-error" role="alert">{appearanceError}</p> : null}
            {appearanceSuccess ? <p className="profile-success" role="status">{appearanceSuccess}</p> : null}
            <div className="profile-form-actions"><button type="submit" className="profile-save-button" disabled={appearanceSubmitting || !appearanceDirty} aria-busy={appearanceSubmitting}>{appearanceSubmitting ? "Saving public profile…" : "Save public profile"}</button><p className="profile-form-note">{appearanceDirty ? "Public profile changes are ready to save." : "Your saved public profile is shown in the preview."}</p></div>
          </form>
        </div>
      </section>

      <section className="dashboard-panel-shell profile-panel profile-account-panel" aria-labelledby={`${id}-account-heading`}>
        <header className="dashboard-section-heading"><div><span className="profile-section-kicker">Private workspace details</span><h2 id={`${id}-account-heading`}>Account information</h2><p>Update identity details separately from your public appearance. Email stays read-only.</p></div><span className={`profile-save-state${accountDirty ? " is-unsaved" : ""}`} role="status">{accountSubmitting ? "Saving…" : accountError ? "Could not save" : accountDirty ? "Unsaved changes" : accountSuccess ? "Saved" : "Up to date"}</span></header>
        <form className="profile-form dashboard-panel" onSubmit={onAccountSubmit} aria-label="Account information" noValidate>
          <div className="profile-field-grid">
            {accountField("Username", "username", username, setUsername, { maxLength: 64 })}
            {accountField("First name", "first_name", firstName, setFirstName, { maxLength: 120 })}
            {accountField("Middle name", "middle_name", middleName, setMiddleName, { maxLength: 120 })}
            {accountField("Last name", "last_name", lastName, setLastName, { maxLength: 120 })}
            {accountField("Suffix", "suffix", suffix, setSuffix, { maxLength: 120 })}
            {accountField("Country", "country", country, setCountry, { maxLength: 120 })}
            {accountField("Date of birth", "date_of_birth", dateOfBirth, setDateOfBirth, { type: "date" })}
            {accountField("Full name", "full_name", fullName, setFullName, { maxLength: 120, hint: "This is the name shown on your public profile." })}
            <label className="profile-field" htmlFor={`${id}-email`}><span>Email</span><input id={`${id}-email`} type="email" value={profile.email} readOnly aria-readonly="true" /><span className="profile-field-hint">Email changes are not available from this page.</span></label>
          </div>
          <div className="profile-account-meta"><span>Member since <time dateTime={profile.created_at}>{formattedMemberSince}</time></span></div>
          {accountError ? <p className="profile-error" role="alert">{accountError}</p> : null}
          {accountSuccess ? <p className="profile-success" role="status">{accountSuccess}</p> : null}
          <div className="profile-form-actions"><button type="submit" className="profile-save-button" disabled={accountSubmitting || !accountDirty} aria-busy={accountSubmitting}>{accountSubmitting ? "Saving account…" : "Save account information"}</button><p className="profile-form-note">Only your authenticated profile record is updated.</p></div>
        </form>
      </section>

      <section className="dashboard-panel-shell profile-panel" aria-labelledby={`${id}-security-heading`}>
        <header className="dashboard-section-heading"><div><span className="profile-section-kicker">Security</span><h2 id={`${id}-security-heading`}>Change password</h2><p>Update your account password securely.</p></div></header>
        <PasswordForm id={id} className="profile-form dashboard-panel" />
      </section>
    </section>
  );
}
