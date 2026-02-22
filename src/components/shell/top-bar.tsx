'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Bell, ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from './sidebar-provider';
import { Avatar } from '../ui/avatar';
import { gentle, bouncy } from '@/lib/animations';

const isUUID = (s: string) => /^[0-9a-f]{8}-/i.test(s);

interface NotificationItem {
  id: string;
  patient_id: string;
  measure_type?: string;
  completed_at: string | null;
  patients: { first_name: string; last_name: string } | null;
  type: 'assessment' | 'intake';
}

function useNotifications() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const fetch_ = useCallback(() => {
    Promise.all([
      fetch('/api/notifications/assessments').then((r) => r.json()).catch(() => ({ count: 0, items: [] })),
      fetch('/api/notifications/intake').then((r) => r.json()).catch(() => ({ count: 0, items: [] })),
    ]).then(([assessments, intake]) => {
      const assessmentItems = (assessments.items ?? []).map((i: NotificationItem) => ({ ...i, type: 'assessment' as const }));
      const intakeItems = (intake.items ?? []).map((i: NotificationItem) => ({ ...i, type: 'intake' as const }));
      setCount((assessments.count ?? 0) + (intake.count ?? 0));
      setItems([...intakeItems, ...assessmentItems]);
    });
  }, []);

  useEffect(() => {
    fetch_();
    const interval = setInterval(fetch_, 5000);
    return () => clearInterval(interval);
  }, [fetch_]);

  const markViewed = useCallback(async (item: NotificationItem) => {
    const endpoint = item.type === 'intake'
      ? `/api/notifications/intake/${item.id}/viewed`
      : `/api/notifications/assessments/${item.id}/viewed`;
    await fetch(endpoint, { method: 'POST' });
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setCount((prev) => Math.max(0, prev - 1));
  }, []);

  return { count, items, markViewed };
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = ['Home', ...segments.filter((s) => !isUUID(s)).map((s) => s.charAt(0).toUpperCase() + s.slice(1))];
  return crumbs;
}

export function TopBar() {
  const { expanded, toggle } = useSidebar();
  const crumbs = useBreadcrumb();
  const router = useRouter();
  const { count, items, markViewed } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleNotificationClick = useCallback(async (item: NotificationItem) => {
    await markViewed(item);
    setDropdownOpen(false);
    router.push(`/clients/${item.patient_id}`);
  }, [markViewed, router]);

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
        <div className="relative" ref={dropdownRef}>
          <button
            className="relative flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label="Notifications"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <Bell size={18} strokeWidth={1.8} />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white font-semibold"
                  style={{
                    width: 18,
                    height: 18,
                    fontSize: 10,
                    background: 'var(--color-error, #FF3B30)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={bouncy}
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Notification dropdown */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                className="absolute right-0 top-full mt-2 rounded-[var(--radius-lg)] overflow-hidden"
                style={{
                  width: 320,
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(20px)',
                }}
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <p className="text-callout font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Notifications
                  </p>
                </div>
                {items.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                      No new notifications
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0"
                          style={{
                            background: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
                          }}
                        >
                          <span style={{ color: 'var(--color-success)', fontSize: 14 }}>&#10003;</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                            {item.patients?.first_name} {item.patients?.last_name} completed {item.type === 'intake' ? 'intake paperwork' : 'a check-in'}
                          </p>
                          <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                            {relativeTime(item.completed_at)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
