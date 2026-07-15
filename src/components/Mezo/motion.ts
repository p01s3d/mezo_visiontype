import type { ComponentPropsWithoutRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import { motion, type MotionProps } from 'framer-motion';

// framer-motion v10 types predate React 19, which breaks intrinsic-element prop
// inference (className etc. disappear). Re-typing motion.div restores them.
type MotionDivProps = MotionProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof MotionProps> &
  RefAttributes<HTMLDivElement>;

export const MotionDiv = motion.div as unknown as ForwardRefExoticComponent<MotionDivProps>;
