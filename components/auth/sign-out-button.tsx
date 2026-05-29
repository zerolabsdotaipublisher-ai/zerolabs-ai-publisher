"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";

interface SignOutButtonProps {
  className?: string;
  containerClassName?: string;
  errorClassName?: string;
}

export function SignOutButton({ className, containerClassName, errorClassName }: SignOutButtonProps = {}) {
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
    <div className={containerClassName}>
      <button type="button" onClick={onSignOut} disabled={signingOut} aria-busy={signingOut} className={className}>
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p role="alert" className={errorClassName ?? "auth-error"}>
          {error}
        </p>
      )}
    </div>
  );
}
