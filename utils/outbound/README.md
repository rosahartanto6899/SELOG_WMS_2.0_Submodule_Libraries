# Outbound Request Pipeline

Reusable outbound HTTP request pipeline for SELOG WMS internal service clients.

**Location:** `shared-libs/utils/outbound/`

Engineers integrating with another service should focus on the request and business mapping. Timeout, retry, circuit breaker, Redis cache, and fallback are handled by the pipeline when enabled.

---

## Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Placement | `shared-libs/utils/outbound/` | Cross-service reusable util — same layer as `cache.util`, `distributed-lock.util` |
| Entry point | `executeOutboundRequest()` + `InternalService.request()` | Minimal API; host services wrap hooks/logger |
| Resilience defaults | **Opt-in** (except timeout) | Backward compatible with existing axios call sites |
| Cache | Existing `cache.util` (Redis) | No second Redis client |
| Retry | Inline exponential backoff | No async-retry dep in host services |
| Circuit breaker | Process-local in-memory | Simple, zero infra; one breaker per `serviceName` |
| Logging | `logger.util.ts` by default + optional **hooks** | Same pattern as `distributed-lock`, `service-bus`; hooks extend defaults |

---

## Request Lifecycle

1. Optional Redis **GET** (cache hit → return)
2. Optional in-flight **coalesce**
3. Optional **circuit breaker** gate
4. **axios** request with timeout
5. Optional **retry** on transient failures (exponential backoff)
6. Optional Redis **SET** (fail-safe)
7. On failure: **fallback** if provided, else rethrow original error

---

## Public API

```ts
import { executeOutboundRequest } from '@/shared-libs/utils/outbound';
// or from InternalService subclass:
return this.request({
  config: {
    method: 'GET',
    url: `${this.url}/v1/resource`,
    headers: this.headers,
  },
  retry: true,
  circuitBreaker: true,
  cache: { key: 'domain:resource:id', ttl: 60 },
  fallback: [],
  mapResponse: (res) => res?.data?.data ?? [],
});
```

### Options

| Option | Default | Notes |
|--------|---------|-------|
| `timeout` | 10s | Always applied |
| `retry` | off | `true` or `{ retries, minTimeout, factor }` |
| `circuitBreaker` | off | `true` or `{ failureThreshold, resetTimeoutMs }` |
| `cache` | off | `true` or `{ key, keyPrefix, ttl, shouldSet, coalesce }` |
| `fallback` | none | Soft-fail value or factory |
| `mapResponse` | `response.data` | Map Axios response → business value |
| `hooks` | `logger.util.ts` defaults | Extend defaults (both run); pass `{ onError: () => {} }` only if you need to silence a specific event |

---

## Retry

Retries **only** transient failures:

- network / no response (timeout, ECONNRESET, DNS, …)
- HTTP **429**
- HTTP **5xx**

Does **not** retry other 4xx. Defaults: `retries: 2`, `minTimeout: 200ms`, `factor: 2`.

---

## Circuit Breaker

- Keyed by `serviceName`
- States: `CLOSED` → `OPEN` → `HALF_OPEN` → `CLOSED`
- Defaults: threshold `5`, reset `30s`
- When open: uses `fallback` if set, else throws `OutboundCircuitOpenError`
- Not distributed across pods (by design)

---

## Cache

When enabled:

1. Redis GET before HTTP
2. Execute on miss
3. Redis SET on success (write failures swallowed)
4. Optional coalesce for concurrent identical keys

### Cache key strategy

| Mode | Result |
|------|--------|
| `cache.key` set | Exact key (preferred for existing conventions) |
| omitted | `{keyPrefix\|outbound:serviceName}:{METHOD}:{sha1-16}` |

Fingerprint inputs: method + url + stable-serialized `params` + `data`.

### TTL

- Default: **60 seconds** (`DEFAULT_OUTBOUND_CACHE_TTL_SECONDS`)
- Override: `cache.ttl: number | (data) => number`

---

## Configuration

Reuse host `SecretManager` / env for service URLs and credentials. Pipeline defaults match existing `InternalService` timeout (10s) and common enrichment TTL (60s). No new config system.

**Host dependency (outbound only):** `axios` — already required by every service doing HTTP outbound. No additional packages needed for retry.

---

## Extension Points

| Extension | How |
|-----------|-----|
| Logging / metrics | Default via `logger.util.ts`; extend with `hooks` (`onStart`, `onSuccess`, `onError`, …) |
| Custom logger only | `createDefaultOutboundHooks(serviceName)` or replace hooks entirely via `mergeOutboundHooks` |
| Dynamic TTL | `cache.ttl: (data) => number` |
| Skip cache write | `cache.shouldSet` |
| Response shaping | `mapResponse` |
| Soft-fail | `fallback` |

---

## Best Practices

1. Prefer `this.request()` / `executeOutboundRequest` for new or touched internal clients.
2. Enable only features you need.
3. Preserve existing Redis keys when migrating (`cache.key`).
4. Use `fallback` for enrichment soft-fail paths.
5. Let errors propagate when the caller must know the downstream failed.
6. Use `cache.coalesce: true` for hot concurrent keys.

---

## Tests

Run from a host service that includes this submodule:

```bash
npm test -- --grep "withOutboundRetry|executeOutboundRequest|isTransientOutboundError"
```

Test files:

- `with-retry.test.ts` — retry + transient error classification
- `outbound-request.test.ts` — pipeline (cache, fallback, retry, circuit breaker, coalesce)

---

## Migration Strategy

1. Add `InternalService.request()` wrapper in the host service (wires default logger hooks).
2. Migrate **one** client as reference (e.g. OrderService).
3. Leave other clients on raw axios until touched.
4. Method signatures and soft-fail return values must stay compatible.

---

## File Map

```
shared-libs/utils/outbound/
├── index.ts                 # public exports
├── constants.ts             # defaults
├── types.ts                 # options + resolvers
├── outbound-request.ts      # pipeline executor
├── with-retry.ts            # inline exponential backoff (no async-retry)
├── cache-key.ts             # auto key generation
├── circuit-breaker.ts       # in-memory breaker
├── is-transient-error.ts    # retry classification
└── README.md                # this document
```
