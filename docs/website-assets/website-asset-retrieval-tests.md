# Website Asset Retrieval Test Notes

## Validated commands

- `npm run lint`
- `npm run build`

## Retrieval scenarios covered

1. **Published live delivery**
   - canonical website asset routes exist under `/api/website-assets/[assetId]`
   - published assets can be served through the website asset render route without exposing object keys

2. **Owner editor / preview delivery**
   - editor media selection stores canonical website asset render URLs
   - owner-authenticated editor/preview flows continue to render those URLs through the protected app route

3. **Shared preview delivery**
   - shared preview pages append the preview token to canonical website asset URLs before rendering
   - preview-token checks validate website ownership/association before allowing private asset delivery

4. **Context resolution**
   - resolve/list endpoints support asset id, library item id, media id, AI asset id, website id, and content/page/section context filters

5. **Fallback behavior**
   - missing or denied render-route requests fall back to `/file.svg`
   - fallback behavior is isolated to the asset request so the page render can continue

6. **Performance safeguards**
   - retrieval lookups stay metadata-only
   - direct signed URL responses use cache entries and DB indexes added by the migration

## Known manual follow-up checks

- Exercise `/api/website-assets/[assetId]/url?surface=social` with a real protected asset if social publishing starts consuming website asset URLs directly.
- Add end-to-end browser tests once the repo has automated coverage for editor/preview/live image rendering.
