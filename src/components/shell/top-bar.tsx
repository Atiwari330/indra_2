'use client';

import { motion } from 'motion/react';
import { Menu, Bell, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSidebar } from './sidebar-provider';
import { Avatar } from '../ui/avatar';
import { gentle } from '@/lib/animations';

function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = ['Home', ...segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1))];
  return crumbs;
}

export function TopBar() {
  const { expanded, toggle } = useSidebar();
  const crumbs = useBreadcrumb();

  return (
    <motion.header
      className="glass-topbar fixed top-0 right-0 z-[200] flex items-center justify-between px-6"
      style={{ height: 56 }}
      animate={{ left: expanded ? 260 : 72 }}
      transition={gentle}
    >
      {/* Left zone */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Menu size={20} strokeWidth={1.8} />
        </button>

        <nav className="flex items-center gap-1 text-callout" style={{ color: 'var(--color-text-tertiary)' }}>
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={14} strokeWidth={1.8} />}
              <span
                style={{
                  color: i === crumbs.length - 1 ? 'var(--color-text-primary)' : undefined,
                  fontWeight: i === crumbs.length - 1 ? 500 : undefined,
                }}
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right zone */}
      <div className="flex items-center gap-3">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={1.8} />
        </button>

        <div
          className="mx-1 h-5"
          style={{ width: 1, background: 'var(--color-border-strong)' }}
        />

        <div className="flex items-center gap-2">
          <Avatar firstName="Sarah" lastName="Chen" size={28} />
          <span className="text-callout" style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
            Sarah Chen
          </span>
        </div>
      </div>
    </motion.header>
  );
}
