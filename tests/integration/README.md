# Integration tests

Integration tests for the editor must use a dedicated, non-production Supabase
project. They must never use the credentials or project referenced by local
application runtime environment files.

The normal `npm test` and `npm run test:unit` commands exclude this directory.

## Slice 3B atomic-persistence harness

`editor-save/isolated-atomic-persistence.test.ts` is the future
`save_editor_document` transaction harness. It creates the complete required
schema itself in `zero_slice3b`; it does not consult project migrations or
touch application tables. The schema and its failure triggers are disposable
test fixtures, not a migration or production RPC implementation.

It runs only when all of these are present:

```text
ZERO_ENV=test
ZERO_TEST_SUPABASE_URL=<local or dedicated-test URL>
ZERO_TEST_SUPABASE_ANON_KEY=<test anon key>
ZERO_TEST_SUPABASE_SERVICE_ROLE_KEY=<test service key>
ZERO_TEST_DATABASE_URL=<test Postgres URL>
```

A remote target additionally requires `ZERO_TEST_PROJECT=dedicated`. The
harness rejects missing markers, `prod`, `production`, `qa`, any other marker,
placeholder values, and any `ZERO_TEST_*` URL/key that equals normal
application Supabase or database configuration. It also requires `psql` and a
Supabase-compatible target with `auth.uid()` plus the `anon`, `authenticated`,
and `service_role` database roles. Without that setup, the integration suite
reports one explicit skipped test; normal unit tests are unaffected.

The service-role key is used only by the test runner to create disposable auth
users, establish/remove the disposable schema, seed rows, inspect results, and
configure test-only failpoint triggers. It is never used by the authenticated
or anonymous RPC callers and must never be browser-visible.

Run `npm run test:integration` only after exporting those isolated variables.
The required persistence scenarios are documented in
`docs/editor/website-editing-interface-tests.md`.
