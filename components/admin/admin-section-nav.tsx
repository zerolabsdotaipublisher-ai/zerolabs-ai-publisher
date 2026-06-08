"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";

const adminLinks = [
  {
    href: routes.adminDashboard,
    label: "Overview",
    description: "Platform and Vercel status",
  },
  {
    href: routes.adminDeployments,
    label: "Deployments",
    description: "Recent builds and health",
  },
  {
    href: routes.adminAnalytics,
    label: "Analytics",
    description: "Traffic and readiness",
  },
  {
    href: routes.adminUsers,
    label: "Admin users",
    description: "Grant and review access",
  },
  {
    href: routes.adminWebsites,
    label: "Websites",
    description: "Existing platform website records",
  },
];

function isAdminLinkActive(pathname: string, href: string): boolean {
  if (href === routes.adminDashboard) {
    return pathname === routes.admin || pathname === routes.adminDashboard;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSectionNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-sidebar-nav" aria-label="Admin sections">
      {adminLinks.map((link) => {
        const isActive = isAdminLinkActive(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch={false}
            className={`admin-sidebar-nav-link${isActive ? " admin-sidebar-nav-link-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <strong>{link.label}</strong>
            <span>{link.description}</span>
          </Link>
        );
      })}
    </nav>
  );
}
