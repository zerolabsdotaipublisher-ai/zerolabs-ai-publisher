"use client";

import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
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
  getProfileAge,
  type ProfileVisibility,
} from "@/lib/profile-visibility";
import {
  getPublicProfileCustomizationPayload,
  isPublicProfileCustomizationDirty,
} from "@/lib/profile-customization";
import {
  isProfileMediaReference,
  isSupportedProfileMediaUrl,
  validateProfileMediaUpload,
  type ProfileMediaDisplayUrls,
  type ProfileMediaKind,
} from "@/lib/profile-media";
import type { Profile, ProfileUpdateData } from "@/lib/supabase/profile";
import { PasswordForm } from "./password-form";
import {
  getProfilePageBackgroundClassName,
  getProfilePageBackgroundStyle,
  ProfilePageBackgroundImage,
  PublicProfilePreview,
} from "./profile-preview";

type ProfileLayoutVariant = "default" | "admin";
type ProfileEditorCategory = "profile-design" | "profile-information" | "media" | "privacy" | "account" | "security";
type UploadedProfileMedia = { reference: string; previewUrl: string };
type PendingProfileMediaUpload = { file: File; uploaded: UploadedProfileMedia };

type ProfileFormProps = {
  profile: Profile;
  mediaUrls?: ProfileMediaDisplayUrls;
  layoutVariant?: ProfileLayoutVariant;
  /** Lets the editor open on a purposeful panel without changing the URL. */
  initialEditorCategory?: ProfileEditorCategory;
};

const GRADIENT_OPTIONS: Array<{ label: string; preset: ProfileBackgroundPreset }> = [
  { label: "Forest", preset: "forest" },
  { label: "Midnight", preset: "midnight" },
  { label: "Aurora", preset: "aurora" },
  { label: "Sunset", preset: "sunset" },
];

const LEGACY_SOLID_BACKGROUND_COLORS: Partial<Record<ProfileBackgroundPreset, string>> = {
  forest: "#0b392a",
  midnight: "#13233c",
};

export function getBackgroundImageFallback(background: ProfileAppearance["background"]): ProfileAppearance["background"] {
  return {
    type: background.color ? "solid" : "gradient",
    preset: background.preset === "image" ? "default" : background.preset,
    color: background.color ?? null,
    imageUrl: null,
  };
}

const PROFILE_EDITOR_CATEGORIES: Array<{
  id: ProfileEditorCategory;
  label: string;
  description: string;
}> = [
  { id: "profile-design", label: "Profile Design", description: "Surface and styling" },
  { id: "profile-information", label: "Profile Information", description: "Public name and location" },
  { id: "media", label: "Media", description: "Picture and cover" },
  { id: "privacy", label: "Privacy", description: "Public details" },
  { id: "account", label: "Account", description: "Private account details" },
  { id: "security", label: "Security", description: "Password and access" },
];

export function getNextProfileEditorCategoryIndex(
  key: string,
  currentIndex: number,
  categoryCount = PROFILE_EDITOR_CATEGORIES.length,
): number | null {
  if (categoryCount < 1) return null;
  const lastIndex = categoryCount - 1;

  if (key === "ArrowDown" || key === "ArrowRight") return currentIndex === lastIndex ? 0 : currentIndex + 1;
  if (key === "ArrowUp" || key === "ArrowLeft") return currentIndex === 0 ? lastIndex : currentIndex - 1;
  if (key === "Home") return 0;
  if (key === "End") return lastIndex;
  return null;
}

