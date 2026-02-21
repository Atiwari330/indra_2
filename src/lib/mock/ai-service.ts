import type { AIAgentService, AgentRun, ProcessingStep, NoteEditResult, SuggestedDiagnosis } from '@/lib/types/ai-agent';
import { matchScenario, type MockScenario } from './scenarios';

interface InternalRun {
  scenario: MockScenario;
  run: AgentRun;
  /** Whether we've entered the post-clarification phase */
  postClarification: boolean;
  /** Combined steps (initial + post-clarification) */
  allSteps: { label: string; delayMs: number }[];
  /** Timestamp when processing started (for computing which step is current) */
  startedAt: number | null;
}

const runs = new Map<string, InternalRun>();

let nextId = 1;
function generateRunId(): string {
  return `mock-run-${nextId++}`;
}

function buildSteps(labels: { label: string }[]): ProcessingStep[] {
  return labels.map((s, i) => ({
    id: `step-${i}`,
    label: s.label,
    status: 'pending' as const,
  }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Given elapsed time since start, compute which steps are completed / active / pending.
 * Returns the index of the first non-completed step, or allSteps.length if all done.
 */
function computeStepProgress(
  allSteps: { label: string; delayMs: number }[],
  steps: ProcessingStep[],
  elapsed: number
): number {
  let cumulative = 0;
  for (let i = 0; i < allSteps.length; i++) {
    cumulative += allSteps[i].delayMs;
    if (elapsed >= cumulative) {
      steps[i].status = 'completed';
    } else if (elapsed >= cumulative - allSteps[i].delayMs) {
      steps[i].status = 'active';
      return i;
    } else {
      steps[i].status = 'pending';
    }
  }
  return allSteps.length; // all completed
}

export function createMockAIService(): AIAgentService {
  return {
    async submitIntent(input: string, patientId?: string, _options?: unknown): Promise<AgentRun> {
      const scenario = matchScenario(input);
      const runId = generateRunId();

      const allStepDefs = [...scenario.steps];

      const run: AgentRun = {
        id: runId,
        status: 'pending',
        inputText: input,
        patientId,
        steps: buildSteps(allStepDefs),
        clarifications: [],
        proposedActions: [],
      };

      runs.set(runId, {
        scenario,
        run,
        postClarification: false,
        allSteps: allStepDefs,
        startedAt: null,
      });

      return { ...run };
    },

    async getRunStatus(runId: string): Promise<AgentRun> {
      const internal = runs.get(runId);
      if (!internal) throw new Error(`Run ${runId} not found`);

      const { scenario, run, allSteps } = internal;

      // If pending, start the clock and move to running
      if (run.status === 'pending') {
        run.status = 'running';
        internal.startedAt = Date.now();
      }

      // If running, compute progress from elapsed time (no sleeping, no race conditions)
      if (run.status === 'running' && internal.startedAt !== null) {
        const elapsed = Date.now() - internal.startedAt;
        const cursor = computeStepProgress(allSteps, run.steps, elapsed);

        // Check if initial steps are done and we need clarification
        if (
          !internal.postClarification &&
          cursor >= scenario.steps.length &&
          scenario.clarifications.length > 0
        ) {
          run.status = 'needs_clarification';
          run.clarifications = scenario.clarifications.map((c) => ({ ...c }));
          return { ...run };
        }

        // Check if all steps are done
        if (cursor >= allSteps.length) {
          if (scenario.proposedActions.length > 0) {
            run.status = 'ready_to_commit';
            run.proposedActions = scenario.proposedActions.map((a) => ({ ...a }));
          } else {
            run.status = 'committed'; // Info-only, no actions needed
          }
          run.summary = scenario.summary;
          run.tokenUsage = scenario.tokenUsage;
        }
      }

      return { ...run };
    },

    async respondToClarification(
      runId: string,
      answers: Record<string, string>
    ): Promise<AgentRun> {
      const internal = runs.get(runId);
      if (!internal) throw new Error(`Run ${runId} not found`);

      const { scenario, run } = internal;

      // Record answers
      for (const clarification of run.clarifications) {
        if (answers[clarification.id]) {
          clarification.answer = answers[clarification.id];
        }
      }

      // If all clarifications answered, move to post-clarification steps
      const allAnswered = run.clarifications.every((c) => c.answer);
      if (allAnswered && scenario.postClarificationSteps?.length) {
        internal.postClarification = true;
        const postSteps = scenario.postClarificationSteps;
        internal.allSteps = [...scenario.steps, ...postSteps];
        run.steps = buildSteps(internal.allSteps);
        // Mark initial steps as completed
        for (let i = 0; i < scenario.steps.length; i++) {
          run.steps[i].status = 'completed';
        }
        // Reset clock for the post-clarification steps
        // Offset so initial steps appear already elapsed
        const initialDuration = scenario.steps.reduce((sum, s) => sum + s.delayMs, 0);
        internal.startedAt = Date.now() - initialDuration;
        run.status = 'running';
      } else if (allAnswered) {
        run.status = 'running';
      }

      return { ...run };
    },

    async commitActions(runId: string): Promise<AgentRun> {
      const internal = runs.get(runId);
      if (!internal) throw new Error(`Run ${runId} not found`);

      internal.run.status = 'committing';
      await sleep(800);

      // If the scenario has suggested diagnoses, transition to diagnosis confirmation
      if (internal.scenario.suggestedDiagnoses?.length) {
        internal.run.status = 'confirming_diagnoses';
        internal.run.suggestedDiagnoses = internal.scenario.suggestedDiagnoses;
      } else {
        internal.run.status = 'committed';
      }

      return { ...internal.run };
    },

    async confirmDiagnoses(runId: string, _diagnoses: SuggestedDiagnosis[]): Promise<AgentRun> {
      const internal = runs.get(runId);
      if (!internal) throw new Error(`Run ${runId} not found`);

      await sleep(400);
      internal.run.status = 'committed';

      return { ...internal.run };
    },

    async editNote(
      content: Record<string, unknown>,
      _noteType: string,
      instruction: string
    ): Promise<NoteEditResult> {
      await sleep(1500);
      return {
        content,
        changesSummary: `Applied edit: ${instruction}`,
      };
    },

    async updateActionPayload(
      _runId: string,
      _actionId: string,
      _payload: Record<string, unknown>
    ): Promise<void> {
      // No-op in mock mode
    },
  };
}
