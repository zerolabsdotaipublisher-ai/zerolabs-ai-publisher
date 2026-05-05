# Environment Setup

This document is the quick-start guide for configuring environment variables for local development of the AI Publisher application.

For the full canonical reference — including all variables, classification, environment matrix, rotation procedures, and access-control guidance — see **[docs/environment-variables.md](../environment-variables.md)**.

---

## Step 1 — Copy the example file

```bash
cp .env.example .env.local
```

## Step 2 — Fill in required values

Open `.env.local` and provide real credentials for each **required now** variable listed below. Never commit this file.

---

## Required variables

### App identity

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | ✅ | Display name shown in the UI (`ZeroLabs AI Publisher`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Canonical URL — use `http://localhost:3000` locally |

### Supabase

Used for authentication and the primary relational database.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Server-only | Service role key (full DB access — keep secret) |

Find these values in your [Supabase project settings](https://app.supabase.com) under **Project Settings → API**.

### OpenAI

Used for AI content generation, summarization, and other language model features.

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ Server-only | Your OpenAI API key |
| `OPENAI_MODEL` | Optional | Model to use — defaults to `gpt-4o` |

Generate a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

---

## Optional variables (set as needed)

### Direct database tooling

Only needed when using Drizzle/Prisma CLI for migrations — not required for runtime.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled connection string |
| `DIRECT_URL` | Direct connection string for migrations |

### Auth / session

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Site URL for Supabase OAuth redirects |
| `JWT_SECRET` | Secret for application-level JWTs (min 32 chars) |

Generate `JWT_SECRET` with:

```bash
openssl rand -base64 32
```

---

## Future variables

The following service groups are planned but not yet active. Leave them commented out in `.env.local` until the feature is built:

- **Qdrant** — semantic search / vector embeddings
- **Wasabi** — file storage
- **Stripe** — billing
- **Resend** — email
- **ZeroFlow** — platform services

See `.env.example` for the full list of commented-out variables and [docs/environment-variables.md](../environment-variables.md) for descriptions.

---

## Vercel environment setup

To populate variables in the Vercel project for Preview and Production deployments:

1. Open [vercel.com](https://vercel.com) → select the `zerolabs-ai-publisher` project.
2. Go to **Settings → Environment Variables**.
3. Add the required variables (see [docs/environment-variables.md — Vercel Environment Setup](../environment-variables.md#vercel-environment-setup)) for **Production** and **Preview** scopes.
4. Ensure `NEXT_PUBLIC_APP_NAME` is set to `ZeroLabs AI Publisher` in **Production**, **Preview**, and **Development** scopes.
5. Trigger a redeploy after adding variables.

Alternatively, pull Vercel variables to your local `.env.local` using the Vercel CLI:

```bash
vercel env pull .env.local
```

---

## Security Notes

- **Never commit `.env.local`** — it is listed in `.gitignore` and must stay out of version control.
- **Never commit `.env`** — the same rule applies.
- The only file that should be committed is `.env.example`, which contains **no real secrets** — only placeholder values and commented-out optional blocks.
- `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are server-side only. Do not use them in client components or prefix them with `NEXT_PUBLIC_`.
- Rotate any key that is accidentally committed immediately. See the [Operations Guide](../environment-variables.md#operations-guide) for rotation steps.
