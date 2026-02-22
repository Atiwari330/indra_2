'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { portalCardItem } from '@/lib/portal-animations';

interface IntakePacketItem {
  id: string;
  item_key: string;
  item_label: string;
  item_type: string;
  status: string;
  sort_order: number;
}

interface IntakePacket {
  id: string;
  status: string;
  items: IntakePacketItem[];
}

interface PendingIntakeCardProps {
  onBegin: (packet: IntakePacket) => void;
}

export function PendingIntakeCard({ onBegin }: PendingIntakeCardProps) {
  const [packet, setPacket] = useState<IntakePacket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/intake')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.id) setPacket(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !packet) return null;

  const completedCount = packet.items.filter((i) => i.status === 'completed').length;
  const totalCount = packet.items.length;
  const isPartiallyComplete = completedCount > 0 && completedCount < totalCount;

  return (
    <motion.div variants={portalCardItem} initial="hidden" animate="show">
      <GlassPanel
        className="p-5 mb-5 relative overflow-hidden"
        style={{
          boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-accent) 20%, transparent), 0 4px 24px color-mix(in srgb, var(--color-accent) 8%, transparent)',
        }}
      >
        {/* Subtle gradient border glow */}
        <div
          className="absolute inset-0 rounded-[var(--radius-lg)] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 6%, transparent), color-mix(in srgb, #D4A574 6%, transparent))',
          }}
        />

        <div className="relative flex items-start gap-4">
          <div
            className="flex items-center justify-center rounded-[var(--radius-md)] flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
              color: 'var(--color-accent)',
            }}
          >
            <FileText size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-headline" style={{ color: 'var(--color-text-primary)' }}>
              {isPartiallyComplete
                ? 'Continue your intake paperwork'
                : 'Welcome! Your therapist has sent you intake paperwork.'}
            </p>
            <p className="text-callout mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {isPartiallyComplete
                ? `${completedCount} of ${totalCount} completed`
                : 'Please complete before your first session'}
            </p>
            <button
              onClick={() => onBegin(packet)}
              className="mt-3 px-5 py-2 rounded-full text-callout font-medium transition-opacity hover:opacity-90"
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
              }}
            >
              {isPartiallyComplete ? 'Continue \u2192' : 'Get Started'}
            </button>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
