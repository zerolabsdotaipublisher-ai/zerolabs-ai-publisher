# Marketing Section Generation Test Scenarios (ZLAP-STORY 6-4)

## Scenario coverage

1. **Small business lead-gen**
   - hero + services + features + testimonials + CTA
   - professional tone, medium density

2. **Landing page conversion push**
   - hero with image placeholder + benefits + pricing + FAQ + CTA
   - bold tone, concise copy

3. **Personal brand authority**
   - hero + about + benefits + testimonials + FAQ
   - friendly or premium tone, balanced density

4. **Audience-sensitive adaptation**
   - swap `targetAudience` or `audienceOverride`
   - confirm headlines, proof, and CTA framing adjust accordingly

5. **Variant coverage**
   - hero `text-only` and `with-image`
   - testimonials `single-quote` and `quote-grid`
   - CTA `banner` and `block`
   - FAQ `compact` and `expanded`
   - pricing `two-tier` and `three-tier`

6. **Weak-input fallback**
   - sparse testimonial input
   - no explicit pricing data
   - incomplete section payload from AI
   - expect placeholder-safe testimonials and pricing plus fallback recovery

7. **Targeted regeneration**
   - regenerate by `sectionTypes`
   - regenerate by `targetSectionIds`
   - verify unrelated sections remain unchanged

8. **Editor/save/preview integration**
   - add new marketing sections from editor controls
   - save edited section content
   - retrieve preview payload and generated content snapshot

## Validation checklist

- `npm run lint`
- `npm run build` with required config-layer environment variables populated
- verify no raw `process.env` usage was added outside `config/env.ts`
- verify no marketing-generation logic was added under `services/zeroflow`
- verify generated sections still flow through WebsiteStructure, layout, preview, publish, and version-aware save paths
