"use client";

import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function PasswordForm({ id }: { id: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const errorId = `${id}-password-error`;
  const successId = `${id}-password-success`;

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
    } catch {
      setError("Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDirty = newPassword.length > 0 || confirmPassword.length > 0;

  return (
    <form onSubmit={handlePasswordSubmit}>
      <div className="profile-field-grid">
        <label className="profile-field" htmlFor={`${id}-new-password`}>
          <span>New Password</span>
          <input
            id={`${id}-new-password`}
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>

        <label className="profile-field" htmlFor={`${id}-confirm-password`}>
          <span>Confirm Password</span>
          <input
            id={`${id}-confirm-password`}
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
      </div>

      <div className="profile-form-feedback">
        {error ? (
          <p id={errorId} className="profile-error" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p id={successId} className="profile-success" role="status">
            {success}
          </p>
        ) : null}
      </div>

      <div className="profile-form-actions">
        <button
          type="submit"
          className="profile-save-button"
          disabled={isSubmitting || !isDirty}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </div>
    </form>
  );
}
