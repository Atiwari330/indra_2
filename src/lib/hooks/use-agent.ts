'use client';

import { useReducer, useCallback, useRef } from 'react';
import type { AgentRun, AgentStatus, SubmitIntentOptions, SuggestedDiagnosis } from '@/lib/types/ai-agent';
import { getAIAgentService } from '@/services/ai-agent.service';

// ── State ───────────────────────────────────────────────────────

export interface AgentState {
  run: AgentRun | null;
  isCommandBarOpen: boolean;
  isSlideOverOpen: boolean;
  isEditing: boolean;
  editError: string | null;
  editHistory: Record<string, Record<string, unknown>[]>; // actionId → stack of previous payloads
}

const initialState: AgentState = {
  run: null,
  isCommandBarOpen: false,
  isSlideOverOpen: false,
  isEditing: false,
  editError: null,
  editHistory: {},
};

// ── Actions ─────────────────────────────────────────────────────

type AgentAction =
  | { type: 'OPEN_COMMAND_BAR' }
  | { type: 'CLOSE_COMMAND_BAR' }
  | { type: 'OPEN_SLIDE_OVER' }
  | { type: 'CLOSE_SLIDE_OVER' }
  | { type: 'SET_RUN'; run: AgentRun }
  | { type: 'RESET' }
  | { type: 'START_EDIT' }
  | { type: 'FINISH_EDIT'; actionId: string; newPayload: Record<string, unknown>; previousPayload: Record<string, unknown> }
  | { type: 'UNDO_EDIT'; actionId: string; previousPayload: Record<string, unknown> }
  | { type: 'EDIT_FAILED'; error: string };

function reducer(state: AgentState, action: AgentAction): AgentState {
  switch (action.type) {
    case 'OPEN_COMMAND_BAR':
      return { ...state, isCommandBarOpen: true };
    case 'CLOSE_COMMAND_BAR':
      return { ...state, isCommandBarOpen: false };
    case 'OPEN_SLIDE_OVER':
      return { ...state, isSlideOverOpen: true };
    case 'CLOSE_SLIDE_OVER':
      return { ...state, isSlideOverOpen: false };
    case 'SET_RUN':
      return { ...state, run: action.run };
    case 'RESET':
      return { ...initialState };
    case 'START_EDIT':
      return { ...state, isEditing: true, editError: null };
    case 'FINISH_EDIT': {
      if (!state.run) return { ...state, isEditing: false };
      const updatedActions = state.run.proposedActions.map((a) =>
        a.id === action.actionId ? { ...a, payload: action.newPayload } : a
      );
      const prevStack = state.editHistory[action.actionId] ?? [];
      return {
        ...state,
        isEditing: false,
        editError: null,
        run: { ...state.run, proposedActions: updatedActions },
        editHistory: {
          ...state.editHistory,
          [action.actionId]: [...prevStack, action.previousPayload],
        },
      };
    }
    case 'UNDO_EDIT': {
      if (!state.run) return state;
      const updatedActions = state.run.proposedActions.map((a) =>
        a.id === action.actionId ? { ...a, payload: action.previousPayload } : a
      );
      const stack = [...(state.editHistory[action.actionId] ?? [])];
      stack.pop(); // remove the entry we just restored
      return {
        ...state,
        run: { ...state.run, proposedActions: updatedActions },
        editHistory: {
          ...state.editHistory,
          [action.actionId]: stack,
        },
      };
    }
    case 'EDIT_FAILED':
      return { ...state, isEditing: false, editError: action.error };
    default:
      return state;
  }
}

// ── Terminal statuses (stop polling) ────────────────────────────

const TERMINAL: AgentStatus[] = [
  'needs_clarification',
  'ready_to_commit',
  'confirming_diagnoses',
  'committed',
  'failed',
];

// ── Synthetic steps (shown while blocking call is in-flight) ───

