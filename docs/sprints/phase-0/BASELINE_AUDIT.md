# BASELINE_AUDIT.md — P0-01 Repository Audit & Baseline

**Issue**: P0-01 — Repository Audit & Baseline  
**Audit date**: 2026-11-07  
**Audited ref**: `main` at commit `3c1853a11dececaec2e2f7465693044480470076`  
**Status**: DONE — audit complete; repository is a Sprint/task baseline repository, not yet an application codebase.

## 1. Audit method and workspace protection

The audit first attempted to obtain a local Git working copy:

```bash
git clone https://github.com/Poetryincense/ai-overseas-store-workbench.git /tmp/ai-overseas-store-workbench
```

Actual result: failed in the execution environment because `github.com` DNS resolution was unavailable (`Could not resolve host: github.com`). Therefore `git status --short`, `git diff --stat`, and filesystem-based `find` could not be truthfully executed against a local checkout.

The audit then used the connected GitHub repository API to read the actual `main` snapshot, repository metadata, root contents, recursive Git tree, and recent commits. No application code was modified or deleted.

**Working-tree caveat**: GitHub API reads committed repository state only and cannot expose another machine's uncommitted local changes. The audited remote `main` snapshot is committed state; any local unpushed/uncommitted work outside GitHub remains outside the visibility of this audit.

## 2. Repository snapshot

Repository metadata shows:

- Repository: `Poetryincense/ai-overseas-store-workbench`
- Default branch: `main`
- Visibility: public
- Repository created: 2026-11-07
- Current audited commit: `3c1853a11dececaec2e2f7465693044480470076`
- Repository size reported by GitHub: 0 KB (no application dependency/content tree beyond the uploaded Sprint documents)
- GitHub repository language: null

Recent commits confirm the repository was initialized with the Sprint package documents and related uploads/deletions.

## 3. Actual repository tree

The recursive Git tree at the audited commit contains documentation/task files only:

```text
ACCEPTANCE_MATRIX.md
AGENTS.md
DECISIONS.md
README.md
SPRINT_PLAN.md
phase-0/
  P0-01-REPOSITORY-AUDIT.md
  P0-02-MONOREPO-BOOTSTRAP.md
  P0-03-QUALITY-TOOLCHAIN.md
  P0-04-LOCAL-INFRASTRUCTURE.md
  P0-05-SERVICE-SKELETON.md
  P0-06-CI-AND-RUNBOOK.md
phase-1/
  P1-01-DATABASE-SCHEMA-MIGRATIONS.md
  P1-02-OWNER-BOOTSTRAP-AUTH-API.md
  P1-03-AUTH-UI-PROTECTED-ROUTES.md
  P1-04-WORKSPACE-CONTEXT-SCOPE-GUARD.md
  P1-05-PROJECT-DOMAIN-STATE-RULES.md
  P1-06-PROJECT-CRUD-API.md
  P1-07-PROJECT-WORKBENCH-UI.md
  P1-08-DASHBOARD-SUMMARY.md
  P1-09-ISOLATION-E2E-VERIFICATION.md
  P1-10-PHASE1-GATE-HANDOVER.md
templates/
  AGENT_DISPATCH_PROMPT.md
  ISSUE_TEMPLATE.md
```

No `package.json`, lockfile, workspace configuration, application source directory, database schema, Docker Compose file, CI workflow, or test configuration exists in the audited tree.

## 4. Actual technology baseline

