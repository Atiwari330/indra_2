'use client';

import { motion } from 'motion/react';
import { Menu } from 'lucide-react';
import { useSidebar } from './sidebar-provider';
import { gentle } from '@/lib/animations';

export function TopBar() {
  const { expanded, toggle } = useSidebar();

  return (
    <motion.header
      className="glass-topbar fixed top-0 right-0 z-[200] flex items-center gap-4 px-6"
      style={{ height: 'var(--topbar-height)' }}
      animate={{ left: expanded ? 260 : 72 }}
      transition={gentle}
    >
      <button
        onClick={toggle}
        className="flex items-center justify-center rounded-[var(--radius-sm)] p-1.5 transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <Menu size={20} strokeWidth={1.8} />
      </button>
    </motion.header>
  );
}
