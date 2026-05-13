"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { routes } from "@/config/routes";

const navLinks = [
  { href: routes.dashboard, label: "Dashboard" },
  { href: routes.activity, label: "Activity" },
  { href: routes.contentLibrary, label: "Content library" },
  { href: routes.websites, label: "Websites" },
  { href: routes.profile, label: "Profile" },
];

interface AppNavigationProps {
  userEmail?: string | null;
}

function isActivePath(pathname: string, href: string) {
  if (href === routes.dashboard) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation({ userEmail }: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <nav className="app-nav" aria-label="Primary">
        <Link href={routes.dashboard} className="app-nav-brand" aria-label="Open Zero Labs AI Publisher dashboard">
          <Image src="/images/Zero Labs Logo transparent.svg" alt="" aria-hidden="true" width={168} height={40} priority className="app-nav-brand-logo" />
          <span className="app-nav-brand-copy">
            <span className="app-nav-brand-title">Zero Labs</span>
            <span className="app-nav-brand-subtitle">AI Publisher</span>
          </span>
        </Link>

        <div className="app-nav-links">
          {navLinks.map((link) => {
            const isActive = isActivePath(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`app-nav-link${isActive ? " app-nav-link-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="app-nav-actions">
          {userEmail ? (
            <span className="app-nav-user" title={userEmail}>
              {userEmail}
            </span>
          ) : null}
          <SignOutButton
            containerClassName="app-nav-signout-group"
            className="app-nav-signout"
            errorClassName="app-nav-error"
          />
        </div>
      </nav>
    </header>
  );
}
