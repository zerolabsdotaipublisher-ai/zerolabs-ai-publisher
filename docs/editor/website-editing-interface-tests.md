# Website Editing Interface Test Scenarios (ZLAP-STORY 4-4)

## Scope

Validate editor route behavior, typed boundaries, preview updates, storage saves, validation, unsaved-change handling, responsive behavior, and accessibility.

## Core scenarios

1. **Load existing website**
   - Open `/editor/{id}` as owner
   - Verify structure loads and selectors initialize
   - Verify renderer canvas displays the selected page

2. **Edit text content**
   - Select section and modify heading/body/CTA fields
   - Confirm preview updates without full page reload
   - Confirm draft state is marked dirty

3. **Toggle section visibility**
   - Hide/show a section using section controls
   - Verify canvas reflects visibility changes immediately

4. **Reorder sections**
   - Move sections up/down in the selected page
   - Verify section order and preview order update
   - Save and confirm persisted order after reload

5. **Add and remove sections**
   - Add supported section types
   - Remove optional sections
   - Verify required-section guard prevents invalid removals

6. **Edit page settings**
   - Update page title, slug, visibility, and navigation label
   - Validate slug format errors are shown on invalid values

7. **Edit navigation**
   - Rename navigation labels
   - Reorder primary navigation
   - Toggle inclusion/exclusion in primary menu

8. **Edit style/theme entry points**
   - Change tone/style, layout template, and theme mode
   - Verify renderer data state updates in canvas

9. **Save draft**
   - Click save draft
   - Verify success status, dirty cleared, and persisted data loads on refresh

10. **Unsaved-change warning**
    - Make edits without saving
    - Attempt to close/refresh tab
    - Confirm browser unsaved-change warning appears

11. **Validation + error handling**
    - Trigger validation failures (invalid slug, invalid section state)
    - Confirm save blocks and error panel shows details

12. **Responsive + accessibility**
    - Verify sidebar/canvas/panels stack on small screens
    - Verify all controls are keyboard reachable and properly labeled
    - Verify save/error messages announce via `aria-live`

## Scenario references

- Scenario definitions: `lib/editor/scenarios.ts`
- Editor shell: `components/editor/website-editor-shell.tsx`
- Save API: `app/api/editor/save/route.ts`
- Reorder API: `app/api/editor/reorder-sections/route.ts`
- Navigation API: `app/api/editor/update-navigation/route.ts`
