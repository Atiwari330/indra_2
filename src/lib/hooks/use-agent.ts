'use client';

import { useReducer, useCallback, useRef } from 'react';
import type { AgentRun, AgentStatus } from '@/lib/types/ai-agent';
import { getAIAgentService } from '@/services/ai-agent.service';

// ── State ───────────────────────────────────────────────────────

export interface AgentState {
  run: AgentRun | null;
  isCommandBarOpen: boolean;
  isSlideOverOpen: boolean;
}

const initialState: AgentState = {
  run: null,
  isCommandBarOpen: false,
  isSlideOverOpen: false,
};

// ── Actions ─────────────────────────────────────────────────────

type AgentAction =
  | { type: 'OPEN_COMMAND_BAR' }
  | { type: 'CLOSE_COMMAND_BAR' }
  | { type: 'OPEN_SLIDE_OVER' }
  | { type: 'CLOSE_SLIDE_OVER' }
  | { type: 'SET_RUN'; run: AgentRun }
  | { type: 'RESET' };

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
      return { ...state, run: null, isSlideOverOpen: false };
    default:
      return state;
  }
}

// ── Terminal statuses (stop polling) ────────────────────────────

const TERMINAL: AgentStatus[] = [
  'needs_clarification',
  'ready_to_commit',
  'committed',
  'failed',
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
    async (input: string, patientId?: string) => {
      dispatch({ type: 'CLOSE_COMMAND_BAR' });
      dispatch({ type: 'OPEN_SLIDE_OVER' });

      try {
        const run = await serviceRef.current.submitIntent(input, patientId);
        dispatch({ type: 'SET_RUN', run });
        startPolling(run.id);
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
      try {
        const updated = await serviceRef.current.respondToClarification(
          state.run.id,
          answers
        );
        dispatch({ type: 'SET_RUN', run: updated });
        if (updated.status === 'running') {
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

  const dismiss = useCallback(() => {
    stopPolling();
    dispatch({ type: 'CLOSE_SLIDE_OVER' });
    // Delay reset so exit animation plays
    setTimeout(() => dispatch({ type: 'RESET' }), 400);
  }, [stopPolling]);

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
    dismiss,
  };
}

// ── Phase derivation ────────────────────────────────────────────

export type Phase = 'processing' | 'clarification' | 'review' | 'success' | 'error' | null;

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
    case 'committed':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return null;
  }
}
