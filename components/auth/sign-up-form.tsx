"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { PasswordField } from "@/components/auth/password-field";
import { routes } from "@/config/routes";
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
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorId = `${id}-error`;
  const passwordHintId = `${id}-password-hint`;
  const passwordMismatchError = confirmPassword && password !== confirmPassword ? "Passwords do not match." : null;
  const displayedError = error ?? passwordMismatchError;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmittedEmail(null);
    const validationError = validateRegistration(email, password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedFullName = fullName.trim();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedFullName || undefined,
          },
          emailRedirectTo: `${getSupabaseAppUrl()}${routes.authCallback}?next=${encodeURIComponent(routes.login)}`,
        },
      });

      if (signUpError) {
        setError(mapSignUpError(signUpError.message));
        return;
      }

      if (data.session) {
        await supabase.auth.signOut();
      }

      setPassword("");
      setConfirmPassword("");
      setSubmittedEmail(trimmedEmail);
    } catch {
      setError("Unable to create your account right now. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <section className="auth-form" aria-label="Account created">
        <h1>Check your email</h1>
        <div className="auth-confirmation-card">
          <p className="auth-success" role="status">
            Account created. Please check your email to verify your account before signing in.
          </p>
          <p className="auth-confirmation-copy">
            Verification email sent to <strong>{submittedEmail}</strong>.
          </p>
          <p className="auth-field-hint">After verifying your email, return here to sign in.</p>
          <div className="auth-button-stack">
            <Link href={routes.login} className="auth-inline-link-button">
              Go to login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} aria-label="Create account" noValidate>
      <h1>Create account</h1>
      <p className="auth-field-hint">Email, password, and password confirmation are required.</p>

      <label htmlFor={`${id}-name`}>
        Full name
        <input
          id={`${id}-name`}
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          autoCapitalize="words"
          placeholder="Example: Razon Umali"
        />
      </label>

      <label htmlFor={`${id}-email`}>
        Email
        <input
          id={`${id}-email`}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          aria-required="true"
          aria-describedby={displayedError ? errorId : undefined}
          placeholder="Example: name@email.com"
        />
      </label>

      <PasswordField
        id={`${id}-password`}
        label="Password"
        toggleLabel="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        autoComplete="new-password"
        minLength={8}
        aria-required="true"
        aria-describedby={displayedError ? errorId : passwordHintId}
        placeholder="Minimum 8 characters"
      />
      <span id={passwordHintId} className="auth-field-hint">
        Minimum 8 characters
      </span>

      <PasswordField
        id={`${id}-confirm-password`}
        label="Confirm password"
        toggleLabel="confirm password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
        autoComplete="new-password"
        minLength={8}
        aria-required="true"
        aria-describedby={displayedError ? errorId : undefined}
        placeholder="Re-enter your password"
      />

      {displayedError ? (
        <p id={errorId} className="auth-error" role="alert">
          {displayedError}
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
