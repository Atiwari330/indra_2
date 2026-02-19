// Agent lifecycle statuses
export type AgentStatus =
  | 'idle'
  | 'pending'
  | 'running'
  | 'needs_clarification'
  | 'ready_to_commit'
  | 'committing'
  | 'committed'
  | 'failed';

// A single step in the processing pipeline
export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

// A clarification question from the AI
export interface Clarification {
  id: string;
  question: string;
  options?: string[];
  answer?: string;
}

// A proposed action the AI wants to take
export interface ProposedAction {
  id: string;
  actionType: 'encounter' | 'note' | 'medication' | 'appointment' | 'billing' | 'utilization_review' | 'treatment_plan';
  description: string;
  payload: Record<string, unknown>;
  assumptions?: string[];
}

// Full run state
export interface AgentRun {
  id: string;
  status: AgentStatus;
  inputText: string;
  patientId?: string;
  steps: ProcessingStep[];
  clarifications: Clarification[];
  proposedActions: ProposedAction[];
  summary?: string;
  error?: string;
  tokenUsage?: { input: number; output: number };
  evidence?: EvidenceItem[];
}

// Evidence/context chip for review phase
export interface EvidenceItem {
  id: string;
  label: string;
  category: 'patient' | 'transcript' | 'note' | 'treatment_plan' | 'medication' | 'diagnosis' | 'encounter';
}

// Options for submitting an intent
export interface SubmitIntentOptions {
  transcriptionSessionId?: string;
  evidence?: EvidenceItem[];
}

// Result from an AI note edit
export interface NoteEditResult {
  content: Record<string, unknown>;
  changesSummary: string;
}

// Service interface — both mock and real implement this
export interface AIAgentService {
  submitIntent(input: string, patientId?: string, options?: SubmitIntentOptions): Promise<AgentRun>;
  getRunStatus(runId: string): Promise<AgentRun>;
  respondToClarification(runId: string, answers: Record<string, string>): Promise<AgentRun>;
  commitActions(runId: string): Promise<AgentRun>;
  editNote(content: Record<string, unknown>, noteType: string, instruction: string): Promise<NoteEditResult>;
  updateActionPayload(runId: string, actionId: string, payload: Record<string, unknown>): Promise<void>;
}
