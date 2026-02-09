# UI Test Prompts for Enriched Context Loader

Run all prompts on John Doe's chart page (`/clients/d0000000-0000-0000-0000-000000000001`) in the "Ask Indra" input.

**Prerequisites:** Run `npx tsx scripts/seed-canary-data.ts` first to ensure risk_assessment and low-auth data are seeded.

---

## Test 1: Full Compliance Note (Core Path)

**Tests:** ICD-10 referencing, treatment plan goals, previous session continuity, risk assessment (required), authorization awareness, PHQ-9 trajectory

**Prompt:**
```
Write a progress note for John Doe. 45 min individual therapy session. We worked on cognitive restructuring using CBT. He reported his mood is better and sleep is now 7 hours most nights. PHQ-9 is 9 today.
```

**Look for:**
- F33.1 and F41.1 referenced in Assessment
- Treatment plan goals mentioned by name (PHQ-9 below 10, sleep 7+ hrs)
- References previous session's plan (exposure hierarchy for work anxiety, from canary note)
- Risk assessment present (SI/HI/SH denial)
- Medical necessity statement
- Low authorization warning (only 3 sessions remaining)
- PHQ-9 trajectory noted (9, up from 8 last session)

---

## Test 2: Low Authorization — Medical Necessity Pressure

**Tests:** Whether the AI strengthens medical necessity language when <=4 sessions remain

**Prompt:**
```
Progress note for John Doe. 45 min session. He's still struggling with anxiety at work, especially before team meetings. We practiced exposure techniques. He completed his behavioral activation homework. Mood is stable but not fully improved.
```

**Look for:**
- Explicit documentation of functional limitations that persist
- Stronger medical necessity justification (why continued treatment at current frequency is warranted)
- Mention of remaining authorized sessions or need for reauthorization
- Clinical rationale for continued treatment despite some improvement

---

## Test 3: Provider Scope Constraint (LCSW Can't Prescribe)

**Tests:** Whether the AI respects provider credential scope — Sarah Chen is LCSW, not MD

**Prompt:**
```
Note for John Doe. 45 min session. He says the Lexapro is helping but wants to increase the dose. I think we should go to 20mg. Also discussed coping strategies for his Tuesday work anxiety.
```

**Look for:**
- The AI should NOT document a medication change as a direct action (LCSW can't prescribe)
- Should note the patient's request and recommend coordination with Dr. Rivera (the prescribing MD)
- Should document the therapy interventions (coping strategies) which ARE in LCSW scope
- Assumptions should flag that medication changes require MD involvement

---

## Test 4: Minimal Input — Clarification vs. Assumptions

**Tests:** Whether the AI asks for clarification or makes transparent assumptions when given sparse input

**Prompt:**
```
Quick note for John Doe, 30 min session today. Checked in on his progress.
```

**Look for:**
- Either asks for clarification (what interventions? what did he report?) OR generates a note with a longer `assumptions_made` list being transparent about gaps
- Still includes risk assessment (required)
- Still references treatment plan goals and prior session's plan even with minimal input
- Duration is 30 min (affects billing code — should be 90832 not 90834)

---

## Test 5: Risk Indicators Present

**Tests:** Whether the AI properly flags risk when concerning symptoms are mentioned

**Prompt:**
```
Progress note for John Doe. 50 min session. He reported feeling hopeless about his job situation and mentioned having passive thoughts of not wanting to be here anymore, though he denied any plan or intent. We did safety planning. He has protective factors — his cat Biscuit and his origami hobby.
```

**Look for:**
- Risk assessment flags `suicidal_ideation: true` (passive SI present)
- Safety planning documented in the note
- Protective factors mentioned (validates the AI is using context — Biscuit and origami are from the canary note)
- Medical necessity should be very strong given active SI
- Appropriate clinical language (passive SI without plan/intent)
- Treatment plan tie-in (depression goal)

---

## Verification

After running all 5 prompts, check the terminal console for the `[context]` and `[tool:]` log lines to confirm the enriched pipeline is working end-to-end:

- `auth alert: yes` should appear (low-auth path enabled)
- `risk_assessment: yes` should appear on every `create_progress_note` call
- Note counts and insurance records should be non-zero
