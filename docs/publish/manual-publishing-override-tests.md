# Manual Publishing Override Test Scenarios (ZLAP-STORY 9-6)

## Scope

Validate manual override permissions, confirmation safeguards, publishing/scheduling/approval integrations, audit metadata, and UI status indicators.

## Scenarios

1. **Urgent website publish**
   - Trigger manual override with valid reason/scenario on unpublished structure.
   - Verify immediate publish success and override status indicator.

2. **Hotfix update for live site**
   - Trigger override on already-published structure.
   - Verify update action path is used and publish metadata updates.

3. **Scheduled content bypass**
   - Ensure structure has active next run in content schedule.
   - Trigger override and verify schedule is paused/cleared to prevent duplicate execution.

4. **Approval gate blocked without bypass**
   - Use content/structure in non-approved state.
   - Trigger override without bypass flag and verify request is blocked.

5. **Approval bypass authorized**
   - Use admin/authorized approver role.
   - Trigger override with bypass approval and verify success with bypass metadata recorded.

6. **Approval bypass unauthorized**
   - Use owner-only role without bypass capability.
   - Attempt bypass approval and verify forbidden response.

7. **Social override (Instagram-supported path)**
   - Trigger manual override for social post with Instagram variant and connected account.
   - Verify publish job/history is created and social schedule (if any) is canceled.

8. **Audit trail persistence**
   - Verify `publish_manual_override_audit` contains required fields:
     - `override_used`
     - `override_reason`
     - `override_timestamp`
     - `override_user_id`
     - `bypassed_workflows`
     - `target_content_id`
     - `target_content_type`

9. **UI state handling**
   - Verify manual override button/dialog loading state.
   - Verify success/error messages surface correctly.

10. **Access control UI behavior**
    - Verify override controls are hidden/disabled when API reports no override permission.
    - Verify bypass checkbox is disabled when bypass permission is false.

## Validation commands

- `npm run lint`
- `npm run build`

## References

- API: `app/api/publish/override/route.ts`
- Domain: `lib/publish/override/*`
- UI: `components/publish/manual-override-*.tsx`, `components/publish/publish-controls.tsx`
- Audit migration: `supabase/migrations/20260507120000_publish_manual_override_audit.sql`
