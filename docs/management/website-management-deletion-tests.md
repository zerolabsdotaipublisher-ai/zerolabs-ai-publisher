# Website Management and Deletion Test Scenarios

## Scenario coverage

Reference scenario IDs in `lib/management/scenarios.ts`.

1. **List websites**
   - Open `/websites`
   - Verify owned websites load with status, timestamps, and quick actions

2. **Search and filter**
   - Search by title/description fragments
   - Filter by status values and confirm visible result changes

3. **Rename metadata**
   - Open rename panel
   - Update title/description
   - Verify immediate list update and persistence after refresh

4. **Open detail actions**
   - From list item open generated detail, preview, and editor
   - If published, open live URL

5. **Delete confirmation and state**
   - Trigger delete action
   - Confirm dialog appears with destructive messaging
   - Confirm deletion and verify deleting state + disabled controls

6. **Delete failure and retry path**
   - Simulate API failure response
   - Verify explicit error state remains visible and retry is possible

7. **Ownership enforcement**
   - Attempt API mutation with non-owned `structureId`
   - Verify route rejects mutation and data remains unchanged

8. **Soft delete visibility behavior**
   - Delete a website
   - Verify default list hides it
   - Enable include-deleted filter and verify it appears with deleted badge

9. **Status badge correctness**
   - Validate badges for draft/published/update-pending/archived/deleted states

## Validation commands

Run from repository root:

- `npm run lint`
- `npm run build`
