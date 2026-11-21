# ADR-0004: Actor and Command Model (design only)

**Status**: Proposed (design principles; no runtime is built in Phase 0–1)
**Date**: 2026-11-22
**Context**: The product is expected to grow an AI agent layer ("super-agent") and automated workflows. Retrofitting that later would mean rewriting every write path. Only the rules that are cheap to follow now are fixed here.

## Decision: rules that apply from P1-03.5 onward

1. **Every state change has an actor.** An actor is `{ type: "human" | "agent" | "system", id, workspaceId }`. Human actors come from the session. The audit table records `actor_type` and `actor_id` for every write (B7).

2. **Writes go through named commands.** A command is an application service function such as `archiveProject(ctx, projectId)`. Route handlers and future agents both call commands. Direct table writes outside command functions are not allowed. This keeps one place for validation, scope checks and auditing.

3. **Commands write their audit event in the same transaction.** If the audit row cannot be written, the change is rolled back.

4. **Commands accept an optional idempotency key.** The same key with the same input returns the earlier result. This is required before any automated caller exists.

5. **Permissions are capabilities, not roles.** V1 has one owner who holds every capability. The capability list is written down now, so that later actors can be given a subset.

6. **External side effects need an approval record.** Publishing a store, spending budget, or sending a message to a third party must be recorded as a pending action and confirmed by a human before it executes. No actor type bypasses this in V1.

7. **Kill switch.** A workspace-level `automation_paused` setting is defined in this ADR. When set, every non-human actor is refused by the command layer. The setting is not implemented in Phase 1; its name and meaning are fixed so later code uses it.

8. **Budget ceilings belong to projects.** `ProjectProfile.budget_amount` is the first ceiling. Any future model-call or ad-spend ledger must reference a project budget and refuse work that would exceed it.

9. **Secrets are not project fields.** Third-party credentials (for example a store API token) go into a separate encrypted store with their own access rules. They are never placed in environment variables that span projects, and never in command inputs or audit metadata.

10. **Agent outputs record provenance.** Any artifact produced by an actor stores the actor, the inputs it used and the parameters, so a result can be reproduced or challenged.

## Explicitly not in Phase 0–1

- Agent runtime, model calls, tool registry, multi-agent orchestration.
- Any table beyond the audit table.
- Any UI for agents.

## Why these rules now

Items 1–3 cost little and change the audit design. Items 4–10 are rules for the future, but writing them now stops later features from adding a second, unaudited write path.
