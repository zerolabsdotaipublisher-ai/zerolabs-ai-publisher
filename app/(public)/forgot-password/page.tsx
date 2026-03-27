import Link from "next/link";
import { routes } from "@/config/routes";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <ForgotPasswordForm />
      <p className="auth-link-row">
        <Link href={routes.login}>Back to sign in</Link>
      </p>
    </>
  );
}
