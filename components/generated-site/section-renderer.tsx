import type { WebsiteSection } from "@/lib/ai/structure/types";

// ---------------------------------------------------------------------------
// Section content shape helpers
// These inline types mirror the prompt output contracts from
// lib/ai/prompts/types.ts so the renderer can safely destructure content.
// ---------------------------------------------------------------------------

interface HeroContent {
  variant?: "text-only" | "with-image";
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  primaryCta?: string;
  secondaryCta?: string;
  supportingCopy?: string;
  ctaHref?: string;
  image?: {
    alt?: string;
    src?: string;
    promptHint?: string;
  };
}

interface AboutContent {
  variant?: string;
  headline?: string;
  subheadline?: string;
  description?: string;
  body?: string;
  paragraphs?: string[];
  bullets?: string[];
  items?: Array<{
    title: string;
    description: string;
  }>;
}

interface ServiceItem {
  name: string;
  description: string;
}

interface ServicesContent {
  variant?: string;
  headline?: string;
  subheadline?: string;
  description?: string;
  paragraphs?: string[];
  bullets?: string[];
  items?: ServiceItem[];
}

interface MarketingListItem {
  title: string;
  description: string;
  eyebrow?: string;
}

interface MarketingListContent {
  variant?: string;
  headline?: string;
  subheadline?: string;
  description?: string;
  paragraphs?: string[];
  bullets?: string[];
  items?: MarketingListItem[];
}

interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  isPlaceholder?: boolean;
}

interface TestimonialsContent {
  variant?: string;
  headline?: string;
  subheadline?: string;
  items?: TestimonialItem[];
}

interface CtaContent {
  variant?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  urgencyLabel?: string;
}

interface FaqContent {
  variant?: string;
  headline?: string;
  subheadline?: string;
  items?: Array<{
    question: string;
    answer: string;
  }>;
}

