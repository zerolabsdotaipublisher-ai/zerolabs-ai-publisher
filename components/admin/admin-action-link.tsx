import Link from "next/link";

type AdminActionVariant = "primary" | "secondary";
type AdminActionTarget = "internal" | "external";

interface AdminActionLinkProps {
  href: string | null;
  label: string;
  reason?: string;
  target?: AdminActionTarget;
  variant?: AdminActionVariant;
  showReasonWhenDisabled?: boolean;
}

function getClassName(variant: AdminActionVariant, isDisabled: boolean): string {
  return [
    "admin-page-action-link",
    variant === "secondary" ? "admin-page-action-link-secondary" : "",
    isDisabled ? "admin-page-action-link-disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function resolveTarget(href: string, target?: AdminActionTarget): AdminActionTarget {
  if (target) {
    return target;
  }

  return href.startsWith("/") ? "internal" : "external";
}

export function AdminActionLink({
  href,
  label,
  reason,
  target,
  variant = "primary",
  showReasonWhenDisabled = false,
}: AdminActionLinkProps) {
  const isDisabled = !href;
  const className = getClassName(variant, isDisabled);

  if (isDisabled) {
    return (
      <span className="admin-page-action-link-group">
        <span className={className} aria-disabled="true" title={reason}>
          {label}
        </span>
        {showReasonWhenDisabled && reason ? (
          <span className="admin-page-action-link-reason">{reason}</span>
        ) : null}
      </span>
    );
  }

  const resolvedTarget = resolveTarget(href, target);

  if (resolvedTarget === "internal") {
    return (
      <Link href={href} className={className} title={reason}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} title={reason}>
      {label}
    </a>
  );
}
