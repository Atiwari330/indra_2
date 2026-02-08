import { PageHeader } from '@/components/ui/page-header';
import { Calendar } from 'lucide-react';

export default function SchedulePage() {
  return (
    <>
      <PageHeader title="Schedule" subtitle="Coming soon" />
      <div className="flex flex-col items-center justify-center py-20">
        <Calendar
          size={48}
          strokeWidth={1.2}
          style={{ color: 'var(--color-text-tertiary)' }}
        />
        <p className="mt-4 text-footnote">
          Scheduling features are under development.
        </p>
      </div>
    </>
  );
}
