// --- Spring Presets ---

/** Hover, press, micro-interactions */
export const snappy = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
};

/** Navigation, layout shifts, page transitions */
export const smooth = {
  type: 'spring' as const,
  duration: 0.5,
  bounce: 0.15,
};

/** Sidebar expand/collapse, large area changes */
export const gentle = {
  type: 'spring' as const,
  duration: 0.6,
  bounce: 0.1,
};

/** Success indicators (use sparingly) */
export const bouncy = {
  type: 'spring' as const,
  duration: 0.6,
  bounce: 0.3,
};

// --- Stagger ---

/** Delay between cards in grid (ms) */
export const STAGGER_MS = 50;

/** Motion stagger children config */
export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: STAGGER_MS / 1000,
    },
  },
};

/** Card entrance variant */
export const cardItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: smooth,
  },
};

/** Fade-in variant for general use */
export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: smooth },
};
