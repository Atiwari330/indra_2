// Browser-local store for the Stedi claims demo. localStorage-backed
// so claims submitted through the inline flow show up in the /billing
// dashboard and survive page reloads during a demo session.
//
// This is demo scaffolding — not a real data layer. Everything is
// keyed by a random id and namespaced under "indra:demo:claims".

import type { ClaimAcknowledgment, ProfessionalClaim } from '@/lib/types/stedi';

export interface StoredDemoClaim {
  id: string;
  patientId: string;
  patientName: string;
  payerName: string;
  cptCode: string;
  cptDescription: string;
  icd10Codes: string[];
  totalCharge: number;
  dateOfService: string; // YYYY-MM-DD
  placeOfService: string;
  status: 'submitted' | 'accepted' | 'rejected' | 'pending';
  submittedAt: string; // ISO
  claimControlNumber: string;
  correlationId: string;
  cms1500Html: string;
  rawClaim: ProfessionalClaim;
  acknowledgment?: ClaimAcknowledgment;
  acknowledgedAt?: string;
}

const STORAGE_KEY = 'indra:demo:claims';
const EVENT_NAME = 'indra:demo-claims-changed';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readAll(): StoredDemoClaim[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredDemoClaim[];
  } catch {
    return [];
  }
}

function writeAll(claims: StoredDemoClaim[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function listDemoClaims(): StoredDemoClaim[] {
  return readAll().sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export function addDemoClaim(claim: StoredDemoClaim): void {
  const all = readAll();
  writeAll([claim, ...all.filter((c) => c.id !== claim.id)]);
}

export function updateDemoClaim(
  id: string,
  patch: Partial<StoredDemoClaim>,
): void {
  const all = readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], ...patch };
  writeAll(all);
}

export function clearDemoClaims(): void {
  writeAll([]);
}

/** Subscribe to localStorage changes from this tab and others. */
export function subscribeDemoClaims(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  const handleLocal = () => callback();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(EVENT_NAME, handleLocal);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(EVENT_NAME, handleLocal);
  };
}