function makeSyntheticRun(inputText: string, labels: string[]): AgentRun {
  return {
    id: 'synth-pending',
    status: 'running',
    inputText,
    steps: labels.map((label, i) => ({
      id: `synth-${i}`,
      label,
      status: i === 0 ? 'active' : 'pending' as const,
    })),
    clarifications: [],
    proposedActions: [],
  };
}

const SUBMIT_STEPS = [
  'Understanding your request',
  'Loading clinical context',
  'Processing with AI',
  'Preparing results',
];

const CLARIFICATION_STEPS = [
  'Processing your answers',
  'Continuing AI analysis',
  'Preparing results',
];

// ── Hook ────────────────────────────────────────────────────────

export function useAgent() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const serviceRef = useRef(getAIAgentService());

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (runId: string) => {
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const updated = await serviceRef.current.getRunStatus(runId);
          dispatch({ type: 'SET_RUN', run: updated });

          if (TERMINAL.includes(updated.status)) {
            stopPolling();
          }
        } catch {
          stopPolling();
          dispatch({
            type: 'SET_RUN',
            run: {
              id: runId,
              status: 'failed',
              inputText: '',
              steps: [],
              clarifications: [],
              proposedActions: [],
              error: 'Failed to get run status',
            },
          });
        }
      }, 800);
    },
    [stopPolling]
  );

  const openCommandBar = useCallback(() => {
    dispatch({ type: 'OPEN_COMMAND_BAR' });
  }, []);

  const closeCommandBar = useCallback(() => {
    dispatch({ type: 'CLOSE_COMMAND_BAR' });
  }, []);

  const submitIntent = useCallback(
    async (input: string, patientId?: string, options?: SubmitIntentOptions) => {
      dispatch({ type: 'CLOSE_COMMAND_BAR' });
      dispatch({ type: 'OPEN_SLIDE_OVER' });

      // Show synthetic processing UI immediately while the blocking call runs
      dispatch({ type: 'SET_RUN', run: makeSyntheticRun(input, SUBMIT_STEPS) });

      try {
        const run = await serviceRef.current.submitIntent(input, patientId, options);
        if (options?.evidence) {
          run.evidence = options.evidence;
        }
        dispatch({ type: 'SET_RUN', run });

        // Only poll if the returned status is non-terminal (mock returns pending)
        // Real service returns terminal states directly (blocking call)
        if (!TERMINAL.includes(run.status)) {
          startPolling(run.id);
        }
      } catch {
        dispatch({
          type: 'SET_RUN',
          run: {
            id: 'error',
            status: 'failed',
            inputText: input,
            steps: [],
            clarifications: [],
            proposedActions: [],
            error: 'Failed to submit intent',
          },
        });
      }
    },
    [startPolling]
  );

  const respondToClarification = useCallback(
    async (answers: Record<string, string>) => {
      if (!state.run) return;

      // Show synthetic processing UI while the blocking clarification response runs
      dispatch({
        type: 'SET_RUN',
        run: makeSyntheticRun(state.run.inputText, CLARIFICATION_STEPS),
      });

      try {
        const updated = await serviceRef.current.respondToClarification(
          state.run.id,
          answers
        );
        dispatch({ type: 'SET_RUN', run: updated });

        // Only poll if non-terminal
        if (!TERMINAL.includes(updated.status)) {
          startPolling(updated.id);
        }
      } catch {
        dispatch({
          type: 'SET_RUN',
          run: { ...state.run, status: 'failed', error: 'Failed to respond to clarification' },
        });
      }
    },
    [state.run, startPolling]
  );

  const commitActions = useCallback(async () => {
    if (!state.run) return;
    dispatch({
      type: 'SET_RUN',
      run: { ...state.run, status: 'committing' },
    });
    try {
      const updated = await serviceRef.current.commitActions(state.run.id);
      dispatch({ type: 'SET_RUN', run: updated });
    } catch {
      dispatch({
        type: 'SET_RUN',
        run: { ...state.run, status: 'failed', error: 'Failed to commit actions' },
      });
    }
  }, [state.run]);

  const editAction = useCallback(
    async (actionId: string, instruction: string) => {
      if (!state.run) return;

      const action = state.run.proposedActions.find((a) => a.id === actionId);
      if (!action) return;

      dispatch({ type: 'START_EDIT' });

      try {
        const noteType = (action.payload.note_type as string) ?? 'soap';
        const content = (action.payload.content as Record<string, unknown>) ?? action.payload;

        const result = await serviceRef.current.editNote(content, noteType, instruction);

        // Build the new full payload (preserve non-content fields like note_type)
        const newPayload = { ...action.payload, content: result.content };

        // Persist to backend
        await serviceRef.current.updateActionPayload(state.run.id, actionId, newPayload);

        dispatch({
          type: 'FINISH_EDIT',
          actionId,
          newPayload,
          previousPayload: action.payload,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Edit failed';
        dispatch({ type: 'EDIT_FAILED', error: message });
      }
    },
    [state.run]
  );

  const undoEdit = useCallback(
    async (actionId: string) => {
      if (!state.run) return;

      const stack = state.editHistory[actionId];
      if (!stack || stack.length === 0) return;

      const previousPayload = stack[stack.length - 1];

      try {
        // Persist the undo to backend
        await serviceRef.current.updateActionPayload(state.run.id, actionId, previousPayload);
        dispatch({ type: 'UNDO_EDIT', actionId, previousPayload });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Undo failed';
        dispatch({ type: 'EDIT_FAILED', error: message });
      }
    },
    [state.run, state.editHistory]
  );

  const dismiss = useCallback(() => {
    stopPolling();
    dispatch({ type: 'CLOSE_SLIDE_OVER' });
    // Delay reset so exit animation plays
    setTimeout(() => dispatch({ type: 'RESET' }), 400);
  }, [stopPolling]);

  const confirmDiagnoses = useCallback(async (diagnoses: SuggestedDiagnosis[]) => {
    if (!state.run) return;
    dispatch({ type: 'SET_RUN', run: { ...state.run, status: 'committing' } });
    try {
      // 1. Save to database via API
      if (state.run.patientId) {
        await fetch(`/api/patients/${state.run.patientId}/diagnoses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diagnoses, status: 'active', aiRunId: state.run.id }),
        });
      }
      // 2. Transition agent state to committed
      const updated = await serviceRef.current.confirmDiagnoses(state.run.id, diagnoses);
      dispatch({ type: 'SET_RUN', run: updated });
    } catch {
      dispatch({
        type: 'SET_RUN',
        run: { ...state.run, status: 'failed', error: 'Failed to confirm diagnoses' },
      });
    }
  }, [state.run]);

  const deferDiagnoses = useCallback(async () => {
    if (!state.run?.patientId || !state.run.suggestedDiagnoses) return;
    // Save as pending_review so they appear on the profile
    await fetch(`/api/patients/${state.run.patientId}/diagnoses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diagnoses: state.run.suggestedDiagnoses,
        status: 'pending_review',
        aiRunId: state.run.id,
      }),
    });
    dismiss();
  }, [state.run, dismiss]);

  // Derive current phase from run status
  const currentPhase = derivePhase(state.run?.status ?? 'idle');

  return {
    ...state,
    currentPhase,
    openCommandBar,
    closeCommandBar,
    submitIntent,
    respondToClarification,
    commitActions,
    editAction,
    undoEdit,
    dismiss,
    confirmDiagnoses,
    deferDiagnoses,
  };
}

// ── Phase derivation ────────────────────────────────────────────

export type Phase = 'processing' | 'clarification' | 'review' | 'diagnosis_confirmation' | 'success' | 'error' | null;

function derivePhase(status: AgentStatus): Phase {
  switch (status) {
    case 'pending':
    case 'running':
    case 'committing':
      return 'processing';
    case 'needs_clarification':
      return 'clarification';
    case 'ready_to_commit':
      return 'review';
    case 'confirming_diagnoses':
      return 'diagnosis_confirmation';
    case 'committed':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return null;
  }
}
