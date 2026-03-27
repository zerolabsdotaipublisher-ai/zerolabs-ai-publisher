import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { getServerUser } from "@/lib/supabase/server";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Zero Labs AI Publisher.",
};

export default async function LoginPage() {
  const user = await getServerUser();
  if (user) {
    redirect(routes.dashboard);
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
