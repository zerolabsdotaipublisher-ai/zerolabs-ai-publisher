# Storage Access Permission Test Coverage (ZLAP-STORY 10-5)

## Manual/backend scenarios

1. Authenticated owner can upload media/file/website assets within the resolved tenant scope.
2. Suspended or blocked users receive structured permission-denied responses for upload attempts.
3. Owner can read, preview, download, sign, replace, and delete owned storage records.
4. Cross-tenant or cross-owner access returns structured 403 responses instead of silent failures.
5. Draft website media preview remains authenticated/private.
6. Published website media preview can be resolved anonymously through short-lived signed URLs.
7. Service-role requests are limited to the configured operation matrix.
8. Signed URL generation uses centralized permission checks and short TTLs for public access.
9. Delete flows continue to soft-delete metadata and reuse existing media cleanup logic.
10. Permission-aware UI hides or disables unauthorized upload/delete/update actions while backend enforcement remains authoritative.

## Validation commands

- `npm run lint`
- `npm run build`
