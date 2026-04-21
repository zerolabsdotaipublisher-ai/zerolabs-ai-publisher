import type { WebsiteSection } from "@/lib/ai/structure/types";

// ---------------------------------------------------------------------------
// Section content shape helpers
// These inline types mirror the prompt output contracts from
// lib/ai/prompts/types.ts so the renderer can safely destructure content.
// ---------------------------------------------------------------------------

interface HeroContent {
  headline?: string;
  subheadline?: string;
  primaryCta?: string;
  secondaryCta?: string;
}

interface AboutContent {
  headline?: string;
  body?: string;
}

interface ServiceItem {
  name: string;
  description: string;
}

interface ServicesContent {
  headline?: string;
  items?: ServiceItem[];
}

interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
}

interface TestimonialsContent {
  headline?: string;
  items?: TestimonialItem[];
}

interface CtaContent {
  headline?: string;
  ctaText?: string;
}

interface ContactChannel {
  label: string;
  value: string;
}

interface ContactContent {
  headline?: string;
  channels?: ContactChannel[];
}

interface FooterContent {
  shortBlurb?: string;
  legalText?: string;
}

interface BlogIndexPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags?: string[];
  readingTimeMinutes?: number;
}

interface BlogIndexContent {
  kind?: "blog-index";
  headline?: string;
  posts?: BlogIndexPost[];
}

interface BlogPostHeaderContent {
  kind?: "blog-post-header";
  title?: string;
  excerpt?: string;
  introduction?: string;
  authorName?: string;
  updatedAt?: string;
  readingTimeMinutes?: number;
  tags?: string[];
}

interface BlogPostBodySection {
  id: string;
  heading: string;
  summary?: string;
  paragraphs?: string[];
  h3Headings?: string[];
}

interface BlogPostBodyContent {
  kind?: "blog-post-body";
  sections?: BlogPostBodySection[];
  conclusion?: string;
  callToAction?: string;
}

// ---------------------------------------------------------------------------
// Section sub-renderers
// ---------------------------------------------------------------------------

function HeroSectionView({ content }: { content: HeroContent }) {
  return (
    <section className="gs-section gs-hero" id="hero">
      <h1 className="gs-hero-headline">{content.headline}</h1>
      {content.subheadline && (
        <p className="gs-hero-subheadline">{content.subheadline}</p>
      )}
      <div className="gs-hero-actions">
        {content.primaryCta && (
          <a className="gs-btn gs-btn-primary" href="#contact">
            {content.primaryCta}
          </a>
        )}
        {content.secondaryCta && (
          <a className="gs-btn gs-btn-secondary" href="#about">
            {content.secondaryCta}
          </a>
        )}
      </div>
    </section>
  );
}

function AboutSectionView({ content }: { content: AboutContent }) {
  return (
    <section className="gs-section gs-about" id="about">
      {content.headline && (
        <h2 className="gs-section-headline">{content.headline}</h2>
      )}
      {content.body && <p className="gs-about-body">{content.body}</p>}
    </section>
  );
}

