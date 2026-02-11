import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import type { ModelMessage } from 'ai';
import { runOrchestrator, type OrchestratorCallbacks } from './orchestrator';
import { classifyIntent } from './intent-classifier';
import { loadPatientContextForPrompt, loadEncounterContextForPrompt, loadTranscriptForPrompt } from './context-loader';
import * as aiRunService from '@/services/ai-run.service';
import type { SystemPromptContext } from './system-prompt';

export interface ExecuteIntentOptions {
  orgId: string;
  userId: string;
  providerId: string;
  inputText: string;
  patientId?: string;
  encounterId?: string;
  transcriptionSessionId?: string;
  idempotencyKey?: string;
  callbacks?: OrchestratorCallbacks;
}

export interface ExecuteIntentResult {
  runId: string;
  status: string;
  intentType: string;
  clarifications?: Array<{ id: string; question: string; options?: unknown }>;
  proposedActions?: Array<{ id: string; action_type: string; description: string; payload: unknown }>;
  summary?: string;
  totalTokens: { input: number; output: number };
}

const COST_PER_INPUT_TOKEN = 0.00015 / 1000;  // Gemini 2.5 Flash approx
const COST_PER_OUTPUT_TOKEN = 0.0006 / 1000;

export async function executeIntent(
  client: SupabaseClient<Database>,
  options: ExecuteIntentOptions
): Promise<ExecuteIntentResult> {
  const { orgId, userId, providerId, inputText, idempotencyKey, callbacks } = options;

  // 1. Create run
  const run = await aiRunService.createRun(client, orgId, userId, inputText, idempotencyKey);

  // If idempotent duplicate, return existing
  if (run.status !== 'pending') {
    const details = await aiRunService.getRunWithDetails(client, run.id);
    return {
      runId: run.id,
      status: run.status,
      intentType: run.intent_type ?? 'unknown',
      proposedActions: details.actions.map((a) => ({
        id: a.id,
        action_type: a.action_type,
        description: a.action_group_label ?? '',
        payload: a.payload,
      })),
      totalTokens: { input: run.total_tokens ?? 0, output: 0 },
    };
  }

  try {
    // 2. Update to running
    await aiRunService.updateRunStatus(client, run.id, 'running', {
      started_at: new Date().toISOString(),
    });

    // 3. Classify intent
    let intentType = 'general_query';
    try {
      const classification = await classifyIntent(inputText);
      intentType = classification.intent_type;

      // Use extracted patient name to resolve patient if not provided
      if (!options.patientId && classification.patient_name) {
        // Will be resolved by the find_patient tool during orchestration
      }

      await aiRunService.updateRunStatus(client, run.id, 'running', {
        intent_type: intentType,
      });
    } catch {
      // Intent classification is best-effort; continue with general_query
    }

    // 4. Load provider context
    const { data: provider } = await client
      .from('providers')
      .select('*, users(first_name, last_name)')
      .eq('id', providerId)
      .single();

    if (!provider) throw new Error('Provider not found');

    const { data: org } = await client
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    const providerUser = provider.users as unknown as { first_name: string; last_name: string } | null;

    const systemPromptContext: SystemPromptContext = {
      providerName: providerUser
        ? `${providerUser.first_name} ${providerUser.last_name}`
        : 'Unknown Provider',
      providerCredentials: provider.credentials ?? '',
      preferredNoteFormat: provider.preferred_note_format,
      organizationName: org?.name ?? 'Unknown Organization',
      todayDate: new Date().toISOString().split('T')[0],
      intentType,
    };

    // Load patient context if provided
    if (options.patientId) {
      systemPromptContext.patientContext = await loadPatientContextForPrompt(
        client, orgId, options.patientId
      );
    }
    if (options.encounterId) {
      systemPromptContext.encounterContext = await loadEncounterContextForPrompt(
        client, orgId, options.encounterId
      );
    }
    // Load transcript if a transcription session is referenced
    if (options.transcriptionSessionId) {
      const transcript = await loadTranscriptForPrompt(client, options.transcriptionSessionId);
      if (transcript) {
        systemPromptContext.sessionTranscript = transcript;
        console.log(`[run-manager] Loaded session transcript: ${transcript.length} chars`);
      }
    }

    // 5. Build initial messages
    const messages: ModelMessage[] = [
      { role: 'user', content: inputText },
    ];

    // 6. Run orchestrator
    const result = await runOrchestrator(
      {
        client,
        orgId,
        providerId,
        runId: run.id,
        systemPromptContext,
        previousMessages: messages,
      },
      callbacks
    );

    // 7. Persist steps
    for (let i = 0; i < result.steps.length; i++) {
      const step = result.steps[i];
      const toolCall = step.toolCalls?.[0];
      await aiRunService.addStep(client, run.id, {
        step_number: i + 1,
        step_type: toolCall ? 'tool_call' : 'llm_call',
        tool_name: toolCall?.toolName,
        input: toolCall?.args as Record<string, unknown> | undefined,
        output: step.toolResults?.[0]?.result as Record<string, unknown> | undefined,
        messages: result.messages as unknown as Record<string, unknown>,
        tokens_input: step.usage?.inputTokens,
        tokens_output: step.usage?.outputTokens,
      });
    }

    // 8. Process terminal tool call
    const costCents = (
      result.totalTokens.input * COST_PER_INPUT_TOKEN +
      result.totalTokens.output * COST_PER_OUTPUT_TOKEN
    ) * 100;

    if (result.terminationReason === 'ask_clarification') {
      return await handleClarification(client, run.id, orgId, result, intentType, costCents);
    }

    if (result.terminationReason === 'submit_results') {
      return await handleSubmitResults(client, run.id, orgId, userId, result, intentType, costCents);
    }

    // Max steps or error
    await aiRunService.updateRunStatus(client, run.id, 'failed', {
      error: 'Orchestrator reached max steps without completing',
      total_tokens: result.totalTokens.input + result.totalTokens.output,
      total_cost_cents: costCents,
      completed_at: new Date().toISOString(),
    });

    return {
      runId: run.id,
      status: 'failed',
      intentType,
      totalTokens: result.totalTokens,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await aiRunService.updateRunStatus(client, run.id, 'failed', {
      error: errorMsg,
      completed_at: new Date().toISOString(),
    });
    throw error;
  }
}

async function handleClarification(
  client: SupabaseClient<Database>,
  runId: string,
  orgId: string,
  result: Awaited<ReturnType<typeof runOrchestrator>>,
  intentType: string,
  costCents: number
): Promise<ExecuteIntentResult> {
  const args = result.terminalToolArgs as {
    questions: Array<{ question: string; context?: string; options?: string[] }>;
  };

  const clarifications = [];
  for (const q of args.questions ?? []) {
    const clarification = await aiRunService.createClarification(client, runId, orgId, {
      question: q.question,
      context: q.context ? { context: q.context } : undefined,
      options: q.options,
    });
    clarifications.push(clarification);
  }

  await aiRunService.updateRunStatus(client, runId, 'needs_clarification', {
    total_tokens: result.totalTokens.input + result.totalTokens.output,
    total_cost_cents: costCents,
  });

  return {
    runId,
    status: 'needs_clarification',
    intentType,
    clarifications: clarifications.map((c) => ({
      id: c.id,
      question: c.question,
      options: c.options,
    })),
    totalTokens: result.totalTokens,
  };
}

function extractCapturedPayloads(
  result: Awaited<ReturnType<typeof runOrchestrator>>
): Map<string, Array<{ target_table: string; payload: Record<string, unknown> }>> {
  const captured = new Map<string, Array<{ target_table: string; payload: Record<string, unknown> }>>();

  for (const step of result.steps) {
    for (const tr of step.toolResults) {
      const res = tr.result as Record<string, unknown> | null;
      const proposed = res?._proposed_action as {
        action_type: string;
        target_table: string;
        payload: Record<string, unknown>;
      } | undefined;

      if (proposed?.action_type) {
        if (!captured.has(proposed.action_type)) {
          captured.set(proposed.action_type, []);
        }
        captured.get(proposed.action_type)!.push({
          target_table: proposed.target_table,
          payload: proposed.payload,
        });
      }
    }
  }

  return captured;
}

async function handleSubmitResults(
  client: SupabaseClient<Database>,
  runId: string,
  orgId: string,
  userId: string,
  result: Awaited<ReturnType<typeof runOrchestrator>>,
  intentType: string,
  costCents: number
): Promise<ExecuteIntentResult> {
  const args = result.terminalToolArgs as {
    summary: string;
    proposed_actions: Array<{
      action_type: string;
      description: string;
      target_table: string;
      payload: Record<string, unknown>;
      confidence: number;
      assumptions?: string[];
    }>;
  };

  const actionGroupId = crypto.randomUUID();
  const capturedPayloads = extractCapturedPayloads(result);

  console.log(`[run-manager] submit_results: ${(args.proposed_actions ?? []).length} proposed action(s)`);
  console.log(`[run-manager] Captured payloads from tool results: ${[...capturedPayloads.keys()].join(', ') || '(none)'}`);

  const proposedActions = [];
  for (let i = 0; i < (args.proposed_actions ?? []).length; i++) {
    const pa = args.proposed_actions[i];
    const captured = capturedPayloads.get(pa.action_type)?.shift();
    const usedCaptured = !!captured;
    const payload = captured?.payload ?? pa.payload;
    const targetTable = captured?.target_table ?? pa.target_table;
    console.log(`[run-manager] Action[${i}]: type=${pa.action_type} | usedCapturedPayload=${usedCaptured} | table=${targetTable} | payload keys: ${Object.keys(payload).join(', ')}`);
    const action = await aiRunService.createProposedAction(client, runId, orgId, {
      action_group: actionGroupId,
      action_group_label: pa.description,
      action_type: pa.action_type as Database['public']['Enums']['ai_action_type'],
      action_order: i,
      target_table: targetTable,
      payload,
      confidence_score: pa.confidence,
      assumptions: pa.assumptions,
    });
    proposedActions.push(action);
  }

  await aiRunService.updateRunStatus(client, runId, 'ready_to_commit', {
    result_summary: args.summary,
    total_tokens: result.totalTokens.input + result.totalTokens.output,
    total_cost_cents: costCents,
    completed_at: new Date().toISOString(),
  });

  return {
    runId,
    status: 'ready_to_commit',
    intentType,
    summary: args.summary,
    proposedActions: proposedActions.map((a) => ({
      id: a.id,
      action_type: a.action_type,
      description: a.action_group_label ?? '',
      payload: a.payload,
    })),
    totalTokens: result.totalTokens,
  };
}

/**
 * Injects a synthetic tool result for the ask_clarification tool call that
 * was left unmatched when `stopWhen` halted the orchestrator loop.
 * Without this, passing the messages back to generateText() would throw
 * MissingToolResultsError.
 */
function injectClarificationToolResult(messages: ModelMessage[]): ModelMessage[] {
  const result = [...messages];

  // Walk backwards to find the last assistant message with an ask_clarification tool call
  for (let i = result.length - 1; i >= 0; i--) {
    const msg = result[i];
    if (msg.role === 'assistant' && Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (
          typeof part === 'object' &&
          part !== null &&
          'type' in part &&
          part.type === 'tool-call' &&
          'toolName' in part &&
          part.toolName === 'ask_clarification'
        ) {
          // Inject a tool result message right after this assistant message
          const toolResultMessage: ModelMessage = {
            role: 'tool',
            content: [{
              type: 'tool-result',
              toolCallId: (part as { toolCallId: string }).toolCallId,
              toolName: 'ask_clarification',
              output: { type: 'text', value: 'Questions sent to provider for clarification.' },
            }],
          };
          result.splice(i + 1, 0, toolResultMessage);
          return result;
        }
      }
    }
  }

  return result;
}

