"use client";

import { useId, useState, type FormEvent } from "react";
import { routes } from "@/config/routes";
import { getSupabaseAppUrl, getSupabaseBrowserClient } from "@/lib/supabase/browser";

function isValidEmail(value: string): boolean {
  if (typeof document === "undefined") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.value = value;
  return emailInput.checkValidity();
}

function mapResetRequestError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "We could not send the reset link right now. Please wait a moment and try again.";
  }

  if (lower.includes("failed to fetch")) {
    return "We could not send the reset link. Please check your connection and try again.";
  }

  return "We could not send the reset link. Please check your connection and try again.";
}

export function ForgotPasswordForm() {
  const id = useId();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();

    if (!confirmedEmail) {
      if (!trimmedEmail) {
        setError("Email is required.");
        return;
      }

      if (!isValidEmail(trimmedEmail)) {
        setError("Please enter a valid email address.");
        return;
      }

      setConfirmedEmail(trimmedEmail);
      return;
    }

    setIsSubmitting(true);

    try {
      const redirectTo = `${getSupabaseAppUrl()}${routes.resetPassword}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(confirmedEmail, { redirectTo });

      if (resetError) {
        setError(mapResetRequestError(resetError.message));
        return;
      }

      setMessage("If an account exists for this email, a reset link has been sent.");
      setConfirmedEmail(null);
      setEmail("");
    } catch {
      setError("We could not send the reset link. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} aria-label="Forgot password" noValidate>
      <h1>Forgot password</h1>

      {confirmedEmail ? (
        <div className="auth-confirmation-card">
          <p className="auth-confirmation-copy">
            Send reset link to <strong>{confirmedEmail}</strong>?
          </p>
          <p className="auth-field-hint">Password reset links are sent by email.</p>
          <div className="auth-button-stack">
            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? "Sending…" : "Yes, send reset link"}
            </button>
            <button
              type="button"
              className="auth-secondary-button"
              disabled={isSubmitting}
              onClick={() => {
                setConfirmedEmail(null);
                setError(null);
              }}
            >
              Use different email
            </button>
          </div>
        </div>
      ) : (
        <>
          <label htmlFor={`${id}-email`}>
            Email
            <input
              id={`${id}-email`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              aria-describedby={error ? `${helperId} ${errorId}` : helperId}
            />
          </label>
          <span id={helperId} className="auth-field-hint">
            Password reset links are sent by email.
          </span>
          <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            Continue
          </button>
        </>
      )}

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
    </form>
  );
}
