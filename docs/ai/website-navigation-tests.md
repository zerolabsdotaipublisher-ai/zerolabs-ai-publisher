# Website Navigation Tests (ZLAP-STORY 3-5)

## Fixture coverage

`lib/ai/navigation/fixtures/*` includes:

- business-site
- portfolio
- landing-page
- personal-brand
- edge-cases (duplicate paths + nested override)

## Scenarios covered

1. Small-business defaults generate Home/About/Services/Contact menus.
2. Portfolio defaults generate Home/Projects/About/Contact menus.
3. Landing-page defaults generate Home/Features/Pricing/Contact menus.
4. Personal-brand defaults generate Home/About/Work/Contact menus.
5. Duplicate slug inputs produce unique path outputs (`/about`, `/about-1`, ...).
6. Parent override produces nested menu item hierarchy.
7. Visibility overrides hide menu entries while keeping hierarchy nodes typed.
8. Fallback navigation is returned when validation fails.
9. Primary/footer menu shape remains renderer-compatible.
10. Active-path state flags are derived deterministically in frontend helpers.

## Manual validation checklist

- Run `npm run lint`
- Run `npm run build`
- Verify `/api/ai/generate-navigation` and `/api/ai/regenerate-navigation` return typed navigation + hierarchy payloads
- Verify generated-site page supports `?page=/about` style navigation state
- Verify no new raw `process.env` usage in changed files
