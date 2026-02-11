'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Heart, Calendar, MessageCircle, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

interface Tab {
  href: string;
  label: string;
  icon: ReactNode;
}

const tabs: Tab[] = [
  { href: '/portal', label: 'Home', icon: <Home size={20} /> },
  { href: '/portal/wellness', label: 'Wellness', icon: <Heart size={20} /> },
  { href: '/portal/appointments', label: 'Appts', icon: <Calendar size={20} /> },
  { href: '/portal/messages', label: 'Messages', icon: <MessageCircle size={20} /> },
  { href: '/portal/resources', label: 'Resources', icon: <Sparkles size={20} /> },
];

export function PortalTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="glass fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
      style={{ height: 64, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors"
            style={{
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              background: isActive ? 'var(--color-nav-active-bg)' : 'transparent',
            }}
          >
            {tab.icon}
            <span style={{ fontSize: '0.625rem', fontWeight: isActive ? 600 : 400 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
