import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { resolvePostLoginRedirectPath } from "@/lib/auth/redirect";
import { createFallbackProfile, getSafeProfile } from "@/lib/supabase/profile";
import { getServerUser } from "@/lib/supabase/server";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Zero Labs AI Publisher account.",
};

export default async function SignUpPage() {
  const user = await getServerUser();
  if (user) {
    const profile = await getSafeProfile(user).catch(() => createFallbackProfile(user));
    redirect(resolvePostLoginRedirectPath(null, profile.role === "admin"));
  }

  return (
    <>
      <SignUpForm />
      <p className="auth-link-row">
        Already have an account? <Link href={routes.login}>Sign in</Link>
      </p>
    </>
  );
}
