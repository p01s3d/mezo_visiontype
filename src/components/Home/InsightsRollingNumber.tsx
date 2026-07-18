import { RollingNumber } from '@coinbase/cds-web/numbers/RollingNumber';
import type { ThemeVars } from '@coinbase/cds-common/core/theme';
import type { TextDefaultElement, TextProps } from '@coinbase/cds-web/typography/Text';
import { useEffect, useState } from 'react';
import { useInViewOnce } from '../../hooks/useInViewOnce';
import { INSIGHTS_ROLL_DELAY_MS, SLOW_ROLL_TRANSITION } from './slowRollMotion';

type InsightsRollingNumberProps = {
  value: number;
  formattedValue: string;
  zeroFormattedValue?: string;
  font?: TextProps<TextDefaultElement>['font'];
  color?: ThemeVars.Color;
  /** Delay before rolling starts after enter (ms). */
  startDelayMs?: number;
};

/** Rolls from 0 → value when the metric enters the viewport (slowed for insights). */
export function InsightsRollingNumber({
  value,
  formattedValue,
  zeroFormattedValue = '0',
  font = 'display2',
  color,
  startDelayMs = INSIGHTS_ROLL_DELAY_MS,
}: InsightsRollingNumberProps) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setArmed(true);
      return;
    }
    const id = window.setTimeout(() => setArmed(true), startDelayMs);
    return () => window.clearTimeout(id);
  }, [inView, startDelayMs]);

  const shown = armed ? value : 0;
  const label = armed ? formattedValue : zeroFormattedValue;

  return (
    <div ref={ref}>
      <RollingNumber
        color={color}
        digitTransitionVariant="every"
        font={font}
        formattedValue={label}
        transition={SLOW_ROLL_TRANSITION}
        value={shown}
      />
    </div>
  );
}
