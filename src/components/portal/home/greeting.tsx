'use client';

import { motion } from 'motion/react';
import { portalFadeIn } from '@/lib/portal-animations';

interface GreetingProps {
  firstName: string;
  preferredName?: string | null;
}

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', emoji: '' };
  if (hour < 17) return { text: 'Good afternoon', emoji: '' };
  return { text: 'Good evening', emoji: '' };
}

function getGradient(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    // Morning: warm sage + golden
    return 'linear-gradient(135deg, rgba(91,154,139,0.08) 0%, rgba(232,169,70,0.06) 100%)';
  }
  if (hour < 17) {
    // Afternoon: sage + soft blue
    return 'linear-gradient(135deg, rgba(91,154,139,0.06) 0%, rgba(125,184,168,0.08) 100%)';
  }
  // Evening: deeper sage + warm
  return 'linear-gradient(135deg, rgba(74,133,119,0.08) 0%, rgba(212,148,92,0.06) 100%)';
}

export function Greeting({ firstName, preferredName }: GreetingProps) {
  const displayName = preferredName || firstName;
  const { text } = getGreeting();
  const gradient = getGradient();

  return (
    <motion.div
      className="rounded-[var(--radius-xl)] p-6 mb-5"
      style={{ background: gradient }}
      variants={portalFadeIn}
      initial="hidden"
      animate="show"
    >
      <h1
        className="text-title-1"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {text},{' '}
        <span style={{ color: 'var(--color-accent)' }}>{displayName}</span>
      </h1>
      <p
        className="mt-1 text-callout"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        How are you doing today?
      </p>
    </motion.div>
  );
}
