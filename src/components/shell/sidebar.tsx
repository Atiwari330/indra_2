'use client';

import { motion } from 'motion/react';
import { Users, Calendar, Settings, HelpCircle } from 'lucide-react';
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
      className="glass-sidebar fixed left-0 top-0 z-[100] flex h-full flex-col overflow-hidden"
      animate={{ width: expanded ? 260 : 72 }}
      transition={gentle}
    >
      {/* Logo area */}
      <div
        className="flex items-center gap-3 px-6"
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
      <nav className="flex flex-1 flex-col gap-1.5 px-4 pt-4">
        {expanded && (
          <span className="text-overline mb-2 px-3">Navigation</span>
        )}
        {navItems.map((item) => (
          <SidebarNavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom section */}
      <div
        className="flex flex-shrink-0 flex-col gap-1 border-t px-4 pb-6 pt-4"
        style={{ borderColor: 'var(--color-separator)' }}
      >
        <button
          className="flex items-center gap-3 px-3 py-2 transition-colors"
          style={{
            borderRadius: 10,
            color: 'var(--color-text-secondary)',
          }}
        >
          <HelpCircle size={20} strokeWidth={1.8} />
          {expanded && <span className="text-callout">Help & Support</span>}
        </button>

        <button
          className="flex items-center gap-3 px-3 py-2 transition-colors"
          style={{
            borderRadius: 10,
            color: 'var(--color-text-secondary)',
          }}
        >
          <Settings size={20} strokeWidth={1.8} />
          {expanded && <span className="text-callout">Settings</span>}
        </button>

        <div
          className="flex items-center gap-3 px-3 py-2"
          style={{
            borderRadius: 10,
            background: expanded ? 'var(--color-bg-tertiary)' : 'transparent',
          }}
        >
          <Avatar firstName="Sarah" lastName="Chen" size={32} />
          {expanded && (
            <div className="min-w-0 flex-1">
              <p className="text-callout truncate" style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                Sarah Chen
              </p>
              <p className="text-caption truncate">LCSW</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
