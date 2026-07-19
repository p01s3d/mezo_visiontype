import { useEffect, useState } from 'react';
import { RollingNumber } from '@coinbase/cds-web/numbers/RollingNumber';
import type { TextDefaultElement, TextProps } from '@coinbase/cds-web/typography/Text';
import { Text } from '@coinbase/cds-web/typography';
import { formatPercentChange } from '../../utils/format';
import { useInViewOnce } from '../../hooks/useInViewOnce';
import { PERCENT_ROLL_DELAY_MS, SLOW_ROLL_TRANSITION } from './slowRollMotion';

type RollingPercentChangeProps = {
  value: number;
  font?: TextProps<TextDefaultElement>['font'];
  loading?: boolean;
  startDelayMs?: number;
};

export function RollingPercentChange({
  value,
  font = 'label2',
  loading = false,
  startDelayMs = PERCENT_ROLL_DELAY_MS,
}: RollingPercentChangeProps) {
  const color = value < 0 ? 'fgNegative' : value > 0 ? 'fgPositive' : 'fgMuted';
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

  if (loading) {
    return (
      <Text color={color} font={font}>
        …
      </Text>
    );
  }

  const shown = armed ? value : 0;
  const label = armed ? formatPercentChange(value) : formatPercentChange(0);

  return (
    <span ref={ref} className="balanceOverview__changeValue">
      <RollingNumber
        color={color}
        digitTransitionVariant="every"
        font={font}
        formattedValue={label}
        transition={SLOW_ROLL_TRANSITION}
        value={shown}
      />
    </span>
  );
}
