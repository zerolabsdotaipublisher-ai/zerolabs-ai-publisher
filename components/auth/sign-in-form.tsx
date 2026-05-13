"use client";

import { useId, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PasswordField } from "@/components/auth/password-field";
import { resolveSafeNextPath } from "@/lib/auth/redirect";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function resolveInitialState(searchParams: ReturnType<typeof useSearchParams>): {
  initialMessage: string | null;
  initialError: string | null;
} {
  if (searchParams.get("message") === "check_email") {
    return {
      initialMessage: "Account created. Check your email to confirm your account, then sign in.",
      initialError: null,
    };
  }

  if (searchParams.get("error") === "callback_failed") {
    return {
      initialMessage: null,
      initialError: "Authentication failed. Please try signing in again.",
    };
  }

  return {
    initialMessage: null,
    initialError: null,
  };
}

function validateSignIn(email: string, password: string): string | null {
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

  return null;
}

function mapSignInError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Invalid email or password. Please try again.";
  }

  if (lower.includes("email not confirmed")) {
    return "Your email has not been confirmed. Check your inbox for the confirmation link.";
  }

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many sign-in attempts. Please wait a moment and try again.";
  }

  if (lower.includes("failed to fetch")) {
    return "Unable to sign in right now. Please check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}

export function SignInForm() {
  const id = useId();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const { initialMessage, initialError } = resolveInitialState(searchParams);
  const nextPath = resolveSafeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorId = `${id}-error`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const validationError = validateSignIn(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(mapSignInError(signInError.message));
        return;
      }

      window.location.replace(nextPath);
    } catch {
      setError("Unable to sign in right now. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} aria-label="Sign in" noValidate>
      <h1>Sign in</h1>

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
        autoComplete="current-password"
        aria-required="true"
        aria-describedby={error ? errorId : undefined}
      />

      {error ? (
        <p id={errorId} className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="auth-success" role="status">
          {message}
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {isSubmitting ? "Signing in, please wait." : ""}
      </span>
    </form>
  );
}
