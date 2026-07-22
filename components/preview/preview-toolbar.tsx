import Link from "next/link";
import type { ReactNode } from "react";

interface PreviewToolbarProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  links?: {
    label: string;
    href: string;
  }[];
  controls?: ReactNode;
}

export function PreviewToolbar({
  title,
  eyebrow,
  subtitle,
  meta,
  actions,
  links,
  controls,
}: PreviewToolbarProps) {
  return (
    <section className="preview-toolbar" aria-label="Website preview overview">
      <div className="preview-toolbar-heading">
        {eyebrow ? <span className="preview-toolbar-eyebrow">{eyebrow}</span> : null}
        <div className="preview-toolbar-heading-row">
          <div className="preview-toolbar-title-block">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {meta ? <div className="preview-toolbar-meta">{meta}</div> : null}
        </div>
      </div>
      {controls || actions || links?.length ? (
        <details className="preview-toolbar-panel">
          <summary className="preview-toolbar-panel-summary">
            <span className="preview-toolbar-panel-label">Preview tools</span>
            <span className="preview-toolbar-panel-copy">
              Page switching, device framing, refresh, sharing, and workspace links.
            </span>
          </summary>
          <div className="preview-toolbar-panel-body">
            {controls || actions ? (
              <div className="preview-toolbar-utility">
                {controls ? <div className="preview-toolbar-controls">{controls}</div> : null}
                {actions ? <div className="preview-toolbar-actions">{actions}</div> : null}
              </div>
            ) : null}
            {links?.length ? (
              <div className="preview-toolbar-links">
                {links.map((link) => (
                  <Link key={`${link.label}-${link.href}`} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </details>
      ) : null}
    </section>
  );
}
