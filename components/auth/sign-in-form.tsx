"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { routes } from "@/config/routes";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    searchParams.get("message") === "check_email"
      ? "Account created. Check your email to confirm your account, then sign in."
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = searchParams.get("next") || routes.dashboard;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h1>Sign in</h1>
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
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="auth-error">{error}</p> : null}
      {message ? <p className="auth-success">{message}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
