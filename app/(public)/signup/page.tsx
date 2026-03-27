import Link from "next/link";
import { routes } from "@/config/routes";
import { SignUpForm } from "@/components/auth/sign-up-form";

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
