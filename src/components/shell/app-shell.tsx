'use client';

import { motion } from 'motion/react';
import { SidebarProvider, useSidebar } from './sidebar-provider';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { AgentProvider, useAgentContext } from '@/components/ai/agent-provider';
import { CommandBar } from '@/components/ai/command-bar';
import { AgentCanvas } from '@/components/ai/agent-canvas';
import { gentle } from '@/lib/animations';
import type { ReactNode } from 'react';

function ShellInner({ children }: { children: ReactNode }) {
  const { expanded } = useSidebar();
  const { isSlideOverOpen } = useAgentContext();

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Sidebar />
      <TopBar />
      <motion.main
        style={{ paddingTop: 56 }}
        animate={{ paddingLeft: expanded ? 260 : 72 }}
        transition={gentle}
        {...(isSlideOverOpen ? { 'data-canvas-active': '' } : {})}
      >
        <div className="p-8 lg:p-10">{children}</div>
      </motion.main>
      <CommandBar />
      <AgentCanvas />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AgentProvider>
        <ShellInner>{children}</ShellInner>
      </AgentProvider>
    </SidebarProvider>
  );
}
