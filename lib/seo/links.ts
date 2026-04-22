import type { SeoContentType, SeoInternalLink } from "./types";

function sanitizeHref(value: string): string {
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

export function buildInternalLinks(args: {
  slug: string;
  title: string;
  contentType: SeoContentType;
  candidates?: Array<{ href: string; title: string; type?: string }>;
}): SeoInternalLink[] {
  const slug = sanitizeHref(args.slug);
  const unique = new Map<string, SeoInternalLink>();
  const candidates = args.candidates ?? [];

  const preferred = [
    { href: "/", title: "Home", reason: "Support crawl path from root" },
    ...candidates.map((candidate) => ({
      href: sanitizeHref(candidate.href),
      title: candidate.title.trim() || candidate.href,
      reason:
        candidate.type === "home"
          ? "Support crawl path from root"
          : candidate.type === "blog"
            ? "Connect related publishing content"
            : candidate.type === "article"
              ? "Connect related long-form content"
              : "Connect relevant internal content",
    })),
  ];

  preferred.forEach((candidate) => {
    if (!candidate.href || candidate.href === slug || unique.has(candidate.href)) {
      return;
    }

    unique.set(candidate.href, {
      href: candidate.href,
      anchorText: candidate.title,
      reason: candidate.reason,
    });
  });

  return Array.from(unique.values()).slice(0, 5);
}
