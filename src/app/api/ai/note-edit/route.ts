import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { getAuthContext, jsonResponse, errorResponse } from '@/lib/api-helpers';

const NOTE_EDIT_SYSTEM_PROMPT = `You are a clinical note editor for a behavioral health EHR. You receive:
1. A clinical note as JSON (either SOAP format or intake assessment format)
2. A provider's edit instruction

Your job is to apply the requested edit and return the ENTIRE note with changes applied.

Rules:
- Preserve everything the provider didn't ask to change
- Maintain clinical accuracy and proper medical terminology
- Keep the same JSON structure and field names
- Do not add new fields or remove existing fields
- Preserve section structure (for SOAP: subjective, objective, assessment, plan; for intake: presenting_problem, history_of_present_illness, etc.)
- When removing content, ensure the remaining text flows naturally
- When changing pronouns, apply consistently throughout the entire note
- When expanding a section, maintain the same clinical tone and style
- Return ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON

You MUST respond with a JSON object containing exactly two fields:
- "content": the full edited note content (same structure as input)
- "changes_summary": a brief one-sentence description of what was changed`;

export async function POST(req: NextRequest) {
  try {
    await getAuthContext(req);

    const body = await req.json();
    const { content, note_type, instruction } = body;

    if (!content || typeof content !== 'object') {
      return errorResponse('Missing or invalid content', 400);
    }
    if (!instruction || typeof instruction !== 'string') {
      return errorResponse('Missing instruction', 400);
    }
    if (!note_type || typeof note_type !== 'string') {
      return errorResponse('Missing note_type', 400);
    }

    const userMessage = `Note type: ${note_type}

Current note content:
${JSON.stringify(content, null, 2)}

Edit instruction: ${instruction}

Return the complete edited note as JSON with "content" and "changes_summary" fields.`;

    const result = await generateText({
      model: gateway('google/gemini-3-flash-preview'),
      system: NOTE_EDIT_SYSTEM_PROMPT,
      prompt: userMessage,
    });

    // Parse the LLM response as JSON
    let parsed: { content: Record<string, unknown>; changes_summary: string };
    try {
      // Strip potential markdown code fences
      let text = result.text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      parsed = JSON.parse(text);
    } catch {
      console.error('[note-edit] Failed to parse LLM response:', result.text);
      return errorResponse('AI returned invalid JSON — please try again', 502);
    }

    if (!parsed.content || typeof parsed.content !== 'object') {
      return errorResponse('AI returned invalid note structure — please try again', 502);
    }

    return jsonResponse({
      content: parsed.content,
      changes_summary: parsed.changes_summary ?? 'Edit applied',
    });
  } catch (error) {
    console.error('[note-edit] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
