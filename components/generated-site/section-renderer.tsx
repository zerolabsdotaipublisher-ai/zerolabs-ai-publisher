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
    default:
      return null;
  }
}
