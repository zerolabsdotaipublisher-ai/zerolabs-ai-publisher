"use client";

import { useState, useId, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseAppUrl, getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { routes } from "@/config/routes";

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
  return "Something went wrong. Please try again.";
}

function validateRegistration(email: string, password: string, confirmPassword: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
}

export function SignUpForm() {
  const id = useId();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorId = `${id}-error`;
  const passwordHintId = `${id}-password-hint`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validateRegistration(email, password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() !== "" ? fullName.trim() : undefined },
        emailRedirectTo: `${getSupabaseAppUrl()}${routes.authCallback}`,
      },
    });

    if (signUpError) {
      setError(mapSignUpError(signUpError.message));
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setIsSubmitting(false);
    router.replace(`${routes.login}?message=check_email`);
    router.refresh();
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
          aria-describedby={error ? errorId : undefined}
        />
      </label>

      <label htmlFor={`${id}-password`}>
        Password <span aria-hidden="true">*</span>
        <input
          id={`${id}-password`}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          aria-required="true"
          aria-describedby={error ? errorId : passwordHintId}
        />
      </label>
      <span id={passwordHintId} className="auth-field-hint">
        Minimum 8 characters
      </span>

      <label htmlFor={`${id}-confirm`}>
        Confirm password <span aria-hidden="true">*</span>
        <input
          id={`${id}-confirm`}
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          aria-required="true"
          aria-describedby={error ? errorId : undefined}
        />
      </label>

      {error ? (
        <p id={errorId} className="auth-error" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="auth-success" role="status">
          Account created. Check your email to confirm, then sign in.
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
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
