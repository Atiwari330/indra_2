import type {
  AIAgentService,
  AgentRun,
  AgentStatus,
  ProcessingStep,
  ProposedAction,
  Clarification,
  SubmitIntentOptions,
  NoteEditResult,
} from '@/lib/types/ai-agent';

// ── Mapping helpers ────────────────────────────────────────────

const ACTION_TYPE_MAP: Record<string, ProposedAction['actionType']> = {
  create_encounter: 'encounter',
  create_note_draft: 'note',
  update_medication: 'medication',
  create_appointment: 'appointment',
  suggest_billing: 'billing',
  generate_utilization_review: 'utilization_review',
  create_treatment_plan: 'treatment_plan',
};

const STEP_LABEL_MAP: Record<string, string> = {
  find_patient: 'Searching for patient',
  get_patient_context: 'Loading patient context',
  resolve_encounter: 'Resolving encounter',
  create_progress_note: 'Generating progress note',
  create_appointment: 'Scheduling appointment',
  suggest_billing_codes: 'Selecting billing codes',
  update_medication: 'Updating medication',
  generate_utilization_review: 'Generating utilization review',
  create_treatment_plan: 'Generating treatment plan',
  submit_results: 'Finalizing results',
  ask_clarification: 'Requesting clarification',
};

// ── Response types from backend ────────────────────────────────

interface BackendRun {
  id: string;
  org_id: string;
  user_id: string;
  patient_id: string | null;
  encounter_id: string | null;
  input_text: string;
  intent_type: string | null;
  status: AgentStatus;
  result_summary: string | null;
  error: string | null;
  total_tokens: number | null;
  total_cost_cents: number | null;
  created_at: string;
}

interface BackendStep {
  id: string;
  run_id: string;
  step_number: number;
  step_type: string;
  tool_name: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
}

interface BackendAction {
  id: string;
  run_id: string;
  action_type: string;
  action_group_label: string | null;
  payload: unknown;
  assumptions: unknown;
  status: string;
}

interface BackendClarification {
  id: string;
  run_id: string;
  question: string;
  options: unknown;
  answer: string | null;
}

interface RunDetailsResponse {
  run: BackendRun;
  steps: BackendStep[];
  actions: BackendAction[];
  clarifications: BackendClarification[];
}

// ── Intent response (returned by POST /api/ai/intent) ──────────

interface IntentResponse {
  runId: string;
  status: string;
  intentType: string;
  clarifications?: Array<{ id: string; question: string; options?: unknown }>;
  proposedActions?: Array<{
    id: string;
    action_type: string;
    description: string;
    payload: unknown;
  }>;
  summary?: string;
  totalTokens: { input: number; output: number };
}

// ── Mappers ────────────────────────────────────────────────────

function mapStep(step: BackendStep, index: number): ProcessingStep {
  const label =
    (step.tool_name && STEP_LABEL_MAP[step.tool_name]) ||
    (step.step_type === 'llm_call' ? 'Analyzing request' : step.tool_name ?? 'Processing');

  return {
    id: `step-${index}`,
    label,
    status: 'completed',
  };
}

function mapAction(action: BackendAction): ProposedAction {
  return {
    id: action.id,
    actionType: ACTION_TYPE_MAP[action.action_type] ?? 'note',
    description: action.action_group_label ?? action.action_type,
    payload: (action.payload ?? {}) as Record<string, unknown>,
    assumptions: Array.isArray(action.assumptions)
      ? (action.assumptions as string[])
      : undefined,
  };
}

function mapClarification(c: BackendClarification): Clarification {
  const options = Array.isArray(c.options) ? (c.options as string[]) : undefined;
  return {
    id: c.id,
    question: c.question,
    options,
    answer: c.answer ?? undefined,
  };
}

function mapRunDetails(data: RunDetailsResponse): AgentRun {
  const { run, steps, actions, clarifications } = data;

  let tokenInput = 0;
  let tokenOutput = 0;
  for (const s of steps) {
    tokenInput += s.tokens_input ?? 0;
    tokenOutput += s.tokens_output ?? 0;
  }

  return {
    id: run.id,
    status: run.status,
    inputText: run.input_text,
    patientId: run.patient_id ?? undefined,
    steps: steps.map(mapStep),
    proposedActions: actions.map(mapAction),
    clarifications: clarifications.map(mapClarification),
    summary: run.result_summary ?? undefined,
    error: run.error ?? undefined,
    tokenUsage: { input: tokenInput, output: tokenOutput },
  };
}

