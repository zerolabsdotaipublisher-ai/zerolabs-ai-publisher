import Link from "next/link";
import { routes } from "@/config/routes";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

const plannedCoverage = [
  {
    title: "Publishing infrastructure commentary",
    description: "Long-form thinking on workflow design, operating constraints, and the tradeoffs behind calmer AI publishing systems.",
    href: `${routes.home}#platform`,
    cta: "Explore platform story",
  },
  {
    title: "Automation playbooks for multi-channel teams",
    description: "Practical guidance for teams balancing generation speed, human review, accessibility, and launch quality.",
    href: `${routes.home}#insights`,
    cta: "Review platform insights",
  },
  {
    title: "Product updates for AI-native content operations",
    description: "Upcoming release notes, roadmap context, and implementation detail on how Zero Labs evolves across app and marketing surfaces.",
    href: routes.signup,
    cta: "Create an account",
  },
] as const;

export default function BlogPage() {
  return (
    <div className="blog-page">
      <MarketingNav currentPath={routes.blog} />
      <main id="main-content" className="marketing-shell blog-main">
        <section className="blog-hero">
          <p className="blog-eyebrow">Blog</p>
          <h1>AI publishing insights, platform updates, and automation strategy coming soon.</h1>
          <p className="blog-lead">
            This public blog entry point is ready for future thought leadership, product releases, and operating-system-level
            commentary about AI-powered publishing infrastructure.
          </p>
          <div className="blog-hero-actions">
            <Link href={routes.home} className="marketing-primary-button blog-action-link">
              Return to homepage
            </Link>
            <Link href={`${routes.home}#insights`} className="marketing-secondary-button blog-action-link">
              Review platform insights
            </Link>
          </div>
        </section>

        <section className="blog-grid" aria-label="Planned blog coverage">
          {plannedCoverage.map((item) => (
            <article key={item.title} className="blog-card">
              <p className="blog-card-tag">Planned coverage</p>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <Link href={item.href} className="blog-card-link">
                {item.cta}
              </Link>
            </article>
          ))}
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
