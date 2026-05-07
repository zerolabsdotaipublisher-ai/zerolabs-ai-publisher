# AI Generated Content Editing (ZLAP-STORY 9-2)

## Scope

This MVP adds owner-scoped editing for AI-generated:

- website/page content
- blog posts
- articles
- social posts

Editing is implemented inside AI Publisher and reuses existing storage, review, versioning, preview, regeneration, and publishing systems.

## Routes

- UI: `/edit/[contentId]`
- API:
  - `GET/PATCH /api/edit/[contentId]`
  - `POST /api/edit/[contentId]/save`
  - `POST /api/edit/[contentId]/autosave`

## Editing UX

- Inline text editing for title/summary/body
- Rich text helper controls (bold, italic, heading, list, link)
- Section/block editing
- Media URL/reference replacement
- Metadata/SEO editing (slug, title, description, keywords, tags, canonical)
- Manual save + lightweight autosave
- Loading/saving/autosaved/unsaved/error states
- Responsive two-column layout

## Workflow Integration

- Draft saves persist through existing content storage modules:
  - website: `lib/editor/storage.saveEditorStructureDraft`
  - blog: `lib/blog/upsertBlogPost`
  - article: `lib/article/upsertArticle`
  - social: `lib/social/upsertSocialPost`
- Edit save re-enters review workflow:
  - approved/published -> `pending_review`
  - rejected/needs_changes -> `needs_changes`
- Version integration:
  - website uses existing version snapshot creation
  - blog/article/social use future-ready snapshot hook model via version increments and metadata support

## Validation

Required fields validated on server-side:

- title
- content body/summary/sections presence
- section-level heading/body for structured content
- SEO title + description

Domain validators are reused before persistence:

- `validateGeneratedBlogPost`
- `validateGeneratedArticle`
- `validateGeneratedSocialPost`
- existing editor validation for website structures

## MVP Boundaries

- Not a collaborative CMS/editor suite
- No full media library upload flow (reference replacement only)
- No duplicate publishing pipeline
- No editing logic moved to `services/zeroflow`
- Undo/redo marked future-ready only
