import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

function ResetPasswordLoadingState() {
  return (
    <div className="auth-form" aria-live="polite">
      <h1>Reset password</h1>
      <p className="auth-field-hint">Preparing a secure password reset session…</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoadingState />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
