# Website SEO Test Coverage (ZLAP-STORY 3-6)

## Use-case matrix

- small-business fixture -> fallback package generation -> valid site/page metadata
- portfolio fixture -> multi-page metadata coverage
- landing-page fixture -> conversion-oriented title/description behavior
- personal-brand fixture -> tone-aware fallback metadata
- edge-case fixture -> fallback safety for missing/irregular inputs

## Validation checklist

- schema validation catches missing title/description/canonical/open graph
- semantic validation enforces length and absolute canonical URLs
- override application updates site/page metadata without dropping required fields
- storage serializes/deserializes site + page rows correctly
- metadata retrieval returns latest version snapshot

## Frontend checks

- generated site page calls Next.js `generateMetadata`
- metadata uses generated SEO package when present
- page-level fallback uses structure/page SEO when SEO package is missing
- canonical and Open Graph are injected into head metadata object

## API checks

- `POST /api/ai/generate-seo` generates and stores metadata for existing structure
- `POST /api/ai/regenerate-seo` regenerates metadata with version increment
- existing generation routes continue returning structure/content/navigation and now include SEO payload

## Manual validation commands

- `npm install`
- `npm run lint`
- `npm run build`
- verify no raw `process.env` access outside `config/*`
