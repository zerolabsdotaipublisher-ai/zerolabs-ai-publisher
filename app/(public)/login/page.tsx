import { Suspense } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function LoginPage() {
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
