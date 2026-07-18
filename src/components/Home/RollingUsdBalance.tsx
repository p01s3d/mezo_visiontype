import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { RollingNumber } from '@coinbase/cds-web/numbers/RollingNumber';
import type { TextDefaultElement, TextProps } from '@coinbase/cds-web/typography/Text';
import { Text } from '@coinbase/cds-web/typography';
import { formatUsd } from '../../utils/format';
import { useInViewOnce } from '../../hooks/useInViewOnce';
import { BALANCE_ROLL_DELAY_MS, SLOW_ROLL_TRANSITION } from './slowRollMotion';

type RollingUsdBalanceProps = {
  value: number;
  loading?: boolean;
  font?: TextProps<TextDefaultElement>['font'];
  style?: CSSProperties;
  startDelayMs?: number;
};

export function RollingUsdBalance({
  value,
  loading = false,
  font = 'display2',
  style,
  startDelayMs = BALANCE_ROLL_DELAY_MS,
}: RollingUsdBalanceProps) {
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
      <Text font={font} style={style}>
        …
      </Text>
    );
  }

  const shown = armed ? value : 0;
  const label = armed ? formatUsd(value) : formatUsd(0);

  return (
    <div ref={ref}>
      <RollingNumber
        digitTransitionVariant="every"
        font={font}
        formattedValue={label}
        style={style}
        transition={SLOW_ROLL_TRANSITION}
        value={shown}
      />
    </div>
  );
}
