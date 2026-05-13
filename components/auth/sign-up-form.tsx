"use client";

import { useId, useState, type FormEvent } from "react";
import { routes } from "@/config/routes";
import { PasswordField } from "@/components/auth/password-field";
import { getSupabaseAppUrl, getSupabaseBrowserClient } from "@/lib/supabase/browser";

function validateRegistration(email: string, password: string, confirmPassword: string): string | null {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return "Email is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return "Please enter a valid email address.";
  }

  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!confirmPassword) {
    return "Please confirm your password.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

function mapSignUpError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (
    lower.includes("password should be") ||
    lower.includes("password is too short") ||
    lower.includes("password must be")
  ) {
    return "Password must be at least 8 characters.";
  }

  if (
    lower.includes("invalid email") ||
    lower.includes("invalid format") ||
    lower.includes("unable to validate email")
  ) {
    return "Please enter a valid email address.";
  }

  if (lower.includes("rate limit") || lower.includes("too many requests") || lower.includes("email rate limit")) {
    return "Too many sign-up attempts. Please wait a moment and try again.";
  }

  if (lower.includes("failed to fetch")) {
    return "Unable to create your account right now. Please check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}

export function SignUpForm() {
  const id = useId();
  const supabase = getSupabaseBrowserClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorId = `${id}-error`;
  const passwordHintId = `${id}-password-hint`;
  const passwordMismatchError = confirmPassword && password !== confirmPassword ? "Passwords do not match." : null;
  const displayedError = error ?? passwordMismatchError;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateRegistration(email, password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim() ? fullName.trim() : undefined,
          },
          emailRedirectTo: `${getSupabaseAppUrl()}${routes.authCallback}`,
        },
      });

      if (signUpError) {
        setError(mapSignUpError(signUpError.message));
        return;
      }

      setSuccess(true);
      window.location.assign(`${routes.login}?message=check_email`);
    } catch {
      setError("Unable to create your account right now. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} aria-label="Create account" noValidate>
      <h1>Create account</h1>

      <label htmlFor={`${id}-name`}>
        Full name
        <input
          id={`${id}-name`}
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          autoCapitalize="words"
        />
      </label>

      <label htmlFor={`${id}-email`}>
        Email <span aria-hidden="true">*</span>
        <input
          id={`${id}-email`}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          aria-required="true"
          aria-describedby={displayedError ? errorId : undefined}
        />
      </label>

      <PasswordField
        id={`${id}-password`}
        label={
          <>
            Password <span aria-hidden="true">*</span>
          </>
        }
        toggleLabel="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        autoComplete="new-password"
        minLength={8}
        aria-required="true"
        aria-describedby={displayedError ? errorId : passwordHintId}
      />
      <span id={passwordHintId} className="auth-field-hint">
        Minimum 8 characters
      </span>

      <PasswordField
        id={`${id}-confirm-password`}
        label={
          <>
            Confirm password <span aria-hidden="true">*</span>
          </>
        }
        toggleLabel="confirm password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
        autoComplete="new-password"
        minLength={8}
        aria-required="true"
        aria-describedby={displayedError ? errorId : undefined}
      />

      {displayedError ? (
        <p id={errorId} className="auth-error" role="alert">
          {displayedError}
        </p>
      ) : null}
      {success ? (
        <p className="auth-success" role="status">
          Account created. Check your email to confirm, then sign in.
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting || Boolean(passwordMismatchError)} aria-busy={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {isSubmitting ? "Submitting registration, please wait." : ""}
      </span>

      <p className="auth-terms-notice">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
