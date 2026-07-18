import type { Transition } from 'framer-motion';

/** Shared slowed digit roll for net worth / insights metrics. */
export const SLOW_ROLL_TRANSITION: {
  y: Transition;
  opacity: Transition;
} = {
  y: { type: 'spring', stiffness: 110, damping: 24, mass: 0.85 },
  opacity: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
};

export const BALANCE_ROLL_DELAY_MS = 80;
export const PERCENT_ROLL_DELAY_MS = 260;
export const INSIGHTS_ROLL_DELAY_MS = 180;
