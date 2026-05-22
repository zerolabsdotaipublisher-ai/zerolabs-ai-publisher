"use client";

import { useCallback, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { routes } from "@/config/routes";
import type { ProfileRole } from "@/lib/supabase/profile";

const customerNavLinks = [
  { href: routes.dashboard, label: "Dashboard" },
  { href: routes.activity, label: "Activity" },
  { href: routes.contentLibrary, label: "Content library" },
  { href: routes.review, label: "Review" },
  { href: routes.approval, label: "Approval" },
  { href: routes.createWebsite, label: "Create website" },
  { href: routes.websites, label: "Websites" },
  { href: routes.profile, label: "Profile" },
];

const adminNavLinks = [
  { href: routes.adminDashboard, label: "Admin Dashboard" },
  { href: routes.adminUsers, label: "Users" },
  { href: routes.adminWebsites, label: "Websites" },
  { href: routes.adminAnalytics, label: "Analytics" },
  { href: routes.adminMonitoring, label: "Monitoring" },
];

interface AppNavigationProps {
  userEmail?: string | null;
  userRole: ProfileRole;
}

function isActivePath(pathname: string, href: string) {
  if (href === routes.dashboard || href === routes.adminDashboard) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation({ userEmail, userRole }: AppNavigationProps) {
  const pathname = usePathname();
  const mobileMenuId = useId();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navLinks = userRole === "admin" ? adminNavLinks : customerNavLinks;
  const dashboardHref = userRole === "admin" ? routes.adminDashboard : routes.dashboard;
  const mobileMenuLabel = isMobileMenuOpen ? "Close dashboard menu" : "Open dashboard menu";
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const renderBrandLogo = () => (
    <Image src="/images/AI robot logo light.svg" alt="" aria-hidden="true" width={44} height={29} priority className="app-nav-brand-logo" />
  );
  const renderUserActions = () => (
    <>
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
    </>
  );
  const renderNavLink = (link: (typeof navLinks)[number], linkKeyPrefix?: string, onClick?: () => void) => {
    const isActive = isActivePath(pathname, link.href);

    return (
      <Link
        key={`${linkKeyPrefix ?? "nav"}-${link.href}`}
        href={link.href}
        className={`app-nav-link${isActive ? " app-nav-link-active" : ""}`}
        aria-current={isActive ? "page" : undefined}
        onClick={onClick}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <header className="app-header">
      <nav className="app-nav" aria-label="Primary">
        <Link href={dashboardHref} className="app-nav-brand app-nav-brand-link" aria-label="Open Zero Labs AI Publisher dashboard">
          {renderBrandLogo()}
        </Link>

        <button
          type="button"
          className="app-nav-brand app-nav-mobile-trigger"
          aria-expanded={isMobileMenuOpen}
          aria-controls={mobileMenuId}
          aria-label={mobileMenuLabel}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {renderBrandLogo()}
        </button>

        <div className="app-nav-links">
          {navLinks.map((link) => renderNavLink(link, "desktop"))}
        </div>

        <div className="app-nav-actions">
          {renderUserActions()}
        </div>

        <div id={mobileMenuId} className="app-nav-mobile-menu" role="region" aria-label="Dashboard menu" hidden={!isMobileMenuOpen}>
          {navLinks.map((link) => renderNavLink(link, "mobile", closeMobileMenu))}
          {renderUserActions()}
        </div>
      </nav>
    </header>
  );
}
