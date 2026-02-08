'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { useSidebar } from './sidebar-provider';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function SidebarNavItem({ href, label, icon: Icon }: SidebarNavItemProps) {
  const pathname = usePathname();
  const { expanded } = useSidebar();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className="relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 transition-colors"
      style={{
        color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
      }}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute inset-0 rounded-[var(--radius-sm)]"
          style={{ background: 'var(--color-accent)', opacity: 0.1 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
        />
      )}
      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
      {expanded && (
        <span
          className="text-callout"
          style={{ fontWeight: isActive ? 600 : 400 }}
        >
          {label}
        </span>
      )}
    </Link>
  );
}
