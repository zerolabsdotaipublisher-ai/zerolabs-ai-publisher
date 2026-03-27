"use client";

import { useState, type FormEvent } from "react";
import { routes } from "@/config/routes";
import { getSupabaseAppUrl, getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ForgotPasswordForm() {
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    const redirectTo = `${getSupabaseAppUrl()}${routes.resetPassword}`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (resetError) {
      setError(resetError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("If the account exists, a reset link has been sent.");
    setIsSubmitting(false);
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h1>Forgot password</h1>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />
      </label>
      {error ? <p className="auth-error">{error}</p> : null}
      {message ? <p className="auth-success">{message}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
