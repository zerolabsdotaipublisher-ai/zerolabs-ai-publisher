# Website Management Controls (ZLAP-STORY 8-4)

## Scope

Story 8-4 adds reusable per-website management controls inside AI Publisher, reusing existing website listing, publish/update, preview, editor, rename, status, and delete systems.

## Requirements and Access Rules

- Controls are owner-scoped and run only on owned websites.
- Delete/rename routes enforce ownership and explicit permission checks.
- Deleted websites are restricted from mutable actions.
- Archived websites keep limited controls and block publish/update.
- Publish actions are status-based:
  - Draft/unpublished-like state: `Publish`
  - Unpublished changes: `Publish updates`
  - Transitional publish/update: disabled
- Critical actions require safeguards:
  - Publish/publish-updates confirmation dialog
  - Delete confirmation with explicit acknowledgement checkbox

## UI Design

- Reusable action menu (`WebsiteActionMenu`) for per-item controls.
- Unified action surface (`WebsiteManagementActions`) combining quick links and menu actions.
- Rename metadata dialog (`WebsiteRenameDialog`).
- Delete confirmation dialog (`WebsiteDeleteDialog`).
- Settings/advanced entry (`WebsiteSettingsEntry`) routed to existing generated-site details/settings anchor.

## Backend Integration

- Reuses existing APIs:
  - `/api/publish`
  - `/api/publish/update`
  - `/api/websites/delete`
  - `/api/websites/rename`
  - `/api/websites/status`
- New management control logic lives in `lib/management` (`actions`, `permissions`, `controls`, `scenarios`).

## Task-to-File Mapping (1-21)

1. Define Website Management Control Requirements  
   - `docs/management/website-management-controls.md`
2. Define Management Control Permissions and Access Rules  
   - `lib/management/permissions.ts`, `app/api/websites/delete/route.ts`, `app/api/websites/rename/route.ts`
3. Design Website Management Control UI  
   - `components/management/website-management-actions.tsx`, `components/management/website-action-menu.tsx`
4. Implement Reusable Action Menu Component  
   - `components/management/website-action-menu.tsx`
5. Implement Edit Website Control  
   - `components/management/website-management-actions.tsx`
6. Implement Preview Website Control  
   - `components/management/website-management-actions.tsx`
7. Implement Publish and Update Controls  
   - `components/management/website-management-actions.tsx`, `components/management/website-management-shell.tsx`, `lib/management/controls.ts`, `lib/management/actions.ts`
8. Implement Delete Website Control  
   - `components/management/website-delete-dialog.tsx`, `components/management/website-management-shell.tsx`, `app/api/websites/delete/route.ts`
9. Implement Duplicate Website Control optional/future-ready  
   - `components/management/website-management-actions.tsx`, `lib/management/scenarios.ts`
10. Implement Rename and Metadata Editing Control  
   - `components/management/website-rename-dialog.tsx`, `components/management/website-management-shell.tsx`, `app/api/websites/rename/route.ts`
11. Implement Settings and Advanced Controls Entry Point  
   - `components/management/website-settings-entry.tsx`, `components/management/website-management-actions.tsx`
12. Implement Status-Based Control Behavior  
   - `lib/management/controls.ts`, `components/management/website-management-actions.tsx`
13. Implement Confirmation and Safeguards for Critical Actions  
   - `components/management/website-delete-dialog.tsx`, `components/management/website-management-actions.tsx`
14. Integrate Controls with Backend APIs  
   - `components/management/website-management-shell.tsx`
15. Implement Loading and Action States  
   - `components/management/website-management-shell.tsx`, `components/management/website-list.tsx`, `components/management/website-list-item.tsx`
16. Implement Error Handling for Management Actions  
   - `components/management/website-management-shell.tsx`, `components/management/website-management-actions.tsx`
17. Implement Access Control Enforcement in UI  
   - `lib/management/permissions.ts`, `lib/management/controls.ts`, `components/management/website-management-actions.tsx`
18. Implement Responsive Behavior for Controls  
   - `app/globals.css`
19. Test Website Management Controls Across Scenarios  
   - `lib/management/scenarios.ts`, `docs/management/website-management-controls-tests.md`
20. Optimize Performance of Management Actions  
   - `components/management/website-management-shell.tsx` (targeted per-item loading/error state, existing list polling/list refresh reuse)
21. Document Website Management Controls  
   - `docs/management/website-management-controls.md`, `docs/management/website-management-controls-tests.md`

## MVP Boundaries

- No new CMS or parallel management domain was introduced.
- Duplicate remains disabled future-ready UI only.
- Bulk destructive actions remain intentionally disabled.
- Existing publish/update and website management backends are reused.
