# ADR-0003: Redis Role and Rate-Limit Store

**Status**: Accepted (owner approved 2026-11-22)
**Date**: 2026-11-22
**Context**: The login rate limiter currently counts in process memory. That is correct for one API instance and wrong for several. Redis is already part of the stack (D-007) and must have a defined role.

## Decision

1. Redis is not a V1 hard dependency for local development. It is required in the cloud profile (ADR-0002). It is not a reason to downgrade the design: Redis is the intended shared state store once there is more than one API instance.

2. The limiter goes behind an interface:

```text
RateLimitStore
  increment(key: string, windowMs: number): Promise<{ count: number; resetAt: Date }>
```

Two implementations:

- `memory`: local profile only. Refuses to start in the cloud profile.
- `redis`: uses atomic increment with expiry (`INCR` plus `PEXPIRE` on first write, in one script). Required in the cloud profile.

Selection is by the `RATE_LIMIT_STORE` setting, validated at startup.

3. Two limits apply to login:

- Per source IP: at most 20 attempts in 15 minutes, counting all attempts.
- Per account: at most 5 failed password checks in 15 minutes. After that the account is locked for 15 minutes, and the lock response is the same generic error used for bad credentials, so account existence is not revealed.

Account keys use an HMAC of the normalized email, not the raw email, so Redis holds no readable addresses.

4. Failure behaviour:

- Local: if the store fails, login is refused with `503`. Development does not hide the problem.
- Cloud: the same. Authentication fails closed. A login outage is preferable to an unlimited password-guessing window.

5. Health: `/health/ready` checks Redis when the cloud profile is active. Locally the check is skipped when `REDIS_URL` is absent and reported as `not_configured`, not `up`.

6. Future use: the Worker queue and any cache are not decided here. A queue choice needs its own ADR. No cache is added in V1 because nothing needs one yet.

## Consequences

- The auth code does not know which store it uses, so the switch is a configuration change.
- Redis availability becomes part of login availability in the cloud. This is accepted and must appear in the runbook.
- The per-account limit is the main defence against distributed guessing that rotates IP addresses.
