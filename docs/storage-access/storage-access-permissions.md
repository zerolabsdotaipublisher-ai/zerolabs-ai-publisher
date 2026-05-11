# Storage Access Permissions (ZLAP-STORY 10-5)

## Architecture

AI Publisher owns storage permission workflows, ownership validation, signed URL rules, website visibility checks, permission-aware UI behavior, and audit logging. This story builds on the existing media, AI asset, website media library, and file upload systems without introducing a duplicate storage platform or moving product-specific logic into `services/zeroflow`.

## Permission requirements

Centralized storage access evaluation now supports:
- upload
- read/view
- preview
- download
- signed URL generation
- update/replace
- delete
- manage

Supported actors:
- authenticated users
- tenant-scoped owner/admin/editor/content-user roles (still owner-scoped in the current product model)
- explicit service roles for AI generation, publishing, cleanup, and storage processing
- anonymous/public readers for published website media only

## Ownership and resource model

Resources covered by the storage access layer:
- `media`
- `file_upload`
- `ai_asset`
- `website_media`

Ownership resolution uses the existing records and associations already stored in AI Publisher:
- `user_id` + `tenant_id`
- linked website/content references
- media/file upload/AI asset relationships
- website publication state for public/private behavior

## Permission matrix

| Operation | Owner user | Published website public reader | Service role (scoped) |
| --- | --- | --- | --- |
| Upload | Yes | No | Role-dependent |
| Read/View | Yes | Published website media only | Role-dependent |
| Preview | Yes | Published website media only | Role-dependent |
| Download | Yes | Published website media only | Role-dependent |
| Signed URL generation | Yes | Published website media only with short TTL | Role-dependent |
| Update | Yes | No | Role-dependent |
| Replace | Yes | No | Role-dependent |
| Delete | Yes | No | Role-dependent |
| Manage | Yes | No | Role-dependent |

## Public vs private strategy

- Draft assets remain private.
- Preview-only assets remain private.
- Published website media can be treated as public-readable through short-lived signed URLs.
- Raw bucket/object keys remain server-only.
- Public access is granted only for read/preview/download/signed URL operations.

## Tenant and environment isolation

- Object namespaces remain under `tenant/{tenantId}/ai-publisher/...`.
- Permission checks verify tenant scope before access is granted.
- New storage metadata records carry `environmentStage` so runtime checks can reject cross-environment access where metadata is available.
- Existing environment separation still relies on per-environment config/service credentials and namespace discipline.

## Service/system access rules

Explicit scoped service roles are supported:
- `ai_generation_worker`
- `publishing_worker`
- `cleanup_job`
- `storage_processing`

These roles use the centralized permission layer and are audit-logged independently from end-user actions.

## Audit and logging

Structured logs and audit rows capture:
- uploads
- downloads
- signed URL generation
- replacements
- deletions
- permission denials
- service/system access actions

Audit persistence is stored in `storage_access_audit_logs`.

## APIs

- `POST /api/storage-access/check`
- `GET /api/storage-access/[resourceId]/permissions?resourceType=...`

These routes support frontend permission-aware behavior and backend policy introspection without duplicating authorization logic.

## Exact task-to-file mapping (1-21)

1. Define Storage Access Permission Requirements → `docs/storage-access/storage-access-permissions.md`, `lib/storage-access/scenarios.ts`
2. Define Storage Ownership and Resource Model → `lib/storage-access/types.ts`, `lib/storage-access/ownership.ts`
3. Define Permission Matrix for Storage Operations → `lib/storage-access/policies.ts`, `docs/storage-access/storage-access-permissions.md`
4. Define Public vs Private Storage Access Strategy → `lib/storage-access/public-private.ts`, `docs/storage-access/storage-access-permissions.md`
5. Define Environment and Tenant Isolation Rules → `lib/storage-access/ownership.ts`, `docs/storage-access/storage-access-permissions.md`, `lib/media/workflow.ts`
6. Implement Storage Access Policy Architecture → `lib/storage-access/workflow.ts`, `lib/storage-access/permissions.ts`, `lib/storage-access/index.ts`
7. Configure Upload Permissions → `lib/storage-access/policies.ts`, `lib/storage-access/permissions.ts`, upload API/routes/workflows
8. Configure Read and Download Permissions → `lib/storage-access/policies.ts`, media/AI asset/website media workflows and routes
9. Configure Update and Replace Permissions → `lib/storage-access/policies.ts`, `lib/ai-assets/workflow.ts`, website media update flows
10. Configure Delete Permissions → `lib/storage-access/policies.ts`, media/file upload/AI asset/website media workflows
11. Implement Signed URL Permission Rules → `lib/storage-access/signed-urls.ts`, `lib/media/workflow.ts`, website media preview route/workflow
12. Implement Service Role and System Access Rules → `lib/storage-access/rbac.ts`, `lib/storage-access/policies.ts`, storage access API routes
13. Integrate Storage Permissions with Authentication and RBAC → `lib/media/permissions.ts`, `lib/file-upload/permissions.ts`, `lib/ai-assets/permissions.ts`, `lib/website-media-library/permissions.ts`
14. Implement Ownership Validation on Storage Operations → `lib/storage-access/ownership.ts`, relevant workflows
15. Implement Access Control for Website and Published Asset Scenarios → `lib/storage-access/public-private.ts`, `lib/website-media-library/workflow.ts`, website media preview route
16. Implement Logging and Audit Trails for Storage Access → `lib/storage-access/audit.ts`, `supabase/migrations/20260511060000_storage_access_permissions.sql`
17. Implement Error Handling for Permission Denials → `lib/storage-access/errors.ts`, storage/media/file/asset routes
18. Implement Frontend Permission-Aware Behavior → media, AI asset, file upload, and website media UI components/types
19. Test Storage Access Permissions Across Scenarios → `docs/storage-access/storage-access-tests.md`
20. Review and Optimize Storage Permission Model → `lib/storage-access/policies.ts`, `lib/storage-access/signed-urls.ts`
21. Document Storage Access Permission Architecture → `docs/storage-access/storage-access-permissions.md`

## MVP boundaries

Included:
- centralized storage policy checks for requested MVP operations
- owner-scoped and published-website access behavior
- service-role rules for internal workflows
- structured denial responses
- frontend permission-aware affordances
- audit logging for critical storage operations

Excluded:
- enterprise IAM platform
- cross-product centralized policy engine
- external policy service
- advanced ABAC/compliance governance
