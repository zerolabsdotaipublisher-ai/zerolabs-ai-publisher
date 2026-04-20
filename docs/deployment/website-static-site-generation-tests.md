# Website Static Site Generation Tests

This document records the ZLAP-STORY 5-2 validation scenarios and manual checks for the SSG extension to the existing pipeline.

## Scenario Fixtures

Scenario fixtures live in `lib/pipeline/ssg/scenarios.ts`.

| Scenario | Fixture | Expected result |
|---|---|---|
| Single-page landing site | `landingPageStructureFixture` | valid, route paths: `/` |
| Multi-page business site | `multiPageStaticSiteStructureFixture` | valid, route paths: `/`, `/about`, `/contact` |
| Hidden page excluded | `hiddenPageStaticSiteStructureFixture` | valid, route paths: `/`, `/contact` |
| Invalid page blocked | `invalidStaticSiteStructureFixture` | invalid, deployment should not call an adapter |

## Validation Coverage

The SSG validation layer should catch:

- missing structure identity fields
- missing page identity fields
- missing visible sections
- missing or incomplete metadata
- invalid static route paths
- duplicate static route paths
- visible pages missing from the static route manifest
- unsafe local asset references
- missing cache policy references
- static output paths outside the expected artifact layout
- page data payloads above the MVP budget

## Manual Verification Commands

Run from the repository root:

```bash
npm install
npm run lint
npm run build
rg "process\\.env" -n --glob "!docs/**"
rg "services/zeroflow|services\\\\zeroflow" lib/pipeline/ssg
rg "interface .*Build|type .*Build" lib/pipeline/ssg
```

Expected results:

- `npm install` completes successfully.
- `npm run lint` completes successfully.
- `npm run build` completes successfully.
- Raw `process.env` access appears only in `config/env.ts`.
- `lib/pipeline/ssg` has no dependency on `services/zeroflow`.
- SSG modules do not introduce a duplicate pipeline build model. The artifact type is attached to `PipelineBuildOutput`.

## Pipeline Checks

When `buildWebsiteStructure()` runs:

1. `validatePipelineBuildInput()` includes SSG validation.
2. `pipeline_ssg_started` is emitted.
3. `buildStaticSiteOutput()` creates the SSG artifact.
4. `pipeline_ssg_completed` is emitted with page, route, and asset counts.
5. Invalid SSG output emits `pipeline_ssg_failed` and raises `PipelineValidationError`.
6. Deployment adapters receive a single `PipelineBuildOutput` with `build.ssg`.

## MVP Boundaries To Recheck

- ISR remains disabled with `revalidate: false`.
- Cache policies remain provider-neutral.
- The Vercel adapter may run in dry-run or real deploy-hook mode, but still consumes the same `PipelineBuildOutput` + SSG artifact.
- Current preview and generated-site app routes remain compatible with existing rendering.
- No code is moved into ZeroFlow.
