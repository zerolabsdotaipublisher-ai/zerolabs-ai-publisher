"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  getSupabaseBrowserClient,
  initializeSupabaseBrowserClient,
  type SupabaseBrowserConfig,
} from "@/lib/supabase/browser";
import { deriveSessionStatus, type SessionStatus } from "@/lib/auth/session";

type AuthContextValue = {
  /** The current Supabase session, or null when unauthenticated / loading. */
  session: Session | null;
  /** The authenticated user, or null when unauthenticated / loading. */
  user: User | null;
  /**
   * True while the initial session is being resolved.
   * Prefer `status === "loading"` for conditional rendering.
   */
  loading: boolean;
  /**
   * Granular session status for UI branching.
   *
   * - `"loading"`         — auth state is resolving
   * - `"authenticated"`   — valid active session
   * - `"unauthenticated"` — no session (signed out / never signed in)
   * - `"expired"`         — previous session revoked or refresh token expired
   * - `"error"`           — unexpected error during session resolution
   */
  status: SessionStatus;
  /** Non-null when `status === "error"`. Contains the error message. */
  error: string | null;
  /** Manually re-fetch the current session and update provider state. */
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  supabaseConfig,
}: {
  children: ReactNode;
  supabaseConfig: SupabaseBrowserConfig;
}) {
  initializeSupabaseBrowserClient(supabaseConfig);
  const supabase = getSupabaseBrowserClient();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  // Track whether we currently hold an active session so that SIGNED_OUT
  // events can be distinguished from a cold-start unauthenticated state.
  const hadSessionRef = useRef(false);
  // Track the previous user ID to detect user switches for profile sync.
  const prevUserIdRef = useRef<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session: nextSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) {
        // Refresh failed — session is gone; mark as expired if we had one.
        setSession(null);
        setUser(null);
        setStatus(hadSessionRef.current ? "expired" : "unauthenticated");
        setError(null);
        hadSessionRef.current = false;
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
      setError(null);
      hadSessionRef.current = Boolean(nextSession);
    } catch {
      setStatus("error");
      setError("Session refresh failed. Please sign in again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    // ── Initial session restore ──────────────────────────────────────────────
    // getSession() reads the session from the in-memory Supabase client (which
    // is populated from cookies set by the server on every request via
    // lib/supabase/middleware.ts).  This covers:
    //   • First load
    //   • Browser refresh
    //   • Returning visit / tab reopen
    supabase.auth
      .getSession()
      .then(({ data: { session: nextSession } }) => {
        if (!mounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setStatus(nextSession ? "authenticated" : "unauthenticated");
        setError(null);
        hadSessionRef.current = Boolean(nextSession);
        prevUserIdRef.current = nextSession?.user?.id ?? null;
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setStatus("error");
        setError("Failed to restore session. Please sign in.");
        setLoading(false);
      });

    // ── Auth state change listener ───────────────────────────────────────────
    // Supabase uses a BroadcastChannel internally, so this listener fires in
    // all open tabs when auth state changes — providing multi-tab sync for
    // sign-in, sign-out, and token refresh without additional code.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      const nextStatus = deriveSessionStatus(event, nextSession, hadSessionRef.current);

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setStatus(nextStatus);
      setError(null);

      // Trigger profile sync when a different (or newly signed-in) user
      // appears. Fires after sign-in, OAuth callback, and magic-link confirm.
      if (nextSession?.user && nextSession.user.id !== prevUserIdRef.current) {
        fetch("/api/auth/profile-sync", { method: "POST" }).catch(() => undefined);
      }

      hadSessionRef.current = Boolean(nextSession);
      prevUserIdRef.current = nextSession?.user?.id ?? null;
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // Refs (hadSessionRef, prevUserIdRef) are stable across renders and are
    // intentionally excluded from this dependency array — they do not need to
    // trigger a re-subscription when their `.current` value changes.
  }, [supabase]);

  const value = useMemo(
    () => ({ session, user, loading, status, error, refreshSession }),
    [session, user, loading, status, error, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
