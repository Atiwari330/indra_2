import { createAdminClient } from '@/lib/supabase/admin';
import { BillingDashboard } from './billing-dashboard';

export const dynamic = 'force-dynamic';

const DEV_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

export default async function BillingPage() {
  const supabase = createAdminClient();

  const { data: patients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, dob, gender, status')
    .eq('org_id', DEV_ORG_ID)
    .eq('status', 'active')
    .order('last_name', { ascending: true });

  return <BillingDashboard patients={patients ?? []} />;
}
