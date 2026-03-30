import Link from "next/link";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { getServerUser } from "@/lib/supabase/server";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage() {
  const user = await getServerUser();
  if (user) {
    redirect(routes.dashboard);
  }

  return (
    <>
      <ForgotPasswordForm />
      <p className="auth-link-row">
        <Link href={routes.login}>Back to sign in</Link>
      </p>
    </>
  );
}
