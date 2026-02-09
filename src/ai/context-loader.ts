import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { getPatientContext } from '@/services/patient.service';

type Client = SupabaseClient<Database>;

interface ScoreRecord {
  measure_type: string;
  score: number;
  administered_at: string;
  encounter_id: string | null;
}

// Measures where lower scores = better outcome
const LOWER_IS_BETTER = ['PHQ-9', 'GAD-7', 'PCL-5', 'AUDIT-C', 'CSSRS'];

function computeTrend(scores: ScoreRecord[]): string | null {
  if (scores.length < 2) return null;
  const oldest = Number(scores[scores.length - 1].score);
  const newest = Number(scores[0].score);
  const diff = newest - oldest;
  const lowerIsBetter = LOWER_IS_BETTER.includes(scores[0].measure_type);
  if (lowerIsBetter) {
    if (diff <= -3) return 'improving';
    if (diff >= 3) return 'worsening';
  } else {
    if (diff >= 3) return 'improving';
    if (diff <= -3) return 'worsening';
  }
  return 'stable';
}

export function computeGoalStatus(
  goalText: string,
  scoresByMeasure: Map<string, ScoreRecord[]>
): { status: string; detail: string } {
  // Try to find a measure reference in the goal text
  const measurePatterns: Array<{ pattern: RegExp; measure: string }> = [
    { pattern: /PHQ-?9/i, measure: 'PHQ-9' },
    { pattern: /GAD-?7/i, measure: 'GAD-7' },
    { pattern: /PCL-?5/i, measure: 'PCL-5' },
    { pattern: /AUDIT-?C/i, measure: 'AUDIT-C' },
    { pattern: /C-?SSRS/i, measure: 'CSSRS' },
  ];

  let matchedMeasure: string | null = null;
  for (const { pattern, measure } of measurePatterns) {
    if (pattern.test(goalText)) {
      matchedMeasure = measure;
      break;
    }
  }

  if (!matchedMeasure) {
    return { status: 'IN PROGRESS', detail: 'qualitative goal - assess from recent notes' };
  }

  const scores = scoresByMeasure.get(matchedMeasure);
  if (!scores || scores.length === 0) {
    return { status: 'BASELINE', detail: 'no scores yet' };
  }

  // Try to parse a numeric target from the goal text
  // Patterns like "below 10", "under 10", "< 10", "to 10 or below", "by 50%"
  const belowMatch = goalText.match(/(?:below|under|less than|<)\s*(\d+)/i);
  const percentMatch = goalText.match(/(?:by|reduce)\s*(\d+)%/i);
  const latestScore = Number(scores[0].score);

  if (belowMatch) {
    const target = parseInt(belowMatch[1], 10);
    if (latestScore < target) {
      return { status: 'MET', detail: `latest: ${latestScore}, target: <${target}` };
    }
    if (latestScore <= target + 2) {
      return { status: 'APPROACHING', detail: `latest: ${latestScore}, target: <${target}` };
    }
    return { status: 'IN PROGRESS', detail: `latest: ${latestScore}, target: <${target}` };
  }

  if (percentMatch && scores.length >= 2) {
    const targetPercent = parseInt(percentMatch[1], 10) / 100;
    const baseline = Number(scores[scores.length - 1].score);
    const targetScore = baseline * (1 - targetPercent);
    if (latestScore <= targetScore) {
      return { status: 'MET', detail: `latest: ${latestScore}, target: ${targetScore.toFixed(0)} (${percentMatch[1]}% reduction from ${baseline})` };
    }
    if (latestScore <= targetScore + (baseline * 0.1)) {
      return { status: 'APPROACHING', detail: `latest: ${latestScore}, target: ${targetScore.toFixed(0)} (${percentMatch[1]}% reduction from ${baseline})` };
    }
    return { status: 'IN PROGRESS', detail: `latest: ${latestScore}, target: ${targetScore.toFixed(0)} (${percentMatch[1]}% reduction from ${baseline})` };
  }

  return { status: 'IN PROGRESS', detail: `latest: ${latestScore}` };
}

