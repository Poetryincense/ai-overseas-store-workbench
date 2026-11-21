# ADR-0005: Owner Recovery and Project Slug Policy

**Status**: Accepted (owner approved 2026-11-22)
**Date**: 2026-11-22
**Context**: The single owner can lose their password. Project slugs currently stay reserved after archiving.

## Decision A: Owner recovery

Two mechanisms, both with no public endpoint.

### A1. Recovery codes

- At bootstrap (`owner:create`) and on request (`owner:regenerate-recovery-codes`, which asks for the current password), the command creates 10 recovery codes.
- Each code is 80 random bits, encoded in Crockford base32, shown once in the terminal, and stored only as a SHA-256 hash. The hash is safe because the code is high-entropy and not a human password.
- Regeneration invalidates all earlier codes.
- New table `owner_recovery_codes`: `id`, `user_id`, `code_hash` (unique), `used_at`, `created_at`.

### A2. Offline recovery command

- `owner:recover` is interactive. It asks for the email, one recovery code and a new password (hidden, confirmed).
- On success it: consumes the code, sets the new password hash, revokes every session of the owner, and writes an audit event `owner.recovered`.
- The command needs shell access to the server. This is intentional: whoever can run it already controls the machine.

### Why not a web reset endpoint

A public reset endpoint adds an unauthenticated write path and needs a second rate limiter and a mail or token flow. For one owner, the CLI with recovery codes covers both the local and the cloud case without that surface. If the cloud host has no shell access, the operator's platform console is the fallback, documented in the runbook.

### Future option

Passkeys (WebAuthn) are the better long-term second factor for a single owner. They are not in V1 and need their own ADR.

## Decision B: Slug policy

- A slug is unique among **non-archived** projects in a workspace.
- Archiving a project releases its slug. Restoring it is allowed only if the slug is still free; otherwise restore fails with `409` and the owner must rename the project first.
- Archived projects are always addressed by ID, never by slug.

### Migration

The current constraint `(workspace_id, slug)` is replaced by a partial unique index:

```sql
DROP INDEX "projects_workspace_id_slug_key";
CREATE UNIQUE INDEX "projects_workspace_id_slug_active_key"
  ON "projects" ("workspace_id", "slug")
  WHERE "archived_at" IS NULL;
```

Rollback is the reverse statement. Dropping the old index only loosens the rule, and every existing row satisfies the new rule, so no data is changed.

Prisma does not express partial indexes in the schema. The migration is written by hand, and the schema file carries a comment pointing to it.
