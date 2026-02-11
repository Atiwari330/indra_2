import { PortalShell } from '@/components/portal/shell/portal-shell';
import type { ReactNode } from 'react';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="portal-theme portal-bg">
      <PortalShell>{children}</PortalShell>
    </div>
  );
}