export async function resumeAfterClarification(
  client: SupabaseClient<Database>,
  runId: string,
  orgId: string,
  userId: string,
  providerId: string,
  callbacks?: OrchestratorCallbacks
): Promise<ExecuteIntentResult> {
  // Load the run
  const details = await aiRunService.getRunWithDetails(client, runId);
  const run = details.run;

  if (run.status !== 'needs_clarification') {
    throw new Error(`Run is not in needs_clarification status: ${run.status}`);
  }

  // Check all clarifications are answered
  const unanswered = details.clarifications.filter((c) => !c.answer);
  if (unanswered.length > 0) {
    throw new Error(`${unanswered.length} unanswered clarification(s)`);
  }

  // Load previous messages from the last step
  const lastStepWithMessages = [...details.steps].reverse().find((s) => s.messages);
  const previousMessages = (lastStepWithMessages?.messages as ModelMessage[] | undefined) ?? [];

  // Inject synthetic tool result for the ask_clarification call that stopped the loop
  const messagesWithToolResult = injectClarificationToolResult(previousMessages);

  // Append clarification answers as user messages
  const clarificationText = details.clarifications
    .map((c) => `Q: ${c.question}\nA: ${c.answer}`)
    .join('\n\n');

  const messages: ModelMessage[] = [
    ...messagesWithToolResult,
    { role: 'user', content: `Here are my answers to your questions:\n\n${clarificationText}\n\nPlease proceed with the workflow.` },
  ];

  // Load provider context
  const { data: provider } = await client
    .from('providers')
    .select('*, users(first_name, last_name)')
    .eq('id', providerId)
    .single();

  if (!provider) throw new Error('Provider not found');

  const { data: org } = await client
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  const providerUser = provider.users as unknown as { first_name: string; last_name: string } | null;

  const systemPromptContext: SystemPromptContext = {
    providerName: providerUser
      ? `${providerUser.first_name} ${providerUser.last_name}`
      : 'Unknown Provider',
    providerCredentials: provider.credentials ?? '',
    preferredNoteFormat: provider.preferred_note_format,
    organizationName: org?.name ?? 'Unknown Organization',
    todayDate: new Date().toISOString().split('T')[0],
    intentType: run.intent_type ?? undefined,
  };

  await aiRunService.updateRunStatus(client, runId, 'running');

  const result = await runOrchestrator(
    { client, orgId, providerId, runId, systemPromptContext, previousMessages: messages },
    callbacks
  );

  // Persist new steps
  const existingStepCount = details.steps.length;
  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];
    const toolCall = step.toolCalls?.[0];
    await aiRunService.addStep(client, runId, {
      step_number: existingStepCount + i + 1,
      step_type: toolCall ? 'tool_call' : 'llm_call',
      tool_name: toolCall?.toolName,
      input: toolCall?.args as Record<string, unknown> | undefined,
      output: step.toolResults?.[0]?.result as Record<string, unknown> | undefined,
      messages: result.messages as unknown as Record<string, unknown>,
      tokens_input: step.usage?.inputTokens,
      tokens_output: step.usage?.outputTokens,
    });
  }

  const costCents = (
    result.totalTokens.input * COST_PER_INPUT_TOKEN +
    result.totalTokens.output * COST_PER_OUTPUT_TOKEN
  ) * 100;

  if (result.terminationReason === 'submit_results') {
    return await handleSubmitResults(client, runId, orgId, userId, result, run.intent_type ?? 'unknown', costCents);
  }

  if (result.terminationReason === 'ask_clarification') {
    return await handleClarification(client, runId, orgId, result, run.intent_type ?? 'unknown', costCents);
  }

  await aiRunService.updateRunStatus(client, runId, 'failed', {
    error: 'Orchestrator reached max steps after clarification',
    completed_at: new Date().toISOString(),
  });

  return {
    runId,
    status: 'failed',
    intentType: run.intent_type ?? 'unknown',
    totalTokens: result.totalTokens,
  };
}
