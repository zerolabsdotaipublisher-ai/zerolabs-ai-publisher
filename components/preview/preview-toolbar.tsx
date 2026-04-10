import Link from "next/link";
import type { ReactNode } from "react";

interface PreviewToolbarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  links?: {
    label: string;
    href: string;
  }[];
  controls?: ReactNode;
}

export function PreviewToolbar({ title, subtitle, actions, links, controls }: PreviewToolbarProps) {
  return (
    <section className="preview-toolbar" aria-label="Website preview controls">
      <div className="preview-toolbar-heading">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {controls ? <div className="preview-toolbar-controls">{controls}</div> : null}
      {actions ? <div className="preview-toolbar-actions">{actions}</div> : null}
      {links?.length ? (
        <div className="preview-toolbar-links">
          {links.map((link) => (
            <Link key={`${link.label}-${link.href}`} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
