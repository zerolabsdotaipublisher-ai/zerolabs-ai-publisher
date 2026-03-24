# Environment Setup

This document explains how to configure environment variables for local development of the AI Publisher application.

## Step 1 — Copy the example file

```bash
cp .env.example .env.local
```

## Step 2 — Fill in required values

Open `.env.local` and provide real credentials for each service listed below. Never commit this file.

---

## Services

### Supabase

Used for authentication and the primary relational database.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Server-only | Service role key (full DB access — keep secret) |

Find these values in your [Supabase project settings](https://app.supabase.com) under **Project Settings → API**.

---

### OpenAI

Used for AI content generation, summarisation, and other language model features.

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | Your OpenAI API key |

Generate a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

---

### Qdrant

Used for vector search and storing/querying content embeddings.

| Variable | Required | Description |
|---|---|---|
| `QDRANT_URL` | ✅ | Qdrant instance URL (e.g. `https://your-cluster.qdrant.io`) |
| `QDRANT_API_KEY` | Optional | API key if your Qdrant instance requires authentication |
| `QDRANT_COLLECTION` | Optional | Collection name (defaults to `ai_publisher_default`) |

---

### Wasabi

Used for file storage (S3-compatible). Stores uploaded assets, generated content, and exports.

| Variable | Required | Description |
|---|---|---|
| `WASABI_ACCESS_KEY_ID` | ⚠️ When storage is used | Wasabi access key ID |
| `WASABI_SECRET_ACCESS_KEY` | ⚠️ When storage is used | Wasabi secret access key |
| `WASABI_BUCKET` | ⚠️ When storage is used | Target bucket name |
| `WASABI_REGION` | ⚠️ When storage is used | Bucket region (e.g. `us-east-1`) |

---

### ZeroFlow Platform Services

Used for usage tracking, billing, and platform-level auth/tenant resolution.

| Variable | Required | Description |
|---|---|---|
| `ZEROFLOW_API_URL` | ⚠️ When platform services are used | Base URL of the ZeroFlow platform API |
| `ZEROFLOW_API_KEY` | ⚠️ When platform services are used | API key issued by the ZeroFlow platform |

---

### Auth / Security

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Secret used to sign/verify JWTs |

Use a long, random string (at least 32 characters). You can generate one with:

```bash
openssl rand -base64 32
```

---

### Feature Flags (Optional)

| Variable | Default | Description |
|---|---|---|
| `ENABLE_ANALYTICS` | `false` | Enable analytics tracking |
| `ENABLE_BILLING` | `false` | Enable billing features |

---

## Security Notes

- **Never commit `.env.local`** — it is listed in `.gitignore` and must stay out of version control.
- **Never commit `.env`** — same rule applies.
- The only file that should be committed is `.env.example`, which contains **no real secrets** — only placeholder values.
- `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` must only be used in server-side code (API routes, server components). Do not expose them to the browser.
- Rotate any key that is accidentally committed immediately.
