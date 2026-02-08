/**
 * Interactive CLI for submitting AI intents.
 * Calls the run manager directly (no HTTP).
 *
 * Usage:
 *   npx tsx scripts/run-intent.ts "Create a progress note for John Doe..."
 *   npx tsx scripts/run-intent.ts --dry-run "Create a note..."
 *   npx tsx scripts/run-intent.ts  (prompts interactively)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import * as readline from 'readline';
import { createAdminClient } from '../src/lib/supabase/admin';
import { executeIntent, resumeAfterClarification } from '../src/ai/run-manager';
import { commitActionGroup } from '../src/services/commit.service';
import { answerClarification, getRunWithDetails } from '../src/services/ai-run.service';

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const USER_ID = 'b0000000-0000-0000-0000-000000000001';
const PROVIDER_ID = 'c0000000-0000-0000-0000-000000000001';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const textArgs = args.filter((a) => !a.startsWith('--'));
  let inputText = textArgs.join(' ').trim();

  if (!inputText) {
    inputText = await ask('Enter intent: ');
  }

  if (!inputText) {
    console.log('No input provided. Exiting.');
    rl.close();
    return;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Intent: ${inputText}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`${'='.repeat(60)}\n`);

  const client = createAdminClient();

  let stepNum = 0;
  const result = await executeIntent(client, {
    orgId: ORG_ID,
    userId: USER_ID,
    providerId: PROVIDER_ID,
    inputText,
    callbacks: {
      onStepComplete: (num, step) => {
        stepNum = num;
        const toolNames = step.toolCalls.map((tc) => tc.toolName).join(', ');
        console.log(`  Step ${num}: ${toolNames || 'text response'}`);
        if (step.text) {
          console.log(`    Text: ${step.text.slice(0, 200)}${step.text.length > 200 ? '...' : ''}`);
        }
        for (const tr of step.toolResults) {
          const resultStr = JSON.stringify(tr.result).slice(0, 200);
          console.log(`    → ${tr.toolName}: ${resultStr}${resultStr.length >= 200 ? '...' : ''}`);
        }
      },
    },
  });

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Run ID: ${result.runId}`);
  console.log(`Status: ${result.status}`);
  console.log(`Intent: ${result.intentType}`);
  console.log(`Tokens: ${result.totalTokens.input} in / ${result.totalTokens.output} out`);

  // Handle clarifications
  if (result.status === 'needs_clarification' && result.clarifications) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log('Clarification needed:\n');

    for (const c of result.clarifications) {
      console.log(`  Q: ${c.question}`);
      if (c.options) {
        const opts = c.options as string[];
        opts.forEach((o, i) => console.log(`     ${i + 1}. ${o}`));
      }

      const answer = process.env.AI_SKIP_CLARIFICATIONS === 'true'
        ? 'auto-answered'
        : await ask('  A: ');

      await answerClarification(client, c.id, answer, USER_ID);
    }

    console.log('\nResuming after clarification...\n');
    const resumed = await resumeAfterClarification(
      client, result.runId, ORG_ID, USER_ID, PROVIDER_ID
    );

    console.log(`Resumed status: ${resumed.status}`);
    if (resumed.summary) console.log(`Summary: ${resumed.summary}`);

    // Show proposed actions from resumed result
    if (resumed.proposedActions) {
      showProposedActions(resumed.proposedActions);
      if (!dryRun && resumed.proposedActions.length > 0) {
        await handleCommit(client, resumed.runId);
      }
    }
  }

  // Handle ready to commit
  if (result.status === 'ready_to_commit') {
    if (result.summary) {
      console.log(`\nSummary: ${result.summary}`);
    }

    if (result.proposedActions) {
      showProposedActions(result.proposedActions);
    }

    const hasActions = result.proposedActions && result.proposedActions.length > 0;
    if (!dryRun && hasActions) {
      await handleCommit(client, result.runId);
    } else if (dryRun) {
      console.log('\n[DRY RUN] Skipping commit.');
    } else {
      console.log('\nNo actions to commit — informational query complete.');
    }
  }

  if (result.status === 'failed') {
    console.log('\nRun failed. Check the run details for error information.');
  }

  rl.close();
}

function showProposedActions(actions: Array<{ id: string; action_type: string; description: string; payload: unknown }>) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Proposed Actions (${actions.length}):\n`);
  for (const a of actions) {
    console.log(`  [${a.action_type}] ${a.description}`);
    console.log(`    Payload: ${JSON.stringify(a.payload).slice(0, 300)}`);
  }
}

async function handleCommit(client: ReturnType<typeof createAdminClient>, runId: string) {
  const answer = await ask('\nCommit? (y/n): ');

  if (answer.toLowerCase() === 'y') {
    const details = await getRunWithDetails(client, runId);
    const pendingActions = details.actions.filter((a) => a.status === 'pending');

    if (pendingActions.length === 0) {
      console.log('No pending actions to commit.');
      return;
    }

    const groupId = pendingActions[0].action_group;
    const commitResult = await commitActionGroup(client, groupId, PROVIDER_ID, ORG_ID);
    console.log(`\nCommitted: ${commitResult.committed}/${commitResult.results.length} actions`);
    for (const r of commitResult.results) {
      console.log(`  ${r.success ? '✓' : '✗'} ${r.actionType}${r.error ? ': ' + r.error : ''}`);
    }
  } else {
    console.log('Commit cancelled.');
  }
}

main().catch((err) => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
