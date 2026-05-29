export const storageAccessScenarios = [
  "Uploads stay owner- and tenant-scoped, with backend-enforced permission checks before storage writes.",
  "Draft website assets remain private and rely on signed URLs for preview/read access.",
  "Published website media may allow public read/preview/download through short-lived signed URLs without public bucket exposure.",
  "AI assets, uploads, and media records reuse centralized storage access evaluation for read, replace, delete, and manage flows.",
  "Service roles are scoped to explicit worker use cases and audited separately from end-user actions.",
  "Permission denials, signed URL generation, replacements, deletions, and service access actions are logged and audit-persisted.",
] as const;

export const STORAGE_ACCESS_MVP_BOUNDARIES = [
  "Included: centralized storage permission evaluation, ownership validation, signed URL rules, audit logging, API checks, and permission-aware UI behavior.",
  "Excluded: enterprise IAM, cross-product policy engines, external policy services, and advanced ABAC/compliance platforms.",
] as const;
