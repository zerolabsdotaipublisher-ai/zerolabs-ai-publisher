# Website Management and Deletion (ZLAP-STORY 4-6)

## Scope and Requirements

This story extends the existing generated website lifecycle owned by AI Publisher (Layer 1 product app). It reuses existing website records (`WebsiteStructure`) and existing preview/editor/publish flows.

### MVP management actions
- View generated website detail
- Open preview
- Open editor
- Check live URL/publish visibility
- Rename website title
- Edit lightweight listing description metadata
- Archive/activate status action
- Soft delete with confirmation and safeguards

### Multi-website support expectations
- List all owned websites in one management surface
- Support name search and status filtering
- Surface key timestamps and status badges per website

### Status visibility
- Lifecycle status shows publish-aware states (`draft`, `published`, `update_pending`, etc.)
- Archived status remains visible
- Deleted is represented via management metadata and excluded by default from listings

### User workflow
1. Open `/websites`
2. Search/filter list
3. Use quick actions (view, preview, edit, live)
4. Rename/update metadata or change status
5. Delete via confirmation dialog
6. See success/failure feedback and updated list state

### MVP boundaries
- Soft delete only in normal flow (recoverable foundation retained)
- Hard delete intentionally disabled
- Bulk actions kept as typed foundation with disabled UI placeholders

## Data Model

Website management metadata is stored on the existing `WebsiteStructure` record via optional `management` fields:
- `displayName`
- `description`
- `deletedAt`
- `deletedBy`
- `deletionState`

No parallel website model is introduced.

## Backend Integration

Routes:
- `GET /api/websites/list`
- `POST /api/websites/rename`
- `POST /api/websites/status`
- `POST /api/websites/delete`

All routes require an authenticated user and validate ownership before mutation.

## Deletion Strategy

- Default strategy: **soft delete**
- Soft delete marks management metadata and archives the website
- Deleted websites are hidden from default list results unless `includeDeleted=true`
- Hard delete route path exists only as guarded foundation and returns an error for MVP

## Security and Ownership

Ownership checks run in API handlers using existing storage ownership scoping (`getWebsiteStructure(id, userId)`) and management ownership helpers. Unauthorized resources return not found/unauthorized and are never mutated.

## Search and Filtering

- Search: title, description, and ID
- Filter: all supported management lifecycle statuses
- Sort: newest `updatedAt` first

## Responsive UI

Management shell, controls, bulk-foundation panel, and list items are responsive with stacked controls/actions on small screens.

## Bulk Actions Foundation

Bulk selection state is implemented for multiple websites. Bulk destructive actions are intentionally disabled in MVP and documented for future activation.
