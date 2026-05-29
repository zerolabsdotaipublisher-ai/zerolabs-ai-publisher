# Generated Content Storage Architecture (ZLAP-STORY 6-6)

This story hardens product-owned generated content persistence in AI Publisher for websites, pages, sections, blogs, articles, SEO metadata, scheduling metadata, version compatibility, ownership, retrieval, and lifecycle-safe archive/delete behavior.

## Architecture and ownership

- AI Publisher continues owning product-specific storage semantics in:
  - `website_structures`
  - `website_generated_content`
  - `website_seo_metadata`
  - `blog_posts`
  - `article_posts`
  - `content_schedules` + `content_schedule_runs`
  - `website_versions`
- ZeroFlow remains a shared platform layer and does not own generated-content meaning, schemas, or persistence semantics.
- No second disconnected storage system was introduced.

## Consolidation strategy

Instead of introducing duplicate tables, this story hardens existing tables with:

- lifecycle fields (`content_status`, extended structure status)
- audit fields (`created_by`, `updated_by`)
- soft archive/delete fields (`archived_at`, `deleted_at`, `is_archived`)
- retrieval/performance indexes for owner/website/type/status/time/schedule state
- lifecycle validation constraints for consistency

## Data model and lifecycle

Lifecycle states used across generated content:

- `draft`
- `generated`
- `edited`
- `scheduled`
- `published`
- `archived`
- `deleted`

Structure-level status now supports lifecycle-safe values while management metadata remains the source for soft-delete semantics.

## Access control and RLS

- Existing table-level RLS remains enabled.
- Existing owner-scoped policies on `user_id` remain enforced.
- New retrieval helpers and APIs are owner-scoped via authenticated `getServerUser()` and `structureId + userId` filters.

## Retrieval paths covered

`GET /api/content?structureId=<id>` now returns a consolidated owner bundle for:

- structure and management state (editing/dashboard)
- generated sections/pages artifacts (preview/editor)
- SEO metadata
- blog/article records (if present)
- schedule state
- version history snapshots

This supports editing, preview, publishing/scheduling visibility, management dashboards, and rollback/history inspection with one product-owned retrieval surface.

## Deletion and archival handling

- Generated content, blog, and article records now use soft-delete semantics in storage helpers.
- Website deletion (`/api/websites/delete`) archives generated content artifacts via product-owned storage helpers.
- Hard delete remains out of MVP.

## Scheduling and version compatibility

- Scheduling integration remains through `lib/scheduling/*` and persisted schedule tables.
- Version compatibility remains through `website_versions` and existing snapshot logic.
- Story 6-6 storage changes preserve existing publish/version/scheduling flows.

## Validation and integrity hardening

- `storeWebsiteGeneratedContent()` now validates package integrity before write:
  - required owner/structure identifiers
  - non-empty pages
  - unique page/section keys
- Storage write failures remain explicit (thrown + logged), preventing silent loss.

## MVP boundaries

In scope:

- reliable persistence/retrieval/update/ownership/lifecycle/archive/version/schedule compatibility

Out of scope:

- full CMS
- advanced analytics
- moving content meaning into ZeroFlow
- replacing existing blog/article/SEO/scheduling systems

## Story 6-6 task-to-file mapping

1. Define Generated Content Storage Requirements  
   - `docs/ai/generated-content-storage.md`, `docs/ai/generated-content-storage-tests.md`
2. Define Content Data Model  
   - `lib/content/types.ts`, `lib/ai/content/types.ts`, `lib/ai/structure/types.ts`
3. Design Database Schema for Generated Content  
   - `supabase/migrations/20260424000000_generated_content_storage_hardening.sql`
4. Create Database Migrations for Content Storage  
   - `supabase/migrations/20260424000000_generated_content_storage_hardening.sql`
5. Define Content Status and Lifecycle Fields  
   - `supabase/migrations/20260424000000_generated_content_storage_hardening.sql`, `lib/ai/structure/types.ts`, `lib/content/types.ts`
6. Implement Content Persistence Layer  
   - `lib/ai/content/storage.ts`, `lib/blog/storage.ts`, `lib/article/storage.ts`, `lib/ai/seo/storage.ts`, `lib/ai/structure/storage.ts`
7. Implement Initial Save for Generated Website Content  
   - `lib/ai/content/storage.ts`, existing `/api/ai/*` + `/api/marketing/*` flows
8. Implement Initial Save for Generated Blog and Article Content  
   - `lib/blog/storage.ts`, `lib/article/storage.ts`, existing `/api/blog/generate`, `/api/article/generate`
9. Implement Update Logic for Stored Generated Content  
   - `lib/ai/content/storage.ts`, `lib/blog/storage.ts`, `lib/article/storage.ts`
10. Implement Structured Storage for Sections and Components  
    - `lib/ai/content/storage.ts`, existing `WebsiteStructure` serialization
11. Implement Metadata and SEO Storage  
    - `lib/ai/seo/storage.ts`, `supabase/migrations/20260424000000_generated_content_storage_hardening.sql`
12. Implement Ownership and Access Mapping  
    - `lib/content/storage.ts`, `app/api/content/route.ts`, existing owner filters
13. Implement Row Level Security or Access Rules  
    - existing RLS policies retained; hardened tables in `supabase/migrations/20260424000000_generated_content_storage_hardening.sql`
14. Implement Content Retrieval Queries and APIs  
    - `lib/content/storage.ts`, `app/api/content/route.ts`
15. Implement Content Deletion and Archival Handling  
    - `lib/ai/content/storage.ts`, `lib/blog/storage.ts`, `lib/article/storage.ts`, `app/api/websites/delete/route.ts`, `lib/management/deletion.ts`
16. Implement Content Version Snapshot Storage  
    - existing `lib/versions/*` compatibility maintained; retrieval via `lib/content/storage.ts`
17. Implement Scheduling Data Persistence for Generated Content  
    - existing `lib/scheduling/*` storage retained; schedule linkage in `lib/content/storage.ts` and content lifecycle metadata updates
18. Implement Validation and Integrity Checks on Save  
    - `lib/ai/content/storage.ts`
19. Implement Error Handling and Recovery for Storage Operations  
    - `lib/ai/content/storage.ts`, `lib/blog/storage.ts`, `lib/article/storage.ts`, `lib/ai/seo/storage.ts`, `app/api/content/route.ts`
20. Optimize Database Indexing and Query Performance  
    - `supabase/migrations/20260424000000_generated_content_storage_hardening.sql`
21. Implement Audit Fields and Change Tracking  
    - `supabase/migrations/20260424000000_generated_content_storage_hardening.sql`, `lib/ai/content/storage.ts`, `lib/blog/storage.ts`, `lib/article/storage.ts`, `lib/ai/seo/storage.ts`, `lib/ai/structure/storage.ts`
22. Test Content Storage Across Scenarios  
    - `docs/ai/generated-content-storage-tests.md`
23. Document Generated Content Storage Architecture  
    - `docs/ai/generated-content-storage.md`
