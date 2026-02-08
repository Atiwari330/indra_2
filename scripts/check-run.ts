/**
 * Check the status and details of an AI run.
 *
 * Usage: npx tsx scripts/check-run.ts <run-id>
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createAdminClient } from '../src/lib/supabase/admin';
import { getRunWithDetails } from '../src/services/ai-run.service';

async function main() {
  const runId = process.argv[2];

  if (!runId) {
    console.error('Usage: npx tsx scripts/check-run.ts <run-id>');
    process.exit(1);
  }

  const client = createAdminClient();
  const details = await getRunWithDetails(client, runId);

  console.log('=== AI Run ===');
  console.log(`ID: ${details.run.id}`);
  console.log(`Status: ${details.run.status}`);
  console.log(`Intent: ${details.run.intent_type}`);
  console.log(`Input: ${details.run.input_text}`);
  console.log(`Summary: ${details.run.result_summary ?? 'N/A'}`);
  console.log(`Tokens: ${details.run.total_tokens}`);
  console.log(`Cost: $${(details.run.total_cost_cents ?? 0) / 100}`);
  console.log(`Created: ${details.run.created_at}`);
  console.log(`Completed: ${details.run.completed_at ?? 'N/A'}`);

  if (details.steps.length > 0) {
    console.log(`\n=== Steps (${details.steps.length}) ===`);
    for (const step of details.steps) {
      console.log(`  Step ${step.step_number}: ${step.step_type}${step.tool_name ? ` (${step.tool_name})` : ''}`);
    }
  }

  if (details.actions.length > 0) {
    console.log(`\n=== Proposed Actions (${details.actions.length}) ===`);
    for (const action of details.actions) {
      console.log(`  [${action.status}] ${action.action_type}: ${action.action_group_label ?? ''}`);
      console.log(`    Payload: ${JSON.stringify(action.payload).slice(0, 200)}`);
    }
  }

  if (details.clarifications.length > 0) {
    console.log(`\n=== Clarifications (${details.clarifications.length}) ===`);
    for (const c of details.clarifications) {
      console.log(`  Q: ${c.question}`);
      console.log(`  A: ${c.answer ?? 'Unanswered'}`);
    }
  }

  if (details.run.error) {
    console.log(`\n=== Error ===`);
    console.log(details.run.error);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
