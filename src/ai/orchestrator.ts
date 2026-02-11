import { generateText, stepCountIs, hasToolCall, type ModelMessage, type StepResult, type ToolSet } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { buildSystemPrompt, type SystemPromptContext } from './system-prompt';
import { createFindPatientTool } from './tools/find-patient';
import { createGetPatientContextTool } from './tools/get-patient-context';
import { createResolveEncounterTool } from './tools/resolve-encounter';
import { createProgressNoteTool } from './tools/create-progress-note';
import { createAppointmentTool } from './tools/create-appointment';
import { createSuggestBillingCodesTool } from './tools/suggest-billing-codes';
import { createUpdateMedicationTool } from './tools/update-medication';
import { createGenerateUtilizationReviewTool } from './tools/generate-utilization-review';
import { createTreatmentPlanTool } from './tools/create-treatment-plan';
import { createAskClarificationTool, createSubmitResultsTool } from './tools/terminal-tools';

export interface OrchestratorConfig {
  client: SupabaseClient<Database>;
  orgId: string;
  providerId: string;
  runId: string;
  systemPromptContext: SystemPromptContext;
  previousMessages?: ModelMessage[];
}

export interface OrchestratorCallbacks {
  onStepStart?: (stepNumber: number, toolName?: string) => void;
  onStepComplete?: (stepNumber: number, step: StepInfo) => void;
}

export interface StepInfo {
  text: string;
  toolCalls: Array<{ toolName: string; args: unknown }>;
  toolResults: Array<{ toolName: string; result: unknown }>;
  usage: { inputTokens: number; outputTokens: number };
}

export interface OrchestratorResult {
  terminationReason: 'submit_results' | 'ask_clarification' | 'max_steps' | 'error';
  terminalToolArgs?: Record<string, unknown>;
  steps: StepInfo[];
  totalTokens: { input: number; output: number };
  messages: ModelMessage[];
}

export async function runOrchestrator(
  config: OrchestratorConfig,
  callbacks?: OrchestratorCallbacks
): Promise<OrchestratorResult> {
  const { client, orgId, providerId, runId, systemPromptContext, previousMessages } = config;

  const allTools = {
    find_patient: createFindPatientTool(client, orgId),
    get_patient_context: createGetPatientContextTool(client, orgId),
    resolve_encounter: createResolveEncounterTool(client, orgId, providerId),
    create_progress_note: createProgressNoteTool(runId),
    create_appointment: createAppointmentTool(client, orgId, providerId),
    suggest_billing_codes: createSuggestBillingCodesTool(client, orgId),
    update_medication: createUpdateMedicationTool(),
    generate_utilization_review: createGenerateUtilizationReviewTool(runId),
    create_treatment_plan: createTreatmentPlanTool(runId),
    ask_clarification: createAskClarificationTool(),
    submit_results: createSubmitResultsTool(),
  };

  type AllTools = typeof allTools;

  const lookupToolNames = ['find_patient', 'get_patient_context', 'resolve_encounter'] as const;
  const actionToolNames = ['create_progress_note', 'create_appointment', 'suggest_billing_codes', 'update_medication', 'generate_utilization_review', 'create_treatment_plan'] as const;
  const terminalToolNames = ['ask_clarification', 'submit_results'] as const;

  const systemPrompt = buildSystemPrompt(systemPromptContext);

  let stepCount = 0;
  let totalInput = 0;
  let totalOutput = 0;
  const allSteps: StepInfo[] = [];

  const result = await generateText({
    model: gateway('google/gemini-3-flash-preview'),
    system: systemPrompt,
    messages: previousMessages ?? [],
    tools: allTools,
    stopWhen: [stepCountIs(10), hasToolCall('submit_results'), hasToolCall('ask_clarification')],
    toolChoice: 'auto',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepareStep: (({ stepNumber }: { stepNumber: number }) => {
      let activeToolNames: (keyof AllTools)[];

      if (stepNumber <= 2) {
        activeToolNames = [...lookupToolNames, ...terminalToolNames];
      } else if (stepNumber <= 7) {
        activeToolNames = [...lookupToolNames, ...actionToolNames, ...terminalToolNames];
      } else {
        activeToolNames = [...terminalToolNames];
      }

      const activeTools: Record<string, unknown> = {};
      for (const name of activeToolNames) {
        activeTools[name] = allTools[name];
      }

      return { tools: activeTools };
    }) as any,
    onStepFinish: (step) => {
      stepCount++;
      const inputTkn = step.usage?.inputTokens ?? 0;
      const outputTkn = step.usage?.outputTokens ?? 0;
      totalInput += inputTkn;
      totalOutput += outputTkn;

      const stepInfo: StepInfo = {
        text: step.text ?? '',
        toolCalls: (step.toolCalls ?? []).map((tc: { toolName: string; input?: unknown; args?: unknown }) => ({
          toolName: tc.toolName,
          args: tc.input ?? tc.args,
        })),
        toolResults: (step.toolResults ?? []).map((tr: { toolName: string; output?: unknown; result?: unknown }) => ({
          toolName: tr.toolName,
          result: tr.output ?? tr.result,
        })),
        usage: { inputTokens: inputTkn, outputTokens: outputTkn },
      };

      allSteps.push(stepInfo);
      callbacks?.onStepComplete?.(stepCount, stepInfo);
    },
  });

  // Determine termination reason
  let terminationReason: OrchestratorResult['terminationReason'] = 'max_steps';
  let terminalToolArgs: Record<string, unknown> | undefined;

  for (const step of allSteps) {
    for (const tc of step.toolCalls) {
      if (tc.toolName === 'submit_results') {
        terminationReason = 'submit_results';
        terminalToolArgs = tc.args as Record<string, unknown>;
      } else if (tc.toolName === 'ask_clarification') {
        terminationReason = 'ask_clarification';
        terminalToolArgs = tc.args as Record<string, unknown>;
      }
    }
  }

  return {
    terminationReason,
    terminalToolArgs,
    steps: allSteps,
    totalTokens: { input: totalInput, output: totalOutput },
    messages: result.response.messages,
  };
}
