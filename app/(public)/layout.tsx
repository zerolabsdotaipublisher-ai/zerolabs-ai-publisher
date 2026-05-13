import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/config/routes";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-page-backdrop" aria-hidden="true" />
      <div className="auth-shell">
        <section className="auth-card">
          <Link href={routes.home} className="auth-brand" aria-label="Return to Zero Labs AI Publisher homepage">
            <span className="auth-brand-logo-wrap" aria-hidden="true">
              <Image
                src="/images/Zero Labs Logo colored.svg"
                alt=""
                width={180}
                height={40}
                priority
                className="auth-brand-logo auth-brand-logo-light"
              />
              <Image
                src="/images/Zero Labs Logo transparent.svg"
                alt=""
                width={180}
                height={40}
                priority
                className="auth-brand-logo auth-brand-logo-dark"
              />
            </span>
            <span className="auth-brand-copy">
              <span className="auth-brand-label">Zero Labs AI Publisher</span>
              <span className="auth-brand-tagline">Sustainable &amp; Humanistic AI publishing</span>
            </span>
          </Link>

          <div className="auth-card-body">{children}</div>
        </section>

        <aside className="auth-visual-panel">
          <span className="auth-panel-eyebrow">Calmer publishing workflows</span>
          <h2>Keep every AI publishing step calm, credible, and brand-safe.</h2>
          <p>
            Balanced surfaces, human-first review, and a green editorial palette keep Zero Labs AI Publisher feeling
            premium from first visit through sign-in.
          </p>
          <ul className="auth-panel-list">
            <li>Prompt-led website creation</li>
            <li>Human approval checkpoints</li>
            <li>Brand-safe publishing controls</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
