import { describe, it, expect } from 'vitest';
import { suggestCptCode } from '@/services/billing.service';

describe('suggestCptCode', () => {
  it('suggests 90832 for short individual therapy (<38 min)', () => {
    const result = suggestCptCode('individual_therapy', 30);
    expect(result.code).toBe('90832');
  });

  it('suggests 90834 for medium individual therapy (38-52 min)', () => {
    const result = suggestCptCode('individual_therapy', 45);
    expect(result.code).toBe('90834');
  });

  it('suggests 90837 for long individual therapy (53+ min)', () => {
    const result = suggestCptCode('individual_therapy', 60);
    expect(result.code).toBe('90837');
  });

  it('suggests 90791 for intake', () => {
    const result = suggestCptCode('intake');
    expect(result.code).toBe('90791');
  });

  it('suggests 90853 for group therapy', () => {
    const result = suggestCptCode('group_therapy');
    expect(result.code).toBe('90853');
  });

  it('suggests 90847 for family therapy', () => {
    const result = suggestCptCode('family_therapy');
    expect(result.code).toBe('90847');
  });

  it('suggests 90839 for crisis', () => {
    const result = suggestCptCode('crisis');
    expect(result.code).toBe('90839');
  });

  it('suggests 99214 for medication management', () => {
    const result = suggestCptCode('medication_management');
    expect(result.code).toBe('99214');
  });

  it('defaults to 90837 for unknown type without duration', () => {
    const result = suggestCptCode('unknown_type');
    expect(result.code).toBe('90837');
  });
});
