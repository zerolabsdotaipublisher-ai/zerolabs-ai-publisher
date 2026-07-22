import type { WebsiteSection } from "@/lib/ai/structure/types";
import { toWebsiteAssetRenderableUrl } from "@/lib/website-asset-retrieval/urls";

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
  supportingLine?: string;
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
  subheadline?: string;
  channels?: ContactChannel[];
  helperText?: string;
}

interface FooterContent {
  shortBlurb?: string;
  legalText?: string;
  trustIndicators?: string[];
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

function asContentObject<T extends object>(value: unknown): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as T;
  }

  return value as T;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatReadableDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getContactHref(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `mailto:${trimmed}`;
  }

  if (/^\+?[\d\s().-]{7,}$/.test(trimmed)) {
    const phoneValue = trimmed.replace(/[^\d+]/g, "");
    return phoneValue ? `tel:${phoneValue}` : undefined;
  }

  return undefined;
}

function normalizeLegalText(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/^Â©\s*/u, "Copyright ").replace(/^©\s*/u, "Copyright ");
}

function IndexKicker({ index }: { index: number }) {
  return <span className="gs-card-kicker">{`0${index + 1}`.slice(-2)}</span>;
}

function MetaPills({ entries }: { entries: Array<string | null | undefined> }) {
  const items = entries.filter((entry): entry is string => Boolean(entry));
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="gs-meta-list">
      {items.map((entry) => (
        <span key={entry} className="gs-meta-pill">
          {entry}
        </span>
      ))}
    </div>
  );
}

