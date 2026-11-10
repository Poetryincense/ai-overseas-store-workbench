# ADR-0001: Owner Authentication and Cookie Session Security

**Status**: Accepted
**Date**: 2026-11-11
**Context**: P1-02 Owner Bootstrap & Authentication API

## Decision

- Passwords use Argon2id (`argon2` 0.45.2; 19 MiB memory, 2 iterations, parallelism 1).
- Owner creation is an interactive one-time command. Password input is hidden and confirmed; database creation of User, Workspace, and OWNER membership is transactional. A PostgreSQL transaction advisory lock serializes concurrent bootstrap attempts; an existing owner causes refusal, never password replacement.
- Session cookies contain 256-bit random base64url tokens. PostgreSQL stores only a SHA-256 token hash. Sessions expire after seven days; successful login revokes all previous active sessions for that user before creating the new session.
- Session cookies are HttpOnly, SameSite=Lax, Path=/; production additionally uses Secure and the `__Host-` prefix.
- State-changing auth requests require both an exact configured Origin and a double-submit CSRF token (readable CSRF cookie + `X-CSRF-Token` header). CORS allows only the configured Workbench origin with credentials.
- Login attempts are limited to five per source IP per 15 minutes. Unknown accounts use a per-process random Argon2id dummy hash so the failure path performs password verification work; all credential failures return the same status and error body.

## Consequences

- The API is intended for the V1 single-workbench deployment. The rate limiter uses the plugin's in-memory store; multi-replica deployments must configure a shared store before scaling.
- Browser clients must first GET `/api/v1/auth/csrf`, retain the CSRF cookie, send its value in `X-CSRF-Token`, use `credentials: "include"`, and send the exact `WEB_ORIGIN`.
- There is no public registration endpoint and no endpoint that changes an existing Owner password.