/**
 * Map the quick intent response (from POST /api/ai/intent) to AgentRun.
 * This response doesn't have the full run details shape, so we build a
 * minimal AgentRun from it.
 */
function mapIntentResponse(resp: IntentResponse, inputText: string): AgentRun {
  return {
    id: resp.runId,
    status: resp.status as AgentStatus,
    inputText,
    steps: [],
    clarifications: (resp.clarifications ?? []).map((c) => ({
      id: c.id,
      question: c.question,
      options: Array.isArray(c.options) ? (c.options as string[]) : undefined,
    })),
    proposedActions: (resp.proposedActions ?? []).map((a) => ({
      id: a.id,
      actionType: ACTION_TYPE_MAP[a.action_type] ?? 'note',
      description: a.description,
      payload: (a.payload ?? {}) as Record<string, unknown>,
    })),
    summary: resp.summary,
    tokenUsage: resp.totalTokens,
  };
}

// ── Fetch helper ───────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const { timeoutMs = 60_000, ...fetchOpts } = options ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(path, {
      ...fetchOpts,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOpts?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errMsg = (body as { error?: string }).error ?? `API error ${res.status}`;
      console.error(`[AI Service] ${fetchOpts?.method ?? 'GET'} ${path} failed:`, errMsg);
      throw new Error(errMsg);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ── Service ────────────────────────────────────────────────────

export function createRealAIService(): AIAgentService {
  return {
    async submitIntent(input: string, patientId?: string, options?: SubmitIntentOptions): Promise<AgentRun> {
      const body: Record<string, unknown> = { text: input };
      if (patientId) body.patient_id = patientId;
      if (options?.transcriptionSessionId) body.transcription_session_id = options.transcriptionSessionId;

      const resp = await apiFetch<IntentResponse>('/api/ai/intent', {
        method: 'POST',
        body: JSON.stringify(body),
        timeoutMs: 60_000,
      });

      // The intent response is minimal. Fetch full details for complete mapping.
      const details = await apiFetch<RunDetailsResponse>(
        `/api/ai/runs/${resp.runId}`
      );
      return mapRunDetails(details);
    },

    async getRunStatus(runId: string): Promise<AgentRun> {
      const details = await apiFetch<RunDetailsResponse>(
        `/api/ai/runs/${runId}`
      );
      return mapRunDetails(details);
    },

    async respondToClarification(
      runId: string,
      answers: Record<string, string>
    ): Promise<AgentRun> {
      const entries = Object.entries(answers);

      for (let i = 0; i < entries.length; i++) {
        const [clarificationId, answer] = entries[i];
        await apiFetch(`/api/ai/clarifications/${clarificationId}/respond`, {
          method: 'POST',
          body: JSON.stringify({ answer }),
          // Last call may block 10-30s (auto-resumes orchestrator)
          timeoutMs: i === entries.length - 1 ? 60_000 : 10_000,
        });
      }

      // Fetch updated run state after all answers submitted
      return this.getRunStatus(runId);
    },

    async commitActions(runId: string): Promise<AgentRun> {
      await apiFetch(`/api/ai/runs/${runId}/commit`, {
        method: 'POST',
      });

      // Fetch final state
      return this.getRunStatus(runId);
    },

    async editNote(
      content: Record<string, unknown>,
      noteType: string,
      instruction: string
    ): Promise<NoteEditResult> {
      return apiFetch<NoteEditResult>('/api/ai/note-edit', {
        method: 'POST',
        body: JSON.stringify({ content, note_type: noteType, instruction }),
        timeoutMs: 30_000,
      });
    },

    async updateActionPayload(
      runId: string,
      actionId: string,
      payload: Record<string, unknown>
    ): Promise<void> {
      await apiFetch(`/api/ai/runs/${runId}/actions/${actionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ provider_modified_payload: payload }),
      });
    },
  };
}
