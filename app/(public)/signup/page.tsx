import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/config/routes";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Zero Labs AI Publisher account.",
};

export default function SignUpPage() {
  return (
    <>
      <SignUpForm />
      <p className="auth-link-row">
        Already have an account? <Link href={routes.login}>Sign in</Link>
      </p>
    </>
  );
}
