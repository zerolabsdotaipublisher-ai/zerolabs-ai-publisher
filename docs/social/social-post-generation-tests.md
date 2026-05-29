# Social Post Generation Test Matrix

## Scenario coverage

### Platforms

- Facebook
- Instagram
- X
- LinkedIn

### Input modes

- topic + keyword only
- topic + keyword + optional URL
- source from blog structure
- source from article structure
- source from website structure
- custom source snapshot only

### Workflow coverage

- initial generation
- full regeneration
- single-platform regeneration
- preview response generation
- manual save after edits
- list by owner
- list by structure filter
- archive propagation via generated content bundle delete flow

## Manual validation steps

1. Submit `socialGenerationScenarios` to `POST /api/social/generate`.
2. Confirm each response contains one variant for each requested platform.
3. Confirm hashtag counts and caption lengths obey platform limits.
4. Use `GET /api/social/preview?postId=<id>` and verify platform preview cards.
5. Edit caption/hashtags/CTA/link through `POST /api/social/save` and verify persisted output.
6. Regenerate all variants with `POST /api/social/regenerate`.
7. Regenerate one platform variant with `POST /api/social/regenerate` and `platform` set.
8. Retrieve list with `GET /api/social/list` and `GET /api/social/list?structureId=<id>`.
9. Validate generated content bundle API includes social posts for linked structures.

## Edge cases

- invalid or missing required input fields
- invalid optional URL format
- AI output missing one or more platform variants
- AI output exceeding platform limits
- source structure not found fallback behavior
- Instagram link stripped due platform support rules
- duplicate hashtags deduped during normalization

## Expected outcomes

- social variants remain valid after generate/edit/regenerate
- fallback generation always returns complete requested platforms
- social posts persist in product-owned DB table and remain user-scoped
- no social generation logic exists in `services/zeroflow`
