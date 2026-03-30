"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });

      if (response.ok) {
        // Replace history entry so the back-button does not return to a
        // protected page.  Then refresh to clear server-side session state.
        router.replace(routes.login);
        router.refresh();
      } else {
        setError("Sign out failed. Please try again.");
      }
    } catch {
      setError("Sign out failed. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <button type="button" onClick={onSignOut} disabled={signingOut} aria-busy={signingOut}>
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
    </>
  );
}
