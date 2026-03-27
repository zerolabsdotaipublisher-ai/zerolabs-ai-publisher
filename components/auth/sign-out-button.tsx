"use client";

import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";

export function SignOutButton() {
  const router = useRouter();

  async function onSignOut() {
    const response = await fetch("/api/auth/sign-out", { method: "POST" });

    if (response.ok) {
      router.replace(routes.login);
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={onSignOut}>
      Sign out
    </button>
  );
}
