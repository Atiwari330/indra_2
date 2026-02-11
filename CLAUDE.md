# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Indra is an AI-native EHR for outpatient behavioral health. It's a Next.js 16 backend (API routes) + Supabase + Vercel AI SDK v6 application. The AI agent orchestrates clinical workflows — it proposes actions (note drafts, billing, appointments, medication changes) that providers review before committing to the clinical record.

## Commands

```bash
npm run dev              # Next.js dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest watch mode
npm run test:run         # Vitest single run (CI)
npm run db:push          # Push Supabase migrations
npm run db:types         # Regenerate TypeScript types from Supabase schema

# Testing scripts (use dotenv with .env.local, not .env)
npx tsx scripts/run-intent.ts "Write a progress note for John Doe"  # Interactive AI intent testing
npx tsx scripts/test-workflows.ts                                    # 5-scenario automated test suite
npx tsx scripts/seed-canary-data.ts                                  # Seed additional test data
npx tsx scripts/seed-test-data.ts                                    # Verify seed data integrity
npx tsx scripts/cleanup-test-data.ts                                  # Clean up test data
npx tsx scripts/check-run.ts                                          # Check AI run status
```

## Testing

Tests live in `tests/**/*.test.ts` (unit and integration). Vitest runs in node environment with `@` path alias.

```bash
npm run test                                          # Watch mode
npm run test:run                                      # Single run (CI)
npx vitest run tests/unit/ai/orchestrator.test.ts     # Single file
npx vitest run -t "test name pattern"                 # By test name
```

## Git & Planning Workflow

When writing a plan for a new feature or body of work, ALWAYS include these git steps:

1. **Start clean.** Verify `git status` shows a clean working tree. If there are uncommitted changes from a previous feature branch, the plan MUST include steps to: commit that work, push the branch, and merge it to main (or confirm with the user what to do with it) before starting new work.

2. **Work on a feature branch.** Create a new branch (`feature/<name>`) or confirm the correct feature branch is already checked out. Never work directly on main.

3. **NEVER merge the feature branch to main unless the user explicitly tells you to.** This rule is absolute. The plan must state this constraint clearly so the executing agent does not auto-merge on completion. The user will decide when to merge.

## Architecture

### Core Flow: Intent → Orchestrate → Propose → Commit

```
User prompt ("Write a note for John Doe")
  → POST /api/ai/intent
    → classifyIntent() (Gemini 3 Flash)
    → loadPatientContextForPrompt() (8-entity parallel query)
    → runOrchestrator() (phased tool access loop, max 10 steps)
      → Steps 1-2: Lookup only (find_patient, get_patient_context, resolve_encounter)
      → Steps 3-7: Lookup + Action + Terminal (all tools)
      → Steps 8-10: Terminal only (submit_results, ask_clarification)
    → Store proposed actions in ai_proposed_actions
    → Run status → ready_to_commit
  → Provider reviews in UI
  → POST /api/ai/runs/[id]/commit
    → commit.service.ts: execute each proposed action in order
    → Cross-references resolved via $ref: placeholders
    → Clinical records created (note_drafts → clinical_notes)
```

### Trust Boundary

**AI never writes directly to clinical tables.** The flow is: AI proposes → `ai_proposed_actions` table → provider reviews → `commit.service.ts` executes. The commit service (`src/services/commit.service.ts`) is the sole gateway to clinical records. Actions in a group are executed in order with `$ref:` cross-reference resolution (e.g., a note action references the encounter_id created by a preceding action).

### Note Lifecycle

`note_drafts` (AI output) are separate from `clinical_notes` (legal record). Drafts go through: pending_review → accepted → clinical_notes created → signed (immutable, SHA256 hash in note_signatures). Signed notes cannot be updated — only amended (creates new version with `previous_version_id`).

### Key Directories

