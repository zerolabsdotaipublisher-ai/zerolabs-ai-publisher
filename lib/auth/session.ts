import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

/**
 * Represents the current state of the user session.
 *
 * - `"loading"`        — auth state is being resolved (initial render, tab restore)
 * - `"authenticated"`  — user has a valid, active session
 * - `"unauthenticated"` — no session present (never logged in or explicitly signed out)
 * - `"expired"`        — a previously active session was revoked or its refresh token expired
 * - `"error"`          — session state could not be determined due to an unexpected error
 */
export type SessionStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "expired"
  | "error";

/**
 * Derives a `SessionStatus` from a Supabase auth change event plus the
 * session that arrived with the event.
 *
 * The `hadSession` flag indicates whether the provider previously held an
 * active session. When a SIGNED_OUT event arrives while a session was active,
 * the status is set to `"expired"` (covers token expiry and server-side
 * revocation).  An explicit user-initiated sign-out goes through the
 * `/api/auth/sign-out` endpoint and then a client-side redirect, so the
 * SIGNED_OUT event seen during normal logout is also correct to map as
 * `"expired"` — the UI redirects away before the state is visible.
 */
export function deriveSessionStatus(
  event: AuthChangeEvent,
  session: Session | null,
  hadSession: boolean,
): SessionStatus {
  switch (event) {
    case "INITIAL_SESSION":
      return session ? "authenticated" : "unauthenticated";

    case "SIGNED_IN":
    case "TOKEN_REFRESHED":
    case "USER_UPDATED":
    case "MFA_CHALLENGE_VERIFIED":
      return session ? "authenticated" : "unauthenticated";

    case "SIGNED_OUT":
      // If we had an active session and it disappeared without an explicit
      // sign-out initiated by the user (e.g. refresh token expired, admin
      // revocation, or another tab signed out), surface this as "expired" so
      // the UI can show a contextual message rather than a blank login screen.
      //
      // For user-initiated sign-out (via SignOutButton → /api/auth/sign-out),
      // the client calls router.replace(routes.login) immediately after the
      // server responds, so the "expired" status is replaced by a page
      // navigation before any component can observe it. The mapping is
      // therefore safe for both explicit and implicit sign-out paths.
      return hadSession ? "expired" : "unauthenticated";

    case "PASSWORD_RECOVERY":
      return session ? "authenticated" : "unauthenticated";

    default:
      return session ? "authenticated" : "unauthenticated";
  }
}