| Area | Status | Actual finding |
|---|---|---|
| Git repository | EXISTS | GitHub repository exists with committed `main` history |
| Node.js project | MISSING | No `package.json` |
| Package manager lockfile | MISSING | No `pnpm-lock.yaml`, npm lockfile, or yarn lockfile |
| pnpm workspace | MISSING | No `pnpm-workspace.yaml` |
| TypeScript | MISSING | No `tsconfig*.json` or source files |
| Next.js Workbench | MISSING | No Next.js application/configuration |
| Independent API service | MISSING | No API application/configuration |
| Worker service | MISSING | No Worker application/configuration |
| PostgreSQL integration | MISSING | No database configuration/schema |
| ORM | MISSING | No Prisma/Drizzle/other ORM configuration |
| Redis integration | MISSING | No Redis configuration |
| Authentication | MISSING | No implementation present |
| Docker Compose | MISSING | No compose file |
| Tests | MISSING | No Vitest/Playwright or test source |
| CI | MISSING | No `.github/workflows/` |
| Existing application modules to reuse | MISSING | No application module is currently present |

## 5. Environment probes actually executed

The execution environment reported:

```text
node --version  -> v22.16.0
npm --version   -> 10.9.2
pnpm --version  -> command not found
docker --version -> command not found
```

These are audit execution-environment facts only. They do **not** prove repository runtime compatibility because the repository has no dependency manifest or runnable application.

## 6. Service entry points and local startup

### Status: MISSING

No runnable entry points were found because the repository contains no application packages or source code.

Consequently, no repository `lint`, `typecheck`, `test`, or `build` scripts exist to execute. The audit did not invent replacement commands or claim those checks passed.

## 7. Database, authentication, tests, and CI

### Database / ORM — MISSING
No database configuration, schema, migration directory, or ORM dependency exists.

### Authentication / Workspace scope — MISSING
The security and isolation rules in `AGENTS.md` and `DECISIONS.md` are documented requirements only; no implementation exists yet.

### Tests — MISSING
No unit, integration, or E2E test configuration/source exists.

### CI — MISSING
No GitHub Actions workflow or other CI configuration exists.

## 8. Comparison with DECISIONS.md

| Decision area | Status | Audit conclusion |
|---|---|---|
| D-001 pnpm workspace | MISSING | Must be created by P0-02 |
| D-002 TypeScript strict | MISSING | Must be established in P0-02/P0-03 |
| D-003 Next.js App Router | MISSING | Workbench skeleton required |
| D-004 Independent Node API / Fastify | MISSING | API skeleton required |
| D-005 PostgreSQL | MISSING | Local infrastructure required |
| D-006 Prisma preference | MISSING | No existing ORM to preserve; baseline may be adopted |
| D-007 Redis health | MISSING | Local infrastructure required |
| D-009 Vitest + Playwright | MISSING | Toolchain required |
| D-010 Single-owner initialization | MISSING | Phase 1 |
| D-011 Workspace | MISSING | Phase 1 |
| D-012–D-019 Project/domain/API/Dashboard rules | MISSING | Phase 1 |
| D-020 Docker Compose for PG/Redis | MISSING | P0-04 |
| D-021 package names | MISSING | P0-02 should establish canonical names |

**Decision conclusion**: there is no existing application technology stack to preserve. The Phase 0–1 baseline in `DECISIONS.md` can therefore be adopted without a migration ADR, provided P0-02 records the resulting actual versions and lockfile.

## 9. Existing / reusable content

### EXISTS — reusable
- `AGENTS.md`: engineering rules and safety boundaries.
- `DECISIONS.md`: Phase 0–1 technical/product baseline.
- `SPRINT_PLAN.md`: dependency order and gates.
- `ACCEPTANCE_MATRIX.md`: acceptance reference.
- `phase-0/`, `phase-1/`: issue-level task definitions.
- `templates/`: agent dispatch and issue templates.

### PARTIAL
- Repository governance exists, but no executable engineering baseline exists.
- Git history exists, but no application implementation exists.

### MISSING
- All runtime code and engineering configuration required for Phase 0.

### RISK
- The repository currently looks like a task-package repository rather than a bootstrapped product repository. P0-02 must not assume any source directory, dependency, or existing service can be reused.
- A local working tree must be checked with `git status --short` immediately before P0-02 changes. This remote audit cannot see unpushed local modifications.
- Current audit environment lacks pnpm and Docker, so final P0 implementation verification will require either installing/using those tools in the execution environment or another CI/development environment where they are available.

