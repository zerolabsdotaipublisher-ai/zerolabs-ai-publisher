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
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
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
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedFullName || undefined,
            first_name: firstName.trim() || undefined,
            middle_name: middleName.trim() || undefined,
            last_name: lastName.trim() || undefined,
            suffix: suffix.trim() || undefined,
            username: username.trim() || undefined,
            country: country.trim() || undefined,
            date_of_birth: dateOfBirth || undefined,
            avatar_url: avatarUrl.trim() || undefined,
          },
          emailRedirectTo: `${getSupabaseAppUrl()}${routes.authCallback}`,
        },
      });

      if (signUpError) {
        setError(mapSignUpError(signUpError.message));
        return;
      }

      if (signUpData.session) {
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
          placeholder="Example: Maria Santos"
        />
      </label>

      <label htmlFor={`${id}-first-name`}>
        First name
        <input
          id={`${id}-first-name`}
          type="text"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          autoComplete="given-name"
          autoCapitalize="words"
        />
      </label>

      <label htmlFor={`${id}-middle-name`}>
        Middle name
        <input
          id={`${id}-middle-name`}
          type="text"
          value={middleName}
          onChange={(event) => setMiddleName(event.target.value)}
          autoComplete="additional-name"
          autoCapitalize="words"
        />
      </label>

      <label htmlFor={`${id}-last-name`}>
        Last name
        <input
          id={`${id}-last-name`}
          type="text"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          autoComplete="family-name"
          autoCapitalize="words"
        />
      </label>

      <label htmlFor={`${id}-suffix`}>
        Suffix
        <input
          id={`${id}-suffix`}
          type="text"
          value={suffix}
          onChange={(event) => setSuffix(event.target.value)}
          autoComplete="honorific-suffix"
          autoCapitalize="words"
        />
      </label>

      <label htmlFor={`${id}-username`}>
        Username
        <input
          id={`${id}-username`}
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
        />
      </label>

      <label htmlFor={`${id}-country`}>
        Country
        <input
          id={`${id}-country`}
          type="text"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          autoComplete="country-name"
          autoCapitalize="words"
        />
      </label>

      <label htmlFor={`${id}-dob`}>
        Date of Birth
        <input
          id={`${id}-dob`}
          type="date"
          value={dateOfBirth}
          onChange={(event) => setDateOfBirth(event.target.value)}
          autoComplete="bday"
        />
      </label>

      <label htmlFor={`${id}-avatar`}>
        Avatar URL (optional)
        <input
          id={`${id}-avatar`}
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          autoComplete="url"
          inputMode="url"
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
          placeholder="Example: maria@company.com"
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
        placeholder="Create a secure password"
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
        placeholder="Confirm your password"
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
