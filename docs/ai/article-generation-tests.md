# AI Article Generation Test Matrix

## Scenario coverage

### Article types

- `guide` — SaaS educational article
- `thought-leadership` — founder opinion article
- `news-style` — short update article
- `long-form-article` — extended B2B explainer

### Editorial controls

- tone variation: professional, friendly, premium
- depth variation: overview, strategic, expert
- length variation: short, medium, long, extended
- outline present vs outline omitted
- references enabled vs disabled

### Workflow coverage

- initial generation
- full regeneration
- section regeneration
- preview response generation
- manual save after edits
- routeable article page creation
- structure persistence and artifact persistence
- version snapshot compatibility
- static validation compatibility

## Manual validation steps

1. Submit `articleGenerationScenarios` inputs to `POST /api/article/generate`.
2. Confirm the response includes:
   - structured article JSON
   - preview path
   - mapped `WebsiteStructure`
   - validation error list
3. Open `GET /api/article/preview` for the returned `structureId` and verify:
   - article index page renders
   - article detail page renders
   - references render when present
4. Edit the article and submit to `POST /api/article/save`.
5. Regenerate a single section with `POST /api/article/regenerate` and confirm only the targeted section changes.
6. Publish through the existing website publish workflow and confirm the structure remains deployable.

## Edge cases

- minimal required input with no outline
- outline longer than allowed max
- references requested but omitted by the AI response
- AI response missing subtitle or thin sections
- fallback generation when structured JSON fails
- long article size approaching SSG page-data warning threshold

## Expected outcomes

- article schema remains valid after generate, edit, and regenerate flows
- article metadata and SEO remain present after normalization
- article pages stay routeable and previewable inside the existing website system
- article logic remains product-owned and outside ZeroFlow
