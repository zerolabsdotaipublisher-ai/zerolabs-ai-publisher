# Branching Strategy

## Overview

This repository follows a structured Git branching model to keep the codebase stable, auditable, and easy to contribute to.

---

## Branch Types

### `main`

- **Purpose:** Production-ready code only.
- **Who merges here:** Lead maintainers via pull request from `develop`.
- **Protection:** Branch is protected. Direct pushes are not allowed.
- **Deployments:** Every merge to `main` triggers a production deployment on Vercel.

### `develop`

- **Purpose:** Integration branch for upcoming work. All features are merged here before being promoted to `main`.
- **Who merges here:** Any contributor via pull request from a `feature/*` branch.
- **Protection:** Branch is protected. Direct pushes are not allowed.
- **Deployments:** Merges to `develop` may trigger a staging/preview deployment.

### `feature/<description>`

- **Purpose:** Short-lived branch for a single task, feature, or fix.
- **Branched from:** `develop`
- **Merged into:** `develop` via pull request.
- **Naming convention:** `feature/<short-kebab-case-description>` (e.g. `feature/add-publishing-scheduler`).
- **Lifecycle:** Delete after the pull request is merged.

---

## Workflow

```
main         ←──────────────────────── (release PR)
               ↑
develop      ←──────────────────────── (feature PR)
               ↑
feature/*    (your work starts and ends here)
```

1. **Start work** — branch off `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Commit often** — use [Conventional Commits](https://www.conventionalcommits.org/) format:
   ```
   feat: add publishing scheduler
   fix: correct auth token expiry handling
   docs: update environment setup guide
   ```

3. **Open a pull request** — target `develop`, not `main`. Include a clear description of what changed and why.

4. **Pass review** — at least one approval is required before merging.

5. **Merge to `develop`** — squash or merge commit, then delete the feature branch.

6. **Release to `main`** — when `develop` is stable and ready for production, open a pull request from `develop` → `main`.

---

## Branch Protection Rules

Both `main` and `develop` should be protected in GitHub with the following settings:

| Setting | `main` | `develop` |
|---|---|---|
| Require pull request before merging | ✅ | ✅ |
| Require at least 1 approving review | ✅ | ✅ |
| Dismiss stale reviews on new commits | ✅ | ✅ |
| Require status checks to pass | ✅ | ✅ |
| Restrict who can push directly | ✅ | ✅ |
| Require branches to be up to date | ✅ | ✅ |

> Configure these rules in **GitHub → Settings → Branches → Branch protection rules**.

---

## Naming Conventions

| Branch type | Pattern | Example |
|---|---|---|
| Feature / task | `feature/<description>` | `feature/add-publishing-scheduler` |
| Bug fix | `feature/fix-<description>` | `feature/fix-auth-token-expiry` |
| Documentation | `feature/docs-<description>` | `feature/docs-update-env-setup` |
| Chore / tooling | `feature/chore-<description>` | `feature/chore-upgrade-dependencies` |

---

## Quick Reference

```bash
# Start a new feature
git checkout develop && git pull origin develop
git checkout -b feature/your-feature-name

# Keep your branch up to date
git fetch origin develop
git rebase origin/develop

# Push your branch and open a PR
git push origin feature/your-feature-name
# → Open pull request targeting develop on GitHub
```
