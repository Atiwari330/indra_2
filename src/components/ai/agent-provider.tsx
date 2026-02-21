'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useAgent, type Phase } from '@/lib/hooks/use-agent';
import type { AgentRun, SubmitIntentOptions, SuggestedDiagnosis } from '@/lib/types/ai-agent';

interface AgentContextValue {
  run: AgentRun | null;
  currentPhase: Phase;
  isCommandBarOpen: boolean;
  isSlideOverOpen: boolean;
  isEditing: boolean;
  editError: string | null;
  editHistory: Record<string, Record<string, unknown>[]>;
  openCommandBar: () => void;
  closeCommandBar: () => void;
  submitIntent: (input: string, patientId?: string, options?: SubmitIntentOptions) => Promise<void>;
  respondToClarification: (answers: Record<string, string>) => Promise<void>;
  commitActions: () => Promise<void>;
  editAction: (actionId: string, instruction: string) => Promise<void>;
  undoEdit: (actionId: string) => Promise<void>;
  dismiss: () => void;
  confirmDiagnoses: (diagnoses: SuggestedDiagnosis[]) => Promise<void>;
  deferDiagnoses: () => Promise<void>;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const agent = useAgent();

  return (
    <AgentContext.Provider value={agent}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgentContext() {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error('useAgentContext must be used within AgentProvider');
  }
  return ctx;
}
