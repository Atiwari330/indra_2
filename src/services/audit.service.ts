import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

type Client = SupabaseClient<Database>;

export async function getAuditLog(
  client: Client,
  orgId: string,
  filters?: {
    table_name?: string;
    record_id?: string;
    patient_id?: string;
    action?: string;
    limit?: number;
  }
) {
  let query = client
    .from('audit_log')
    .select('*')
    .eq('org_id', orgId)
    .order('event_time', { ascending: false });

  if (filters?.table_name) query = query.eq('table_name', filters.table_name);
  if (filters?.record_id) query = query.eq('record_id', filters.record_id);
  if (filters?.patient_id) query = query.eq('patient_id', filters.patient_id);
  if (filters?.action) query = query.eq('action', filters.action);

  const { data, error } = await query.limit(filters?.limit ?? 50);
  if (error) throw new Error(`Failed to get audit log: ${error.message}`);
  return data;
}
