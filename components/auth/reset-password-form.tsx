"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/password-field";
import { routes } from "@/config/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const REDIRECT_DELAY_AFTER_SUCCESS = 1200;

function readResetLinkError(searchParams: URLSearchParams, hashParams: URLSearchParams): string | null {
  const error = searchParams.get("error") ?? hashParams.get("error");
  const errorCode = searchParams.get("error_code") ?? hashParams.get("error_code");
  const rawDescription = searchParams.get("error_description") ?? hashParams.get("error_description") ?? "";
  const description = (() => {
    try {
      return decodeURIComponent(rawDescription).toLowerCase();
    } catch {
      return rawDescription.toLowerCase();
    }
  })();

  if (
    error === "access_denied" ||
    errorCode === "otp_expired" ||
    description.includes("expired") ||
    description.includes("invalid")
  ) {
    return "This reset link is invalid or expired. Please request a new password reset link.";
  }

  return null;
}

function validateResetPassword(password: string, confirmPassword: string): string | null {
  if (!password) {
    return "New password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!confirmPassword) {
    return "Please confirm your new password.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

function mapUpdateError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("otp_expired") ||
    lower.includes("expired") ||
    lower.includes("invalid") ||
    lower.includes("access denied")
  ) {
    return "This reset link has expired.";
  }

  if (lower.includes("failed to fetch") || lower.includes("session") || lower.includes("auth")) {
    return "Password update failed. Please request a new reset link.";
  }

  return "Password update failed. Please request a new reset link.";
}

export function ResetPasswordForm() {
  const id = useId();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const redirectTimeoutRef = useRef<number | null>(null);
  const invalidLinkMessage = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return readResetLinkError(
      new URLSearchParams(window.location.search),
      new URLSearchParams(window.location.hash.replace(/^#/, "")),
    );
  }, []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorId = `${id}-error`;
  const passwordHintId = `${id}-password-hint`;
  const passwordMismatchError = confirmPassword && password !== confirmPassword ? "Passwords do not match." : null;
  const displayedError = error ?? passwordMismatchError;

  useEffect(() => {
    if (invalidLinkMessage && typeof window !== "undefined" && (window.location.search || window.location.hash)) {
      window.history.replaceState(null, "", routes.resetPassword);
    }
  }, [invalidLinkMessage]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const validationError = validateResetPassword(password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(mapUpdateError(updateError.message));
        return;
      }

      setMessage("Password updated successfully. Redirecting to sign in…");
      await Promise.allSettled([supabase.auth.signOut(), fetch("/api/auth/sign-out", { method: "POST" })]);
      redirectTimeoutRef.current = window.setTimeout(() => {
        router.replace(routes.login);
      }, REDIRECT_DELAY_AFTER_SUCCESS);
    } catch {
      setError("Password update failed. Please request a new reset link.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (invalidLinkMessage) {
    return (
      <div className="auth-form" aria-live="polite">
        <h1>Reset password</h1>
        <p className="auth-error" role="alert">
          {invalidLinkMessage}
        </p>
        <Link href={routes.forgotPassword} className="auth-inline-link-button">
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} aria-label="Reset password" noValidate>
      <h1>Reset password</h1>

      <PasswordField
        id={`${id}-password`}
        label="New password"
        toggleLabel="new password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        autoComplete="new-password"
        minLength={8}
        aria-describedby={displayedError ? errorId : passwordHintId}
      />
      <span id={passwordHintId} className="auth-field-hint">
        Minimum 8 characters
      </span>

      <PasswordField
        id={`${id}-confirm-password`}
        label="Confirm new password"
        toggleLabel="confirm new password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
        autoComplete="new-password"
        minLength={8}
        aria-describedby={displayedError ? errorId : undefined}
      />

      {displayedError ? (
        <p id={errorId} className="auth-error" role="alert">
          {displayedError}
        </p>
      ) : null}
      {message ? (
        <p className="auth-success" role="status">
          {message}
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting || Boolean(passwordMismatchError)} aria-busy={isSubmitting}>
        {isSubmitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
