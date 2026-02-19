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

// --- Slide-Over + Modal Variants ---

/** Slide-over panel (right side) */
export const slideOver = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: smooth,
  },
  exit: {
    x: '100%',
    transition: { type: 'spring' as const, duration: 0.4, bounce: 0.05 },
  },
};

/** Backdrop fade for modals / panels */
export const backdropFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Centered modal pop-in */
export const modalPop = {
  hidden: { opacity: 0, scale: 0.96, y: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -10,
    transition: { duration: 0.15 },
  },
};

/** Checkmark success animation */
export const checkmarkPop = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: bouncy,
  },
};

/** Phase content transition */
export const phaseTransition = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: smooth },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// --- Canvas Variants ---

/** Canvas container — subtle rise + scale (Apple sheet style) */
export const canvasReveal = {
  hidden: { opacity: 0, scale: 0.985, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, duration: 0.5, bounce: 0.1 },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    y: 12,
    transition: { duration: 0.18 },
  },
};

/** Canvas backdrop — light frosted overlay */
export const canvasBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

/** Processing phase centered content rise */
export const processingReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...smooth, delay: 0.1 },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};
