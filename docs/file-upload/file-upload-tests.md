# File Upload Capability Test Scenarios

## Happy path
- Upload a single file from the shared media upload panel and confirm the response includes upload metadata, media metadata, and a signed URL.
- Upload a file from website media library and confirm the returned item appears in the website media list with no raw storage path.
- Upload media from the social post editor and verify the selected variant keeps the signed media reference.
- Upload media from content management and confirm references are added to the editor draft.

## Multi-file and progress
- Upload multiple files through the shared file upload panel and confirm each file shows its own progress and status.
- Verify successful uploads move from selected → validating → uploading → uploaded.

## Validation and retry
- Try an unsupported file type and confirm client-side rejection before upload.
- Try a zero-byte or oversize file and confirm client-side rejection.
- Force a server-side failure and confirm the upload row returns `failed` and can be retried.

## Associations and secure access
- Upload with website/page/section context and confirm association rows are stored owner-scoped.
- Confirm `/api/file-upload/[fileId]/signed-url` returns a short-lived signed URL and never bucket/object-key values.
- Confirm `/api/file-upload/[fileId]` returns structured upload metadata and association summaries.

## Access control
- Unauthenticated requests to file upload routes return 401.
- Cross-user file detail, signed URL, and delete requests do not expose another owner’s uploads.
- Tenant-scoped uploads continue using `tenant/{tenantId}/ai-publisher/...` object namespaces.

## Deletion and cleanup
- Delete an uploaded file and confirm the existing media deletion workflow is reused.
- Delete a website media upload and confirm website media metadata is updated without orphaning upload records.

## Monitoring
- Confirm upload logs capture attempts, success/failure, file size, source, and retry count.
- Confirm batch uploads return per-file success/failure results without failing the whole request body.
