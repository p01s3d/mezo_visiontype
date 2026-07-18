import { useEffect, useRef, useState } from 'react';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import type { GroupedPoolPosition, WalletToken } from '../../api/walletTypes';
import {
  useSleeveMonthPerformance,
  type SleevePerformancePeriod,
  type SleeveSnapshotStatus,
} from '../../hooks/useSleeveMonthPerformance';
import { useInViewOnce } from '../../hooks/useInViewOnce';
import type { SleevePerformance } from '../../utils/sleevePerformance';
import { formatSignedPct } from '../../utils/bentoHealthMetrics';
import { InsightsRollingNumber } from './InsightsRollingNumber';

const POS_COLORS = [
  'var(--color-fgWarning, #f5a524)',
  'var(--color-fgPrimary, #0052ff)',
  'var(--color-fgPositive, #098551)',
  'var(--color-fg, #0a0b0d)',
];

const NEG_COLOR = 'var(--color-fgNegative, #cf202f)';

const PERIOD_TABS: Array<{ label: string; period: SleevePerformancePeriod }> = [
  { label: '1D', period: 'day' },
  { label: '30D', period: 'month' },
  { label: '1Y', period: 'year' },
];

const PERIOD_ARIA: Record<SleevePerformancePeriod, string> = {
  day: 'Sleeve 1-day performance',
  month: 'Sleeve 30-day performance',
  year: 'Sleeve 1-year performance',
};

function statusNote(status: SleeveSnapshotStatus, period: SleevePerformancePeriod): string | null {
  if (period === 'day') return null;
  if (status === 'quota') {
    return 'Zerion quota reached — showing cache if available. Try Refresh tomorrow.';
  }
  if (status === 'empty') {
    return 'No period data yet — Refresh when quota resets.';
  }
  return null;
}

type AllocationPerformanceCardProps = {
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  isConnected: boolean;
  refreshEpoch?: number;
};

export function AllocationPerformanceCard({
  walletTokens,
  poolPositions,
  isConnected,
  refreshEpoch = 0,
}: AllocationPerformanceCardProps) {
  const [period, setPeriod] = useState<SleevePerformancePeriod>('day');
  const [ref, inView] = useInViewOnce<HTMLDivElement>();
  const [revealed, setRevealed] = useState(false);
  const hasEnteredRef = useRef(false);
  /** Keep last known % / bar so period fetches don't remount digits at 0. */
  const lastSleeveRef = useRef<Record<string, Pick<SleevePerformance, 'returnPct' | 'barHeight'>>>(
    {},
  );
  const hasHoldings = walletTokens.length > 0 || poolPositions.length > 0;
  const { sleeves, loading, status } = useSleeveMonthPerformance(
    walletTokens,
    poolPositions,
    isConnected && hasHoldings,
    period,
    refreshEpoch,
  );
  const note = statusNote(status, period);

  for (const sleeve of sleeves) {
    if (sleeve.returnPct != null) {
      lastSleeveRef.current[sleeve.id] = {
        returnPct: sleeve.returnPct,
        barHeight: sleeve.barHeight,
      };
    }
  }

  // Enter animation once; period switches morph height / digits instead of replaying from 0.
  useEffect(() => {
    if (!inView || loading) return;
    if (hasEnteredRef.current) {
      setRevealed(true);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hasEnteredRef.current = true;
      setRevealed(true);
      return;
    }
    setRevealed(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        hasEnteredRef.current = true;
        setRevealed(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [inView, loading]);

  return (
    <div ref={ref}>
      <section className="healthBento__card healthBento__card--allocation">
        <HStack alignItems="center" justifyContent="space-between" width="100%">
          <Text font="label1">Allocation Performance</Text>
          <HStack alignItems="center" gap={0.5}>
            {PERIOD_TABS.map((tab) => {
              const active = tab.period === period;
              return (
                <Pressable
                  key={tab.period}
                  accessibilityLabel={`Allocation period ${tab.label}`}
                  background={active ? 'bgPrimaryWash' : 'transparent'}
                  borderRadius={1000}
                  onClick={() => setPeriod(tab.period)}
                  paddingX={1}
                  paddingY={0.5}
                >
                  <Box alignItems="center" display="flex" justifyContent="center">
                    <Text color={active ? 'fgPrimary' : 'fgMuted'} font="label2">
                      {tab.label}
                    </Text>
                  </Box>
                </Pressable>
              );
            })}
          </HStack>
        </HStack>

        <div
          aria-busy={loading}
          aria-label={PERIOD_ARIA[period]}
          className="healthBento__allocBars"
          role="img"
          style={{ opacity: loading ? 0.45 : 1, transition: 'opacity 150ms ease' }}
        >
          {sleeves.map((sleeve, index) => {
            const held = lastSleeveRef.current[sleeve.id];
            const returnPct = sleeve.returnPct ?? held?.returnPct ?? null;
            const extent = sleeve.returnPct != null ? sleeve.barHeight : (held?.barHeight ?? 0);
            const isFlat = returnPct != null && extent === 0;
            const isPos = extent > 0;
            const isNeg = extent < 0;
            const halfPct = Math.round(Math.abs(extent) * 100);
            const fillClass = ['healthBento__allocFill', revealed ? 'is-revealed' : '']
              .filter(Boolean)
              .join(' ');

            return (
              <div key={sleeve.id} className="healthBento__allocCol">
                <VStack alignItems="center" flexGrow={1} gap={1} width="100%">
                  <div className="healthBento__allocTrack" data-midline>
                    <div className="healthBento__allocHalf healthBento__allocHalf--pos">
                      <div
                        className={`${fillClass} healthBento__allocFill--pos`}
                        style={{
                          height: `${isPos ? halfPct : 0}%`,
                          background: POS_COLORS[index % POS_COLORS.length],
                        }}
                      />
                    </div>
                    <div className="healthBento__allocMidline" aria-hidden />
                    <div className="healthBento__allocHalf healthBento__allocHalf--neg">
                      <div
                        className={`${fillClass} healthBento__allocFill--neg`}
                        style={{
                          height: `${isNeg ? halfPct : 0}%`,
                          background: NEG_COLOR,
                        }}
                      />
                    </div>
                    {isFlat || (returnPct == null && !loading) ? (
                      <div
                        aria-hidden
                        className={`healthBento__allocFlat${revealed ? ' is-revealed' : ''}`}
                      />
                    ) : null}
                  </div>
                  {returnPct == null ? (
                    <Text font="label2" tabularNumbers>
                      —
                    </Text>
                  ) : (
                    <InsightsRollingNumber
                      color={
                        returnPct < 0 ? 'fgNegative' : returnPct > 0 ? 'fg' : 'fgMuted'
                      }
                      font="label2"
                      formattedValue={formatSignedPct(returnPct)}
                      startDelayMs={220}
                      value={returnPct}
                      zeroFormattedValue={formatSignedPct(0)}
                    />
                  )}
                  <Text color="fgMuted" font="caption">
                    {sleeve.label}
                  </Text>
                </VStack>
              </div>
            );
          })}
        </div>

        {note ? (
          <Text color="fgMuted" font="caption">
            {note}
          </Text>
        ) : null}
      </section>
    </div>
  );
}
