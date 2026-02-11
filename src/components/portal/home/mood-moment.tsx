'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { portalCardItem, portalSmooth } from '@/lib/portal-animations';

type MoodLevel = 'great' | 'good' | 'okay' | 'low' | 'rough';

interface MoodOption {
  level: MoodLevel;
  emoji: string;
  label: string;
  colorVar: string;
}

const MOODS: MoodOption[] = [
  { level: 'great', emoji: '\u{1F60A}', label: 'Great', colorVar: 'var(--color-mood-great)' },
  { level: 'good', emoji: '\u{1F642}', label: 'Good', colorVar: 'var(--color-mood-good)' },
  { level: 'okay', emoji: '\u{1F614}', label: 'Okay', colorVar: 'var(--color-mood-okay)' },
  { level: 'low', emoji: '\u{1F61E}', label: 'Low', colorVar: 'var(--color-mood-low)' },
  { level: 'rough', emoji: '\u{1F622}', label: 'Rough', colorVar: 'var(--color-mood-rough)' },
];

export function MoodMoment() {
  const [todayMood, setTodayMood] = useState<MoodLevel | null>(null);
  const [selected, setSelected] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch('/api/portal/mood?today=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.today) {
          setTodayMood(data.today.mood);
          setDone(true);
        }
      })
      .catch(console.error);
  }, []);

  async function handleSubmit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/portal/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: selected, note: note.trim() || undefined }),
      });
      if (res.ok) {
        setTodayMood(selected);
        setDone(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const moodInfo = MOODS.find((m) => m.level === todayMood);
    return (
      <motion.div variants={portalCardItem} initial="hidden" animate="show">
        <GlassPanel className="p-5 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 32, height: 32, background: 'var(--color-accent)', opacity: 0.15 }}
            >
              <Check size={16} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <p className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Mood logged {moodInfo ? `\u2014 ${moodInfo.emoji} ${moodInfo.label}` : ''}
              </p>
              <p className="text-footnote">Check back tomorrow</p>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    );
  }

  return (
    <motion.div variants={portalCardItem} initial="hidden" animate="show">
      <GlassPanel className="p-5 mb-5">
        <p className="text-headline mb-4" style={{ color: 'var(--color-text-primary)' }}>
          How are you feeling right now?
        </p>

        <div className="flex justify-between mb-4">
          {MOODS.map((mood) => (
            <button
              key={mood.level}
              onClick={() => setSelected(mood.level)}
              className="flex flex-col items-center gap-1.5 transition-transform"
              style={{
                transform: selected === mood.level ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              <motion.div
                className="flex items-center justify-center rounded-full text-xl"
                style={{
                  width: 48,
                  height: 48,
                  background: selected === mood.level ? mood.colorVar : 'var(--color-bg-tertiary)',
                  opacity: selected === mood.level ? 0.2 : 1,
                  border: selected === mood.level ? `2px solid ${mood.colorVar}` : '2px solid transparent',
                }}
                animate={{ scale: selected === mood.level ? 1.05 : 1 }}
                transition={portalSmooth}
              >
                {mood.emoji}
              </motion.div>
              <span
                className="text-caption"
                style={{
                  color: selected === mood.level ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                  fontWeight: selected === mood.level ? 600 : 400,
                }}
              >
                {mood.label}
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={portalSmooth}
          >
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              maxLength={200}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] text-callout mb-3"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 rounded-[var(--radius-md)] text-callout font-medium transition-colors"
              style={{
                background: 'var(--color-accent)',
                color: '#ffffff',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Saving...' : 'Log Mood'}
            </button>
          </motion.div>
        )}
      </GlassPanel>
    </motion.div>
  );
}
