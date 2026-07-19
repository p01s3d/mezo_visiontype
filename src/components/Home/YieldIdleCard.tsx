import { memo, useId } from 'react';
import { HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import {
  DefaultBar,
  PercentageBarChart,
  type BarComponentProps,
} from '@coinbase/cds-web/visualizations/chart';
import { InsightsRollingNumber } from './InsightsRollingNumber';

type YieldIdleCardProps = {
  /** Value-weighted APY on DefiLlama-matched positions only. */
  matchedApy: number | null;
  /** % of book with a yield match (context, not the bar). */
  matchedDeFiPct: number;
  /** Stablecoin sleeve % of book. */
  stablesPct: number;
  /** Non-stable % of book. */
  restPct: number;
};

/** Same stripe recipe as `.healthBento__heatCell--out`: -45°, 3px line / 3px gap @ 0.55 opacity. */
const STRIPE_LINE = 'var(--color-bgLine, #dee1e6)';
const STRIPE_GAP = 'var(--bento-bg, #efe9de)';
const YIELD_REST_COLOR = 'var(--chart-accent, #cc785c)';

const StripedBarComponent = memo(function StripedBarComponent(props: BarComponentProps) {
  const { dataX, x, y } = props;
  const patternId = useId();
  const uniquePatternId = `${patternId}-${String(dataX)}`;

  return (
    <>
      <defs>
        <pattern
          height={6}
          id={uniquePatternId}
          patternTransform="rotate(-45)"
          patternUnits="userSpaceOnUse"
          width={6}
          x={x}
          y={y}
        >
          <rect fill={STRIPE_LINE} height="6" width="3" x="0" y="0" />
          <rect fill={STRIPE_GAP} height="6" width="3" x="3" y="0" />
        </pattern>
      </defs>
      <g opacity={0.55}>
        <DefaultBar {...props} fill={`url(#${uniquePatternId})`} />
      </g>
    </>
  );
});

export function YieldIdleCard({
  matchedApy,
  matchedDeFiPct,
  stablesPct,
  restPct,
}: YieldIdleCardProps) {
  const stables = Math.max(0, stablesPct);
  const rest = Math.max(0, restPct);
  const hasShare = stables + rest > 0;

  return (
    <section className="healthBento__card healthBento__card--yield">
      <VStack gap={2} width="100%">
        <VStack gap={1} width="100%">
          <Text font="label1">Potential yield</Text>
          <VStack gap={0} paddingTop={1} width="100%">
            {matchedApy != null ? (
              <InsightsRollingNumber
                formattedValue={`${matchedApy.toFixed(1)}%`}
                value={matchedApy}
                zeroFormattedValue="0.0%"
              />
            ) : (
              <Text font="display2" tabularNumbers>
                —
              </Text>
            )}
            <Text className="healthBento__yieldCaption" color="fgMuted" font="label2">
              {matchedApy != null
                ? `APY on ${matchedDeFiPct.toFixed(0)}% matched`
                : 'no DefiLlama match'}
            </Text>
          </VStack>
        </VStack>

        {hasShare ? (
          <VStack gap={1} width="100%">
            <PercentageBarChart
              barMinSize={12}
              borderRadius={1000}
              height={16}
              series={[
                {
                  id: 'rest',
                  data: rest,
                  label: 'Rest',
                  color: YIELD_REST_COLOR,
                },
                {
                  id: 'stables',
                  data: stables,
                  label: 'Stables',
                  color: STRIPE_LINE,
                  BarComponent: StripedBarComponent,
                },
              ]}
              stackGap={4}
            />
            <HStack justifyContent="space-between" width="100%">
              <Text color="fgMuted" font="caption">
                Rest {restPct.toFixed(0)}%
              </Text>
              <Text color="fgMuted" font="caption">
                Stables {stablesPct.toFixed(0)}%
              </Text>
            </HStack>
          </VStack>
        ) : (
          <Text color="fgMuted" font="caption">
            No allocation share yet
          </Text>
        )}
      </VStack>
    </section>
  );
}