/** Kept separate so every profile-media upload uses the same multipart shape. */
export function createProfileMediaUploadFormData(file: File, kind: ProfileMediaKind): FormData {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("kind", kind);
  return formData;
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

export function ProfileForm({
  profile: initialProfile,
  mediaUrls,
  layoutVariant = "default",
  initialEditorCategory = "media",
}: ProfileFormProps) {
  const id = useId();
  const isAdminLayout = layoutVariant === "admin";
  const [selectedEditorCategory, setSelectedEditorCategory] = useState<ProfileEditorCategory>(initialEditorCategory);
  const categoryButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);
  const pendingAvatarUploadRef = useRef<PendingProfileMediaUpload | null>(null);
  const pendingCoverUploadRef = useRef<PendingProfileMediaUpload | null>(null);
  const pendingBackgroundUploadRef = useRef<PendingProfileMediaUpload | null>(null);
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
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string | null>(() => (
    mediaUrls
      ? mediaUrls.avatarUrl
      : isProfileMediaReference(initialProfile.avatar_url) || !isSupportedProfileMediaUrl(initialProfile.avatar_url)
        ? null
        : initialProfile.avatar_url
  ));
  const [coverDisplayUrl, setCoverDisplayUrl] = useState<string | null>(() => {
    const coverUrl = getProfileAppearance(initialProfile.preferences).coverUrl;
    return mediaUrls
      ? mediaUrls.coverUrl
      : isProfileMediaReference(coverUrl) || !isSupportedProfileMediaUrl(coverUrl)
        ? null
        : coverUrl;
  });
  const [backgroundDisplayUrl, setBackgroundDisplayUrl] = useState<string | null>(() => {
    const backgroundImageUrl = getProfileAppearance(initialProfile.preferences).background.imageUrl;
    return mediaUrls
      ? mediaUrls.backgroundUrl ?? null
      : isProfileMediaReference(backgroundImageUrl) || !isSupportedProfileMediaUrl(backgroundImageUrl)
        ? null
        : backgroundImageUrl;
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [avatarLocalPreviewUrl, setAvatarLocalPreviewUrl] = useState<string | null>(null);
  const [coverLocalPreviewUrl, setCoverLocalPreviewUrl] = useState<string | null>(null);
  const [backgroundLocalPreviewUrl, setBackgroundLocalPreviewUrl] = useState<string | null>(null);
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [appearanceSubmitting, setAppearanceSubmitting] = useState(false);
  const [accountFieldErrors, setAccountFieldErrors] = useState<EditableProfileFieldErrors>({});
  const [publicFieldErrors, setPublicFieldErrors] = useState<EditableProfileFieldErrors>({});
  const [appearanceError, setAppearanceError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [appearanceSuccess, setAppearanceSuccess] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [mediaMessage, setMediaMessage] = useState<string | null>(null);

  useEffect(() => () => {
    if (avatarLocalPreviewUrl) URL.revokeObjectURL(avatarLocalPreviewUrl);
  }, [avatarLocalPreviewUrl]);
  useEffect(() => () => {
    if (coverLocalPreviewUrl) URL.revokeObjectURL(coverLocalPreviewUrl);
  }, [coverLocalPreviewUrl]);
  useEffect(() => () => {
    if (backgroundLocalPreviewUrl) URL.revokeObjectURL(backgroundLocalPreviewUrl);
  }, [backgroundLocalPreviewUrl]);

  const publicProfileDraft = normalizeEditableProfileUpdate({
    full_name: fullName,
    username,
    country,
  });
  const accountDraft = normalizeEditableProfileUpdate({
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    suffix,
    date_of_birth: dateOfBirth,
  });
  const publicProfileInformationDirty = (
    publicProfileDraft.full_name !== (profile.full_name ?? null) ||
    publicProfileDraft.username !== (profile.username ?? null) ||
    publicProfileDraft.country !== (profile.country ?? null)
  );
  const accountDirty = (
    accountDraft.first_name !== (profile.first_name ?? null) ||
    accountDraft.middle_name !== (profile.middle_name ?? null) ||
    accountDraft.last_name !== (profile.last_name ?? null) ||
    accountDraft.suffix !== (profile.suffix ?? null) ||
    accountDraft.date_of_birth !== (profile.date_of_birth ?? null)
  );
  const publicProfileDirty = Boolean(avatarFile || coverFile || backgroundFile) || publicProfileInformationDirty || isPublicProfileCustomizationDirty({ avatarUrl, appearance, visibility, profile });
  const displayName = fullName.trim() || profile.full_name || [firstName, lastName].filter(Boolean).join(" ") || "Your profile";
  const previewAge = visibility.showAge ? getProfileAge(dateOfBirth) : null;
  const previewMetadata = [
    previewAge === null ? null : `${previewAge} years old`,
    visibility.showLocation ? country.trim() || null : null,
  ].filter((value): value is string => Boolean(value));
  const previewAppearance = {
    ...appearance,
    coverUrl: coverLocalPreviewUrl ?? coverDisplayUrl,
    background: {
      ...appearance.background,
      imageUrl: backgroundLocalPreviewUrl ?? backgroundDisplayUrl,
    },
  };
  const previewAvatarUrl = avatarLocalPreviewUrl ?? avatarDisplayUrl;
  const solidBackgroundColor = appearance.background.type === "solid"
    ? appearance.background.color ?? LEGACY_SOLID_BACKGROUND_COLORS[appearance.background.preset] ?? "#0b392a"
    : "#0b392a";
  const formattedMemberSince = useMemo(
    () => new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
    [profile.created_at],
  );

  function applySavedPublicProfile(nextProfile: Profile, nextMediaUrls?: ProfileMediaDisplayUrls): void {
    setProfile(nextProfile);
    setFullName(nextProfile.full_name ?? "");
    setUsername(nextProfile.username ?? "");
    setCountry(nextProfile.country ?? "");
    setAvatarUrl(nextProfile.avatar_url ?? "");
    setAppearance(getProfileAppearance(nextProfile.preferences));
    setVisibility(getProfileVisibility(nextProfile.preferences));
    if (nextMediaUrls) {
      setAvatarDisplayUrl(nextMediaUrls.avatarUrl);
      setCoverDisplayUrl(nextMediaUrls.coverUrl);
      setBackgroundDisplayUrl(nextMediaUrls.backgroundUrl ?? null);
    }
  }

  function applySavedAccountProfile(nextProfile: Profile): void {
    setProfile(nextProfile);
    setFirstName(nextProfile.first_name ?? "");
    setMiddleName(nextProfile.middle_name ?? "");
    setLastName(nextProfile.last_name ?? "");
    setSuffix(nextProfile.suffix ?? "");
    setDateOfBirth(nextProfile.date_of_birth ?? "");
  }

  async function saveProfile(body: ProfileUpdateData & { profileAppearance?: ProfileAppearance; profileVisibility?: ProfileVisibility }): Promise<Profile> {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      profile?: Profile;
      error?: string | { code?: string; message?: string };
      fieldErrors?: EditableProfileFieldErrors;
    };
    if (!response.ok || !payload.profile) {
      const message = typeof payload.error === "string"
        ? payload.error
        : payload.error?.message ?? "Failed to save profile. Please try again.";
      const error = new Error(message);
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
      applySavedAccountProfile(nextProfile);
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

  async function onPublicProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let nextAvatarUrl = avatarUrl;
    let nextAppearance = appearance;
    let nextAvatarDisplayUrl = avatarDisplayUrl;
    let nextCoverDisplayUrl = coverDisplayUrl;
    let nextBackgroundDisplayUrl = backgroundDisplayUrl;

    setAppearanceError(null);
    setAppearanceSuccess(null);
    setPublicFieldErrors({});
    setMediaMessage(null);
    setAppearanceSubmitting(true);

    try {
      // Validate the profile before writing an object so invalid text/settings
      // cannot leave an upload waiting for a profile save that will never run.
      const currentPublicProfilePayload = getPublicProfileCustomizationPayload({
        avatarUrl,
        appearance,
        visibility,
        profile,
      });
      const initialPublicFieldErrors = validateEditableProfileUpdate(normalizeEditableProfileUpdate({
        ...publicProfileDraft,
        avatar_url: currentPublicProfilePayload.avatar_url,
      }));
      const initialAppearanceErrors = validateProfileAppearance(currentPublicProfilePayload.profileAppearance);
      if (Object.keys(initialPublicFieldErrors).length > 0 || Object.keys(initialAppearanceErrors).length > 0) {
        setPublicFieldErrors(initialPublicFieldErrors);
        setAppearanceError(initialPublicFieldErrors.avatar_url ?? Object.values(initialPublicFieldErrors)[0] ?? Object.values(initialAppearanceErrors)[0] ?? "Please fix the public profile settings.");
        return;
      }

      if (avatarFile) {
        const uploaded = await getOrUploadProfileMedia(avatarFile, "avatar");
        nextAvatarUrl = uploaded.reference;
        nextAvatarDisplayUrl = uploaded.previewUrl;
      }

      if (coverFile) {
        const uploaded = await getOrUploadProfileMedia(coverFile, "cover");
        nextAppearance = { ...nextAppearance, coverUrl: uploaded.reference };
        nextCoverDisplayUrl = uploaded.previewUrl;
      }

      if (backgroundFile) {
        const uploaded = await getOrUploadProfileMedia(backgroundFile, "background");
        nextAppearance = {
          ...nextAppearance,
          background: {
            ...nextAppearance.background,
            type: "image",
            imageUrl: uploaded.reference,
          },
        };
        nextBackgroundDisplayUrl = uploaded.previewUrl;
      }

      const publicProfilePayload = getPublicProfileCustomizationPayload({
        avatarUrl: nextAvatarUrl,
        appearance: nextAppearance,
        visibility,
        profile,
      });
      const publicFieldErrors = validateEditableProfileUpdate(normalizeEditableProfileUpdate({
        ...publicProfileDraft,
        avatar_url: publicProfilePayload.avatar_url,
      }));
      const nextAppearanceErrors = validateProfileAppearance(publicProfilePayload.profileAppearance);
      if (Object.keys(publicFieldErrors).length > 0 || Object.keys(nextAppearanceErrors).length > 0) {
        setPublicFieldErrors(publicFieldErrors);
        setAppearanceError(publicFieldErrors.avatar_url ?? Object.values(publicFieldErrors)[0] ?? Object.values(nextAppearanceErrors)[0] ?? "Please fix the public profile settings.");
      return;
    }

      const nextProfile = await saveProfile({
        ...normalizeEditableProfileUpdate({
          ...publicProfileDraft,
          avatar_url: publicProfilePayload.avatar_url,
        }),
        profileAppearance: publicProfilePayload.profileAppearance,
        profileVisibility: publicProfilePayload.profileVisibility,
      });
      applySavedPublicProfile(nextProfile, {
        avatarUrl: nextAvatarDisplayUrl,
        coverUrl: nextCoverDisplayUrl,
        backgroundUrl: nextBackgroundDisplayUrl,
      });
      pendingAvatarUploadRef.current = null;
      pendingCoverUploadRef.current = null;
      pendingBackgroundUploadRef.current = null;
      setAvatarFile(null);
      setCoverFile(null);
      setBackgroundFile(null);
      setAvatarLocalPreviewUrl(null);
      setCoverLocalPreviewUrl(null);
      setBackgroundLocalPreviewUrl(null);
      setMediaMessage(null);
      setPublicFieldErrors({});
      setAppearanceSuccess("Public profile saved.");
    } catch (error) {
      // Keep both the local File and its staged durable reference. The next
      // Save retries the profile PATCH without replacing the object, which is
      // safe even if the previous request reached the server before a network
      // error prevented the browser from receiving its response.
      const fieldErrors = error instanceof Error && "fieldErrors" in error
        ? (error.fieldErrors as EditableProfileFieldErrors | undefined)
        : undefined;
      setPublicFieldErrors(fieldErrors ?? {});
      setAppearanceError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setAppearanceSubmitting(false);
    }
  }

  async function uploadProfileMedia(file: File, kind: ProfileMediaKind): Promise<UploadedProfileMedia> {
    const formData = createProfileMediaUploadFormData(file, kind);
    const response = await fetch("/api/profile/media", { method: "POST", body: formData });
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      media?: { reference?: string; previewUrl?: string };
      error?: string | { code?: string; message?: string };
    };
    if (!response.ok || !payload.media?.reference || !payload.media.previewUrl) {
      const message = typeof payload.error === "string"
        ? payload.error
        : payload.error?.message ?? "We couldn't upload that image. Your selection is still ready to retry.";
      const error = new Error(message);
      Object.assign(error, { code: typeof payload.error === "string" ? undefined : payload.error?.code });
      throw error;
    }
    return { reference: payload.media.reference, previewUrl: payload.media.previewUrl };
  }

  async function getOrUploadProfileMedia(file: File, kind: ProfileMediaKind): Promise<UploadedProfileMedia> {
    const pendingRef = kind === "avatar"
      ? pendingAvatarUploadRef
      : kind === "cover"
        ? pendingCoverUploadRef
        : pendingBackgroundUploadRef;
    if (pendingRef.current?.file === file) return pendingRef.current.uploaded;

    const uploaded = await uploadProfileMedia(file, kind);
    pendingRef.current = { file, uploaded };
    return uploaded;
  }

  async function discardUploadedProfileMedia(media: Array<{ reference: string; kind: ProfileMediaKind }>): Promise<void> {
    await Promise.all(media.map(async ({ reference, kind }) => {
      try {
        await fetch("/api/profile/media", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, kind }),
        });
      } catch {
        // Retrying the profile save remains more important than surfacing a
        // cleanup warning. The server keeps the object owner-scoped either way.
      }
    }));
  }

  function discardPendingProfileMedia(kind: ProfileMediaKind): void {
    const pendingRef = kind === "avatar"
      ? pendingAvatarUploadRef
      : kind === "cover"
        ? pendingCoverUploadRef
        : pendingBackgroundUploadRef;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) void discardUploadedProfileMedia([{ reference: pending.uploaded.reference, kind }]);
  }

  function clearPendingBackgroundImage(): void {
    discardPendingProfileMedia("background");
    setBackgroundFile(null);
    setBackgroundLocalPreviewUrl(null);
  }

  function chooseProfileMedia(event: ChangeEvent<HTMLInputElement>, target: ProfileMediaKind) {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const validation = validateProfileMediaUpload({
      kind: target,
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    });
    if (!validation.ok) {
      setMediaMessage(validation.errors[0] ?? "Choose a supported profile image.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    if (target === "avatar") {
      discardPendingProfileMedia("avatar");
      setAvatarFile(file);
      setAvatarLocalPreviewUrl(previewUrl);
    } else if (target === "cover") {
      discardPendingProfileMedia("cover");
      setCoverFile(file);
      setCoverLocalPreviewUrl(previewUrl);
    } else {
      discardPendingProfileMedia("background");
      setBackgroundFile(file);
      setBackgroundLocalPreviewUrl(previewUrl);
      setAppearance((current) => ({
        ...current,
        background: {
          ...current.background,
          type: "image",
        },
      }));
    }
    setMediaMessage(`${file.name} selected. It will upload when you save your public profile.`);
  }

  const profileField = (
    label: string,
    name: keyof EditableProfileFieldErrors,
    value: string,
    setValue: (value: string) => void,
    options: { type?: "text" | "date"; maxLength?: number; hint?: string } = {},
    fieldErrors: EditableProfileFieldErrors = accountFieldErrors,
  ) => (
    <label className={`profile-field${fieldErrors[name] ? " profile-field-error" : ""}`} htmlFor={`${id}-${name}`}>
      <span>{label}</span>
      <input id={`${id}-${name}`} type={options.type ?? "text"} value={value} onChange={(event) => setValue(event.target.value)} maxLength={options.maxLength} aria-invalid={fieldErrors[name] ? "true" : "false"} />
      {fieldErrors[name] ? <span className="profile-field-message" role="alert">{fieldErrors[name]}</span> : options.hint ? <span className="profile-field-hint">{options.hint}</span> : null}
    </label>
  );

  const selectEditorCategory = (index: number) => {
    const category = PROFILE_EDITOR_CATEGORIES[index];
    if (!category) return;
    setSelectedEditorCategory(category.id);
    categoryButtonRefs.current[index]?.focus();
  };

  const handleEditorCategoryKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextIndex = getNextProfileEditorCategoryIndex(event.key, index);

    if (nextIndex !== null) {
      event.preventDefault();
      selectEditorCategory(nextIndex);
    }
  };

  const pageClassName = isAdminLayout ? "profile-page profile-page-admin admin-page-shell" : "profile-page dashboard-home-shell";
  const isProfileInformationCategory = selectedEditorCategory === "profile-information";
  const isAccountEditorCategory = selectedEditorCategory === "account";
  const activeEditorDirty = isAccountEditorCategory ? accountDirty : selectedEditorCategory === "security" ? false : publicProfileDirty;
  const activeEditorSubmitting = isAccountEditorCategory ? accountSubmitting : selectedEditorCategory === "security" ? false : appearanceSubmitting;
  const activeEditorError = isAccountEditorCategory ? accountError : selectedEditorCategory === "security" ? null : appearanceError;
  const activeEditorSuccess = isAccountEditorCategory ? accountSuccess : selectedEditorCategory === "security" ? null : appearanceSuccess;

  return (
    <section className={pageClassName} aria-label="Profile page">
      <header className={isAdminLayout ? "admin-page-header profile-page-header" : "dashboard-home-header profile-page-header"}>
        <div className={isAdminLayout ? "profile-page-heading" : "dashboard-hero-panel profile-page-heading"}>
          <span className={isAdminLayout ? "admin-page-kicker" : "dashboard-eyebrow"}>{isAdminLayout ? "Admin workspace" : "Zero Labs workspace"}</span>
          <h1>Customize profile</h1>
          <p>Shape your public profile, account details, and security settings in one focused workspace.</p>
        </div>
        <div className="profile-page-header-actions"><Link href={routes.profile} className="profile-secondary-link">Back to profile</Link></div>
      </header>

      <section className="profile-customization-shell" aria-labelledby={`${id}-customization-heading`}>
        <header className="profile-section-heading">
          <div>
            <span className="profile-section-kicker">Profile editor</span>
            <h2 id={`${id}-customization-heading`}>Customize your profile</h2>
            <p>Choose a category, preview public changes live, and save when you are ready.</p>
          </div>
          <span className={`profile-save-state${activeEditorDirty ? " is-unsaved" : ""}`} role="status">
            {activeEditorSubmitting ? "Saving…" : activeEditorError ? "Could not save" : activeEditorDirty ? "Unsaved changes" : activeEditorSuccess ? "Saved" : "Up to date"}
          </span>
        </header>

        <div className="profile-customization-grid">
          <nav className="profile-editor-nav" aria-label="Profile customization categories">
            <span className="profile-editor-nav-label">Categories</span>
            <div className="profile-editor-tablist" role="tablist" aria-orientation="vertical">
              {PROFILE_EDITOR_CATEGORIES.map((category, index) => {
                const selected = selectedEditorCategory === category.id;
                return (
                  <button
                    key={category.id}
                    id={`${id}-${category.id}-tab`}
                    type="button"
                    role="tab"
                    ref={(button) => { categoryButtonRefs.current[index] = button; }}
                    className={`profile-editor-nav-button${selected ? " is-selected" : ""}`}
                    aria-controls={`${id}-${category.id}-controls`}
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => selectEditorCategory(index)}
                    onKeyDown={(event) => handleEditorCategoryKeyDown(event, index)}
                  >
                    <span className="profile-editor-nav-button-label">
                      <span className="profile-editor-nav-step" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                      <span>{category.label}</span>
                    </span>
                    <small>{category.description}</small>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="profile-preview-column">
            <span className="profile-preview-live-label">Live preview</span>
            <div
              className={`profile-editor-page-preview ${getProfilePageBackgroundClassName(previewAppearance)}`}
              style={getProfilePageBackgroundStyle(previewAppearance)}
            >
              <ProfilePageBackgroundImage appearance={previewAppearance} />
              <PublicProfilePreview appearance={previewAppearance} avatarUrl={previewAvatarUrl} displayName={displayName} username={username.trim() || null} country={visibility.showLocation ? country.trim() || null : null} label="Live public profile preview" variant="profile" metadata={previewMetadata} />
            </div>
          </div>

          {selectedEditorCategory === "security" ? (
            <section id={`${id}-security-controls`} className="profile-control-panel" role="tabpanel" aria-labelledby={`${id}-security-tab`}>
              <div className="profile-control-heading"><span className="profile-section-kicker">Security</span><h3 id={`${id}-security-heading`}>Password and access</h3></div>
              <p className="profile-control-copy">Update your account password securely.</p>
              <PasswordForm id={id} className="profile-form" />
            </section>
          ) : (
          <form
            id={`${id}-${selectedEditorCategory}-controls`}
            className="profile-appearance-form"
            role="tabpanel"
            aria-labelledby={`${id}-${selectedEditorCategory}-tab`}
            onSubmit={isAccountEditorCategory ? onAccountSubmit : onPublicProfileSubmit}
            aria-label={isProfileInformationCategory ? "Profile information" : selectedEditorCategory === "account" ? "Account information" : "Public profile settings"}
            noValidate
          >
            {selectedEditorCategory === "profile-information" ? (
              <section className="profile-control-panel" aria-labelledby={`${id}-profile-information-heading`}>
                <div className="profile-control-heading"><span className="profile-section-kicker">Profile information</span><h3 id={`${id}-profile-information-heading`}>Public identity</h3></div>
                <p className="profile-control-copy">These details are reflected in your live public profile preview.</p>
                <div className="profile-field-grid">
                  {profileField("Display name", "full_name", fullName, setFullName, { maxLength: 120, hint: "This is the name shown on your public profile." }, publicFieldErrors)}
                  {profileField("Username", "username", username, setUsername, { maxLength: 64 }, publicFieldErrors)}
                  {profileField("Country or location", "country", country, setCountry, { maxLength: 120, hint: "This is only visible when Show location is enabled." }, publicFieldErrors)}
                </div>
              </section>
            ) : null}
            {selectedEditorCategory === "media" ? (
              <section className="profile-control-panel" aria-labelledby={`${id}-media-heading`}>
              <div className="profile-control-heading"><span className="profile-section-kicker">Media</span><h3 id={`${id}-media-heading`}>Picture and cover</h3></div>
              <div className="profile-media-controls">
                <div className="profile-media-thumbnail profile-media-thumbnail-avatar" aria-hidden="true">{isDisplayableImageUrl(previewAvatarUrl) ? <img src={previewAvatarUrl} alt="" /> : <span>{displayName.slice(0, 1).toUpperCase()}</span>}</div>
                <div className="profile-media-copy">
                  <strong>Profile picture</strong>
                  <p>JPG, PNG, WebP, or GIF up to 4 MB. Your image uploads when you save.</p>
                  <button type="button" className="profile-upload-trigger" onClick={() => avatarInputRef.current?.click()}>
                    Upload profile picture
                  </button>
                  <input ref={avatarInputRef} id={`${id}-avatar-upload`} className="profile-upload-input" aria-label="Upload profile picture" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseProfileMedia(event, "avatar")} />
                  <p className="profile-media-selection" role="status">{avatarFile ? `${avatarFile.name} selected` : avatarUrl ? "Profile picture saved" : "No profile picture selected"}</p>
                  <button type="button" className="profile-inline-action" onClick={() => { discardPendingProfileMedia("avatar"); setAvatarUrl(""); setAvatarDisplayUrl(null); setAvatarFile(null); setAvatarLocalPreviewUrl(null); setMediaMessage("Profile picture will be removed when you save."); }} disabled={!avatarUrl && !avatarFile}>
                    Remove profile picture
                  </button>
                </div>
              </div>
              <div className="profile-media-controls">
                <div className="profile-media-thumbnail profile-media-thumbnail-cover" aria-hidden="true">{isDisplayableImageUrl(previewAppearance.coverUrl) ? <img src={previewAppearance.coverUrl} alt="" /> : null}</div>
                <div className="profile-media-copy">
                  <strong>Cover photo</strong>
                  <p>Landscape images work best. JPG, PNG, WebP, or GIF up to 4 MB. Your image uploads when you save.</p>
                  <button type="button" className="profile-upload-trigger" onClick={() => coverInputRef.current?.click()}>
                    Upload cover photo
                  </button>
                  <input ref={coverInputRef} id={`${id}-cover-upload`} className="profile-upload-input" aria-label="Upload cover photo" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseProfileMedia(event, "cover")} />
                  <p className="profile-media-selection" role="status">{coverFile ? `${coverFile.name} selected` : appearance.coverUrl ? "Cover photo saved" : "No cover photo selected"}</p>
                  <button type="button" className="profile-inline-action" onClick={() => { discardPendingProfileMedia("cover"); setAppearance((current) => updateAppearance(current, "coverUrl", null)); setCoverDisplayUrl(null); setCoverFile(null); setCoverLocalPreviewUrl(null); setMediaMessage("Cover photo will be removed when you save."); }} disabled={!appearance.coverUrl && !coverFile}>
                    Remove cover photo
                  </button>
                </div>
              </div>
              <fieldset className="profile-option-group"><legend>Cover focal point</legend><div className="profile-option-row">{(["top", "center", "bottom"] as ProfileCoverFocalPoint[]).map((point) => <OptionButton key={point} label={point[0].toUpperCase() + point.slice(1)} selected={appearance.coverFocalPoint === point} onClick={() => setAppearance((current) => updateAppearance(current, "coverFocalPoint", point))} />)}</div></fieldset>
              </section>
            ) : null}

            {selectedEditorCategory === "profile-design" ? (
              <section className="profile-control-panel" aria-labelledby={`${id}-profile-design-heading`}>
              <div className="profile-control-heading"><span className="profile-section-kicker">Profile design</span><h3 id={`${id}-profile-design-heading`}>Surface and styling</h3></div>
              <fieldset className="profile-option-group"><legend>Page background</legend><p className="profile-control-copy">This fills the full public profile canvas behind your header and shared content. It does not replace the cover photo.</p><div className="profile-option-row profile-background-options"><OptionButton label="Default" swatchClass="profile-option-swatch-default" selected={appearance.background.type === "gradient" && appearance.background.preset === "default"} onClick={() => { clearPendingBackgroundImage(); setAppearance((current) => ({ ...current, background: { type: "gradient", preset: "default", color: null, imageUrl: null } })); }} /></div></fieldset>
              <fieldset className="profile-option-group"><legend>Solid color</legend><div className="profile-background-color-control"><input id={`${id}-background-color`} type="color" value={solidBackgroundColor} aria-label="Page background color" onChange={(event) => { clearPendingBackgroundImage(); setAppearance((current) => ({ ...current, background: { type: "solid", preset: "default", color: event.target.value, imageUrl: null } })); }} /><output htmlFor={`${id}-background-color`}>{solidBackgroundColor.toUpperCase()}</output></div></fieldset>
              <fieldset className="profile-option-group"><legend>Gradient preset</legend><div className="profile-option-row profile-background-options">{GRADIENT_OPTIONS.map((option) => <OptionButton key={option.preset} label={option.label} swatchClass={`profile-option-swatch-${option.preset}`} selected={appearance.background.type === "gradient" && appearance.background.preset === option.preset} onClick={() => { clearPendingBackgroundImage(); setAppearance((current) => ({ ...current, background: { type: "gradient", preset: option.preset, color: null, imageUrl: null } })); }} />)}</div></fieldset>
              <div className="profile-media-controls profile-background-image-control">
                <div className="profile-media-thumbnail profile-media-thumbnail-background" aria-hidden="true">{isDisplayableImageUrl(previewAppearance.background.imageUrl) ? <img src={previewAppearance.background.imageUrl} alt="" /> : null}</div>
                <div className="profile-media-copy">
                  <strong>Page background image</strong>
                  <p>Use an image for the full profile page canvas. Your cover photo remains inside the profile header. JPG, PNG, WebP, or GIF up to 4 MB.</p>
                  <button type="button" className="profile-upload-trigger" onClick={() => backgroundInputRef.current?.click()}>Upload page background image</button>
                  <input ref={backgroundInputRef} id={`${id}-background-upload`} className="profile-upload-input" aria-label="Upload page background image" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseProfileMedia(event, "background")} />
                  <p className="profile-media-selection" role="status">{backgroundFile ? `${backgroundFile.name} selected` : appearance.background.imageUrl ? "Page background image saved" : "No page background image selected"}</p>
                  <button type="button" className="profile-inline-action" onClick={() => { clearPendingBackgroundImage(); setAppearance((current) => ({ ...current, background: getBackgroundImageFallback(current.background) })); setBackgroundDisplayUrl(null); setMediaMessage("Page background image will be removed when you save."); }} disabled={!appearance.background.imageUrl && !backgroundFile}>Remove page background image</button>
                </div>
              </div>
              <fieldset className="profile-option-group"><legend>Visual style</legend><div className="profile-option-row">{(["minimal", "soft", "glass", "bold"] as ProfileVisualStyle[]).map((style) => <OptionButton key={style} label={style[0].toUpperCase() + style.slice(1)} selected={appearance.visualStyle === style} onClick={() => setAppearance((current) => updateAppearance(current, "visualStyle", style))} />)}</div></fieldset>
              <fieldset className="profile-option-group"><legend>Card shape</legend><div className="profile-option-row">{(["square", "rounded", "pill-soft"] as ProfileCardShape[]).map((shape) => <OptionButton key={shape} label={shape === "pill-soft" ? "Soft / Pill" : shape[0].toUpperCase() + shape.slice(1)} selected={appearance.cardShape === shape} onClick={() => setAppearance((current) => updateAppearance(current, "cardShape", shape))} />)}</div></fieldset>
              <fieldset className="profile-option-group"><legend>Accent</legend><div className="profile-option-row">{(["mint", "emerald", "blue", "violet", "amber", "neutral"] as ProfileAccent[]).map((accent) => <OptionButton key={accent} label={accent[0].toUpperCase() + accent.slice(1)} swatchClass={`profile-option-swatch-accent-${accent}`} selected={appearance.accent === accent} onClick={() => setAppearance((current) => updateAppearance(current, "accent", accent))} />)}</div></fieldset>
              <fieldset className="profile-option-group"><legend>Text alignment</legend><div className="profile-option-row">{(["left", "center"] as ProfileTextAlignment[]).map((alignment) => <OptionButton key={alignment} label={alignment[0].toUpperCase() + alignment.slice(1)} selected={appearance.textAlignment === alignment} onClick={() => setAppearance((current) => updateAppearance(current, "textAlignment", alignment))} />)}</div></fieldset>
              <fieldset className="profile-option-group"><legend>Content width</legend><div className="profile-option-row">{(["compact", "standard", "wide"] as ProfileContentWidth[]).map((width) => <OptionButton key={width} label={width[0].toUpperCase() + width.slice(1)} selected={appearance.contentWidth === width} onClick={() => setAppearance((current) => updateAppearance(current, "contentWidth", width))} />)}</div></fieldset>
              </section>
            ) : null}

            {selectedEditorCategory === "privacy" ? (
              <section className="profile-control-panel" aria-labelledby={`${id}-privacy-heading`}>
              <div className="profile-control-heading"><span className="profile-section-kicker">Privacy</span><h3 id={`${id}-privacy-heading`}>Public details</h3></div>
              <p className="profile-control-copy">Older profiles stay private by default. Choose only the details you want to show on your profile.</p>
              <div className="profile-visibility-options">
                <label className="profile-visibility-option"><input type="checkbox" checked={visibility.showAge} onChange={(event) => setVisibility((current) => ({ ...current, showAge: event.target.checked }))} /><span><strong>Show age</strong><small>Your exact date of birth stays private.</small></span></label>
                <label className="profile-visibility-option"><input type="checkbox" checked={visibility.showLocation} onChange={(event) => setVisibility((current) => ({ ...current, showLocation: event.target.checked }))} /><span><strong>Show location</strong><small>Show your country on your public profile.</small></span></label>
              </div>
              </section>
            ) : null}

            {selectedEditorCategory === "account" ? (
              <section className="profile-control-panel" aria-labelledby={`${id}-account-heading`}>
                <div className="profile-control-heading"><span className="profile-section-kicker">Account</span><h3 id={`${id}-account-heading`}>Private account details</h3></div>
                <p className="profile-control-copy">These details stay private. Your email is read-only.</p>
                <div className="profile-field-grid">
                  {profileField("First name", "first_name", firstName, setFirstName, { maxLength: 120 })}
                  {profileField("Middle name", "middle_name", middleName, setMiddleName, { maxLength: 120 })}
                  {profileField("Last name", "last_name", lastName, setLastName, { maxLength: 120 })}
                  {profileField("Suffix", "suffix", suffix, setSuffix, { maxLength: 120 })}
                  {profileField("Date of birth", "date_of_birth", dateOfBirth, setDateOfBirth, { type: "date" })}
                  <label className="profile-field" htmlFor={`${id}-email`}><span>Email</span><input id={`${id}-email`} type="email" value={profile.email} readOnly aria-readonly="true" /><span className="profile-field-hint">Email changes are not available from this page.</span></label>
                </div>
                <div className="profile-account-meta"><span>Member since <time dateTime={profile.created_at}>{formattedMemberSince}</time></span></div>
              </section>
            ) : null}

            {!isAccountEditorCategory && mediaMessage ? <p className="profile-local-media-message" role="status">{mediaMessage}</p> : null}
            {isAccountEditorCategory ? accountError ? <p className="profile-error" role="alert">{accountError}</p> : null : appearanceError ? <p className="profile-error" role="alert">{appearanceError}</p> : null}
            {isAccountEditorCategory ? accountSuccess ? <p className="profile-success" role="status">{accountSuccess}</p> : null : appearanceSuccess ? <p className="profile-success" role="status">{appearanceSuccess}</p> : null}
            <div className="profile-form-actions">
              <button
                type="submit"
                className="profile-save-button"
                disabled={isAccountEditorCategory ? accountSubmitting || !accountDirty : appearanceSubmitting || !publicProfileDirty}
                aria-busy={isAccountEditorCategory ? accountSubmitting : appearanceSubmitting}
              >
                {isAccountEditorCategory ? accountSubmitting ? "Saving account…" : "Save account information" : appearanceSubmitting ? "Saving public profile…" : "Save public profile"}
              </button>
              <p className="profile-form-note">
                {isAccountEditorCategory
                  ? accountDirty ? "Account changes are ready to save." : "Your account details are up to date."
                  : publicProfileDirty ? "Public profile changes are ready to save." : "Your saved public profile is shown in the preview."}
              </p>
            </div>
          </form>
          )}
        </div>
      </section>

    </section>
  );
}
