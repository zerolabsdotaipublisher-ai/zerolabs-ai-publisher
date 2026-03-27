import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      {children}
    </main>
  );
}
