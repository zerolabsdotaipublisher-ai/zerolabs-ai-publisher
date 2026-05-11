# Website Media Library Test Scenarios

## Happy path
- Upload an image to a website-specific library and verify the item appears in list/grid views.
- Confirm `/preview` returns a signed URL and no raw storage object path.
- Select an asset from the website media selector dialog and verify editor insertion receives a signed URL.

## Filtering and organization
- Search by display name, description, or alt text.
- Filter by media type and tag.
- Confirm archived/deleted states can be browsed intentionally.

## AI asset integration
- Register an AI-generated asset through story 10-2 flow.
- Load website media library and confirm the asset is synced as a reusable library item without duplicate upload.

## Usage tracking and deletion safety
- Record usage for website/page/section insertion.
- Attempt delete on an in-use item and verify archive behavior instead of hard delete.
- Delete an unused item and verify existing media/AI asset deletion workflows are reused.

## Access control
- Unauthenticated requests return 401.
- Cross-user or wrong-website access returns not found/forbidden behavior.
- Queries remain owner/tenant-scoped.

## Responsiveness and empty/error states
- Verify grid/list usage on narrow and wide layouts.
- Confirm empty state renders when no media exists.
- Confirm API errors surface actionable feedback in the shell.

## Validation
- Reject unsupported MIME types via existing media validation.
- Reject invalid tags or malformed website/content/page/section references.
