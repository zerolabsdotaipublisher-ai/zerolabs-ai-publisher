# ZeroLabs AI Publisher

> AI-powered automated publishing platform for websites, portfolios, and social media — part of the **ZeroFlow** ecosystem.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?logo=openai)](https://openai.com)

---

## Quick Start

```bash
git clone https://github.com/zerolabsdotaipublisher-ai/zerolabs-ai-publisher.git
cd zerolabs-ai-publisher
npm install
cp .env.example .env.local   # fill in your credentials
npm run dev                  # → http://localhost:3000
```

> See [Environment Setup](#environment-setup) for a full list of required variables.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Architecture Diagram](#architecture-diagram)
- [Scope](#scope)
- [Tech Stack](#tech-stack)
- [Next.js Framework Conventions](#nextjs-framework-conventions)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [Build and Production](#build-and-production)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Security Notes](#security-notes)
- [Contributing](#contributing)

---

## Project Overview

**ZeroLabs AI Publisher** is a production-grade Next.js application (App Router) that enables users to plan, generate, and publish AI-assisted content across websites, portfolios, and social media channels.

It is the **Layer 1 Product Application** within the broader [ZeroFlow](#architecture) ecosystem, consuming platform services (auth, billing, AI orchestration) from Layer 2 and infrastructure providers from Layer 3.

Key capabilities include:

- AI-powered content generation via OpenAI
- Semantic search and recommendations powered by Qdrant vector database
- Asset storage backed by Wasabi (S3-compatible object storage)
- User authentication and data persistence via Supabase
- Multi-tenant support through the ZeroFlow platform

---

## Architecture

This project is part of the ZeroFlow ecosystem:

### Layer 1 — Product Application (This Repo)

- Next.js frontend + API routes, hosted on Vercel
- Supabase Postgres database for application data
- App-specific business logic, UI, and content workflows

### Layer 2 — ZeroFlow Platform

Provides shared platform services consumed by this app:

- Authentication & tenant management
- Usage tracking & billing
- AI orchestration layer

### Layer 3 — Infrastructure Providers

| Provider   | Role                        |
|------------|-----------------------------|
| **OpenAI** | AI content generation       |
| **Qdrant** | Vector database for search  |
| **Wasabi** | Object storage (S3-compatible) |
| **Supabase** | Database & authentication  |

```
┌─────────────────────────────────────┐
│  Layer 1 — ZeroLabs AI Publisher    │
│  (Next.js · Vercel)                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Layer 2 — ZeroFlow Platform        │
│  (Auth · Billing · Orchestration)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Layer 3 — Infrastructure Providers │
│  OpenAI · Qdrant · Wasabi · Supabase│
└─────────────────────────────────────┘
```

---

## Architecture Diagram

The diagram below shows the full request flow from user to infrastructure across all three layers of the ZeroFlow ecosystem.

```mermaid
flowchart TD
    User["👤 User"]

    subgraph L1["Layer 1 – Product App (This Repo)"]
        App["Next.js App\nVercel"]
    end

    subgraph L2["Layer 2 – ZeroFlow Platform"]
        direction LR
        Auth["Auth Service"]
        Billing["Billing Service"]
        AI["AI Orchestration"]
    end

    subgraph L3["Layer 3 – Infrastructure"]
        direction LR
        OpenAI["OpenAI API"]
        Qdrant["Qdrant Vector DB"]
        Supabase["Supabase DB/Auth"]
        Storage["Wasabi Storage"]
    end

    User --> App
    App <-->|"auth / tenancy"| Auth
    App <-->|"usage / billing"| Billing
    App <-->|"AI requests"| AI
    AI <-->|"completions"| OpenAI
    AI <-->|"vector queries"| Qdrant
    App <-->|"data & auth"| Supabase
    App -->|"asset storage"| Storage
```

---

## Scope

**This repository contains:**

- The product application (Layer 1): Next.js frontend, API routes, feature modules, and Supabase database schema

**This repository does NOT include:**

- ZeroFlow platform services (Layer 2) — auth service, billing service, and AI orchestration layer are external platform dependencies
- Infrastructure provisioning (Layer 3) — OpenAI, Qdrant, Wasabi, and Supabase are consumed as hosted services; their infrastructure is managed outside this repo

> This boundary prevents confusion when onboarding new contributors and makes the integration points explicit.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Full-stack React framework |
| **TypeScript** | Type-safe development |
| **Supabase** | PostgreSQL database & authentication |
| **OpenAI API** | AI content generation |
| **Qdrant** | Vector database for semantic search |
| **Wasabi** | S3-compatible object storage |
| **Vercel** | Hosting & deployment |

---

## Next.js Framework Conventions

The framework baseline in this repository was established previously and is validated in-place (not recreated).

- **Framework/runtime:** Next.js 16 with React 19 (`package.json`)
- **Router:** App Router via `app/` (`app/layout.tsx`, `app/page.tsx`)
- **TypeScript:** Enabled with strict mode (`tsconfig.json`)
- **Styling baseline:** Global styles in `app/globals.css` and route-scoped styles with CSS Modules (for example `app/page.module.css`)
- **Linting:** Next.js Core Web Vitals + TypeScript config via `eslint.config.mjs`
- **Static assets:** `public/` with placeholder directories for future brand/icon/image assets

For framework-specific guidance, see:
- [docs/setup/nextjs-framework.md](docs/setup/nextjs-framework.md)
- [docs/setup/environment.md](docs/setup/environment.md)

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project
- An OpenAI API key
- A Qdrant instance (cloud or self-hosted)

### Clone the Repository

```bash
git clone https://github.com/zerolabsdotaipublisher-ai/zerolabs-ai-publisher.git
cd zerolabs-ai-publisher
```

### Install Dependencies

```bash
npm install
```

---

## Environment Setup

> ⚠️ **Never commit real secrets.** Only `.env.local` should hold live credentials — it is listed in `.gitignore` and must never be pushed to version control.

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Environment variables are loaded from `.env.local` by Next.js. The current framework baseline can run without external integrations, and variables below become relevant when integration features are enabled.

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `OPENAI_API_KEY` | OpenAI API key |
| `QDRANT_URL` | Qdrant instance URL (optional unless vector features are enabled) |
| `QDRANT_API_KEY` | Qdrant API key |
| `QDRANT_COLLECTION` | Qdrant collection name (default: `ai_publisher_default`) |
| `JWT_SECRET` | Secret used for signing JWTs |

Optional variables:

| Variable | Description |
|---|---|
| `WASABI_ACCESS_KEY_ID` | Wasabi access key |
| `WASABI_SECRET_ACCESS_KEY` | Wasabi secret key |
| `WASABI_BUCKET` | Wasabi bucket name |
| `WASABI_REGION` | Wasabi region (default: `us-east-1`) |
| `ZEROFLOW_API_URL` | ZeroFlow platform API base URL |
| `ZEROFLOW_API_KEY` | ZeroFlow platform API key |
| `ENABLE_ANALYTICS` | Enable analytics feature flag (`true`/`false`) |
| `ENABLE_BILLING` | Enable billing feature flag (`true`/`false`) |

> Keep server-only values (for example `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`) out of client components and never prefix them with `NEXT_PUBLIC_`.

---

## Running Locally

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Build and Production

```bash
# Create a production build
npm run build

# Start the production server
npm start
```

Run the linter before building:

```bash
npm run lint
```

---

## Deployment

This application is designed to be deployed on **[Vercel](https://vercel.com)**.

1. Connect your GitHub repository to a Vercel project.
2. Add all required environment variables in the Vercel project settings (under **Settings → Environment Variables**).
3. Vercel will automatically build and deploy on every push to your main branch.

> Ensure all variables from `.env.example` are configured in your Vercel environment before deploying to production.

---

## Project Structure

```
zerolabs-ai-publisher/
├── app/                  # Next.js App Router — pages, layouts, and API routes
│   └── api/              # Server-side API route handlers (auth, projects, publishing, webhooks)
├── components/           # Reusable React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── forms/            # Form components
│   ├── marketing/        # Marketing/landing page components
│   ├── shared/           # Shared layout components
│   └── ui/               # Base UI primitives
├── config/               # Application configuration
│   ├── app.ts            # App-level constants
│   ├── env.ts            # Typed, validated environment variables
│   └── routes.ts         # Route constants
├── features/             # Feature-based modules (auth, projects, publishing, assets, analytics)
├── hooks/                # Custom React hooks
├── lib/                  # Core library code
│   ├── ai/               # AI utilities and helpers
│   ├── api/              # API client helpers
│   ├── auth/             # Authentication utilities
│   ├── billing/          # Billing integration
│   ├── db/               # Database access layer
│   ├── storage/          # Storage utilities
│   ├── types/            # Shared TypeScript types
│   └── utils/            # General utilities
├── services/             # External service integrations
│   ├── openai/           # OpenAI API client
│   ├── qdrant/           # Qdrant vector DB client
│   ├── supabase/         # Supabase client
│   ├── wasabi/           # Wasabi storage client
│   └── zeroflow/         # ZeroFlow platform client
├── supabase/             # Supabase migrations and configuration
├── public/               # Static assets
├── tests/                # Test suite
├── .env.example          # Example environment variables template
└── next.config.ts        # Next.js configuration
```

---

## Security Notes

- **Never commit `.env` or `.env.local`** to version control — they are listed in `.gitignore`.
- Use `.env.example` as the canonical reference for required variables. It contains only placeholder values and is safe to commit.
- The `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are server-side secrets — never expose them in client-side code or prefix them with `NEXT_PUBLIC_`.
- `JWT_SECRET` should be a long, cryptographically random string. Rotate it if it is ever compromised.
- Review Vercel's [environment variable documentation](https://vercel.com/docs/projects/environment-variables) to ensure secrets are scoped correctly (Production / Preview / Development).

---

## Contributing

### Branching Strategy

This project uses a `main` / `develop` / `feature/*` branching model:

| Branch | Purpose |
|---|---|
| `main` | Production-ready code — protected, deploys to production |
| `develop` | Integration branch for upcoming work — protected |
| `feature/<description>` | Short-lived branch for a single task or fix |

All changes go through pull requests. Direct pushes to `main` and `develop` are not allowed.

> See [docs/branching-strategy.md](docs/branching-strategy.md) for the full workflow, branch protection settings, and naming conventions.

### Commit Messages

Please use [Conventional Commits](https://www.conventionalcommits.org/) format (e.g. `feat: add publishing scheduler`).

---

## License

Private — All rights reserved. © ZeroLabs AI
