import { createAdminClient } from '@/lib/supabase/admin';
import { ClientGrid } from './client-grid';

export const dynamic = 'force-dynamic';

const DEV_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

export default async function ClientsPage() {
  const supabase = createAdminClient();

  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, first_name, last_name, dob, status')
    .eq('org_id', DEV_ORG_ID)
    .order('last_name', { ascending: true });

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-footnote" style={{ color: 'var(--color-error)' }}>
          Failed to load clients: {error.message}
        </p>
      </div>
    );
  }

  return <ClientGrid patients={patients ?? []} />;
}
