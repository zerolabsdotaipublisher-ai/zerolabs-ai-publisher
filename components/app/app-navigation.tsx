"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SiteThemeToggle } from "@/components/theme/site-theme-toggle";
import { routes } from "@/config/routes";
import { useTheme } from "@/providers/theme-provider";
import type { ProfileRole } from "@/lib/supabase/profile";

const customerNavLinks = [
  { href: routes.dashboard, label: "Dashboard" },
  { href: routes.activity, label: "Activity" },
  { href: routes.insights, label: "Insights" },
  { href: routes.blog, label: "Blog" },
  { href: routes.createWebsite, label: "Create website" },
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
  userDisplayName?: string | null;
  userEmail?: string | null;
  userRole: ProfileRole;
}

function isActivePath(pathname: string, href: string) {
  if (href === routes.dashboard || href === routes.adminDashboard) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation({ userDisplayName, userEmail, userRole }: AppNavigationProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const mobileMenuId = "app-navigation-mobile-menu";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navLinks = userRole === "admin" ? adminNavLinks : customerNavLinks;
  const dashboardHref = userRole === "admin" ? routes.adminDashboard : routes.dashboard;
  const mobileMenuLabel = isMobileMenuOpen ? "Close dashboard menu" : "Open dashboard menu";
  const toggleMobileMenu = () => setIsMobileMenuOpen((open) => !open);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const userLabel = userDisplayName?.trim() || userEmail?.trim() || null;
  const renderBrandLogo = () => (
    <Image
      src={theme === "dark" ? "/images/AI robot logo light.svg" : "/images/AI robot logo dark.svg"}
      alt=""
      aria-hidden="true"
      width={44}
      height={29}
      priority
      className="app-nav-brand-logo"
    />
  );
  const renderUserActions = () => (
    <>
      {userLabel ? (
        <span className="app-nav-user" title={userEmail ?? userLabel}>
          {userLabel}
        </span>
      ) : null}
      <SignOutButton
        containerClassName="app-nav-signout-group"
        className="app-nav-signout"
        errorClassName="app-nav-error"
      />
    </>
  );
  const renderNavLink = (link: (typeof navLinks)[number], keyPrefix?: string, onClick?: () => void) => {
    const isActive = isActivePath(pathname, link.href);

    return (
      <Link
        key={`${keyPrefix ?? "nav"}-${link.href}`}
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
      <nav className="app-nav app-container" aria-label="Primary">
        <Link
          href={dashboardHref}
          className="app-nav-brand app-nav-brand-link"
          aria-label="Open Zero Labs AI Publisher dashboard"
        >
          {renderBrandLogo()}
        </Link>

        <button
          type="button"
          className="app-nav-brand app-nav-mobile-trigger"
          aria-expanded={isMobileMenuOpen}
          aria-controls={mobileMenuId}
          aria-label={mobileMenuLabel}
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? (
            <X aria-hidden="true" className="app-nav-mobile-trigger-icon" />
          ) : (
            <Menu aria-hidden="true" className="app-nav-mobile-trigger-icon" />
          )}
        </button>

        <div className="app-nav-links">
          {navLinks.map((link) => renderNavLink(link, "desktop"))}
        </div>

        <div className="app-nav-actions">
          <div className="app-nav-theme-toggle app-nav-theme-toggle-desktop">
            <SiteThemeToggle className="theme-toggle-button theme-toggle-button-app" />
          </div>
          {renderUserActions()}
        </div>

        <div
          id={mobileMenuId}
          className="app-nav-mobile-menu"
          aria-label="Dashboard menu"
          hidden={!isMobileMenuOpen}
        >
          <div className="app-nav-theme-toggle app-nav-theme-toggle-mobile">
            <SiteThemeToggle className="theme-toggle-button theme-toggle-button-app" />
          </div>
          {navLinks.map((link) => renderNavLink(link, "mobile", closeMobileMenu))}
          {renderUserActions()}
        </div>
      </nav>
    </header>
  );
}
