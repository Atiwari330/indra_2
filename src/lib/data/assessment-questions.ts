/**
 * Static question banks for standardized clinical assessments.
 * No API needed — these are well-established, public-domain instruments.
 */

export interface AnswerOption {
  label: string;
  value: number;
}

export interface ScoringBand {
  min: number;
  max: number;
  severity: string;
  label: string;
}

export interface QuestionBank {
  measureType: 'PHQ-9' | 'GAD-7';
  preamble: string;
  questions: string[];
  answerOptions: AnswerOption[];
  scoringBands: ScoringBand[];
  sensitiveQuestionIndex: number | null;
}

export const ANSWER_OPTIONS: AnswerOption[] = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];

export const PHQ9: QuestionBank = {
  measureType: 'PHQ-9',
  preamble: 'Over the last 2 weeks, how often have you been bothered by...',
  questions: [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    'Trouble concentrating on things, such as reading the newspaper or watching television',
    'Moving or speaking so slowly that other people could have noticed — or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
    'Thoughts that you would be better off dead, or of hurting yourself in some way',
  ],
  answerOptions: ANSWER_OPTIONS,
  scoringBands: [
    { min: 0, max: 4, severity: 'minimal', label: 'Minimal' },
    { min: 5, max: 9, severity: 'mild', label: 'Mild' },
    { min: 10, max: 14, severity: 'moderate', label: 'Moderate' },
    { min: 15, max: 19, severity: 'moderately_severe', label: 'Moderately Severe' },
    { min: 20, max: 27, severity: 'severe', label: 'Severe' },
  ],
  sensitiveQuestionIndex: 8, // Q9 (0-indexed)
};

export const GAD7: QuestionBank = {
  measureType: 'GAD-7',
  preamble: 'Over the last 2 weeks, how often have you been bothered by...',
  questions: [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid, as if something awful might happen',
  ],
  answerOptions: ANSWER_OPTIONS,
  scoringBands: [
    { min: 0, max: 4, severity: 'minimal', label: 'Minimal' },
    { min: 5, max: 9, severity: 'mild', label: 'Mild' },
    { min: 10, max: 14, severity: 'moderate', label: 'Moderate' },
    { min: 15, max: 21, severity: 'severe', label: 'Severe' },
  ],
  sensitiveQuestionIndex: null,
};

export const QUESTION_BANKS: Record<string, QuestionBank> = {
  'PHQ-9': PHQ9,
  'GAD-7': GAD7,
};

/**
 * Derive severity label from a total score for a given measure type.
 */
export function deriveSeverity(measureType: string, totalScore: number): string {
  const bank = QUESTION_BANKS[measureType];
  if (!bank) return 'Unknown';
  const band = bank.scoringBands.find((b) => totalScore >= b.min && totalScore <= b.max);
  return band?.label ?? 'Unknown';
}

/**
 * Get estimated time for an assessment in minutes.
 */
export function getEstimatedMinutes(measureType: string): number {
  const bank = QUESTION_BANKS[measureType];
  if (!bank) return 2;
  return Math.max(1, Math.ceil(bank.questions.length / 4));
}
