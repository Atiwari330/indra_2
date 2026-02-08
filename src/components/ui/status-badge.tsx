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
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-caption"
      style={{
        background: `color-mix(in srgb, ${config.cssVar} 12%, transparent)`,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: config.cssVar }}
      />
      <span style={{ color: 'var(--color-text-secondary)' }}>{config.label}</span>
    </span>
  );
}
