'use client';

import { motion } from 'motion/react';
import { SidebarProvider, useSidebar } from './sidebar-provider';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { gentle } from '@/lib/animations';
import type { ReactNode } from 'react';

function ShellInner({ children }: { children: ReactNode }) {
  const { expanded } = useSidebar();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <motion.main
        className="pt-[var(--topbar-height)]"
        animate={{ paddingLeft: expanded ? 260 : 72 }}
        transition={gentle}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </motion.main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <ShellInner>{children}</ShellInner>
    </SidebarProvider>
  );
}
