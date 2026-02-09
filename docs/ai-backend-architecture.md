# Indra EHR — AI Backend Architecture

> **Version:** 1.0 | **Last updated:** 2026-02-08
>
> This document is self-contained. It provides full context on how the Indra AI backend works — its philosophy, architecture, tool system, database schema, services, and extension patterns.

---

## Table of Contents

1. [Project Overview & Philosophy](#1-project-overview--philosophy)
2. [High-Level Architecture](#2-high-level-architecture)
3. [AI Orchestrator](#3-ai-orchestrator)
4. [Phased Tool Access Pattern](#4-phased-tool-access-pattern)
5. [System Prompt](#5-system-prompt)
6. [Intent Classification](#6-intent-classification)
7. [Run Manager](#7-run-manager)
8. [All AI Tools (Complete Reference)](#8-all-ai-tools-complete-reference)
9. [The Trust Boundary: Commit Service](#9-the-trust-boundary-commit-service)
10. [Service Layer](#10-service-layer)
11. [API Routes](#11-api-routes)
12. [Database Schema (AI-Specific Tables)](#12-database-schema-ai-specific-tables)
13. [Database Schema (Clinical Tables Summary)](#13-database-schema-clinical-tables-summary)
14. [Security Model](#14-security-model)
15. [Key Patterns & Conventions](#15-key-patterns--conventions)
16. [How to Extend the System](#16-how-to-extend-the-system)

---

## 1. Project Overview & Philosophy

**Indra** is an AI-native Electronic Health Record (EHR) for **outpatient behavioral health**. It combines clinical documentation, scheduling, billing, and medication management into a single system where an AI assistant helps providers work faster without compromising clinical integrity.

### Core Philosophy

```
AI proposes  -->  Provider reviews  -->  Provider commits
```

This is the **trust boundary**. The AI orchestrates clinical workflows (looking up patients, drafting notes, suggesting billing codes), but every action it takes is a **proposal**. Nothing touches the clinical record until a human provider explicitly approves it.

### Key Design Principles

- **Note drafts are NOT clinical records.** AI output lives in a separate `note_drafts` table. Only after provider review does content move to `clinical_notes`.
- **The AI is not a clinician.** It is a *clinical workflow orchestrator* — it finds patients, loads context, drafts notes, and suggests codes, but it does not make clinical decisions.
- **Assumptions are tracked.** Every AI-generated note includes an `assumptions_made` array listing what was inferred vs. explicitly stated.
- **Signed notes are immutable.** Once a note is signed, RLS policies block updates. Amendments create a new version.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| API framework | Next.js 15 (App Router, API routes only) |
| Database | Supabase (PostgreSQL with RLS) |
| AI SDK | Vercel AI SDK v6 |
| AI Model | Google Gemini 3 Flash via `@ai-sdk/gateway` |
| Language | TypeScript (strict) |
| Schema validation | Zod v4 |

---

## 2. High-Level Architecture

```
Provider Input (natural language)
        |
        v
  POST /api/ai/intent
        |
        v
+------------------+
| Intent Classifier |  (Gemini 3 Flash + structured output)
| Extracts: intent_type, patient_name, encounter_date, confidence
+------------------+
        |
        v
+------------------+
|   Run Manager    |  executeIntent() — lifecycle orchestrator
|   Creates run,   |
|   loads context, |
|   calls orchestrator
+------------------+
        |
        v
+-------------------------------+
|       AI Orchestrator         |  generateText() agentic loop
|  Phased tool access:          |
|    Steps 1-2:  Lookup+Terminal|
|    Steps 3-7:  All tools      |
|    Steps 8-10: Terminal only  |
+-------------------------------+
        |                    |
        v                    v
  submit_results       ask_clarification
        |                    |
        v                    v
  Proposed Actions     Clarification Questions
  (stored in DB)       (stored in DB)
        |                    |
        v                    v
  Provider Reviews     Provider Answers
        |                    |
        v                    v
  POST .../commit      POST .../respond
        |                    |
        v                    v
+------------------+   Resume orchestrator
|  Commit Service  |   with previous messages
|  (trust boundary)|   + injected answers
+------------------+
        |
        v
  Clinical Tables
  (notes, appointments,
   medications, claims)
        |
        v
  Audit Log (trigger-based, append-only)
```

### Request Flow Summary

1. Provider types natural language (e.g., *"Write a progress note for John Doe — 45-min individual therapy, discussed CBT techniques for anxiety"*)
2. Intent classifier categorizes the request
3. Run manager creates a run record, loads provider/patient/encounter context
4. Orchestrator loops through tools: finds patient, loads context, resolves encounter, creates note draft
5. Orchestrator calls `submit_results` with proposed actions
6. Provider sees proposed actions, reviews the note draft, and clicks "Commit"
7. Commit service executes each action in order, writing to clinical tables
8. Audit triggers capture every mutation

---

## 3. AI Orchestrator

**File:** `src/ai/orchestrator.ts`

The orchestrator is a single `generateText()` call from Vercel AI SDK v6 that runs an agentic tool-calling loop.

### Configuration

```typescript
interface OrchestratorConfig {
  client: SupabaseClient<Database>;  // Admin client (bypasses RLS)
  orgId: string;
  providerId: string;
  runId: string;
  systemPromptContext: SystemPromptContext;
  previousMessages?: ModelMessage[];  // For resuming after clarification
}
```

### How It Works

```typescript
const result = await generateText({
  model: gateway('google/gemini-3-flash-preview'),
  system: systemPrompt,
  messages: previousMessages ?? [],
  tools: allTools,
  stopWhen: [
    stepCountIs(10),
    hasToolCall('submit_results'),
    hasToolCall('ask_clarification'),
  ],
  toolChoice: 'auto',
  prepareStep: ({ stepNumber }) => {
    // Returns different tool subsets based on step number
    // (see Phased Tool Access below)
  },
  onStepFinish: (step) => {
    // Tracks token usage and collects step info
  },
});
```

### Key SDK v6 Details

- **`stopWhen`** (not `maxSteps`): Array of conditions that terminate the loop. The loop stops on:
  - `stepCountIs(10)` — hard limit of 10 steps
  - `hasToolCall('submit_results')` — normal completion
  - `hasToolCall('ask_clarification')` — pauses for provider input
- **`prepareStep`**: Called before each step to dynamically control which tools are available (phased access).
- **`ModelMessage`** (not `CoreMessage`): The message type used by AI SDK v6.
- **`inputTokens`/`outputTokens`** (not `promptTokens`/`completionTokens`): Token usage field names.
- **`inputSchema`** (not `parameters`): How tool input schemas are defined.

### Return Structure

```typescript
interface OrchestratorResult {
  terminationReason: 'submit_results' | 'ask_clarification' | 'max_steps' | 'error';
  terminalToolArgs?: Record<string, unknown>;  // Args from the terminal tool call
  steps: StepInfo[];                           // All steps with tool calls, results, usage
  totalTokens: { input: number; output: number };
  messages: ModelMessage[];                    // Full message history (for resumability)
}
```

The `messages` field is critical — it enables resuming the orchestrator after a clarification pause by passing the full conversation history back.

---

## 4. Phased Tool Access Pattern

**Why it exists:** Prevents the AI from taking action before it has sufficient context. Without phasing, the model might try to create a note before identifying the patient.

### Phase Definitions

| Step Range | Available Tools | Purpose |
|-----------|----------------|---------|
| Steps 1-2 | Lookup + Terminal | Force the model to identify patient, load context first |
| Steps 3-7 | Lookup + Action + Terminal | All tools available for the main workflow |
| Steps 8-10 | Terminal only | Force completion — model must wrap up |

### Tool Categories

| Category | Tools |
|----------|-------|
| **Lookup** | `find_patient`, `get_patient_context`, `resolve_encounter` |
| **Action** | `create_progress_note`, `create_appointment`, `suggest_billing_codes`, `update_medication` |
| **Terminal** | `ask_clarification`, `submit_results` |

### Implementation

The `prepareStep` callback in the orchestrator dynamically filters the tool set:

```typescript
prepareStep: ({ stepNumber }) => {
  let activeToolNames;
  if (stepNumber <= 2) {
    activeToolNames = [...lookupToolNames, ...terminalToolNames];
  } else if (stepNumber <= 7) {
    activeToolNames = [...lookupToolNames, ...actionToolNames, ...terminalToolNames];
  } else {
    activeToolNames = [...terminalToolNames];
  }
  // Return only the active tools
}
```

---

## 5. System Prompt

**File:** `src/ai/system-prompt.ts`

### Structure

The system prompt is built dynamically from a `SystemPromptContext`:

```typescript
interface SystemPromptContext {
  providerName: string;         // "Sarah Chen"
  providerCredentials: string;  // "LCSW"
  preferredNoteFormat: string;  // "SOAP" (always SOAP for now)
  organizationName: string;     // "Riverbend Behavioral Health"
  todayDate: string;            // "2026-02-08"
  patientContext?: string;      // Injected if patient_id provided upfront
  encounterContext?: string;    // Injected if encounter_id provided upfront
}
```

### Key Sections

1. **Role Definition**: "You are a clinical workflow orchestrator... You are NOT a clinician."
2. **Behavioral Rules** (12 rules):
   - Always call `find_patient` first if patient identity unknown
   - Always call `get_patient_context` after identifying patient
   - Always call `resolve_encounter` before creating notes/billing
   - Never fabricate clinical content
   - Use `ask_clarification` when information is ambiguous
   - Track assumptions in `assumptions_made` array
   - Always use SOAP format for progress notes
   - Always end with `submit_results` (even for informational queries)
   - Use `_proposed_action.payload` from tool results (not reconstructed from memory)
3. **Tool Ordering**: Explicit phase documentation (Lookup → Action → Complete)
4. **Documentation Standards**: Clinical accuracy, ICD-10 references in assessment, specific/actionable plans
5. **Dynamic Context** (injected when available):
   - Patient context: demographics, diagnoses, medications, recent notes, treatment plan, upcoming appointments
   - Encounter context: date, type, duration, status

### Context Loaders

**File:** `src/ai/context-loader.ts`

Two functions build injectable text blocks:

- **`loadPatientContextForPrompt(client, orgId, patientId)`** — Calls `getPatientContext()` from patient.service and formats: demographics, active diagnoses (ICD-10), current medications, last 3 notes (truncated summaries), treatment plan goals, upcoming appointments.

- **`loadEncounterContextForPrompt(client, orgId, encounterId)`** — Simple one-liner: encounter date, type, duration, status.

---

## 6. Intent Classification

**File:** `src/ai/intent-classifier.ts`

Uses `generateObject()` with Gemini 3 Flash to classify the provider's natural language input into a structured intent.

### Intent Types

| Intent | Meaning |
|--------|---------|
| `create_progress_note` | Document a clinical session/encounter |
| `schedule_appointment` | Schedule a follow-up or new appointment |
| `query_patient_info` | Look up information about a patient |
| `update_medication` | Change a patient's medication |
| `general_query` | General question or unclear intent |

### Output Schema

```typescript
const IntentClassification = z.object({
  intent_type: z.enum([...]),         // One of the 5 types above
  patient_name: z.string().optional(), // Extracted patient name if mentioned
  encounter_date: z.string().optional(), // Extracted date if mentioned
  confidence: z.number().min(0).max(1), // Classification confidence
});
```

### Behavior

- Classification is **best-effort** — if it fails, the system falls back to `general_query` and continues.
- The extracted `patient_name` is informational; the actual patient resolution happens via the `find_patient` tool during orchestration.
- The intent type is stored on the `ai_runs` record for analytics.

---

## 7. Run Manager

**File:** `src/ai/run-manager.ts`

The run manager is the top-level lifecycle controller. It ties together intent classification, context loading, orchestration, and result persistence.

### `executeIntent()` Lifecycle

```
1. Create ai_run record (status: pending)
   - Check idempotency key; return existing run if duplicate
2. Update status → running
3. Classify intent (best-effort)
4. Load provider context (provider name, credentials, org)
5. Load patient context (if patient_id provided)
6. Load encounter context (if encounter_id provided)
7. Build initial messages: [{ role: 'user', content: inputText }]
8. Run orchestrator
9. Persist all steps to ai_steps table
10. Process terminal tool call:
    - submit_results → create proposed actions, status → ready_to_commit
    - ask_clarification → create clarifications, status → needs_clarification
    - max_steps → status → failed
```

### `resumeAfterClarification()` Lifecycle

```
1. Load run with details (verify status = needs_clarification)
2. Check all clarifications are answered
3. Load previous messages from last step
4. Inject synthetic tool result for ask_clarification call
   (prevents MissingToolResultsError from AI SDK)
5. Append clarification answers as user message
6. Reload provider context
7. Update status → running
8. Run orchestrator with full message history
9. Persist new steps (step numbers continue from previous)
10. Process terminal tool call (same as executeIntent)
```

### Status Lifecycle

```
pending → running → ready_to_commit → committed
                  ↘ needs_clarification → running (resume) → ready_to_commit → committed
                  ↘ failed
```

### Cost Tracking

Each run tracks token usage and estimated cost:

```typescript
const COST_PER_INPUT_TOKEN = 0.00015 / 1000;   // Gemini 3 Flash approx
const COST_PER_OUTPUT_TOKEN = 0.0006 / 1000;
const costCents = (input * COST_PER_INPUT_TOKEN + output * COST_PER_OUTPUT_TOKEN) * 100;
```

Stored as `total_tokens` (int) and `total_cost_cents` (numeric) on the run.

### `_proposed_action` Payload Capture

The run manager extracts captured payloads from tool results using the `_proposed_action` pattern:

```typescript
function extractCapturedPayloads(result) {
  // Walks all step tool results looking for _proposed_action objects
  // Returns Map<action_type, Array<{ target_table, payload }>>
}
```

When building proposed actions from `submit_results` args, captured payloads from actual tool executions take precedence over the model's reconstructed payloads. This ensures the committed payload matches what the tool actually computed.

---

## 8. All AI Tools (Complete Reference)

All tools are defined in `src/ai/tools/` and use the Vercel AI SDK v6 `tool()` function with `inputSchema` (Zod).

---

### Lookup Tools

#### `find_patient`

| | |
|-|-|
| **File** | `src/ai/tools/find-patient.ts` |
| **Phase** | Lookup |
| **Purpose** | Search for a patient by name |
| **DB Tables** | `patients` (read) |

**Input Schema:**
```
{ query: string }  // Patient name or partial name
```

**Output Shape:**
```
{ found: boolean, patient_id?: string, patient_name?: string, ambiguous?: boolean, patients: [{ id, name, dob }] }
```

**Behavior:** Searches active patients by first/last name using `ilike`. Returns single match with `patient_id`, or multiple matches with `ambiguous: true` for the model to use `ask_clarification`.

---

#### `get_patient_context`

| | |
|-|-|
| **File** | `src/ai/tools/get-patient-context.ts` |
| **Phase** | Lookup |
| **Purpose** | Load full clinical profile for a patient |
| **DB Tables** | `patients`, `patient_diagnoses`, `medications`, `clinical_notes`, `treatment_plans`, `appointments` (read) |

**Input Schema:**
```
{ patient_id: string }  // UUID from find_patient
```

**Output Shape:**
```
{
  patient: { id, name, dob, gender, status },
  diagnoses: [{ code, description, is_primary, status }],
  medications: [{ id, name, dosage, frequency }],
  recent_notes: [{ id, date, type, content_summary }],
  treatment_plan: { goals, status } | null,
  upcoming_appointments: [{ date, type }]
}
```

**Behavior:** Calls `getPatientContext()` which runs 6 parallel queries. Returns last 3 notes (truncated to 150 chars), active diagnoses (primary first), active medications, current treatment plan, and next 5 scheduled appointments.

---

#### `resolve_encounter`

| | |
|-|-|
| **File** | `src/ai/tools/resolve-encounter.ts` |
| **Phase** | Lookup |
| **Purpose** | Find or create an encounter for a patient on a date |
| **DB Tables** | `encounters` (read/write) |

**Input Schema:**
```
{
  patient_id: string,
  date: string,           // YYYY-MM-DD
  encounter_type: enum    // default: 'individual_therapy'
}
```

**Encounter Type Enum:** `individual_therapy`, `group_therapy`, `family_therapy`, `intake`, `crisis`, `telehealth`, `medication_management`

**Output Shape:**
```
{ encounter_id: string, created: boolean, encounter_date, encounter_type, status }
```

**Behavior:** Looks for an existing encounter matching patient+provider+date with status in (`scheduled`, `in_progress`, `completed`). If not found, creates one with status `in_progress`.

---

### Action Tools

#### `create_progress_note`

| | |
|-|-|
| **File** | `src/ai/tools/create-progress-note.ts` |
| **Phase** | Action |
| **Purpose** | Generate a structured SOAP progress note draft |
| **DB Tables** | None (pure computation, captures `_proposed_action`) |

**Input Schema:**
```
{
  encounter_id: string,
  content: {
    subjective: string,  // What the patient reports
    objective: string,   // Observable data
    assessment: string,  // Clinical assessment
    plan: string,        // Treatment plan / next steps
  },
  risk_assessment?: {
    suicidal_ideation: boolean,
    homicidal_ideation: boolean,
    self_harm: boolean,
    details?: string,
  },
  assumptions_made: string[],  // Transparency about inferences
  session_duration_minutes?: number,
}
```

**Output Shape:**
```
{
  note_type: 'SOAP',
  status: 'proposed',
  assumptions_made: [...],
  message: '...',
  _proposed_action: {
    action_type: 'create_note_draft',
    target_table: 'note_drafts',
    payload: { encounter_id, ai_run_id, note_type: 'SOAP', content }
  }
}
```

**Behavior:** Pure function — does not write to DB. Returns the note content with a `_proposed_action` payload that the run manager captures and uses when creating proposed actions. The `runId` is injected at tool creation time.

---

#### `create_appointment`

| | |
|-|-|
| **File** | `src/ai/tools/create-appointment.ts` |
| **Phase** | Action |
| **Purpose** | Propose scheduling a new appointment |
| **DB Tables** | `appointments` (read, for availability check) |

**Input Schema:**
```
{
  patient_id: string,
  start_time: string,          // ISO 8601
  duration_minutes: number,    // default: 45
  appointment_type: string,    // default: 'individual_therapy'
  notes?: string,
}
```

**Output Shape (available):**
```
{
  success: true,
  proposed_appointment: { patient_id, start_time, end_time, ... },
  message: '...',
  _proposed_action: {
    action_type: 'create_appointment',
    target_table: 'appointments',
    payload: { patient_id, start_time, end_time, appointment_type, notes }
  }
}
```

**Output Shape (conflict):**
```
{ success: false, message: '...', conflicts: [{ start, end }] }
```

**Behavior:** Checks provider availability via `checkAvailability()` before proposing. Computes `end_time` from `start_time + duration_minutes`. If conflicts exist, returns them so the model can suggest an alternative or ask for clarification.

---

#### `suggest_billing_codes`

| | |
|-|-|
| **File** | `src/ai/tools/suggest-billing-codes.ts` |
| **Phase** | Action |
| **Purpose** | Suggest CPT and ICD-10 billing codes for an encounter |
| **DB Tables** | `patient_insurance` (read) |

**Input Schema:**
```
{
  encounter_id: string,
  patient_id: string,
  encounter_type: string,
  duration_minutes: number,
  active_diagnoses: [{ code, description, is_primary }],
  date_of_service: string,
}
```

**Output Shape:**
```
{
  suggested_claim: {
    encounter_id, patient_id, date_of_service,
    patient_insurance_id, diagnoses, line_items, copay
  },
  message: 'Suggested 90834 (Psychotherapy, 45 minutes) with 2 diagnosis code(s).',
  _proposed_action: {
    action_type: 'suggest_billing',
    target_table: 'claims',
    payload: { encounter_id, patient_id, date_of_service, ... }
  }
}
```

**Behavior:** CPT code selection is **deterministic** (no LLM needed):

| Encounter Type | CPT Code |
|---------------|----------|
| `intake` | 90791 |
| `group_therapy` | 90853 |
| `family_therapy` | 90847 |
| `crisis` | 90839 |
| `medication_management` | 99214 |
| `individual_therapy` / `telehealth` | 90832 (<38 min), 90834 (38-52 min), 90837 (53+ min) |

ICD-10 codes come from the patient's active diagnoses. Primary diagnosis is always sequence 1. Base rates are hardcoded per CPT code.

---

#### `update_medication`

| | |
|-|-|
| **File** | `src/ai/tools/update-medication.ts` |
| **Phase** | Action |
| **Purpose** | Propose a medication change (start, change, or discontinue) |
| **DB Tables** | None (pure computation, captures `_proposed_action`) |

**Input Schema:**
```
{
  patient_id: string,
  action: 'start' | 'change' | 'discontinue',
  medication_name: string,
  dosage: string,
  frequency: string,
  route: string,          // default: 'oral'
  current_medication_id?: string,  // For change/discontinue
  change_reason: string,
}
```

**Output Shape:**
```
{
  proposed_medication_change: { patient_id, action, name, dosage, ... },
  message: 'Proposed to change Sertraline 50mg once daily. Requires provider approval.',
  _proposed_action: {
    action_type: 'update_medication',
    target_table: 'medications',
    payload: { patient_id, name, dosage, frequency, route, discontinue_medication_id, change_reason }
  }
}
```

**Behavior:** Pure function. For `change`/`discontinue` actions, includes `discontinue_medication_id` so the commit service knows which existing medication to mark as changed/discontinued.

---

### Terminal Tools

#### `ask_clarification`

| | |
|-|-|
| **File** | `src/ai/tools/terminal-tools.ts` |
| **Phase** | Terminal |
| **Purpose** | Pause workflow and ask the provider questions |
| **DB Tables** | None (handled by run manager) |

**Input Schema:**
```
{
  questions: [{
    question: string,
    context?: string,      // Why this question is needed
    options?: string[],    // Suggested answer options
  }]
}
```

**Behavior:** The `stopWhen` condition `hasToolCall('ask_clarification')` halts the orchestrator loop immediately. The run manager creates `ai_clarifications` records and sets status to `needs_clarification`. Note: this tool has no `execute` function — the loop stops before execution.

---

#### `submit_results`

| | |
|-|-|
| **File** | `src/ai/tools/terminal-tools.ts` |
| **Phase** | Terminal |
| **Purpose** | Complete the workflow and present proposed actions |
| **DB Tables** | None (handled by run manager) |

**Input Schema:**
```
{
  summary: string,
  proposed_actions: [{
    action_type: enum,       // 'create_note_draft' | 'create_encounter' | 'suggest_billing' | 'update_medication' | 'create_appointment'
    description: string,
    target_table: string,
    payload: Record<string, unknown>,
    confidence: number,      // 0-1
    assumptions?: string[],
  }]
}
```

**Action Type Enum Values:** `create_note_draft`, `create_encounter`, `suggest_billing`, `update_medication`, `create_appointment`

**Behavior:** The `stopWhen` condition `hasToolCall('submit_results')` halts the loop. The run manager creates `ai_proposed_actions` records, sets status to `ready_to_commit`, and returns the proposed actions to the provider. For informational queries, `proposed_actions` is an empty array and the answer goes in `summary`.

---

## 9. The Trust Boundary: Commit Service

**File:** `src/services/commit.service.ts`

This is the single gateway between AI proposals and clinical records. Every database write to clinical tables goes through here.

### `commitActionGroup(client, groupId, providerId, orgId)`

Executes all pending actions in an action group, in order.

**Flow:**

```
1. Load all pending actions for the group, ordered by action_order
2. For each action:
   a. Use provider_modified_payload if present, otherwise use original payload
   b. Resolve any $ref: cross-references from previously committed actions
   c. Execute the action (calls appropriate service)
   d. Store created ID in refs map for cross-references
   e. Mark action as committed
   f. On failure: stop processing, do not continue to next action
3. If all actions succeeded: update run status → committed
```

### Supported Action Types

| Action Type | What It Does | Service Called |
|------------|--------------|---------------|
| `create_encounter` | Find/create encounter, optionally update duration | `encounterService.resolveEncounter()`, `encounterService.updateEncounterStatus()` |
| `create_note_draft` | Create note draft → auto-accept → create clinical note | `noteService.createNoteDraft()`, `noteService.acceptNoteDraft()` |
| `create_appointment` | Create a scheduled appointment | `appointmentService.createAppointment()` |
| `update_medication` | Discontinue old + create new medication | Direct DB operations on `medications` |
| `suggest_billing` | Create claim with diagnoses + line items | `billingService.createClaim()` |

### Cross-Reference Pattern (`$ref:`)

Actions in a group can depend on each other. For example, a note needs an `encounter_id` that was created by a previous `create_encounter` action.

```json
// Action 0: create_encounter → creates encounter with id "abc-123"
// Action 1: create_note_draft
{
  "encounter_id": "$ref:encounters_id"   // Resolved to "abc-123" at commit time
}
```

The `resolveCrossRefs()` function walks the payload and replaces any `$ref:<key>` values with actual IDs from the `refs` map. Refs are stored as:
- `{action_type}_id` — e.g., `create_encounter_id`
- `{target_table}_id` — e.g., `encounters_id`

### Provider-Modified Payloads

The `ai_proposed_actions` table has a `provider_modified_payload` column. If the provider edits the payload before committing (e.g., rewrites part of a note), the commit service uses the modified payload instead of the original.

### `rejectRun(client, runId, userId, reason?)`

Rejects all pending actions in a run and marks the run as failed.

---

## 10. Service Layer

### `ai-run.service.ts`
**File:** `src/services/ai-run.service.ts`

CRUD operations for the AI run lifecycle:
- `createRun(client, orgId, userId, inputText, idempotencyKey?)` — Creates run with idempotency check
- `updateRunStatus(client, runId, status, data?)` — Updates status with optional metadata
- `addStep(client, runId, stepData)` — Persists a step (tool call or LLM call)
- `createProposedAction(client, runId, orgId, actionData)` — Creates a proposed action record
- `createClarification(client, runId, orgId, questionData)` — Creates a clarification question
- `answerClarification(client, clarificationId, answer, userId)` — Records the provider's answer
- `getRunWithDetails(client, runId)` — Loads run + steps + actions + clarifications in parallel

### `patient.service.ts`
**File:** `src/services/patient.service.ts`

- `getPatient(client, orgId, patientId)` — Single patient lookup
- `searchPatients(client, orgId, query, limit?)` — Name search with `ilike`, handles multi-term queries
- `getPatientContext(client, orgId, patientId)` — Parallel load of patient + diagnoses + medications + recent notes + treatment plan + upcoming appointments

### `encounter.service.ts`
**File:** `src/services/encounter.service.ts`

- `createEncounter(client, orgId, input)` — Direct create
- `getEncounter(client, orgId, encounterId)` — With joined patient/provider data
- `resolveEncounter(client, orgId, patientId, providerId, date, encounterType)` — Find existing or create new
- `updateEncounterStatus(client, orgId, encounterId, status, durationMinutes?)` — Update status/duration

### `note.service.ts`
**File:** `src/services/note.service.ts`

- `createNoteDraft(client, orgId, input)` — Creates in `note_drafts` with status `pending_review`
- `acceptNoteDraft(client, orgId, draftId, providerId, encounterId, patientId, providerEdits?)` — Creates `clinical_notes` record from draft, marks draft as accepted
- `signNote(client, orgId, noteId, providerId)` — Signs a draft note: updates status to `signed`, creates SHA-256 content hash, creates `note_signatures` record
- `amendNote(client, orgId, input)` — Marks current note as `amended`/`is_current=false`, creates new version with `version+1`, links via `previous_version_id`
- `getNoteHistory(client, orgId, encounterId)` — Returns all note versions for an encounter

### `appointment.service.ts`
**File:** `src/services/appointment.service.ts`

- `createAppointment(client, orgId, input)` — Creates with status `scheduled`
- `getSchedule(client, orgId, providerId, startDate, endDate)` — Provider schedule with patient names
- `checkAvailability(client, orgId, providerId, startTime, durationMinutes)` — Checks for overlapping scheduled appointments

### `billing.service.ts`
**File:** `src/services/billing.service.ts`

- `createClaim(client, orgId, input)` — Creates claim + diagnoses + line items in 3 inserts
- `suggestCptCode(encounterType, durationMinutes?)` — **Deterministic** CPT code selection (no LLM)
- `validateClaim(client, orgId, claimId)` — Validates diagnoses exist, line items exist, diagnosis pointers match
- `getCptCodes(client, category?)` — Reference table lookup
- `searchIcd10Codes(client, searchQuery)` — Code/description search with `ilike`

### `commit.service.ts`
**File:** `src/services/commit.service.ts`

*(Detailed in [Section 9](#9-the-trust-boundary-commit-service))*

---

## 11. API Routes

All routes are Next.js 15 App Router API routes. Auth is handled by `getAuthContext()` which currently uses seed data IDs in dev mode (`SKIP_AUTH=true`).

The admin client (service role, bypasses RLS) is used for all server-side operations.

---

### `POST /api/ai/intent`

**File:** `src/app/api/ai/intent/route.ts`

Starts a new AI workflow.

**Input:**
```json
{
  "text": "Write a progress note for John Doe...",
  "patient_id": "uuid (optional)",
  "encounter_id": "uuid (optional)",
  "idempotency_key": "string (optional)"
}
```

**Validation:** Uses `IntentInput` Zod schema.

**Output (ready_to_commit):**
```json
{
  "runId": "uuid",
  "status": "ready_to_commit",
  "intentType": "create_progress_note",
  "summary": "Created a SOAP progress note for John Doe...",
  "proposedActions": [
    {
      "id": "uuid",
      "action_type": "create_note_draft",
      "description": "...",
      "payload": { ... }
    }
  ],
  "totalTokens": { "input": 5000, "output": 2000 }
}
```

**Output (needs_clarification):**
```json
{
  "runId": "uuid",
  "status": "needs_clarification",
  "intentType": "create_progress_note",
  "clarifications": [
    { "id": "uuid", "question": "What was the session duration?", "options": ["30 min", "45 min", "60 min"] }
  ],
  "totalTokens": { "input": 3000, "output": 500 }
}
```

**Calls:** `executeIntent()` from run-manager.

---

### `GET /api/ai/runs/[id]`

**File:** `src/app/api/ai/runs/[id]/route.ts`

Get full details for a run (including steps, proposed actions, clarifications).

**Output:**
```json
{
  "run": { "id": "...", "status": "...", ... },
  "steps": [...],
  "actions": [...],
  "clarifications": [...]
}
```

**Calls:** `getRunWithDetails()` from ai-run.service. Verifies org ownership.

---

### `POST /api/ai/runs/[id]/commit`

**File:** `src/app/api/ai/runs/[id]/commit/route.ts`

Commit all proposed actions for a run. This is the provider's approval action.

**Preconditions:** Run status must be `ready_to_commit`. Must have pending actions.

**Output:**
```json
{
  "committed": 2,
  "results": [
    { "actionId": "...", "actionType": "create_encounter", "success": true, "result": { ... } },
    { "actionId": "...", "actionType": "create_note_draft", "success": true, "result": { ... } }
  ]
}
```

**Calls:** `commitActionGroup()` from commit.service.

---

### `POST /api/ai/runs/[id]/reject`

**File:** `src/app/api/ai/runs/[id]/reject/route.ts`

Reject all proposed actions for a run.

**Input (optional):**
```json
{ "reason": "I need to revise the note manually" }
```

**Calls:** `rejectRun()` from commit.service. Marks all pending actions as `rejected`, run as `failed`.

---

### `POST /api/ai/clarifications/[id]/respond`

**File:** `src/app/api/ai/clarifications/[id]/respond/route.ts`

Answer a clarification question. If all clarifications for the run are answered, automatically resumes the orchestrator.

**Input:**
```json
{ "answer": "The session was 45 minutes" }
```

**Output (more questions remain):**
```json
{
  "status": "needs_more_answers",
  "unanswered": [{ "id": "...", "question": "..." }]
}
```

**Output (all answered — run resumed):**
Same as `POST /api/ai/intent` output (run resumes and returns new result).

**Calls:** `answerClarification()` + optionally `resumeAfterClarification()`.

---

## 12. Database Schema (AI-Specific Tables)

**Migration:** `supabase/migrations/20260206000004_ai_system.sql`

### Enums

```sql
ai_run_status:    pending | running | needs_clarification | ready_to_commit | committed | failed
ai_step_type:     llm_call | tool_call | tool_result | error
ai_action_type:   create_note_draft | create_encounter | suggest_billing | update_medication | create_appointment
ai_action_status: pending | committed | rejected | expired
note_draft_status: pending_review | accepted | rejected
```

### `ai_runs`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | Auto-generated |
| org_id | uuid FK | → organizations |
| user_id | uuid FK | → users (who initiated) |
| patient_id | uuid FK? | → patients (if identified) |
| encounter_id | uuid FK? | → encounters (if identified) |
| idempotency_key | text UNIQUE | Prevents duplicate runs |
| status | ai_run_status | Lifecycle state |
| input_text | text | Provider's original input |
| intent_type | text | Classified intent |
| result_summary | text | AI's summary of what was done |
| total_tokens | int | Total tokens used |
| total_cost_cents | numeric(10,4) | Estimated cost |
| error | text | Error message if failed |
| started_at | timestamptz | When orchestration began |
| completed_at | timestamptz | When run finished |
| created_at | timestamptz | Record creation time |

### `ai_steps`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| run_id | uuid FK | → ai_runs (CASCADE delete) |
| step_number | int | Sequential step number |
| step_type | ai_step_type | What kind of step |
| tool_name | text? | Tool called (if tool_call) |
| input | jsonb? | Tool input args |
| output | jsonb? | Tool result |
| messages | jsonb? | Full message history (for resumability) |
| tokens_input | int | Input tokens this step |
| tokens_output | int | Output tokens this step |
| duration_ms | int? | Step duration |
| created_at | timestamptz | |

### `ai_proposed_actions`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| run_id | uuid FK | → ai_runs (CASCADE delete) |
| org_id | uuid FK | → organizations |
| action_group | uuid | Groups related actions together |
| action_group_label | text? | Human-readable description |
| action_type | ai_action_type | What kind of action |
| action_order | smallint | Execution order within group |
| target_table | text | Which clinical table this affects |
| payload | jsonb | Full action payload |
| status | ai_action_status | pending → committed/rejected |
| provider_modified_payload | jsonb? | Provider's edits (used over payload if present) |
| confidence_score | real? | AI's confidence (0-1) |
| assumptions | jsonb? | Array of assumption strings |
| requires_review | boolean | Always true currently |
| committed_at | timestamptz? | When committed |
| committed_by | uuid FK? | → users (who committed) |
| created_at | timestamptz | |

### `ai_clarifications`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| run_id | uuid FK | → ai_runs (CASCADE delete) |
| org_id | uuid FK | → organizations |
| question | text | The question asked |
| context | jsonb? | Why this question was needed |
| options | jsonb? | Suggested answer options |
| answer | text? | Provider's answer (null = unanswered) |
| answered_at | timestamptz? | |
| answered_by | uuid FK? | → users |
| created_at | timestamptz | |

### `note_drafts`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| encounter_id | uuid FK? | → encounters |
| org_id | uuid FK | → organizations |
| ai_run_id | uuid FK? | → ai_runs |
| source_transcript | text? | Original provider input |
| note_type | note_type enum | SOAP, DAP, BIRP, intake, discharge |
| generated_content | jsonb | The AI-generated note content |
| provider_edits | jsonb? | Provider's modifications |
| status | note_draft_status | pending_review → accepted/rejected |
| accepted_at | timestamptz? | |
| created_at | timestamptz | |

### Idempotency Key Pattern

The `ai_runs.idempotency_key` column (UNIQUE) prevents duplicate processing. When `createRun()` receives a key that already exists, it returns the existing run without creating a new one. This handles network retries gracefully.

---

## 13. Database Schema (Clinical Tables Summary)

### Core Platform (Migration 1)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `organizations` | Multi-tenant root | id, name, slug, settings |
| `users` | Application users (linked to Supabase auth) | id, auth_id, org_id, role, first_name, last_name, email |
| `providers` | Clinical identity (separate from auth) | id, user_id, org_id, npi, credentials, license_number, specialty, preferred_note_format |

### Clinical Tables (Migration 2)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `patients` | Patient demographics | id, org_id, first_name, last_name, dob, gender, status (active/inactive/discharged) |
| `patient_diagnoses` | Active diagnoses (ICD-10) | id, patient_id, org_id, icd10_code, description, status, is_primary, onset_date |
| `encounters` | Clinical encounters | id, patient_id, provider_id, org_id, encounter_date, encounter_type, status, duration_minutes |
| `clinical_notes` | **Legal clinical record** (versioned) | id, encounter_id, patient_id, provider_id, org_id, note_type, version, is_current, status, content (jsonb), signed_at, signed_by, amendment_reason, previous_version_id |
| `note_signatures` | Signature records with content hash | id, clinical_note_id, signer_id, signature_type (author/cosigner/supervisor), content_hash |
| `treatment_plans` | Versioned treatment plans | id, patient_id, provider_id, org_id, version, is_current, status, goals, objectives, interventions |
| `appointments` | Scheduled appointments | id, patient_id, provider_id, org_id, start_time, end_time, status, appointment_type, recurring_rule |
| `medications` | Patient medications | id, patient_id, provider_id, org_id, name, dosage, frequency, route, status (active/discontinued/changed), start_date, end_date, change_reason |

### Billing Tables (Migration 3)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `cpt_codes` | Reference table (read-only) | code (PK), description, category, time_range_minutes, is_addon |
| `icd10_codes` | Reference table (read-only) | code (PK), description, category, is_billable, chapter |
| `insurance_payers` | Insurance companies | id, org_id, name, payer_id_number |
| `patient_insurance` | Patient-payer relationships | id, patient_id, org_id, payer_id, priority, member_id, copay_amount, authorized_sessions, sessions_used |
| `billing_claims` | Insurance claims | id, encounter_id, patient_id, provider_id, org_id, claim_number, status, date_of_service, total_charge |
| `claim_line_items` | Claim services (CPT codes) | id, claim_id, line_number, cpt_code, diagnosis_pointers (int[]), units, charge_amount, service_date |
| `claim_diagnoses` | Claim diagnoses (ICD-10) | id, claim_id, sequence_number (1-12), icd10_code |

### Audit System (Migration 5)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `audit_log` | Append-only mutation log | id (bigserial), event_time, user_id, action (INSERT/UPDATE/DELETE), table_name, record_id, old_data, new_data, changed_fields, patient_id, org_id |

### Versioning Pattern

Both `clinical_notes` and `treatment_plans` use an append-only versioning pattern:
- `version` (int, starts at 1) increments with each amendment
- `is_current` (boolean) — only one version per entity is current
- `previous_version_id` (self-referential FK) — links to the prior version
- Amendment: mark old as `is_current=false` + `status='amended'`, insert new with `version+1`

### Audited Tables

The following tables have audit triggers (INSERT/UPDATE/DELETE → `audit_log`):
- `patients`, `encounters`, `clinical_notes`, `treatment_plans`, `appointments`, `medications`, `billing_claims`, `patient_diagnoses`, `ai_proposed_actions`

The audit trigger extracts `user_id` from the JWT, and `patient_id`/`org_id` from the record being modified.

---

## 14. Security Model

### Row Level Security (RLS)

**Every table** has RLS enabled (Migration 6). The pattern:

```sql
-- Helper functions extract from JWT
get_org_id() → (request.jwt.claims->>'org_id')::uuid
get_user_id() → (request.jwt.claims->>'sub')::uuid

-- Standard org isolation policy
CREATE POLICY "table_select" ON table FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
```

**Special policies:**
- **`clinical_notes`**: UPDATE blocked when `status = 'signed'` (signed notes are immutable)
- **`note_signatures`**: Access through parent `clinical_notes` join (no direct org_id)
- **`claim_line_items`**, **`claim_diagnoses`**: Access through parent `billing_claims` join
- **`ai_steps`**: Access through parent `ai_runs` join
- **`cpt_codes`**, **`icd10_codes`**: Read-only for all authenticated users (no org filter)
- **`audit_log`**: SELECT + INSERT only (append-only, UPDATE/DELETE revoked)

### Admin Client (Service Role)

**File:** `src/lib/supabase/admin.ts`

The `createAdminClient()` function creates a Supabase client with the **service role key**, which bypasses RLS entirely. This is used for:
- AI orchestration (needs cross-table access)
- Commit service (writes to clinical tables on behalf of provider)
- Seeding

**NEVER exposed to the client.** Only used in API route handlers.

### Auth Context

**File:** `src/lib/api-helpers.ts`

Currently uses seed data IDs in dev mode (`SKIP_AUTH=true`). Production will extract `orgId`, `userId`, `providerId` from Supabase JWT claims.

---

## 15. Key Patterns & Conventions

### AI SDK v6 Specifics

| v5 / Old | v6 / Current |
|----------|-------------|
| `parameters` | `inputSchema` |
| `CoreMessage` | `ModelMessage` |
| `promptTokens` / `completionTokens` | `inputTokens` / `outputTokens` |
| `maxSteps` | `stopWhen` (array of conditions) |

### Zod v4 Specifics

```typescript
// z.record() requires 2 args in Zod v4
z.record(z.string(), z.unknown())  // correct
z.record(z.unknown())              // error in Zod v4
```

### `_proposed_action` Payload Capture Pattern

Action tools don't write to the database. Instead, they return a `_proposed_action` object in their result:

```typescript
return {
  message: '...',
  _proposed_action: {
    action_type: 'create_note_draft',
    target_table: 'note_drafts',
    payload: { encounter_id, note_type: 'SOAP', content },
  },
};
```

The run manager's `extractCapturedPayloads()` walks all step results, collects these objects, and uses them when creating `ai_proposed_actions` records. This ensures the committed payload matches what the tool actually computed, rather than relying on the model to correctly reconstruct it in `submit_results`.

### Assumption Tracking

The `create_progress_note` tool requires an `assumptions_made: string[]` field. The system prompt instructs the model to list anything inferred rather than explicitly stated. These assumptions appear in the proposed action for provider review.

### SOAP Format

All progress notes use SOAP format with four sections:

| Section | Content |
|---------|---------|
| **Subjective** | What the patient reports — symptoms, concerns, progress |
| **Objective** | Observable data — appearance, behavior, test scores, vitals |
| **Assessment** | Clinical assessment — diagnosis status, progress, severity |
| **Plan** | Treatment plan — next steps, interventions, follow-up |

---

## 16. How to Extend the System

### Adding a New AI Tool

1. **Define the tool** in `src/ai/tools/your-tool.ts`:
   ```typescript
   import { tool } from 'ai';
   import { z } from 'zod';

   export function createYourTool(/* dependencies */) {
     return tool({
       description: '...',
       inputSchema: z.object({ /* ... */ }),
       execute: async (input) => {
         // For action tools: return _proposed_action
         return {
           message: '...',
           _proposed_action: {
             action_type: 'your_action_type',
             target_table: 'target_table',
             payload: { /* ... */ },
           },
         };
       },
     });
   }
   ```

2. **Register in the orchestrator** (`src/ai/orchestrator.ts`):
   - Import the tool creator
   - Add to the `allTools` object
   - Add the tool name to the appropriate phase array (`lookupToolNames`, `actionToolNames`, or `terminalToolNames`)

3. **If it's an action tool**, add a commit handler (see below).

### Adding a New Action Type

1. **Update the `ai_action_type` enum** — Create a new migration:
   ```sql
   ALTER TYPE public.ai_action_type ADD VALUE 'your_action_type';
   ```

2. **Add a case to `commit.service.ts`** `executeAction()`:
   ```typescript
   case 'your_action_type': {
     validateRequiredFields(payload, 'your_action_type', ['field1', 'field2']);
     return yourService.doSomething(client, orgId, payload);
   }
   ```

3. **Update the `submit_results` tool** `action_type` enum in `src/ai/tools/terminal-tools.ts` to include the new type.

4. **Update the `RunActionType` schema** in `src/lib/schemas/ai.ts`.

### Adding a New Intent Type

1. **Update the `IntentClassification` schema** in `src/lib/schemas/ai.ts`:
   ```typescript
   intent_type: z.enum([..., 'your_new_intent']),
   ```

2. **Update the classifier prompt** in `src/ai/intent-classifier.ts` with the new intent description.

3. **Optionally update the system prompt** in `src/ai/system-prompt.ts` if the new intent requires special behavioral rules.

---

## Appendix: Source File Index

| File | Purpose |
|------|---------|
| `src/ai/orchestrator.ts` | Core agentic loop (generateText + phased tools) |
| `src/ai/run-manager.ts` | Lifecycle: intent → orchestrate → persist → result |
| `src/ai/system-prompt.ts` | Dynamic system prompt builder |
| `src/ai/intent-classifier.ts` | Intent classification (generateObject) |
| `src/ai/context-loader.ts` | Patient/encounter context → text blocks |
| `src/ai/tools/find-patient.ts` | Lookup: patient search |
| `src/ai/tools/get-patient-context.ts` | Lookup: full clinical profile |
| `src/ai/tools/resolve-encounter.ts` | Lookup: find/create encounter |
| `src/ai/tools/create-progress-note.ts` | Action: SOAP note draft |
| `src/ai/tools/create-appointment.ts` | Action: schedule appointment |
| `src/ai/tools/suggest-billing-codes.ts` | Action: CPT/ICD-10 suggestion |
| `src/ai/tools/update-medication.ts` | Action: medication changes |
| `src/ai/tools/terminal-tools.ts` | Terminal: submit_results + ask_clarification |
| `src/services/commit.service.ts` | Trust boundary executor |
| `src/services/ai-run.service.ts` | Run/step/action/clarification CRUD |
| `src/services/patient.service.ts` | Patient search and context |
| `src/services/encounter.service.ts` | Encounter resolution |
| `src/services/note.service.ts` | Draft → clinical note → sign → amend |
| `src/services/appointment.service.ts` | Scheduling and availability |
| `src/services/billing.service.ts` | Claims, CPT/ICD-10 lookup |
| `src/lib/api-helpers.ts` | Auth context, admin client, response helpers |
| `src/lib/supabase/admin.ts` | Service-role client (bypasses RLS) |
| `src/lib/supabase/client.ts` | Anon-key client (respects RLS) |
| `src/lib/schemas/ai.ts` | Zod schemas for AI types |
| `src/app/api/ai/intent/route.ts` | POST /api/ai/intent |
| `src/app/api/ai/runs/[id]/route.ts` | GET /api/ai/runs/:id |
| `src/app/api/ai/runs/[id]/commit/route.ts` | POST /api/ai/runs/:id/commit |
| `src/app/api/ai/runs/[id]/reject/route.ts` | POST /api/ai/runs/:id/reject |
| `src/app/api/ai/clarifications/[id]/respond/route.ts` | POST /api/ai/clarifications/:id/respond |
| `supabase/migrations/20260206000001_core_platform.sql` | Organizations, users, providers |
| `supabase/migrations/20260206000002_clinical_tables.sql` | Clinical domain tables |
| `supabase/migrations/20260206000003_billing_tables.sql` | Billing domain tables |
| `supabase/migrations/20260206000004_ai_system.sql` | AI runs, steps, actions, clarifications, drafts |
| `supabase/migrations/20260206000005_audit_system.sql` | Audit log + triggers |
| `supabase/migrations/20260206000006_rls_policies.sql` | Row Level Security policies |
| `supabase/migrations/20260206000007_seed_data.sql` | Test data |
