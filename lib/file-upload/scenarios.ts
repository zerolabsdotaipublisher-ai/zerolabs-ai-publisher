export const fileUploadScenarios = [
  "Upload single or multiple files from media library, website editing, social publishing, and content management contexts.",
  "Validate file type and size client-side before submission and server-side before storage.",
  "Track upload lifecycle from selected through uploaded, failed, or canceled states.",
  "Associate uploaded files with website, page, section, social post, or content records without exposing raw storage paths.",
  "Retry failed uploads without duplicating storage provider logic or bypassing ownership checks.",
  "Delete uploaded files through AI Publisher-owned cleanup workflows that reuse existing media deletion behavior.",
];

export const FILE_UPLOAD_MVP_BOUNDARIES = [
  "Included: reusable upload UI, backend upload orchestration, signed access, retry support, association tracking, deletion hooks, docs/tests.",
  "Excluded: enterprise DAM governance, CDN orchestration, billing engine work, collaborative file governance, new ZeroFlow services.",
];