function TagRow({ tags, prefix }: { tags?: string[]; prefix: string }) {
  if (!tags?.length) {
    return null;
  }

  return (
    <div className="gs-blog-card-tags">
      {tags.map((tag) => (
        <span key={`${prefix}_${tag}`} className="gs-blog-tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

function HeroSectionView({ content }: { content: HeroContent }) {
  const image = asContentObject<NonNullable<HeroContent["image"]>>(content.image);
  const hasRenderableImage = Boolean(image.src);
  const hasMediaPanel =
    content.variant === "with-image" && (hasRenderableImage || image.alt || image.promptHint);

  return (
    <section className="gs-section gs-hero" id="hero">
      <div className="gs-hero-copy">
        {content.eyebrow ? <p className="gs-hero-eyebrow">{content.eyebrow}</p> : null}
        <div className="gs-section-intro gs-section-intro-hero">
          <h1 className="gs-hero-headline">{content.headline}</h1>
          {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
        </div>
        {content.supportingCopy ? (
          <p className="gs-about-body gs-hero-supporting-copy">{content.supportingCopy}</p>
        ) : null}
        <div className="gs-hero-actions">
          {content.primaryCta ? (
            <a className="gs-btn gs-btn-primary" href={content.ctaHref || "#contact"}>
              {content.primaryCta}
            </a>
          ) : null}
          {content.secondaryCta ? (
            <a className="gs-btn gs-btn-secondary" href="#about">
              {content.secondaryCta}
            </a>
          ) : null}
        </div>
      </div>
      {hasMediaPanel ? (
        <div className={`gs-hero-media${hasRenderableImage ? " has-image" : " is-placeholder"}`}>
          {hasRenderableImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="gs-component gs-component-image"
              src={toWebsiteAssetRenderableUrl(image.src!)}
              alt={image.alt || content.headline || content.subheadline || "Hero image"}
            />
          ) : (
            <div className="gs-hero-media-placeholder" aria-hidden="true">
              <span className="gs-hero-media-orb gs-hero-media-orb-primary" />
              <span className="gs-hero-media-orb gs-hero-media-orb-secondary" />
              <span className="gs-hero-media-grid" />
            </div>
          )}
          <div className="gs-hero-media-caption">
            {image.alt ? <strong className="gs-service-name">{image.alt}</strong> : null}
            {image.promptHint ? <p className="gs-service-description">{image.promptHint}</p> : null}
            {!hasRenderableImage && !image.alt && !image.promptHint ? (
              <p className="gs-service-description">Illustration placeholder</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AboutSectionView({ content }: { content: AboutContent }) {
  const paragraphs = asArray<string>(content.paragraphs);
  const items = asArray<NonNullable<AboutContent["items"]>[number]>(content.items);
  const bullets = asArray<string>(content.bullets);
  const hasDetailColumn = items.length > 0 || bullets.length > 0;

  return (
    <section className="gs-section gs-about" id="about">
      <div className="gs-section-intro">
        {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
        {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
      </div>
      <div className={`gs-about-grid${hasDetailColumn ? " has-details" : ""}`}>
        <div className="gs-about-story">
          {content.description ? <p className="gs-about-body">{content.description}</p> : null}
          {content.body ? <p className="gs-about-body">{content.body}</p> : null}
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="gs-about-body">
              {paragraph}
            </p>
          ))}
        </div>
        {hasDetailColumn ? (
          <div className="gs-about-details">
            {items.length ? (
              <ul className="gs-services-list">
                {items.map((item, index) => (
                  <li key={index} className="gs-service-item">
                    <IndexKicker index={index} />
                    <strong className="gs-service-name">{item.title}</strong>
                    <p className="gs-service-description">{item.description}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {bullets.length ? (
              <ul className="gs-feature-list">
                {bullets.map((bullet, index) => (
                  <li key={index} className="gs-feature-list-item">
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ServicesSectionView({ content }: { content: ServicesContent }) {
  const items = asArray<ServiceItem>(content.items);
  const bullets = asArray<string>(content.bullets);

  return (
    <section className="gs-section gs-services" id="services">
      <div className="gs-section-intro">
        {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
        {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
        {content.description ? <p className="gs-about-body">{content.description}</p> : null}
      </div>
      {items.length > 0 ? (
        <ul className="gs-services-list">
          {items.map((item, index) => (
            <li key={index} className="gs-service-item">
              <IndexKicker index={index} />
              <strong className="gs-service-name">{item.name}</strong>
              <p className="gs-service-description">{item.description}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {bullets.length ? (
        <ul className="gs-feature-list">
          {bullets.map((bullet, index) => (
            <li key={index} className="gs-feature-list-item">
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
  const items = asArray<MarketingListItem>(content.items);
  const bullets = asArray<string>(content.bullets);

  return (
    <section className="gs-section gs-services" id={sectionId}>
      <div className="gs-section-intro">
        {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
        {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
        {content.description ? <p className="gs-about-body">{content.description}</p> : null}
      </div>
      {items.length ? (
        <ul className="gs-services-list">
          {items.map((item, index) => (
            <li key={index} className="gs-service-item">
              <IndexKicker index={index} />
              {item.eyebrow ? <p className="gs-footer-blurb">{item.eyebrow}</p> : null}
              <strong className="gs-service-name">{item.title}</strong>
              <p className="gs-service-description">{item.description}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {bullets.length ? (
        <ul className="gs-feature-list">
          {bullets.map((bullet, index) => (
            <li key={index} className="gs-feature-list-item">
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function TestimonialsSectionView({ content }: { content: TestimonialsContent }) {
  const items = asArray<TestimonialItem>(content.items);
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="gs-section gs-testimonials" id="testimonials">
      <div className="gs-section-intro">
        {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
        {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
      </div>
      <ul className="gs-testimonials-list">
        {items.map((item, index) => (
          <li key={index} className="gs-testimonial-item">
            <IndexKicker index={index} />
            <blockquote className="gs-testimonial-quote">{item.quote}</blockquote>
            <cite className="gs-testimonial-author">
              {item.author}
              {item.role ? <span className="gs-testimonial-role"> - {item.role}</span> : null}
              {item.company ? <span className="gs-testimonial-role"> / {item.company}</span> : null}
            </cite>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CtaSectionView({ content }: { content: CtaContent }) {
  const supportingLine = content.subheadline || content.supportingLine;

  return (
    <section className="gs-section gs-cta" id="cta">
      <div className="gs-cta-panel">
        <div className="gs-cta-copy">
          <div className="gs-section-intro">
            {content.urgencyLabel ? <p className="gs-footer-blurb">{content.urgencyLabel}</p> : null}
            {content.headline ? <h2 className="gs-cta-headline">{content.headline}</h2> : null}
            {supportingLine ? <p className="gs-hero-subheadline">{supportingLine}</p> : null}
          </div>
        </div>
        <div className="gs-cta-actions-panel">
          <div className="gs-hero-actions gs-cta-actions">
            {content.ctaText ? (
              <a className="gs-btn gs-btn-primary" href={content.ctaHref || "#contact"}>
                {content.ctaText}
              </a>
            ) : null}
            {content.secondaryCtaText ? (
              <a className="gs-btn gs-btn-secondary" href={content.secondaryCtaHref || "#services"}>
                {content.secondaryCtaText}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSectionView({ content }: { content: FaqContent }) {
  const items = asArray<NonNullable<FaqContent["items"]>[number]>(content.items);
  if (!items.length) {
    return null;
  }

  return (
    <section className="gs-section gs-about gs-faq" id="faq">
      <div className="gs-section-intro">
        {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
        {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
      </div>
      <div className="gs-faq-list">
        {items.map((item, index) => (
          <details key={index} className="gs-faq-item" open={index === 0}>
            <summary className="gs-faq-question">{item.question}</summary>
            <p className="gs-faq-answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function PricingSectionView({ content }: { content: PricingContent }) {
  const tiers = asArray<NonNullable<PricingContent["tiers"]>[number]>(content.tiers);
  if (!tiers.length) {
    return null;
  }

  return (
    <section className="gs-section gs-pricing" id="pricing">
      <div className="gs-section-intro">
        {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
        {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
      </div>
      <div className="gs-pricing-grid">
        {tiers.map((tier, index) => {
          const features = asArray<string>(tier.features);

          return (
            <article
              key={index}
              className={`gs-pricing-tier${tier.isFeatured ? " is-featured" : ""}`}
            >
              <span className="gs-card-kicker">
                {tier.isFeatured ? "Featured" : `0${index + 1}`.slice(-2)}
              </span>
              <div className="gs-pricing-tier-header">
                <strong className="gs-service-name">{tier.name}</strong>
                <p className="gs-pricing-price">
                  {tier.price}
                  {tier.billingPeriod ? (
                    <span className="gs-pricing-price-period">{tier.billingPeriod}</span>
                  ) : null}
                </p>
              </div>
              <p className="gs-service-description">{tier.description}</p>
              <ul className="gs-feature-list">
                {features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="gs-feature-list-item">
                    {feature}
                  </li>
                ))}
              </ul>
              <a className="gs-btn gs-btn-primary" href="#contact">
                {tier.ctaText}
              </a>
            </article>
          );
        })}
      </div>
      {content.guaranteeLine ? <p className="gs-footer-blurb">{content.guaranteeLine}</p> : null}
      {content.disclaimer ? <p className="gs-footer-legal">{content.disclaimer}</p> : null}
    </section>
  );
}

function ContactSectionView({ content }: { content: ContactContent }) {
  const channels = asArray<ContactChannel>(content.channels);

  return (
    <section className="gs-section gs-contact" id="contact">
      <div className="gs-section-intro gs-contact-intro">
        {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
        {content.subheadline ? <p className="gs-hero-subheadline">{content.subheadline}</p> : null}
        {content.helperText ? <p className="gs-contact-helper">{content.helperText}</p> : null}
      </div>
      {channels.length > 0 ? (
        <ul className="gs-contact-channels">
          {channels.map((channel, index) => {
            const href = getContactHref(channel.value);

            return (
              <li key={index} className="gs-contact-channel">
                <span className="gs-card-kicker">{channel.label}</span>
                <span className="gs-contact-label">{channel.label}</span>
                {href ? (
                  <a className="gs-contact-value gs-contact-link" href={href}>
                    {channel.value}
                  </a>
                ) : (
                  <span className="gs-contact-value">{channel.value}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function FooterSectionView({ content }: { content: FooterContent }) {
  const trustIndicators = asArray<string>(content.trustIndicators);
  const legalText = normalizeLegalText(content.legalText);

  return (
    <footer className="gs-section gs-footer" id="footer">
      <div className="gs-footer-grid">
        <div className="gs-footer-copy">
          {content.shortBlurb ? <p className="gs-footer-copy-text">{content.shortBlurb}</p> : null}
        </div>
        {trustIndicators.length > 0 ? (
          <ul className="gs-footer-trust-list">
            {trustIndicators.map((item, index) => (
              <li key={`${item}_${index}`} className="gs-footer-trust-item">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {legalText ? <p className="gs-footer-legal">{legalText}</p> : null}
    </footer>
  );
}

function BlogIndexSectionView({ content }: { content: BlogIndexContent }) {
  const posts = asArray<BlogIndexPost>(content.posts);

  return (
    <section className="gs-section gs-blog-index">
      <div className="gs-section-intro">
        {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
      </div>
      <div className="gs-blog-index-list">
        {posts.map((post) => (
          <article key={post.id} className="gs-blog-card">
            <span className="gs-card-kicker">
              {post.articleType?.replace(/-/g, " ") || "Article"}
            </span>
            <h3 className="gs-blog-card-title">
              <a href={`?page=${encodeURIComponent(post.slug)}`}>{post.title}</a>
            </h3>
            {post.subtitle ? <p className="gs-blog-card-excerpt">{post.subtitle}</p> : null}
            <p className="gs-blog-card-excerpt">{post.excerpt}</p>
            <p className="gs-blog-card-meta">
              {post.readingTimeMinutes ? `${post.readingTimeMinutes} min read` : null}
              {post.articleType ? ` / ${post.articleType.replace(/-/g, " ")}` : null}
            </p>
            <TagRow tags={post.tags} prefix={post.id} />
          </article>
        ))}
      </div>
    </section>
  );
}

function BlogPostHeaderSectionView({ content }: { content: BlogPostHeaderContent }) {
  const formattedDate = formatReadableDate(content.updatedAt);

  return (
    <section className="gs-section gs-blog-post-header">
      {content.title ? <h1 className="gs-hero-headline">{content.title}</h1> : null}
      {content.excerpt ? <p className="gs-hero-subheadline">{content.excerpt}</p> : null}
      <MetaPills
        entries={[
          content.authorName ? `By ${content.authorName}` : null,
          formattedDate ? `Updated ${formattedDate}` : null,
          content.readingTimeMinutes ? `${content.readingTimeMinutes} min read` : null,
        ]}
      />
      <TagRow tags={content.tags} prefix="blog-post" />
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
  const formattedDate = formatReadableDate(content.updatedAt);

  return (
    <section className="gs-section gs-blog-post-header">
      {content.title ? <h1 className="gs-hero-headline">{content.title}</h1> : null}
      {content.subtitle ? <p className="gs-hero-subheadline">{content.subtitle}</p> : null}
      {content.excerpt ? <p className="gs-about-body">{content.excerpt}</p> : null}
      <MetaPills
        entries={[
          content.authorName ? `By ${content.authorName}` : null,
          formattedDate ? `Updated ${formattedDate}` : null,
          content.readingTimeMinutes ? `${content.readingTimeMinutes} min read` : null,
          content.articleType ? content.articleType.replace(/-/g, " ") : null,
          content.depth ?? null,
        ]}
      />
      <TagRow tags={content.tags} prefix="article-page" />
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
            <ul className="gs-feature-list">
              {section.takeaways.map((takeaway, index) => (
                <li key={`${section.id}_takeaway_${index}`} className="gs-feature-list-item">
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
  if (!content.references?.length) {
    return null;
  }

  return (
    <section className="gs-section gs-about">
      <div className="gs-section-intro">
        {content.headline ? <h2 className="gs-section-headline">{content.headline}</h2> : null}
      </div>
      <ul className="gs-services-list gs-reference-list">
        {content.references.map((reference, index) => (
          <li key={`${reference.title}_${index}`} className="gs-service-item">
            <span className="gs-card-kicker">{`Ref ${index + 1}`}</span>
            <strong className="gs-service-name">{reference.title}</strong>
            {reference.source ? <p className="gs-service-description">{reference.source}</p> : null}
            {reference.note ? <p className="gs-service-description">{reference.note}</p> : null}
            {reference.url ? (
              <p className="gs-service-description">
                <a className="gs-reference-link" href={reference.url}>
                  {reference.url}
                </a>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface SectionRendererProps {
  section: WebsiteSection;
}

export function SectionRenderer({ section }: SectionRendererProps) {
  const content = asContentObject<Record<string, unknown>>(section.content);

  if (section.type === "custom") {
    const customKind = typeof content.kind === "string" ? content.kind : undefined;
    if (customKind === "blog-index") {
      return <BlogIndexSectionView content={content as BlogIndexContent} />;
    }
    if (customKind === "blog-post-header") {
      return <BlogPostHeaderSectionView content={content as BlogPostHeaderContent} />;
    }
    if (customKind === "blog-post-body") {
      return <BlogPostBodySectionView content={content as BlogPostBodyContent} />;
    }
    if (customKind === "article-index") {
      return <BlogIndexSectionView content={content as BlogIndexContent} />;
    }
    if (customKind === "article-page-header") {
      return <ArticlePageHeaderSectionView content={content as ArticlePageHeaderContent} />;
    }
    if (customKind === "article-page-body") {
      return <ArticlePageBodySectionView content={content as ArticlePageBodyContent} />;
    }
    if (customKind === "article-page-references") {
      return (
        <ArticlePageReferencesSectionView content={content as ArticlePageReferencesContent} />
      );
    }
  }

  switch (section.type) {
    case "hero":
      return <HeroSectionView content={content as HeroContent} />;
    case "about":
      return <AboutSectionView content={content as AboutContent} />;
    case "services":
      return <ServicesSectionView content={content as ServicesContent} />;
    case "features":
      return (
        <MarketingListSectionView
          content={content as MarketingListContent}
          sectionId="features"
        />
      );
    case "benefits":
      return (
        <MarketingListSectionView
          content={content as MarketingListContent}
          sectionId="benefits"
        />
      );
    case "testimonials":
      return <TestimonialsSectionView content={content as TestimonialsContent} />;
    case "faq":
      return <FaqSectionView content={content as FaqContent} />;
    case "cta":
      return <CtaSectionView content={content as CtaContent} />;
    case "pricing":
      return <PricingSectionView content={content as PricingContent} />;
    case "contact":
      return <ContactSectionView content={content as ContactContent} />;
    case "footer":
      return <FooterSectionView content={content as FooterContent} />;
    default:
      return null;
  }
}
