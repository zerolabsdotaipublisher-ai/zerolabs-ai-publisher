# Website Listing Test Scenarios

## Scenario coverage

1. **Owner-scoped listing**
   - Open `/websites` as authenticated user.
   - Verify only owned websites are returned.

2. **Default ordering**
   - Confirm websites are sorted by `updatedAt` descending (most recent first).

3. **Search by website name**
   - Search by partial title.
   - Verify only matching website names remain.

4. **Filter by lifecycle status**
   - Select each lifecycle filter and verify expected matches.

5. **Filter by publish state**
   - Select publish state values and verify records match publication metadata.

6. **Filter by website type**
   - Select website type values and verify matching records only.

7. **Include deleted toggle**
   - Confirm deleted websites are hidden by default.
   - Enable include deleted and verify deleted cards appear.

8. **Quick actions availability**
   - Verify manage, preview, edit, publish entry, schedule, and live links.
   - Verify delete and archive/activate controls work through existing flows.

9. **Empty states**
   - No websites case shows create CTA.
   - No filter matches case shows filter-specific empty state copy.

10. **Loading and error states**
    - Verify loading skeleton appears during retrieval.
    - Simulate API retrieval failure and verify error + retry action.

11. **Incremental loading**
    - With >1 page of websites, click `Load more`.
    - Verify next page appends and `hasMore` handling is correct.

12. **Responsive behavior**
    - Validate controls and card actions stack correctly on small screens.

13. **Dashboard integration**
    - From dashboard website summary, use `Manage all websites` link.
    - Verify it routes to `/websites`.

## Validation commands

Run from repository root:

- `npm run lint`
- `npm run build`
