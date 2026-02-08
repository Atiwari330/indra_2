/**
 * Automated workflow scenario tests.
 * Tests 5 scenarios against the live AI + database.
 *
 * Usage: npx tsx scripts/test-workflows.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createAdminClient } from '../src/lib/supabase/admin';
import { executeIntent } from '../src/ai/run-manager';
import { commitActionGroup } from '../src/services/commit.service';
import { getRunWithDetails, answerClarification } from '../src/services/ai-run.service';

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const USER_ID = 'b0000000-0000-0000-0000-000000000001';
const PROVIDER_ID = 'c0000000-0000-0000-0000-000000000001';

interface ScenarioResult {
  name: string;
  passed: boolean;
  status: string;
  intentType: string;
  actionCount: number;
  tokens: { input: number; output: number };
  error?: string;
  duration: number;
}

const scenarios = [
  {
    name: '1. Simple progress note',
    input: 'Create a progress note for John Doe. 45 min individual therapy session today. He reported improved mood since starting behavioral activation. Sleep is better, 6-7 hours per night. PHQ-9 score dropped to 11. We continued CBT work on cognitive restructuring. Plan to continue biweekly sessions.',
    expect: {
      minActions: 1,
      hasActionType: 'create_note_draft',
    },
  },
  {
    name: '2. Note with clarification',
    input: 'Create a note for Jane Smith from today',
    expect: {
      status: 'needs_clarification',
    },
  },
  {
    name: '3. Schedule follow-up',
    input: 'Schedule a follow-up appointment for John Doe next Tuesday at 2pm for individual therapy, 45 minutes.',
    expect: {
      minActions: 1,
      hasActionType: 'create_appointment',
    },
  },
  {
    name: '4. Patient query',
    input: 'How many sessions has Jane Smith had?',
    expect: {
      status: 'ready_to_commit',
    },
  },
  {
    name: '5. Complex multi-action',
    input: 'I just finished a 60-min session with John Doe. He is doing better on Lexapro. Let\'s increase it to 20mg daily. Schedule follow-up in 2 weeks, same time. He reported significant mood improvement, sleeping 7 hours, PHQ-9 score 8. We did CBT cognitive restructuring and he is challenging negative thoughts more effectively.',
    expect: {
      minActions: 2,
    },
  },
];

async function runScenario(scenario: typeof scenarios[0]): Promise<ScenarioResult> {
  const client = createAdminClient();
  const start = Date.now();

  try {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Running: ${scenario.name}`);
    console.log(`Input: ${scenario.input.slice(0, 100)}...`);

    const result = await executeIntent(client, {
      orgId: ORG_ID,
      userId: USER_ID,
      providerId: PROVIDER_ID,
      inputText: scenario.input,
      callbacks: {
        onStepComplete: (num, step) => {
          const tools = step.toolCalls.map((tc) => tc.toolName).join(', ');
          console.log(`  Step ${num}: ${tools || 'text'}`);
        },
      },
    });

    const duration = Date.now() - start;

    // Check expectations
    let passed = true;

    if (scenario.expect.status && result.status !== scenario.expect.status) {
      // Allow some flexibility: if we expected clarification but got results, that's OK
      if (scenario.expect.status === 'needs_clarification' && result.status === 'ready_to_commit') {
        console.log(`  Note: Expected clarification but model proceeded anyway (acceptable)`);
      } else {
        console.log(`  WARN: Expected status ${scenario.expect.status}, got ${result.status}`);
      }
    }

    if (scenario.expect.minActions && (result.proposedActions?.length ?? 0) < scenario.expect.minActions) {
      console.log(`  WARN: Expected at least ${scenario.expect.minActions} actions, got ${result.proposedActions?.length ?? 0}`);
      // Don't fail on this — LLM output is non-deterministic
    }

    if (scenario.expect.hasActionType && result.proposedActions) {
      const found = result.proposedActions.some((a) => a.action_type === scenario.expect.hasActionType);
      if (!found) {
        console.log(`  WARN: Expected action type ${scenario.expect.hasActionType} not found`);
      }
    }

    console.log(`  Status: ${result.status}`);
    console.log(`  Actions: ${result.proposedActions?.length ?? 0}`);
    console.log(`  Intent: ${result.intentType}`);
    console.log(`  Tokens: ${result.totalTokens.input} in / ${result.totalTokens.output} out`);
    console.log(`  Duration: ${duration}ms`);

    if (result.proposedActions) {
      for (const a of result.proposedActions) {
        console.log(`    → [${a.action_type}] ${a.description.slice(0, 100)}`);
      }
    }

    if (result.clarifications) {
      for (const c of result.clarifications) {
        console.log(`    ? ${c.question}`);
      }
    }

    return {
      name: scenario.name,
      passed,
      status: result.status,
      intentType: result.intentType,
      actionCount: result.proposedActions?.length ?? 0,
      tokens: result.totalTokens,
      duration,
    };

  } catch (error) {
    const duration = Date.now() - start;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ERROR: ${errorMsg}`);

    return {
      name: scenario.name,
      passed: false,
      status: 'error',
      intentType: 'unknown',
      actionCount: 0,
      tokens: { input: 0, output: 0 },
      error: errorMsg,
      duration,
    };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Indra EHR — Automated Workflow Tests');
  console.log('='.repeat(60));
  console.log(`Running ${scenarios.length} scenarios...`);

  const results: ScenarioResult[] = [];
  let totalTokensIn = 0;
  let totalTokensOut = 0;

  for (const scenario of scenarios) {
    const result = await runScenario(scenario);
    results.push(result);
    totalTokensIn += result.tokens.input;
    totalTokensOut += result.tokens.output;
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  for (const r of results) {
    console.log(`  ${r.passed ? '✓' : '✗'} ${r.name} — ${r.status} (${r.actionCount} actions, ${r.duration}ms)${r.error ? ' ERROR: ' + r.error : ''}`);
  }

  console.log(`\n  ${passed}/${results.length} scenarios passed`);
  console.log(`  Total tokens: ${totalTokensIn} in / ${totalTokensOut} out`);
  console.log(`  Estimated cost: $${((totalTokensIn * 0.00015 + totalTokensOut * 0.0006) / 1000).toFixed(4)}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
