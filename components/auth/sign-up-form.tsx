"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseAppUrl, getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { routes } from "@/config/routes";

export function SignUpForm() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${getSupabaseAppUrl()}${routes.authCallback}`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.replace(`${routes.login}?message=check_email`);
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h1>Create account</h1>
      <label>
        Full name
        <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} />
      </label>
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
          autoComplete="new-password"
          minLength={8}
        />
      </label>
      {error ? <p className="auth-error">{error}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