function ServicesSectionView({ content }: { content: ServicesContent }) {
  return (
    <section className="gs-section gs-services" id="services">
      {content.headline && (
        <h2 className="gs-section-headline">{content.headline}</h2>
      )}
      {content.items && content.items.length > 0 && (
        <ul className="gs-services-list">
          {content.items.map((item, i) => (
            <li key={i} className="gs-service-item">
              <strong className="gs-service-name">{item.name}</strong>
              <p className="gs-service-description">{item.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TestimonialsSectionView({
  content,
}: {
  content: TestimonialsContent;
}) {
  if (!content.items || content.items.length === 0) return null;

  return (
    <section className="gs-section gs-testimonials" id="testimonials">
      {content.headline && (
        <h2 className="gs-section-headline">{content.headline}</h2>
      )}
      <ul className="gs-testimonials-list">
        {content.items.map((item, i) => (
          <li key={i} className="gs-testimonial-item">
            <blockquote className="gs-testimonial-quote">
              {item.quote}
            </blockquote>
            <cite className="gs-testimonial-author">
              {item.author}
              {item.role && (
                <span className="gs-testimonial-role"> — {item.role}</span>
              )}
            </cite>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CtaSectionView({ content }: { content: CtaContent }) {
  return (
    <section className="gs-section gs-cta" id="cta">
      {content.headline && (
        <h2 className="gs-cta-headline">{content.headline}</h2>
      )}
      {content.ctaText && (
        <a className="gs-btn gs-btn-primary" href="#contact">
          {content.ctaText}
        </a>
      )}
    </section>
  );
}

function ContactSectionView({ content }: { content: ContactContent }) {
  return (
    <section className="gs-section gs-contact" id="contact">
      {content.headline && (
        <h2 className="gs-section-headline">{content.headline}</h2>
      )}
      {content.channels && content.channels.length > 0 && (
        <ul className="gs-contact-channels">
          {content.channels.map((channel, i) => (
            <li key={i} className="gs-contact-channel">
              <span className="gs-contact-label">{channel.label}:</span>{" "}
              <span className="gs-contact-value">{channel.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FooterSectionView({ content }: { content: FooterContent }) {
  return (
    <footer className="gs-section gs-footer" id="footer">
      {content.shortBlurb && (
        <p className="gs-footer-blurb">{content.shortBlurb}</p>
      )}
      {content.legalText && (
        <p className="gs-footer-legal">{content.legalText}</p>
      )}
    </footer>
  );
}

function BlogIndexSectionView({ content }: { content: BlogIndexContent }) {
  return (
    <section className="gs-section gs-blog-index">
      {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
      <div className="gs-blog-index-list">
        {(content.posts ?? []).map((post) => (
          <article key={post.id} className="gs-blog-card">
            <h3 className="gs-blog-card-title">
              <a href={`?page=${encodeURIComponent(post.slug)}`}>{post.title}</a>
            </h3>
            <p className="gs-blog-card-excerpt">{post.excerpt}</p>
            <p className="gs-blog-card-meta">
              {post.readingTimeMinutes ? `${post.readingTimeMinutes} min read` : null}
              {post.tags?.length ? ` • ${post.tags.join(", ")}` : null}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BlogPostHeaderSectionView({ content }: { content: BlogPostHeaderContent }) {
  return (
    <section className="gs-section gs-blog-post-header">
      {content.title ? <h1 className="gs-hero-headline">{content.title}</h1> : null}
      {content.excerpt ? <p className="gs-hero-subheadline">{content.excerpt}</p> : null}
      <p className="gs-blog-post-meta">
        {content.authorName ? `By ${content.authorName}` : null}
        {content.updatedAt ? ` • Updated ${new Date(content.updatedAt).toLocaleDateString()}` : null}
        {content.readingTimeMinutes ? ` • ${content.readingTimeMinutes} min read` : null}
      </p>
      {content.tags?.length ? <p className="gs-blog-post-tags">{content.tags.join(" • ")}</p> : null}
      {content.introduction ? <p className="gs-about-body">{content.introduction}</p> : null}
    </section>
  );
}

function BlogPostBodySectionView({ content }: { content: BlogPostBodyContent }) {
  return (
    <section className="gs-section gs-blog-post-body">
      {(content.sections ?? []).map((section) => (
        <article key={section.id} className="gs-blog-post-block">
          <h2 className="gs-section-headline">{section.heading}</h2>
          {section.summary ? <p className="gs-about-body">{section.summary}</p> : null}
          {(section.h3Headings ?? []).map((heading, index) => (
            <h3 key={`${section.id}_${index}`} className="gs-blog-post-subheading">
              {heading}
            </h3>
          ))}
          {(section.paragraphs ?? []).map((paragraph, index) => (
            <p key={`${section.id}_paragraph_${index}`} className="gs-about-body">
              {paragraph}
            </p>
          ))}
        </article>
      ))}
      {content.conclusion ? <p className="gs-about-body">{content.conclusion}</p> : null}
      {content.callToAction ? <p className="gs-cta-headline">{content.callToAction}</p> : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Public section renderer
// ---------------------------------------------------------------------------

interface SectionRendererProps {
  section: WebsiteSection;
}

/**
 * Render a single website section by dispatching to the appropriate
 * sub-renderer based on `section.type`.
 */
export function SectionRenderer({ section }: SectionRendererProps) {
  if (section.type === "custom") {
    const customKind = (section.content as { kind?: string }).kind;
    if (customKind === "blog-index") {
      return <BlogIndexSectionView content={section.content as BlogIndexContent} />;
    }
    if (customKind === "blog-post-header") {
      return <BlogPostHeaderSectionView content={section.content as BlogPostHeaderContent} />;
    }
    if (customKind === "blog-post-body") {
      return <BlogPostBodySectionView content={section.content as BlogPostBodyContent} />;
    }
  }

  switch (section.type) {
    case "hero":
      return <HeroSectionView content={section.content as HeroContent} />;
    case "about":
      return <AboutSectionView content={section.content as AboutContent} />;
    case "services":
      return (
        <ServicesSectionView content={section.content as ServicesContent} />
      );
    case "testimonials":
      return (
        <TestimonialsSectionView
          content={section.content as TestimonialsContent}
        />
      );
    case "cta":
      return <CtaSectionView content={section.content as CtaContent} />;
    case "contact":
      return (
        <ContactSectionView content={section.content as ContactContent} />
      );
    case "footer":
      return <FooterSectionView content={section.content as FooterContent} />;
    case "custom":
    default:
      return null;
  }
}
