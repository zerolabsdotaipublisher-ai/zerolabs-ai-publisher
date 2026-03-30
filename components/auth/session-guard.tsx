"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { useAuth } from "@/providers/auth-provider";

/**
 * SessionGuard — client component that watches auth status and enforces
 * redirect rules when a session expires or enters an error state.
 *
 * Render inside any layout that wraps protected pages.  It has no visible
 * output; it exists purely for its side-effect (redirect on expiry/error).
 *
 * Multi-tab logout is handled automatically: Supabase fires an
 * `onAuthStateChange` SIGNED_OUT event in all open tabs via its built-in
 * BroadcastChannel, which sets status to "expired" here, triggering the
 * redirect in every tab simultaneously.
 */
export function SessionGuard() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    if (status === "expired" || status === "error") {
      if (mounted) {
        router.replace(routes.login);
      }
    }

    return () => {
      mounted = false;
    };
  }, [status, router]);

  return null;
}
