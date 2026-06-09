import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { resolvePostLoginRedirectPath } from "@/lib/auth/redirect";
import { createFallbackProfile, getSafeProfile } from "@/lib/supabase/profile";
import { getServerUser } from "@/lib/supabase/server";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Zero Labs AI Publisher.",
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const queryParams = searchParams ? await searchParams : {};
  const nextParam = typeof queryParams.next === "string" ? queryParams.next : null;
  const user = await getServerUser();

  if (user) {
    const profile = await getSafeProfile(user).catch(() => createFallbackProfile(user));
    redirect(resolvePostLoginRedirectPath(nextParam, profile.role === "admin"));
  }

  return (
    <>
      <Suspense fallback={<p>Loading...</p>}>
        <SignInForm />
      </Suspense>
      <p className="auth-link-row">
        <Link href={routes.signup}>Create account</Link>
        <span> · </span>
        <Link href={routes.forgotPassword}>Forgot password?</Link>
      </p>
    </>
  );
}
