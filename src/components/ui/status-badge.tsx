type Status = 'active' | 'inactive' | 'discharged';

const statusConfig: Record<Status, { label: string; cssVar: string }> = {
  active: { label: 'Active', cssVar: 'var(--color-status-active)' },
  inactive: { label: 'Inactive', cssVar: 'var(--color-status-inactive)' },
  discharged: { label: 'Discharged', cssVar: 'var(--color-status-discharged)' },
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-caption">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: config.cssVar }}
      />
      <span style={{ color: 'var(--color-text-secondary)' }}>{config.label}</span>
    </span>
  );
}
