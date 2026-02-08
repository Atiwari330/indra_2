import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

type Client = SupabaseClient<Database>;
type AiRunStatus = Database['public']['Enums']['ai_run_status'];

export async function createRun(
  client: Client,
  orgId: string,
  userId: string,
  inputText: string,
  idempotencyKey?: string
) {
  // Check idempotency
  if (idempotencyKey) {
    const { data: existing } = await client
      .from('ai_runs')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing) return existing;
  }

  const { data, error } = await client
    .from('ai_runs')
    .insert({
      org_id: orgId,
      user_id: userId,
      input_text: inputText,
      status: 'pending',
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create AI run: ${error.message}`);
  return data;
}

export async function updateRunStatus(
  client: Client,
  runId: string,
  status: AiRunStatus,
  data?: {
    intent_type?: string;
    patient_id?: string;
    encounter_id?: string;
    result_summary?: string;
    total_tokens?: number;
    total_cost_cents?: number;
    error?: string;
    started_at?: string;
    completed_at?: string;
  }
) {
  const update: Record<string, unknown> = { status, ...data };

  const { data: updated, error } = await client
    .from('ai_runs')
    .update(update)
    .eq('id', runId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update AI run: ${error.message}`);
  return updated;
}

export async function addStep(
  client: Client,
  runId: string,
  stepData: {
    step_number: number;
    step_type: Database['public']['Enums']['ai_step_type'];
    tool_name?: string;
    input?: unknown;
    output?: unknown;
    messages?: unknown;
    tokens_input?: number;
    tokens_output?: number;
    duration_ms?: number;
  }
) {
  const { data, error } = await client
    .from('ai_steps')
    .insert({
      run_id: runId,
      ...stepData,
      input: stepData.input as Database['public']['Tables']['ai_steps']['Insert']['input'],
      output: stepData.output as Database['public']['Tables']['ai_steps']['Insert']['output'],
      messages: stepData.messages as Database['public']['Tables']['ai_steps']['Insert']['messages'],
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add AI step: ${error.message}`);
  return data;
}

export async function createProposedAction(
  client: Client,
  runId: string,
  orgId: string,
  actionData: {
    action_group: string;
    action_group_label?: string;
    action_type: Database['public']['Enums']['ai_action_type'];
    action_order: number;
    target_table: string;
    payload: Record<string, unknown>;
    confidence_score?: number;
    assumptions?: string[];
    requires_review?: boolean;
  }
) {
  const { data, error } = await client
    .from('ai_proposed_actions')
    .insert({
      run_id: runId,
      org_id: orgId,
      action_group: actionData.action_group,
      action_group_label: actionData.action_group_label,
      action_type: actionData.action_type,
      action_order: actionData.action_order,
      target_table: actionData.target_table,
      payload: actionData.payload as Database['public']['Tables']['ai_proposed_actions']['Insert']['payload'],
      confidence_score: actionData.confidence_score,
      assumptions: actionData.assumptions as unknown as Database['public']['Tables']['ai_proposed_actions']['Insert']['assumptions'],
      requires_review: actionData.requires_review ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create proposed action: ${error.message}`);
  return data;
}

export async function createClarification(
  client: Client,
  runId: string,
  orgId: string,
  questionData: {
    question: string;
    context?: Record<string, unknown>;
    options?: string[];
  }
) {
  const { data, error } = await client
    .from('ai_clarifications')
    .insert({
      run_id: runId,
      org_id: orgId,
      question: questionData.question,
      context: questionData.context as Database['public']['Tables']['ai_clarifications']['Insert']['context'],
      options: questionData.options as unknown as Database['public']['Tables']['ai_clarifications']['Insert']['options'],
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create clarification: ${error.message}`);
  return data;
}

export async function answerClarification(
  client: Client,
  clarificationId: string,
  answer: string,
  userId: string
) {
  const { data, error } = await client
    .from('ai_clarifications')
    .update({
      answer,
      answered_at: new Date().toISOString(),
      answered_by: userId,
    })
    .eq('id', clarificationId)
    .select()
    .single();

  if (error) throw new Error(`Failed to answer clarification: ${error.message}`);
  return data;
}

export async function getRunWithDetails(client: Client, runId: string) {
  const [run, steps, actions, clarifications] = await Promise.all([
    client.from('ai_runs').select('*').eq('id', runId).single(),
    client.from('ai_steps').select('*').eq('run_id', runId).order('step_number'),
    client.from('ai_proposed_actions').select('*').eq('run_id', runId).order('action_order'),
    client.from('ai_clarifications').select('*').eq('run_id', runId).order('created_at'),
  ]);

  if (run.error) throw new Error(`Failed to get AI run: ${run.error.message}`);

  return {
    run: run.data,
    steps: steps.data ?? [],
    actions: actions.data ?? [],
    clarifications: clarifications.data ?? [],
  };
}
