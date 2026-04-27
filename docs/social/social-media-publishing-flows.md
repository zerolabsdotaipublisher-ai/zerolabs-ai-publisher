# Social Media Publishing Flows (ZLAP-STORY 7-1)

## A) Primary user flows

1. Connect social account
2. Create/select source content
3. Map content to platform payload
4. Publish now or schedule
5. Observe status and resolve failures

## B) Connect account flow (future implementation target)

```mermaid
sequenceDiagram
  participant U as User
  participant UI as AI Publisher UI
  participant API as AI Publisher API
  participant OA as Platform OAuth
  participant DB as Product DB

  U->>UI: Connect LinkedIn/X
  UI->>API: Request OAuth start
  API->>OA: Redirect with state + scopes
  OA-->>UI: Callback with code/state
  UI->>API: Exchange code
  API->>OA: Token exchange
  OA-->>API: Access/refresh tokens
  API->>DB: Save encrypted credential + connection metadata
  API-->>UI: connected
```

## C) Publish-now flow

```mermaid
sequenceDiagram
  participant U as User
  participant API as Social Publish API
  participant MAP as Mapper/Validator
  participant Q as Job Queue Model
  participant W as Publish Worker
  participant PA as Platform Adapter
  participant DB as Product DB

  U->>API: Publish now(contentId, target)
  API->>MAP: canonicalize + validate
  MAP-->>API: mapping result
  API->>Q: enqueue immediate job
  Q-->>W: claimed job
  W->>PA: publish(payload, credentials)
  PA-->>W: provider result
  W->>DB: persist job status/attempt/event
  W-->>API: final outcome
```

## D) Scheduled publish flow (reuse existing scheduler concepts)

```mermaid
flowchart TD
  Setup[User configures social schedule] --> Save[Persist schedule metadata]
  Save --> Due[Existing scheduler executes due work]
  Due --> Claim[Claim social due jobs]
  Claim --> Map[Map+validate payload]
  Map --> Exec[Publish worker executes]
  Exec --> Persist[Persist run/attempt/events]
  Persist --> Next[Compute retry/next run]
```

## E) Status lifecycle model

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> queued: publish now/schedule
  queued --> scheduled: delayed job
  queued --> running: immediate claim
  scheduled --> running: due time reached
  running --> published: all targets succeeded
  running --> partial_failed: mixed target outcomes
  running --> failed: non-retryable or exhausted
  partial_failed --> queued: retry remaining targets
  failed --> queued: manual replay
  published --> queued: republish/update
  queued --> cancelled: user cancel
```

## F) Retry and recovery flow

- Failure is classified into `retryable` or `non_retryable`.
- Retryable: transient network, provider 5xx, temporary rate limit.
- Non-retryable: revoked token, permission/scope mismatch, invalid payload/media policy rejection.
- Recovery options:
  - automatic retry with backoff+jitter (bounded)
  - reconnect account then replay failed jobs
  - edit payload then replay
  - cancel pending schedule

## G) Rate-limit/throttling flow

- Job dequeue checks budget at platform + account levels.
- If budget unavailable, transition attempt to `retry_scheduled` with throttle delay.
- Update local budget snapshot from provider headers when available.

## H) Audit and observability event flow

1. API emits structured request log.
2. Job transitions emit social event records.
3. Worker logs include request/job/attempt IDs for traceability.
4. Metrics include queue lag, success rate, retry exhaustion, auth failure rate.
