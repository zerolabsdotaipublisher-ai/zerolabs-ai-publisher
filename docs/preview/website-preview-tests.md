# Website Preview Test Scenarios (ZLAP-STORY 4-3)

## Scope

Validate preview route behavior, rendering reuse, controls, responsive modes, security, and generation handoff.

## Core scenarios

1. **Generation handoff**
   - Generate from `/generate`
   - Confirm success link opens `/preview/{id}`
   - Confirm generated structure renders with existing renderer

2. **Multi-page navigation**
   - Use page selector to switch among generated pages
   - Use in-renderer navigation links
   - Confirm selected page remains in URL query (`page`)

3. **Responsive modes**
   - Switch desktop -> tablet -> mobile
   - Confirm device frame classes update and content remains renderable
   - Confirm page selection is preserved while switching modes

4. **Loading and error**
   - Load preview route with normal data and verify loading state is visible first
   - Trigger rendering error path and confirm safe preview error UI
   - Confirm no unhandled crash/blank page

5. **Owner security**
   - Access own `/preview/{id}` as authenticated owner -> allowed
   - Access another user’s structure id -> denied (not found)

6. **Share flow**
   - Create share link via preview toolbar
   - Open `/preview/share/{token}` -> read-only preview
   - Test expired/invalid token -> denied

7. **Refresh/live foundation**
   - Click refresh preview control
   - Confirm refresh query key (`r`) changes and render updates

## Scenario references

- Scenario definitions: `lib/preview/scenarios.ts`
- Owner route: `app/preview/[id]/page.tsx`
- Shared route: `app/preview/share/[token]/page.tsx`
- Share API: `app/api/preview/share/route.ts`
- Resolve API: `app/api/preview/resolve/route.ts`
