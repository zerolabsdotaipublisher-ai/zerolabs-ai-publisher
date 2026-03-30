"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });

      if (response.ok) {
        // Replace history entry so the back-button does not return to a
        // protected page.  Then refresh to clear server-side session state.
        router.replace(routes.login);
        router.refresh();
      }
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <button type="button" onClick={onSignOut} disabled={signingOut} aria-busy={signingOut}>
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