- `src/ai/orchestrator.ts` — generateText loop with phased tool filtering via `prepareStep`
- `src/ai/run-manager.ts` — Full lifecycle: create run → classify intent → load context → orchestrate → persist steps → handle terminal tool
- `src/ai/context-loader.ts` — Formats patient context as human-readable text for the system prompt
- `src/ai/system-prompt.ts` — Dynamic prompt builder with compliance rules and SOAP requirements
- `src/ai/tools/` — All 11 tools (3 lookup, 6 action, 2 terminal)
- `src/services/commit.service.ts` — Trust boundary: proposed actions → clinical records
- `src/services/patient.service.ts` — Patient search + `getPatientContext()` (loads diagnoses, meds, notes, treatment plan, insurance, encounters, appointments in parallel)
- `src/lib/api-helpers.ts` — `getAuthContext()`, `getAdminClient()`, response helpers
- `src/lib/schemas/` — Zod validation schemas for all API boundaries
- `src/lib/types/database.ts` — Auto-generated from Supabase (regenerate with `npm run db:types`)
- `supabase/migrations/` — Sequential migrations (platform → clinical → billing → AI → audit → RLS → seed)

## SDK & Library Gotchas

### Vercel AI SDK v6 (NOT v5)
- Use `inputSchema` (Zod object), not `parameters`
- Use `ModelMessage`, not `CoreMessage`
- Use `inputTokens`/`outputTokens`, not `promptTokens`/`completionTokens`
- Use `stopWhen` (array of conditions like `stepCountIs()`, `hasToolCall()`), not `maxSteps`
- Model: `gateway('google/gemini-3-flash-preview')` via `@ai-sdk/gateway`

### Zod v4
- `z.record()` requires 2 args: `z.record(z.string(), z.unknown())` — single arg throws
- UUID validation is strict RFC 4122 — test with valid v4 UUIDs like `550e8400-e29b-41d4-a716-446655440000`

### Supabase
- Cloud project ID: `wkbfhvepiavfdhwmlnyf`
- RLS on every table filtered by `org_id` from JWT
- `getAdminClient()` (service-role key) bypasses RLS for server-side orchestration
- `supabase migration repair --status reverted <version>` to clear stale remote migrations before pushing

## Adding New Tools

1. Create `src/ai/tools/your-tool.ts` using `tool()` with `inputSchema` and `execute`
2. Register in `src/ai/orchestrator.ts` → `allTools` object
3. Add tool name to the appropriate phase array: `lookupToolNames`, `actionToolNames`, or `terminalToolNames`
4. For action tools: return `_proposed_action` with `{ action_type, target_table, payload }`
5. Add commit handler in `commit.service.ts` → `executeAction()` switch case
6. If new action type: add to `ai_action_type` enum in a new migration

## Adding Context to Patient Load

1. Add query in `getPatientContext()` in `src/services/patient.service.ts`
2. Update the return type
3. Format as text in `loadPatientContextForPrompt()` in `src/ai/context-loader.ts`
4. If new table: create migration with RLS policy, run `npm run db:types`

## Seed Data IDs (Dev Mode)

When `SKIP_AUTH=true`, the system uses these fixed seed identities:

| Entity | ID |
|--------|----|
| Org | `a0000000-0000-0000-0000-000000000001` |
| User (Sarah Chen) | `b0000000-0000-0000-0000-000000000001` |
| Provider (LCSW) | `c0000000-0000-0000-0000-000000000001` |
| Patients | `d0000000-0000-0000-0000-00000000000[1-5]` |

UUID hex digits only go up to `f` — never use characters like `g` in seed UUIDs.

## Database Conventions

- Every table has `org_id` for multi-tenant isolation via RLS
- Clinical tables have audit triggers capturing all mutations to `audit_log` (append-only, UPDATE/DELETE revoked)
- `clinical_notes` uses `version` + `is_current` + `previous_version_id` for append-only versioning
- Enums are Postgres-level (e.g., `ai_run_status`, `encounter_type`, `note_status`) — update via migration
