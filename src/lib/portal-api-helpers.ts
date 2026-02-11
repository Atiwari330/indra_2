import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Seed data IDs for dev mode — patient perspective
const DEV_ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const DEV_PATIENT_ID = 'd0000000-0000-0000-0000-000000000001'; // John Doe

export interface PortalAuthContext {
  orgId: string;
  patientId: string;
}

/**
 * Get authentication context for portal API routes.
 * In dev mode (SKIP_AUTH=true), uses seed patient identity.
 * DEV_PATIENT_ID env var overrides which patient to impersonate.
 */
export async function getPortalAuthContext(req: NextRequest): Promise<PortalAuthContext> {
  if (process.env.SKIP_AUTH === 'true') {
    return {
      orgId: DEV_ORG_ID,
      patientId: process.env.DEV_PATIENT_ID || DEV_PATIENT_ID,
    };
  }

  // TODO: Extract patient identity from Supabase JWT via get_portal_patient_id()
  throw new Error('Portal auth not implemented yet — set SKIP_AUTH=true');
}

export function getAdminClient() {
  return createAdminClient();
}

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
