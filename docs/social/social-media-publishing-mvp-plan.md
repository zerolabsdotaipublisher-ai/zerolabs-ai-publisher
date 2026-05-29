# Social Media Publishing MVP Plan (ZLAP-STORY 7-1)

## MVP boundary summary

Ship architecture-aligned implementation in phased stories without building a second scheduler/publisher.

### In scope for MVP implementation stories

- Platform adapters: LinkedIn and X (initial constrained capabilities)
- Account connect/disconnect + token refresh lifecycle
- Canonical social payload model + platform mapping
- Immediate publish + scheduled publish via existing scheduler concepts
- Queue/job/attempt persistence and status UI hooks
- Retry, throttling, audit events, and observability baseline

### Out of scope for MVP

- New ZeroFlow-owned social domain services
- Social analytics warehouse
- Approval workflows and multi-step review chains
- Rich campaign orchestration, thread planning, and advanced media workflows

## Delivery phases (future stories)

### Phase 1 — Foundations

- Add social domain types, storage schema, and service interfaces.
- Implement account connection metadata and encrypted credential storage path.
- Implement canonical payload builder and validation contracts.

### Phase 2 — Publish execution core

- Implement adapter abstractions and LinkedIn first adapter.
- Implement social publish job model + worker execution path.
- Implement publish lifecycle transitions and attempt persistence.

### Phase 3 — Scheduling and resilience

- Integrate delayed publishing with existing scheduling patterns.
- Add retry/backoff, rate-limit budgeting, and replay tools.
- Add X adapter with MVP-safe content constraints.

### Phase 4 — Product hardening

- Add account health views, failure triage UX, and operator actions.
- Add richer media formats and capability matrix-driven validation.
- Prepare extensibility hooks for additional platforms.

## Supported initial platforms recommendation

1. LinkedIn first (best enterprise B2B fit + stable MVP scope)
2. X second (text/image constrained rollout, capability-gated)

Expansion candidates after MVP:

- Instagram/Facebook Pages via shared Meta adapter base
- YouTube community/short-post integrations
- TikTok/Threads as capability-specific adapters

## Implementation guidance rules

- Keep social publishing business meaning in AI Publisher (Layer 1).
- Keep `services/zeroflow` free of social account, payload, and publish job semantics.
- Reuse existing content/version/schedule/publish concepts where possible.
- Maintain owner-scoped security and auditability at every transition.
- Prefer adapter capability matrix over platform-specific branching spread across the app.

## Definition of done for architecture story handoff

- Architecture docs cover all 23 story tasks.
- Mermaid diagrams describe components, sequences, and state transitions.
- MVP phases are explicit and implementation-ready.
- Boundaries with EPIC 5/6 and ZeroFlow are explicit and enforceable.
