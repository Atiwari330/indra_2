# Indra EHR — Database Schema

## Overview

Multi-tenant behavioral health EHR with AI-assisted clinical workflows. Every table is organization-scoped with Row Level Security (RLS).

## Core Platform

### `organizations`
Top-level tenant boundary. All data is scoped to an organization.

### `users`
Authentication identities. Linked to Supabase Auth via `auth_id`. Roles: admin, provider, billing, staff.

### `providers`
Clinical identity (NPI, credentials, license). Separate from `users` because billing requires provider-level data. Has `preferred_note_format` (SOAP/DAP/BIRP).

## Clinical Domain

### `patients`
Patient demographics. Status: active/inactive/discharged. Name-indexed for search.

### `patient_diagnoses`
ICD-10 diagnoses per patient. Tracks active/resolved/ruled_out status, primary flag, onset/resolved dates.

### `encounters`
A clinical encounter (session). Types: individual_therapy, group_therapy, family_therapy, intake, crisis, telehealth, medication_management. Status: scheduled → in_progress → completed.

### `clinical_notes` (versioned, append-only)
The legal medical record. **Key design decisions:**
- `version` + `is_current` for versioning (never overwrite)
- `status`: draft → signed → amended/addended
- `content` is format-specific JSONB (SOAP: `{subjective, objective, assessment, plan}`, DAP: `{data, assessment, plan}`, BIRP: `{behavior, intervention, response, plan}`)
- Signed notes cannot be updated via RLS (only amended via new version)
- `previous_version_id` links amendment chain

### `note_signatures`
Cryptographic proof of note signing. Types: author, cosigner, supervisor. Includes content hash.

### `note_drafts`
AI-generated draft notes. **Separate from `clinical_notes`** — AI output is never directly in the legal record. Flow: AI generates draft → provider reviews → accepts → creates `clinical_notes` record.

### `treatment_plans` (versioned)
Goals, objectives, interventions. Versioned like clinical notes.

### `appointments`
Scheduling. Includes recurring rules (JSONB). Status: scheduled/completed/cancelled/no_show.

### `medications`
Active medication list. Status: active/discontinued/changed. Tracks change reasons.

## Billing Domain

### `cpt_codes` (reference table)
Common Procedure Technology codes. Includes `time_range_minutes` (int4range) for automatic suggestion based on session duration.

### `icd10_codes` (reference table)
International Classification of Diseases codes. Behavioral health subset.

### `insurance_payers`
Insurance companies. Org-scoped.

### `patient_insurance`
Patient's insurance details. Priority (primary/secondary/tertiary), authorization tracking (authorized_sessions, sessions_used).

### `billing_claims`
CMS-1500 claim model. Status: draft → ready → submitted → accepted/rejected/denied → paid/appealed.

### `claim_line_items`
CPT codes billed on a claim. `diagnosis_pointers` (int[]) reference `claim_diagnoses` by sequence number — matching real CMS-1500 form structure.

### `claim_diagnoses`
ICD-10 diagnoses on a claim. Sequence 1-12. Referenced by line items via pointers.

## AI System

### `ai_runs`
A single AI orchestration execution. Tracks: input text, intent type, status (pending → running → needs_clarification/ready_to_commit → committed/failed), token usage, cost.

### `ai_steps`
Each step in the orchestration loop. Stores full `messages` JSONB for run resumability after clarification.

### `ai_proposed_actions`
What the AI wants to do. Grouped by `action_group`. Types: create_note_draft, create_encounter, suggest_billing, update_medication, create_appointment. **Never written directly to clinical tables** — must go through commit service.

### `ai_clarifications`
Questions the AI asks when information is ambiguous. Stores question, context, options, and answer.

## Audit System

### `audit_log` (append-only)
Database triggers automatically capture all INSERT/UPDATE/DELETE on auditable tables. Stores old_data, new_data, changed_fields, patient_id, org_id. **UPDATE and DELETE revoked** — truly append-only.

## Key Relationships

```
organization ─┬─ users ─── providers
              ├─ patients ─┬─ diagnoses
              │             ├─ encounters ─── clinical_notes ─── note_signatures
              │             ├─ appointments
              │             ├─ medications
              │             ├─ insurance
              │             └─ treatment_plans
              ├─ billing_claims ─┬─ claim_line_items
              │                  └─ claim_diagnoses
              └─ ai_runs ─┬─ ai_steps
                           ├─ ai_proposed_actions
                           ├─ ai_clarifications
                           └─ note_drafts
```

## Security Model

- **RLS on every table** with `org_id` check from JWT claims
- Service role bypasses RLS for server-side operations
- Signed clinical notes are immutable (RLS blocks UPDATE when status='signed')
- Audit log is append-only (UPDATE/DELETE revoked at DB level)
- Reference tables (CPT, ICD-10) are read-only for authenticated users
