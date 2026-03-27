"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Password updated. You can now sign in.");
    setIsSubmitting(false);
    router.replace(routes.login);
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h1>Reset password</h1>
      <label>
        New password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
        />
      </label>
      <label>
        Confirm new password
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
        />
      </label>
      {error ? <p className="auth-error">{error}</p> : null}
      {message ? <p className="auth-success">{message}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
