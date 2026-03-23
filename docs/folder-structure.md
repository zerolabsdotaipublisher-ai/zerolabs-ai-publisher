# Project Folder Structure

## Purpose

This repository uses a modular folder structure designed for scalability, maintainability, and clear separation of concerns.

The structure separates:
- UI and route handling
- domain/business logic
- shared technical utilities
- external/platform services
- configuration
- documentation

## Top-Level Structure

### `app/`
Next.js App Router entry point. Contains route segments, layouts, pages, and API route handlers.

### `components/`
Reusable presentational and composite UI components shared across the application.

### `features/`
Domain-based modules. Each feature contains its own components, services, schemas, and types.

### `lib/`
Shared technical building blocks such as database helpers, authentication helpers, utilities, constants, validations, and shared types.

### `services/`
Integrations with external providers and shared platform services such as ZeroFlow, Supabase, OpenAI, Qdrant, and Wasabi.

### `config/`
Centralized application configuration including environment parsing, route definitions, and permissions.

### `public/`
Static assets such as images, icons, and brand files.

### `docs/`
Project documentation including architecture, setup instructions, ADRs, and structural references.

### `hooks/`
Reusable React hooks.

### `tests/`
Unit, integration, and end-to-end tests.

### `scripts/`
Developer and operational scripts.

### `supabase/`
Database migrations, seed files, and server-side functions related to Supabase.

## Design Principles

1. Keep UI concerns separate from business logic.
2. Group product capabilities by feature/domain.
3. Keep external provider integrations isolated.
4. Centralize shared utilities and config.
5. Support future growth without flattening everything into one folder.

## Architecture Alignment

This structure is aligned with the product-app model:
- the application owns its frontend, backend route handlers, and product logic
- shared platform capabilities such as auth, billing, storage services, and usage tracking are integrated through dedicated service layers
- storage and vector-related concerns should remain namespaced to this app
