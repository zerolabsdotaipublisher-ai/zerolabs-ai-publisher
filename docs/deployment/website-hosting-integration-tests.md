# Website Hosting Integration Tests (ZLAP-STORY 5-3)

## Scenario Coverage

Scenario catalogs:

- `lib/pipeline/hosting/scenarios.ts`
- `lib/pipeline/scenarios.ts`

Required scenarios:

1. Preview deployment
2. Production deployment
3. Failed deployment
4. Domain assignment
5. Update/redeploy
6. Invalid hosting configuration

## Manual Verification Commands

Run from repository root:

```bash
npm install
npm run lint
npm run build
rg "process\\.env" -n --glob "!docs/**"
rg "services/zeroflow|services\\\\zeroflow" lib/pipeline lib/publish
rg "PipelineBuildOutput|StaticSiteArtifact" lib/pipeline lib/publish
```

Expected:

- `npm install` succeeds
- `npm run lint` succeeds
- `npm run build` succeeds when required env is configured
- raw `process.env` reads remain limited to `config/env.ts`
- hosting logic has no dependency on `services/zeroflow`
- hosting uses existing `PipelineBuildOutput` + `StaticSiteArtifact`

## End-to-End Behavior Checks

1. **Preview dry-run fallback**
   - `PIPELINE_DEPLOYMENT_TARGET=vercel`
   - `PIPELINE_VERCEL_ENABLE_REAL_DEPLOYMENTS=false`
   - run preview deploy
   - verify deployment succeeds with typed metadata and `dryRun=true`

2. **Preview real deploy-hook mode**
   - set `PIPELINE_VERCEL_ENABLE_REAL_DEPLOYMENTS=true`
   - set `PIPELINE_VERCEL_DEPLOY_HOOK_PREVIEW_URL`
   - run preview deploy
   - verify provider deployment id/url metadata is populated

3. **Production publish deployment**
   - publish through existing publish API/workflow
   - verify `publication.deployment` includes status, provider metadata, domains, logs

4. **Publish update redeploy**
   - publish once, then edit and run update
   - verify interim status uses `updating` and final status is `deployed`

5. **Invalid real hosting config**
   - set `PIPELINE_VERCEL_ENABLE_REAL_DEPLOYMENTS=true`
   - omit environment deploy hook URL
   - verify deployment fails with actionable config error

6. **Generated domain assignment**
   - set `PIPELINE_VERCEL_DEFAULT_DOMAIN`
   - run preview and production deploys
   - verify deterministic generated domain strategy differs by environment suffix

## Boundary Regression Checks

- no second deployment system introduced
- no new build model introduced
- no raw environment access added outside config layer
- no host/render/deployment logic moved into ZeroFlow
