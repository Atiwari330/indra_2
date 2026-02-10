import { generateObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { IntentClassification } from '@/lib/schemas/ai';

export async function classifyIntent(text: string): Promise<IntentClassification> {
  const { object } = await generateObject({
    model: gateway('google/gemini-3-flash-preview'),
    schema: IntentClassification,
    prompt: `Classify the following clinician input into one of these intent types:
- create_progress_note: The clinician wants to document a clinical session/encounter
- schedule_appointment: The clinician wants to schedule a follow-up or new appointment
- query_patient_info: The clinician wants to look up information about a patient
- update_medication: The clinician wants to change a patient's medication
- generate_utilization_review: The clinician wants to generate a utilization review or authorization request for a patient
- general_query: General question or unclear intent

Also extract the patient name if mentioned, and the encounter date if mentioned.
Rate your confidence from 0 to 1.

Clinician input: "${text}"`,
  });

  return object;
}
