# Website Listing (ZLAP-STORY 8-2)

## Scope and Requirements

This story delivers a dashboard-aligned website listing MVP in AI Publisher using existing website management, publishing, scheduling, and ownership systems.

### Included in MVP
- Owner-scoped website listing at `/websites`
- Server-side ownership validation and user-scoped retrieval
- Search by website name
- Filters for lifecycle status, publish state, and website type
- Default sorting by most recently updated websites
- Incremental loading (`Load more`) for larger datasets
- Website cards showing:
  - website name
  - lifecycle status
  - publish state
  - website type
  - updated/published timestamps
  - schedule and social signal indicators
- Quick actions:
  - edit
  - preview
  - manage/open details
  - publish entry point
  - schedule link
  - delete (existing deletion flow)
  - archive/activate status toggle
- Empty, loading, and error/retry states
- Responsive controls and list card behavior
- Dashboard integration link to manage all websites

### Architecture alignment
- Website listing logic remains in AI Publisher (`lib/management`, `app/api/websites/list`, management components)
- No website listing logic was moved into `services/zeroflow`
- Existing website/storage/ownership and publish systems were reused
- No duplicate website management system was created

## Data Model

Listing records continue to reuse `WebsiteManagementRecord` derived from existing `WebsiteStructure` with additional listing fields:
- `websiteType`
- `publicationState`
- lifecycle status from existing publish/status model
- existing schedule summary metadata when available

Listing API now returns paginated metadata:
- `websites`
- `total`
- `page`
- `perPage`
- `hasMore`

## API

`GET /api/websites/list`

Supported query params:
- `query` (website name search)
- `status`
- `publishState`
- `websiteType`
- `includeDeleted`
- `page`
- `perPage`

All reads are authenticated and user-owned via server-side user resolution.

## MVP Boundaries

- This is listing and quick-action MVP only, not a full CMS.
- Bulk destructive actions remain intentionally disabled.
- Advanced analytics/reporting and cross-tenant workspace models are out of scope.
