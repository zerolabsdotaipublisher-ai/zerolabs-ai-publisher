# Publish and Update Controls Test Scenarios (ZLAP-STORY 4-5)

## Scope

Validate publication lifecycle state, controls, validation, permissions, delivery URL handling, and status indicators across editor/preview/generated-site surfaces.

## End-to-end scenarios

1. **First publish**
   - Open editor for draft-only structure
   - Publish from publish controls
   - Verify status is `published`, live URL appears, timestamps update

2. **Update published website**
   - Start from published structure
   - Save draft edits in editor
   - Verify state becomes `update_pending`
   - Run update and verify state returns to `published`

3. **Unsaved changes blocked**
   - Edit content without saving in editor
   - Verify publish action is blocked with unsaved warning

4. **Validation blocked**
   - Create invalid draft (for example invalid slug or missing visible section)
   - Verify publish action is blocked and validation errors render

5. **Publish failure and retry**
   - Simulate publish failure path
   - Verify `update_failed` state and failure message
   - Retry and verify successful recovery

6. **Permission denied**
   - Attempt publish API with unauthorized user/session
   - Verify 401/permission error and no publication mutation

7. **Live link handling**
   - Publish successfully
   - Verify live URL appears in controls and opens generated live path

8. **Cross-surface status indicators**
   - Verify consistent badge state in editor, preview owner mode, and generated-site page

## References

- Scenario catalog: `lib/publish/scenarios.ts`
- Publish APIs: `app/api/publish/*`
- Publish controls: `components/publish/*`
- Publication state logic: `lib/publish/*`
