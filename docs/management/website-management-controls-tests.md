# Website Management Controls Test Scenarios

Reference scenario IDs in `lib/management/scenarios.ts`.

1. **Action menu rendering**
   - Open `/websites` and verify each website row has action menu + quick actions.
2. **Edit/Preview/Manage routes**
   - Verify controls navigate to editor, preview, and generated details.
3. **Publish action rules**
   - Draft website shows `Publish`.
   - Website with unpublished changes shows `Publish updates`.
   - Publishing/updating states disable publish action.
4. **Publish confirmation safeguard**
   - Trigger publish action and verify confirmation dialog appears.
5. **Rename metadata**
   - Open rename dialog, update title/description, save, and verify persisted list update.
6. **Delete safeguard and result**
   - Open delete dialog, verify confirmation checkbox is required, confirm delete, verify success and listing behavior.
7. **Delete failure state**
   - Simulate delete API failure and verify explicit per-item error.
8. **Status action behavior**
   - Archive an active website and reactivate archived website.
9. **Access enforcement**
   - Attempt rename/delete on non-owned `structureId` and verify route rejection.
10. **Archived/deleted restrictions**
   - Confirm restricted controls are disabled for archived/deleted records.
11. **Settings entry point**
   - Verify settings action routes to generated-site settings anchor.
12. **Duplicate future-ready**
   - Verify duplicate action is visible but disabled.
13. **Responsive controls**
   - Validate quick actions, menu, and dialogs on mobile viewport.
14. **Regression with listing shell**
   - Confirm search/filter/list load-more states still work with controls enabled.

## Validation commands

Run from repository root:

- `npm run lint`
- `npm run build`
