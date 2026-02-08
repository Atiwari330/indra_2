'use client';

import { motion } from 'motion/react';
import { Users, Calendar, Settings } from 'lucide-react';
import { useSidebar } from './sidebar-provider';
import { SidebarNavItem } from './sidebar-nav-item';
import { Avatar } from '../ui/avatar';
import { gentle } from '@/lib/animations';

const navItems = [
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
];

export function Sidebar() {
  const { expanded } = useSidebar();

  return (
    <motion.aside
      className="glass-sidebar fixed left-0 top-0 z-[100] flex h-full flex-col"
      animate={{ width: expanded ? 260 : 72 }}
      transition={gentle}
    >
      {/* Logo area */}
      <div
        className="flex items-center gap-3 px-5"
        style={{ height: 'var(--topbar-height)' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]"
          style={{ background: 'var(--color-accent)' }}
        >
          <span className="text-sm font-bold text-white">I</span>
        </div>
        {expanded && (
          <span className="text-headline" style={{ color: 'var(--color-text-primary)' }}>
            Indra
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-4">
        {navItems.map((item) => (
          <SidebarNavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom section */}
      <div
        className="flex flex-col gap-2 border-t px-3 pb-4 pt-3"
        style={{ borderColor: 'var(--color-separator)' }}
      >
        <button
          className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Settings size={20} strokeWidth={1.8} />
          {expanded && <span className="text-callout">Settings</span>}
        </button>

        <div className="flex items-center gap-3 px-3 py-1">
          <Avatar firstName="Sarah" lastName="Chen" size={28} />
          {expanded && (
            <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
              Sarah Chen
            </span>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