interface PricingContent {
  variant?: string;
  headline?: string;
  subheadline?: string;
  tiers?: Array<{
    name: string;
    price: string;
    billingPeriod?: string;
    description: string;
    features: string[];
    ctaText: string;
    isFeatured?: boolean;
  }>;
  guaranteeLine?: string;
  disclaimer?: string;
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
  subtitle?: string;
  slug: string;
  excerpt: string;
  tags?: string[];
  readingTimeMinutes?: number;
  articleType?: string;
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

interface ArticlePageHeaderContent {
  kind?: "article-page-header";
  title?: string;
  subtitle?: string;
  excerpt?: string;
  introduction?: string;
  authorName?: string;
  updatedAt?: string;
  readingTimeMinutes?: number;
  qualityStatus?: string;
  tags?: string[];
  articleType?: string;
  depth?: string;
}

interface ArticlePageBodySection extends BlogPostBodySection {
  takeaways?: string[];
}

interface ArticlePageBodyContent {
  kind?: "article-page-body";
  sections?: ArticlePageBodySection[];
  conclusion?: string;
  callToAction?: string;
}

interface ArticleReferenceItem {
  title: string;
  source?: string;
  url?: string;
  note?: string;
}

interface ArticlePageReferencesContent {
  kind?: "article-page-references";
  headline?: string;
  references?: ArticleReferenceItem[];
}

// ---------------------------------------------------------------------------
// Section sub-renderers
// ---------------------------------------------------------------------------

function HeroSectionView({ content }: { content: HeroContent }) {
  return (
    <section className="gs-section gs-hero" id="hero">
      {content.eyebrow ? <p className="gs-hero-eyebrow">{content.eyebrow}</p> : null}
      <h1 className="gs-hero-headline">{content.headline}</h1>
      {content.subheadline && (
        <p className="gs-hero-subheadline">{content.subheadline}</p>
      )}
      {content.supportingCopy ? <p className="gs-about-body">{content.supportingCopy}</p> : null}
      {content.variant === "with-image" && content.image ? (
        <div className="gs-service-item">
          <strong className="gs-service-name">{content.image.alt}</strong>
          {content.image.promptHint ? (
            <p className="gs-service-description">{content.image.promptHint}</p>
          ) : null}
        </div>
      ) : null}
      <div className="gs-hero-actions">
        {content.primaryCta && (
          <a className="gs-btn gs-btn-primary" href={content.ctaHref || "#contact"}>
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
      {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
      {content.description ? <p className="gs-about-body">{content.description}</p> : null}
      {content.body && <p className="gs-about-body">{content.body}</p>}
      {(content.paragraphs ?? []).map((paragraph, index) => (
        <p key={index} className="gs-about-body">
          {paragraph}
        </p>
      ))}
      {content.items?.length ? (
        <ul className="gs-services-list">
          {content.items.map((item, index) => (
            <li key={index} className="gs-service-item">
              <strong className="gs-service-name">{item.title}</strong>
              <p className="gs-service-description">{item.description}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {content.bullets?.length ? (
        <ul className="gs-services-list">
          {content.bullets.map((bullet, index) => (
            <li key={index} className="gs-service-item">
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ServicesSectionView({ content }: { content: ServicesContent }) {
  return (
    <section className="gs-section gs-services" id="services">
      {content.headline && (
        <h2 className="gs-section-headline">{content.headline}</h2>
      )}
      {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
      {content.description ? <p className="gs-about-body">{content.description}</p> : null}
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
      {content.bullets?.length ? (
        <ul className="gs-services-list">
          {content.bullets.map((bullet, index) => (
            <li key={index} className="gs-service-item">
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function MarketingListSectionView({
  content,
  sectionId,
}: {
  content: MarketingListContent;
  sectionId: string;
}) {
  return (
    <section className="gs-section gs-services" id={sectionId}>
      {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
      {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
      {content.description ? <p className="gs-about-body">{content.description}</p> : null}
      {(content.items ?? []).length ? (
        <ul className="gs-services-list">
          {(content.items ?? []).map((item, index) => (
            <li key={index} className="gs-service-item">
              {item.eyebrow ? <p className="gs-footer-blurb">{item.eyebrow}</p> : null}
              <strong className="gs-service-name">{item.title}</strong>
              <p className="gs-service-description">{item.description}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {content.bullets?.length ? (
        <ul className="gs-services-list">
          {content.bullets.map((bullet, index) => (
            <li key={index} className="gs-service-item">
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
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
              {"company" in item && item.company ? (
                <span className="gs-testimonial-role"> · {item.company}</span>
              ) : null}
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
      {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
      {content.urgencyLabel ? <p className="gs-footer-blurb">{content.urgencyLabel}</p> : null}
      {content.ctaText && (
        <a className="gs-btn gs-btn-primary" href={content.ctaHref || "#contact"}>
          {content.ctaText}
        </a>
      )}
      {content.secondaryCtaText ? (
        <a className="gs-btn gs-btn-secondary" href={content.secondaryCtaHref || "#services"}>
          {content.secondaryCtaText}
        </a>
      ) : null}
    </section>
  );
}

function FaqSectionView({ content }: { content: FaqContent }) {
  if (!content.items?.length) return null;

  return (
    <section className="gs-section gs-about" id="faq">
      {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
      {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
      <ul className="gs-services-list">
        {content.items.map((item, index) => (
          <li key={index} className="gs-service-item">
            <strong className="gs-service-name">{item.question}</strong>
            <p className="gs-service-description">{item.answer}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PricingSectionView({ content }: { content: PricingContent }) {
  if (!content.tiers?.length) return null;

  return (
    <section className="gs-section gs-services" id="pricing">
      {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
      {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
      <ul className="gs-services-list">
        {content.tiers.map((tier, index) => (
          <li key={index} className="gs-service-item">
            <strong className="gs-service-name">
              {tier.name} — {tier.price}
              {tier.billingPeriod ? tier.billingPeriod : ""}
            </strong>
            <p className="gs-service-description">{tier.description}</p>
            <ul className="gs-services-list">
              {tier.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="gs-service-item">
                  {feature}
                </li>
              ))}
            </ul>
            <a className="gs-btn gs-btn-primary" href="#contact">
              {tier.ctaText}
            </a>
          </li>
        ))}
      </ul>
      {content.guaranteeLine ? <p className="gs-footer-blurb">{content.guaranteeLine}</p> : null}
      {content.disclaimer ? <p className="gs-footer-legal">{content.disclaimer}</p> : null}
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
            {post.subtitle ? <p className="gs-blog-card-excerpt">{post.subtitle}</p> : null}
            <p className="gs-blog-card-excerpt">{post.excerpt}</p>
            <p className="gs-blog-card-meta">
              {post.readingTimeMinutes ? `${post.readingTimeMinutes} min read` : null}
              {post.articleType ? ` • ${post.articleType.replace(/-/g, " ")}` : null}
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

function ArticlePageHeaderSectionView({ content }: { content: ArticlePageHeaderContent }) {
  return (
    <section className="gs-section gs-blog-post-header">
      {content.title ? <h1 className="gs-hero-headline">{content.title}</h1> : null}
      {content.subtitle ? <p className="gs-hero-subheadline">{content.subtitle}</p> : null}
      {content.excerpt ? <p className="gs-about-body">{content.excerpt}</p> : null}
      <p className="gs-blog-post-meta">
        {content.authorName ? `By ${content.authorName}` : null}
        {content.updatedAt ? ` • Updated ${new Date(content.updatedAt).toLocaleDateString()}` : null}
        {content.readingTimeMinutes ? ` • ${content.readingTimeMinutes} min read` : null}
        {content.articleType ? ` • ${content.articleType.replace(/-/g, " ")}` : null}
        {content.depth ? ` • ${content.depth}` : null}
      </p>
      {content.tags?.length ? <p className="gs-blog-post-tags">{content.tags.join(" • ")}</p> : null}
      {content.introduction ? <p className="gs-about-body">{content.introduction}</p> : null}
    </section>
  );
}

function ArticlePageBodySectionView({ content }: { content: ArticlePageBodyContent }) {
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
          {section.takeaways?.length ? (
            <ul className="gs-services-list">
              {section.takeaways.map((takeaway, index) => (
                <li key={`${section.id}_takeaway_${index}`} className="gs-service-item">
                  {takeaway}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
      {content.conclusion ? <p className="gs-about-body">{content.conclusion}</p> : null}
      {content.callToAction ? <p className="gs-cta-headline">{content.callToAction}</p> : null}
    </section>
  );
}

function ArticlePageReferencesSectionView({ content }: { content: ArticlePageReferencesContent }) {
  if (!content.references?.length) return null;

  return (
    <section className="gs-section gs-about">
      {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
      <ul className="gs-services-list">
        {content.references.map((reference, index) => (
          <li key={`${reference.title}_${index}`} className="gs-service-item">
            <strong className="gs-service-name">{reference.title}</strong>
            {reference.source ? <p className="gs-service-description">{reference.source}</p> : null}
            {reference.note ? <p className="gs-service-description">{reference.note}</p> : null}
            {reference.url ? (
              <p className="gs-service-description">
                <a href={reference.url}>{reference.url}</a>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
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
    if (customKind === "article-index") {
      return <BlogIndexSectionView content={section.content as BlogIndexContent} />;
    }
    if (customKind === "article-page-header") {
      return <ArticlePageHeaderSectionView content={section.content as ArticlePageHeaderContent} />;
    }
    if (customKind === "article-page-body") {
      return <ArticlePageBodySectionView content={section.content as ArticlePageBodyContent} />;
    }
    if (customKind === "article-page-references") {
      return <ArticlePageReferencesSectionView content={section.content as ArticlePageReferencesContent} />;
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
    case "features":
      return (
        <MarketingListSectionView
          content={section.content as MarketingListContent}
          sectionId="features"
        />
      );
    case "benefits":
      return (
        <MarketingListSectionView
          content={section.content as MarketingListContent}
          sectionId="benefits"
        />
      );
    case "testimonials":
      return (
        <TestimonialsSectionView
          content={section.content as TestimonialsContent}
        />
      );
    case "faq":
      return <FaqSectionView content={section.content as FaqContent} />;
    case "cta":
      return <CtaSectionView content={section.content as CtaContent} />;
    case "pricing":
      return <PricingSectionView content={section.content as PricingContent} />;
    case "contact":
      return (
        <ContactSectionView content={section.content as ContactContent} />
      );
    case "footer":
      return <FooterSectionView content={section.content as FooterContent} />;
    default:
      return null;
  }
}