## 10. Path mapping for subsequent Phase 0 tasks

Because no application structure exists, the task-package example structure should become the initial engineering structure rather than a migration target.

| Issue | Recommended actual paths | Status / reuse guidance |
|---|---|---|
| P0-02 Monorepo Bootstrap | `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `apps/workbench/`, `apps/api/`, `apps/worker/`, `packages/database/`, `packages/contracts/`, `packages/shared/`, `packages/config/` | New creation; no existing code conflict |
| P0-03 Quality Toolchain | root scripts/config plus app/package TS configs | New creation; preserve task docs |
| P0-04 Local Infrastructure | `docker-compose.yml`, `.env.example`, infrastructure docs | New creation |
| P0-05 Service Skeleton | `apps/workbench/`, `apps/api/`, `apps/worker/`, health endpoints | New creation |
| P0-06 CI & Runbook | `.github/workflows/`, `README.md` updates and developer docs | New creation; retain current Sprint documentation content |

## 11. P0-02 execution recommendation

**Recommendation: PROCEED after audit approval.**

P0-02 should treat this repository as a clean documentation baseline and perform a controlled Monorepo bootstrap. Before modifying:

1. Run `git status --short` in the actual local checkout and preserve any user changes.
2. Confirm Node version policy and install/activate pnpm rather than mixing package managers.
3. Create the D-021 canonical package names exactly once.
4. Commit a deterministic `pnpm-lock.yaml`.
5. Do not delete the existing Sprint package files; they are project governance inputs and remain reusable.
6. Do not start P0-03/P0-04/P0-05 before the P0-02 root/workspace structure is established.

## 12. Risks and unresolved issues

1. **No application baseline**: all runtime services are MISSING; P0-02 scope should remain bootstrap only.
2. **Local-change visibility gap**: this audit could inspect committed GitHub state but not a developer's local uncommitted files.
3. **Tool availability**: audit execution environment has no pnpm or Docker.
4. **No CI yet**: there is currently no clean-environment verification for future work.
5. **No dependency/version baseline yet**: exact versions must be selected and locked in P0-02; do not use floating `latest` or `*`.

## 13. Actual commands/operations and results

### Attempted local repository operation
```bash
git clone https://github.com/Poetryincense/ai-overseas-store-workbench.git /tmp/ai-overseas-store-workbench
```
Result: **FAILED** — `Could not resolve host: github.com`.

### Actual environment probes
```bash
node --version
npm --version
pnpm --version
docker --version
```
Result: Node and npm available; pnpm and Docker commands unavailable.

### Actual repository reads through connected GitHub access
- Repository metadata: **SUCCESS**
- Root contents: **SUCCESS**
- Recursive Git tree for `main`: **SUCCESS**
- Recent commits (up to 5): **SUCCESS**
- `AGENTS.md`: **SUCCESS**
- `README.md`: **SUCCESS**
- `DECISIONS.md`: **SUCCESS**
- `SPRINT_PLAN.md`: **SUCCESS**
- `phase-0/P0-01-REPOSITORY-AUDIT.md`: **SUCCESS**
- Searches for existing `package.json`, workspace, Docker, ORM, Next.js, Vitest, Playwright and CI indicators: no matching application/configuration files found in the audited repository snapshot.

## 14. P0-01 acceptance conclusion

- [x] Report is based on the actual committed repository snapshot.
- [x] Repository structure and current technical baseline recorded.
- [x] Existing scripts/configurations recorded as absent rather than assumed.
- [x] Differences from `DECISIONS.md` identified.
- [x] P0-02 through P0-06 path mapping and reuse guidance provided.
- [x] No business code was changed or deleted.
- [x] No claim is made that unavailable local Git checks or nonexistent repository scripts passed.

**P0-01 final status: DONE. Stop here and wait for master-controller review before starting P0-02.**
