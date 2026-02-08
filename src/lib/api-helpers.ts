import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Seed data IDs for dev mode
const DEV_ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const DEV_USER_ID = 'b0000000-0000-0000-0000-000000000001';
const DEV_PROVIDER_ID = 'c0000000-0000-0000-0000-000000000001';

export interface AuthContext {
  orgId: string;
  userId: string;
  providerId: string;
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext> {
  // In dev mode with SKIP_AUTH, use seed data identities
  if (process.env.SKIP_AUTH === 'true') {
    return {
      orgId: DEV_ORG_ID,
      userId: DEV_USER_ID,
      providerId: DEV_PROVIDER_ID,
    };
  }

  // TODO: Extract from Supabase JWT in production
  throw new Error('Auth not implemented yet — set SKIP_AUTH=true');
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
