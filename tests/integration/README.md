# Integration tests

Integration tests for the editor must use a dedicated, non-production Supabase
project. They must never use the credentials or project referenced by local
application runtime environment files.

The normal `npm test` and `npm run test:unit` commands exclude this directory.
Use `npm run test:integration` only after supplying dedicated test-project
credentials and a disposable owner/non-owner fixture. The required persistence
scenarios are documented in `docs/editor/website-editing-interface-tests.md`.
