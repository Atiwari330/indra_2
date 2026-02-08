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
      className="relative flex items-center gap-3 px-3 py-2.5 transition-colors"
      style={{
        borderRadius: 10,
        color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
      }}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute inset-0"
          style={{
            borderRadius: 10,
            background: 'var(--color-nav-active-bg)',
          }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
        />
      )}
      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className="relative" />
      {expanded && (
        <span
          className="text-callout relative"
          style={{ fontWeight: isActive ? 600 : 500 }}
        >
          {label}
        </span>
      )}
    </Link>
  );
}
