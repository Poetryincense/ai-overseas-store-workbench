# ADR-0006: V1 Value Focus and Scope Conflict (site building)

**Status**: Proposed (owner decision required)
**Date**: 2026-11-22
**Context**: The owner states that V1 should do site building (建站) well. The current scope rules say otherwise for Phase 0–1: AGENTS §2.6 forbids external tool calls and automated business operations, README §6 excludes Shopify and Storefront, and D-003 says Phase 1 does not create a Storefront.

## The conflict, stated plainly

- Phase 0–1 builds the container: accounts, workspaces, projects, a project brief and a dashboard.
- Site building is a product capability that needs an external platform or a generated storefront. It needs credentials, outbound API calls and a publishing workflow.
- Doing site building inside Phase 1 would break the current gate and the rules in AGENTS. It must be a scope change, not a silent addition.

## Options

| Option          | What it means                                                                                         | Cost                                         | Risk                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| A (recommended) | Phase 1 stays the container. Phase 2 is the site-building sprint, planned with its own pack after G1. | Phase 2 starts after G1                      | Lowest. Keeps every rule intact.                              |
| B               | Add a guided site-building checklist and asset list to Phase 1 (no external calls, no generation).    | Small extra work in P1-05 and P1-07          | Low. Still no external side effects.                          |
| C               | Pull external store integration or a generated storefront into V1 now.                                | Large, needs a new gate and a rewritten plan | High. Needs the ADR-0004 approval and credential store first. |

## What "site building" must mean before it is planned

The owner needs to pick one meaning:

1. **Guided setup**: the workbench tracks each step of opening a store (domain, platform, theme, payments, legal pages, product listings) and holds the assets for each step.
2. **Connected setup**: the workbench drives an external platform through its API (for example a store platform). This needs OAuth or token handling, the credential store from ADR-0004, and approval gates.
3. **Generated storefront**: the workbench produces the site itself. This reverses D-003 and is the largest option.

## Recommendation

Choose option A now. Choose the meaning of "site building" as the first item of the Phase 2 planning. Option B can be considered when P1-05 is designed, if the owner wants the project brief to capture site-building inputs earlier.

## What is not decided here

- No new site-building tables or fields. The brief already holds market, business model, budget and constraints.
- No external platform is chosen.
