'use client';

import { motion } from 'motion/react';
import { Wind, FileText, MessageCircle, BookOpen } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { portalStaggerContainer, portalCardItem } from '@/lib/portal-animations';
import type { ReactNode } from 'react';

interface QuickAction {
  label: string;
  icon: ReactNode;
  href: string;
  description: string;
}

const actions: QuickAction[] = [
  {
    label: 'Breathing',
    icon: <Wind size={22} />,
    href: '/resources',
    description: 'Take a moment',
  },
  {
    label: 'Session Prep',
    icon: <FileText size={22} />,
    href: '/appointments',
    description: 'Prepare for next visit',
  },
  {
    label: 'Messages',
    icon: <MessageCircle size={22} />,
    href: '/messages',
    description: 'Contact your team',
  },
  {
    label: 'Resources',
    icon: <BookOpen size={22} />,
    href: '/resources',
    description: 'Learn and grow',
  },
];

export function QuickActions() {
  return (
    <div>
      <p className="text-overline mb-3">Quick Actions</p>
      <motion.div
        className="grid grid-cols-2 gap-3"
        variants={portalStaggerContainer}
        initial="hidden"
        animate="show"
      >
        {actions.map((action) => (
          <motion.div key={action.label} variants={portalCardItem}>
            <GlassPanel
              className="p-4 cursor-pointer transition-colors hover:opacity-90"
              variant="subtle"
            >
              <div
                className="flex items-center justify-center rounded-[var(--radius-md)] mb-3"
                style={{
                  width: 40,
                  height: 40,
                  background: 'var(--color-nav-active-bg)',
                  color: 'var(--color-accent)',
                }}
              >
                {action.icon}
              </div>
              <p className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {action.label}
              </p>
              <p className="text-caption mt-0.5">{action.description}</p>
            </GlassPanel>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
