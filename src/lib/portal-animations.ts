// --- Portal Spring Presets (gentler than provider) ---

/** Large area changes — portal uses slower, calmer motion */
export const portalGentle = {
  type: 'spring' as const,
  duration: 0.8,
  bounce: 0.05,
};

/** Navigation, layout shifts — softer than provider */
export const portalSmooth = {
  type: 'spring' as const,
  duration: 0.7,
  bounce: 0.08,
};

/** Delay between items in staggered lists (ms) */
export const PORTAL_STAGGER_MS = 80;

/** Motion stagger children config for portal */
export const portalStaggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: PORTAL_STAGGER_MS / 1000,
    },
  },
};

/** Card entrance variant for portal */
export const portalCardItem = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: portalSmooth,
  },
};

/** Fade-in variant for portal */
export const portalFadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: portalSmooth },
};

// --- Breathing Animation Presets ---

/** Breathing in phase (4 seconds) */
export const BREATHE_IN_MS = 4000;

/** Hold phase (7 seconds) */
export const BREATHE_HOLD_MS = 7000;

/** Breathing out phase (8 seconds) */
export const BREATHE_OUT_MS = 8000;

/** Full breathing cycle duration */
export const BREATHE_CYCLE_MS = BREATHE_IN_MS + BREATHE_HOLD_MS + BREATHE_OUT_MS;

/** Breathing circle scale values for each phase */
export const breatheKeyframes = {
  in: { scale: 1.4, transition: { duration: BREATHE_IN_MS / 1000, ease: 'easeInOut' } },
  hold: { scale: 1.4, transition: { duration: BREATHE_HOLD_MS / 1000 } },
  out: { scale: 1, transition: { duration: BREATHE_OUT_MS / 1000, ease: 'easeInOut' } },
};

/** Overlay entrance/exit */
export const breatheOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

// --- Assessment Flow Animations ---

/** Assessment question slide forward (exit left, enter from right) */
export const assessmentSlideForward = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.25, ease: 'easeInOut' } },
};

/** Assessment question slide backward (exit right, enter from left) */
export const assessmentSlideBackward = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
  exit: { opacity: 0, x: 60, transition: { duration: 0.25, ease: 'easeInOut' } },
};

/** Portal checkmark bouncy spring for completion */
export const portalCheckmark = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, duration: 0.6, bounce: 0.3 },
  },
};

/**
 * Check if user prefers reduced motion.
 * Call in useEffect or event handlers — not during render.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