export async function loadPatientContextForPrompt(
  client: Client,
  orgId: string,
  patientId: string
): Promise<string> {
  const ctx = await getPatientContext(client, orgId, patientId);
  const p = ctx.patient;

  // Build a lookup of scores by encounter_id for annotating notes
  const scoresByEncounter = new Map<string, ScoreRecord[]>();
  // Build a lookup of scores by measure type (chronological, oldest first)
  const scoresByMeasure = new Map<string, ScoreRecord[]>();
  for (const s of ctx.assessmentScores) {
    const rec: ScoreRecord = {
      measure_type: s.measure_type,
      score: Number(s.score),
      administered_at: s.administered_at,
      encounter_id: s.encounter_id,
    };
    if (s.encounter_id) {
      const existing = scoresByEncounter.get(s.encounter_id) ?? [];
      existing.push(rec);
      scoresByEncounter.set(s.encounter_id, existing);
    }
    const byMeasure = scoresByMeasure.get(s.measure_type) ?? [];
    byMeasure.push(rec);
    scoresByMeasure.set(s.measure_type, byMeasure);
  }

  const lines: string[] = [];
  lines.push(`Patient: ${p.first_name} ${p.last_name} (DOB: ${p.dob}, ${p.gender ?? 'unknown gender'})`);
  lines.push(`Status: ${p.status}`);

  // Diagnoses with onset dates
  if (ctx.diagnoses.length > 0) {
    lines.push('\nActive Diagnoses:');
    for (const d of ctx.diagnoses) {
      const onset = d.onset_date ? ` (onset: ${d.onset_date})` : '';
      lines.push(`  - ${d.icd10_code}: ${d.description}${d.is_primary ? ' (PRIMARY)' : ''}${onset}`);
    }
  }

  if (ctx.medications.length > 0) {
    lines.push('\nCurrent Medications:');
    for (const m of ctx.medications) {
      lines.push(`  - ${m.name} ${m.dosage} ${m.frequency}`);
    }
  }

  // Recent notes — structured clinical signals, not full content
  if (ctx.recentNotes.length > 0) {
    lines.push('\nRecent Notes (structured signals):');
    for (let i = 0; i < ctx.recentNotes.length; i++) {
      const n = ctx.recentNotes[i];
      const content = n.content as Record<string, string> | null;
      const planSection = content?.plan ?? null;
      const riskAssessment = n.risk_assessment as Record<string, unknown> | null;

      lines.push(`  [${n.created_at?.split('T')[0]} ${n.note_type}]`);

      // First note: clinical observations + assessment + plan + risk
      if (i === 0 && content) {
        // Clinical observations: DAP uses 'data', SOAP uses 'subjective' + 'objective'
        const observations = content.data ?? content.subjective ?? null;
        const objective = content.objective ?? null;
        if (observations) {
          lines.push(`    Clinical observations: ${observations.length > 400 ? observations.slice(0, 400) + '...' : observations}`);
        }
        if (objective) {
          lines.push(`    Objective: ${objective.length > 300 ? objective.slice(0, 300) + '...' : objective}`);
        }
        if (content.assessment) {
          lines.push(`    Assessment: ${content.assessment.length > 300 ? content.assessment.slice(0, 300) + '...' : content.assessment}`);
        }
        if (planSection) lines.push(`    Last session plan: ${planSection}`);
      } else {
        // 2nd/3rd notes: plan section only
        if (planSection) lines.push(`    Plan: ${planSection.length > 200 ? planSection.slice(0, 200) + '...' : planSection}`);
      }

      // Show associated scores for all notes
      if (n.encounter_id) {
        const noteScores = scoresByEncounter.get(n.encounter_id);
        if (noteScores && noteScores.length > 0) {
          const scoreStrs = noteScores.map(s => `${s.measure_type}: ${s.score}`);
          lines.push(`    Scores: ${scoreStrs.join(', ')}`);
        }
      }

      // Risk flags for all notes
      if (riskAssessment) {
        const flags: string[] = [];
        if (riskAssessment.suicidal_ideation) flags.push('SI');
        if (riskAssessment.homicidal_ideation) flags.push('HI');
        if (riskAssessment.self_harm) flags.push('SH');
        lines.push(`    Risk: ${flags.length > 0 ? flags.join(', ') : 'Denied SI/HI/SH'}`);
      }
    }
  }

  // Session Continuity section
  if (ctx.encounterHistory.length > 0) {
    lines.push('\nSession Continuity:');

    // Session count and authorization
    const sessionCount = ctx.encounterHistory.length;
    const primaryInsurance = ctx.insurance.find(ins => ins.priority === 'primary');
    if (primaryInsurance) {
      const authorized = primaryInsurance.authorized_sessions ?? 0;
      const used = primaryInsurance.sessions_used ?? 0;
      const remaining = authorized - used;
      lines.push(`  Session #${used + 1} of ${authorized} authorized (${remaining} remaining)`);
    } else {
      lines.push(`  Session #${sessionCount + 1}`);
    }

    // Last session summary
    const lastEncounter = ctx.encounterHistory[0];
    const lastNote = ctx.recentNotes.length > 0 ? ctx.recentNotes[0] : null;
    lines.push(`  Last session (${lastEncounter.encounter_date}):`);
    if (lastNote) {
      const content = lastNote.content as Record<string, string> | null;
      if (content?.plan) {
        const plan = content.plan.length > 200 ? content.plan.slice(0, 200) + '...' : content.plan;
        lines.push(`    Plan: ${plan}`);
      }
      const riskAssessment = lastNote.risk_assessment as Record<string, unknown> | null;
      if (riskAssessment) {
        const flags: string[] = [];
        if (riskAssessment.suicidal_ideation) flags.push('SI');
        if (riskAssessment.homicidal_ideation) flags.push('HI');
        if (riskAssessment.self_harm) flags.push('SH');
        lines.push(`    Risk: ${flags.length > 0 ? flags.join(', ') : 'Denied SI/HI/SH'}`);
      }
    }

    // Outcome measures with trends
    if (scoresByMeasure.size > 0) {
      lines.push('  Outcome measures:');
      for (const [measure, scores] of scoresByMeasure) {
        // Scores are newest-first from the query, reverse for display (chronological)
        const chronological = [...scores].reverse();
        const trajectory = chronological.map(s => `${s.score} (${s.administered_at.split('T')[0]})`).join(' -> ');
        const trend = computeTrend(scores);
        const trendStr = trend ? ` [trend: ${trend}]` : '';
        lines.push(`    ${measure}: ${trajectory}${trendStr}`);
      }
    }

    // Treatment plan goal status
    const goals = ctx.treatmentPlan?.goals as Array<{ goal: string; target_date?: string }> | null;
    if (Array.isArray(goals) && goals.length > 0) {
      lines.push('  Treatment plan goal status:');
      for (const g of goals) {
        const { status, detail } = computeGoalStatus(g.goal, scoresByMeasure);
        lines.push(`    Goal: "${g.goal}"`);
        lines.push(`      Status: ${status} (${detail})`);
      }
    }
  }

  // Treatment plan — full structure
  if (ctx.treatmentPlan) {
    lines.push('\nTreatment Plan:');
    if (ctx.treatmentPlan.review_date) {
      lines.push(`  Review date: ${ctx.treatmentPlan.review_date}`);
    }
    const diagCodes = ctx.treatmentPlan.diagnosis_codes;
    if (Array.isArray(diagCodes) && diagCodes.length > 0) {
      lines.push(`  Diagnosis codes: ${diagCodes.join(', ')}`);
    }

    const goals = ctx.treatmentPlan.goals as Array<{ goal: string; target_date?: string }> | null;
    if (Array.isArray(goals) && goals.length > 0) {
      lines.push('  Goals:');
      for (const g of goals) {
        const target = g.target_date ? ` (target: ${g.target_date})` : '';
        lines.push(`    - ${g.goal}${target}`);
      }
    }

    const objectives = ctx.treatmentPlan.objectives as Array<{ objective: string; frequency?: string }> | null;
    if (Array.isArray(objectives) && objectives.length > 0) {
      lines.push('  Objectives:');
      for (const o of objectives) {
        const freq = o.frequency ? ` [${o.frequency}]` : '';
        lines.push(`    - ${o.objective}${freq}`);
      }
    }

    const interventions = ctx.treatmentPlan.interventions as Array<{ intervention: string; frequency?: string }> | null;
    if (Array.isArray(interventions) && interventions.length > 0) {
      lines.push('  Interventions:');
      for (const iv of interventions) {
        const freq = iv.frequency ? ` [${iv.frequency}]` : '';
        lines.push(`    - ${iv.intervention}${freq}`);
      }
    }
  }

  // Authorization status
  if (ctx.insurance.length > 0) {
    lines.push('\nAuthorization Status:');
    for (const ins of ctx.insurance) {
      const payer = (ins.insurance_payers as { name: string } | null)?.name ?? 'Unknown payer';
      const authorized = ins.authorized_sessions ?? 0;
      const used = ins.sessions_used ?? 0;
      const remaining = authorized - used;
      lines.push(`  - ${payer} (${ins.priority}): ${used}/${authorized} sessions used, ${remaining} remaining`);
      if (ins.copay_amount != null) {
        lines.push(`    Copay: $${ins.copay_amount}`);
      }
      if (remaining > 0 && remaining <= 4) {
        lines.push(`    ⚠ LOW AUTHORIZATION: Only ${remaining} sessions remaining — strengthen medical necessity documentation`);
      }
    }
  }

  // Recent session dates
  if (ctx.encounterHistory.length > 0) {
    lines.push('\nRecent Session Dates:');
    const dates = ctx.encounterHistory.map(e => `${e.encounter_date} (${e.encounter_type}, ${e.duration_minutes ?? '?'}min)`);
    for (const d of dates) {
      lines.push(`  - ${d}`);
    }
  } else {
    lines.push('\nSession History: First session (no prior encounters)');
  }

  if (ctx.upcomingAppointments.length > 0) {
    lines.push('\nUpcoming Appointments:');
    for (const a of ctx.upcomingAppointments) {
      lines.push(`  - ${a.start_time} (${a.appointment_type ?? 'appointment'})`);
    }
  }

  const result = lines.join('\n');
  const authAlert = ctx.insurance.some(ins => {
    const remaining = (ins.authorized_sessions ?? 0) - (ins.sessions_used ?? 0);
    return remaining > 0 && remaining <= 4;
  });
  console.log(`[context] Formatted prompt context: ${result.length} chars (~${Math.round(result.length / 4)} tokens), auth alert: ${authAlert ? 'yes' : 'no'}`);

  return result;
}

export async function loadEncounterContextForPrompt(
  client: Client,
  orgId: string,
  encounterId: string
): Promise<string> {
  const { data: encounter, error } = await client
    .from('encounters')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', encounterId)
    .single();

  if (error || !encounter) return '';

  return `Encounter: ${encounter.encounter_date} | Type: ${encounter.encounter_type} | Duration: ${encounter.duration_minutes ?? 'unknown'} min | Status: ${encounter.status}`;
}
