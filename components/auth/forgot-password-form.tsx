"use client";

import { useId, useState, type FormEvent } from "react";
import { routes } from "@/config/routes";
import { getSupabaseAppUrl, getSupabaseBrowserClient } from "@/lib/supabase/browser";

let emailInputValidator: HTMLInputElement | null = null;

function isValidEmail(value: string): boolean {
  if (typeof document === "undefined") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  const emailInput = emailInputValidator ?? document.createElement("input");
  emailInputValidator = emailInput;
  emailInput.type = "email";
  emailInput.value = value;
  return emailInput.checkValidity();
}

function mapResetRequestError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("failed to fetch")) {
    return "We could not send the reset link. Please check your connection and try again.";
  }

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "We could not send the reset link right now. Please wait a moment and try again.";
  }

  return "We could not send the reset link. Please check your connection and try again.";
}

export function ForgotPasswordForm() {
  const id = useId();
  const supabase = getSupabaseBrowserClient();

  const [identifier, setIdentifier] = useState("");
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmedIdentifier = identifier.trim();

    if (!confirmedEmail) {
      if (!trimmedIdentifier) {
        setError("Email is required.");
        return;
      }

      if (!isValidEmail(trimmedIdentifier)) {
        setError("Enter the email address for your account. Password reset links are sent by email.");
        return;
      }

      setConfirmedEmail(trimmedIdentifier);
      return;
    }

    setIsSubmitting(true);

    try {
      const redirectTo = `${getSupabaseAppUrl()}${routes.resetPassword}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(confirmedEmail, { redirectTo });

      if (resetError) {
        setError(mapResetRequestError(resetError.message));
        setIsSubmitting(false);
        return;
      }

      setMessage("If an account exists for this email, a reset link has been sent.");
      setConfirmedEmail(null);
      setIdentifier("");
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
              onClick={() => {
                setConfirmedEmail(null);
                setError(null);
              }}
              disabled={isSubmitting}
            >
              Use different email
            </button>
          </div>
        </div>
      ) : (
        <>
          <label htmlFor={`${id}-identifier`}>
            Email or username
            <input
              id={`${id}-identifier`}
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              autoComplete="username"
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
