'use client';

import { motion } from 'motion/react';
import {
  User,
  Mic,
  FileText,
  Target,
  Pill,
  Stethoscope,
  Calendar,
} from 'lucide-react';
import type { EvidenceItem } from '@/lib/types/ai-agent';
import { smooth } from '@/lib/animations';

const CATEGORY_ICONS: Record<EvidenceItem['category'], typeof User> = {
  patient: User,
  transcript: Mic,
  note: FileText,
  treatment_plan: Target,
  medication: Pill,
  diagnosis: Stethoscope,
  encounter: Calendar,
};

interface EvidenceChipsProps {
  items?: EvidenceItem[];
}

export function EvidenceChips({ items }: EvidenceChipsProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {items.map((item, i) => {
        const Icon = CATEGORY_ICONS[item.category] || FileText;
        return (
          <motion.span
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...smooth, delay: i * 0.04 }}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
              color: 'var(--color-accent)',
            }}
          >
            <Icon size={11} strokeWidth={1.8} />
            {item.label}
          </motion.span>
        );
      })}
    </div>
  );
}
