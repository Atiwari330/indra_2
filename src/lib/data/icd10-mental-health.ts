export interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

export const ICD10_MENTAL_HEALTH: ICD10Code[] = [
  // Depressive Disorders
  { code: 'F32.0', description: 'Major depressive disorder, single episode, mild', category: 'Depressive Disorders' },
  { code: 'F32.1', description: 'Major depressive disorder, single episode, moderate', category: 'Depressive Disorders' },
  { code: 'F32.2', description: 'Major depressive disorder, single episode, severe without psychotic features', category: 'Depressive Disorders' },
  { code: 'F32.3', description: 'Major depressive disorder, single episode, severe with psychotic features', category: 'Depressive Disorders' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified', category: 'Depressive Disorders' },
  { code: 'F33.0', description: 'Major depressive disorder, recurrent, mild', category: 'Depressive Disorders' },
  { code: 'F33.1', description: 'Major depressive disorder, recurrent, moderate', category: 'Depressive Disorders' },
  { code: 'F33.2', description: 'Major depressive disorder, recurrent, severe without psychotic features', category: 'Depressive Disorders' },
  { code: 'F33.3', description: 'Major depressive disorder, recurrent, severe with psychotic features', category: 'Depressive Disorders' },
  { code: 'F33.9', description: 'Major depressive disorder, recurrent, unspecified', category: 'Depressive Disorders' },
  { code: 'F34.1', description: 'Dysthymic disorder (Persistent depressive disorder)', category: 'Depressive Disorders' },

  // Anxiety Disorders
  { code: 'F40.10', description: 'Social anxiety disorder (social phobia)', category: 'Anxiety Disorders' },
  { code: 'F40.11', description: 'Social anxiety disorder, generalized', category: 'Anxiety Disorders' },
  { code: 'F40.210', description: 'Arachnophobia', category: 'Anxiety Disorders' },
  { code: 'F40.218', description: 'Other animal type phobia', category: 'Anxiety Disorders' },
  { code: 'F40.230', description: 'Fear of blood', category: 'Anxiety Disorders' },
  { code: 'F41.0', description: 'Panic disorder', category: 'Anxiety Disorders' },
  { code: 'F41.1', description: 'Generalized anxiety disorder', category: 'Anxiety Disorders' },
  { code: 'F41.8', description: 'Other specified anxiety disorders', category: 'Anxiety Disorders' },
  { code: 'F41.9', description: 'Anxiety disorder, unspecified', category: 'Anxiety Disorders' },

  // Trauma & Stress-Related Disorders
  { code: 'F43.10', description: 'Post-traumatic stress disorder, unspecified', category: 'Trauma & Stress-Related' },
  { code: 'F43.11', description: 'Post-traumatic stress disorder, acute', category: 'Trauma & Stress-Related' },
  { code: 'F43.12', description: 'Post-traumatic stress disorder, chronic', category: 'Trauma & Stress-Related' },
  { code: 'F43.0', description: 'Acute stress reaction', category: 'Trauma & Stress-Related' },
  { code: 'F43.20', description: 'Adjustment disorder, unspecified', category: 'Adjustment Disorders' },
  { code: 'F43.21', description: 'Adjustment disorder with depressed mood', category: 'Adjustment Disorders' },
  { code: 'F43.22', description: 'Adjustment disorder with anxiety', category: 'Adjustment Disorders' },
  { code: 'F43.23', description: 'Adjustment disorder with mixed anxiety and depressed mood', category: 'Adjustment Disorders' },
  { code: 'F43.24', description: 'Adjustment disorder with disturbance of conduct', category: 'Adjustment Disorders' },
  { code: 'F43.25', description: 'Adjustment disorder with mixed disturbance of emotions and conduct', category: 'Adjustment Disorders' },

  // Bipolar & Related Disorders
  { code: 'F31.0', description: 'Bipolar disorder, current episode hypomanic', category: 'Bipolar Disorders' },
  { code: 'F31.11', description: 'Bipolar disorder, current episode manic, without psychotic features, mild', category: 'Bipolar Disorders' },
  { code: 'F31.12', description: 'Bipolar disorder, current episode manic, without psychotic features, moderate', category: 'Bipolar Disorders' },
  { code: 'F31.13', description: 'Bipolar disorder, current episode manic, without psychotic features, severe', category: 'Bipolar Disorders' },
  { code: 'F31.31', description: 'Bipolar disorder, current episode depressed, mild', category: 'Bipolar Disorders' },
  { code: 'F31.32', description: 'Bipolar disorder, current episode depressed, moderate', category: 'Bipolar Disorders' },
  { code: 'F31.9', description: 'Bipolar disorder, unspecified', category: 'Bipolar Disorders' },
  { code: 'F34.0', description: 'Cyclothymic disorder', category: 'Bipolar Disorders' },

  // ADHD
  { code: 'F90.0', description: 'ADHD, predominantly inattentive type', category: 'ADHD' },
  { code: 'F90.1', description: 'ADHD, predominantly hyperactive type', category: 'ADHD' },
  { code: 'F90.2', description: 'ADHD, combined type', category: 'ADHD' },
  { code: 'F90.9', description: 'ADHD, unspecified type', category: 'ADHD' },

  // OCD & Related
  { code: 'F42.2', description: 'Obsessive-compulsive disorder, mixed', category: 'OCD & Related' },
  { code: 'F42.3', description: 'Hoarding disorder', category: 'OCD & Related' },
  { code: 'F42.4', description: 'Excoriation (skin-picking) disorder', category: 'OCD & Related' },
  { code: 'F42.8', description: 'Other obsessive-compulsive disorder', category: 'OCD & Related' },
  { code: 'F42.9', description: 'Obsessive-compulsive disorder, unspecified', category: 'OCD & Related' },

  // Substance Use Disorders
  { code: 'F10.10', description: 'Alcohol use disorder, mild', category: 'Substance Use' },
  { code: 'F10.20', description: 'Alcohol use disorder, moderate/severe', category: 'Substance Use' },
  { code: 'F12.10', description: 'Cannabis use disorder, mild', category: 'Substance Use' },
  { code: 'F12.20', description: 'Cannabis use disorder, moderate/severe', category: 'Substance Use' },
  { code: 'F11.10', description: 'Opioid use disorder, mild', category: 'Substance Use' },
  { code: 'F11.20', description: 'Opioid use disorder, moderate/severe', category: 'Substance Use' },
  { code: 'F15.10', description: 'Other stimulant use disorder, mild', category: 'Substance Use' },
  { code: 'F15.20', description: 'Other stimulant use disorder, moderate/severe', category: 'Substance Use' },

  // Sleep Disorders
  { code: 'G47.00', description: 'Insomnia, unspecified', category: 'Sleep Disorders' },
  { code: 'G47.01', description: 'Insomnia due to medical condition', category: 'Sleep Disorders' },
  { code: 'G47.09', description: 'Other insomnia', category: 'Sleep Disorders' },

  // Personality Disorders
  { code: 'F60.3', description: 'Borderline personality disorder', category: 'Personality Disorders' },
  { code: 'F60.4', description: 'Histrionic personality disorder', category: 'Personality Disorders' },
  { code: 'F60.5', description: 'Obsessive-compulsive personality disorder', category: 'Personality Disorders' },
  { code: 'F60.6', description: 'Avoidant personality disorder', category: 'Personality Disorders' },
  { code: 'F60.7', description: 'Dependent personality disorder', category: 'Personality Disorders' },
  { code: 'F60.81', description: 'Narcissistic personality disorder', category: 'Personality Disorders' },
  { code: 'F60.2', description: 'Antisocial personality disorder', category: 'Personality Disorders' },
  { code: 'F60.9', description: 'Personality disorder, unspecified', category: 'Personality Disorders' },

  // Eating Disorders
  { code: 'F50.00', description: 'Anorexia nervosa, unspecified', category: 'Eating Disorders' },
  { code: 'F50.01', description: 'Anorexia nervosa, restricting type', category: 'Eating Disorders' },
  { code: 'F50.02', description: 'Anorexia nervosa, binge eating/purging type', category: 'Eating Disorders' },
  { code: 'F50.2', description: 'Bulimia nervosa', category: 'Eating Disorders' },
  { code: 'F50.81', description: 'Binge eating disorder', category: 'Eating Disorders' },

  // Other
  { code: 'F45.1', description: 'Undifferentiated somatoform disorder', category: 'Other' },
  { code: 'F48.1', description: 'Depersonalization-derealization disorder', category: 'Other' },
  { code: 'F44.81', description: 'Dissociative identity disorder', category: 'Other' },
  { code: 'F94.1', description: 'Reactive attachment disorder of childhood', category: 'Other' },
  { code: 'F94.2', description: 'Disinhibited social engagement disorder', category: 'Other' },
];
