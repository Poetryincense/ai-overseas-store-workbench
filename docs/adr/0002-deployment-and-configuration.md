# ADR-0002: Deployment Profiles and Configuration

**Status**: Accepted (owner approved 2026-11-22)
**Date**: 2026-11-22
**Context**: V1 starts as a local single-machine deployment and must later run in the cloud without a rewrite.

## Decision

1. Two profiles are defined. Both use the same code and the same configuration names.

| Item       | local                                                 | cloud                                                          |
| ---------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| Web/API    | Processes on the developer machine, HTTP on localhost | Containers or processes behind a reverse proxy with TLS        |
| PostgreSQL | Docker Compose or a local install                     | Managed PostgreSQL with backups enabled                        |
| Redis      | Optional                                              | Required (see ADR-0003)                                        |
| Cookies    | `Secure` off, plain names                             | `Secure` on, `__Host-` prefixed names                          |
| Migrations | `pnpm db:migrate:dev`                                 | `pnpm db:migrate:deploy` as a release step, never at app start |

2. Configuration comes only from environment variables. A startup validator checks every variable that the active profile requires and exits with a clear message if one is missing or malformed. Required variables are listed in one schema in `packages/config`.

3. `NODE_ENV=production` requires: `WEB_ORIGIN` is `https://`, `DATABASE_URL` is set, `REDIS_URL` is set, and `TRUST_PROXY` is set to explicit proxy addresses (never `true`).

4. The browser-to-API proxy moves from build-time `rewrites()` to a runtime Route Handler in Workbench. It reads `API_INTERNAL_URL` at runtime, forwards `Cookie`, `Origin` and `X-CSRF-Token` unchanged, and relays `Set-Cookie` from the API. Changing the API address then needs no rebuild.

5. The API trusts `X-Forwarded-For` and `X-Forwarded-Proto` only from addresses listed in `TRUST_PROXY`. Without this, every client behind the proxy shares one rate-limit bucket, or a client can spoof its IP.

6. Secrets never live in the repository or in images. In local use they are in the git-ignored `.env`. In cloud use they come from the platform secret store.

7. Backups: in cloud, managed PostgreSQL backups plus a periodic logical dump stored off the primary host. Locally, a `pg_dump` script (B6 in P1-03.5). A restore drill is required before the first real data entry.

## Consequences

- Local development stays simple: every cloud-only variable has a local default or is optional.
- The cloud move is a configuration change plus a reverse proxy, not a code change.
- The startup validator is the single place to add new required settings, so they cannot be forgotten.

## Out of scope for this ADR

- Choice of cloud provider and region (decide when the cloud move is scheduled).
- Object storage (D-008 still applies).
