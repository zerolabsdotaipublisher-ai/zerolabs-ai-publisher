"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useState } from "react";

type PasswordFieldProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  label: ReactNode;
  toggleLabel?: string;
};

export function PasswordField({ label, toggleLabel = "password", className, ...inputProps }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label htmlFor={inputProps.id}>
      {label}
      <span className="auth-password-field">
        <input {...inputProps} className={className} type={isVisible ? "text" : "password"} />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={`${isVisible ? "Hide" : "Show"} ${toggleLabel}`}
          aria-pressed={isVisible}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}
