import { useEffect, useMemo, useRef, useState } from 'react';
import { useSparklinePath } from '@coinbase/cds-common/visualizations/useSparklinePath';
import { Box, Divider, VStack } from '@coinbase/cds-web/layout';
import { Sparkline, SparklineInteractive } from '@coinbase/cds-web/visualizations';
import {
  CHART_STROKE_COLOR,
  generatePortfolioHistory,
  generateSparklineValues,
} from '../../../utils/chartData';

type ChartPeriod = '1M' | '3M' | '1Y';

const PERIODS = [
  { label: '1M', value: '1M' as const },
  { label: '3M', value: '3M' as const },
  { label: '1Y', value: '1Y' as const },
];

const SPARKLINE_HEIGHT = 32;

function FullWidthSparkline({ values }: { values: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(280);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => setWidth(Math.max(element.clientWidth, 120));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const path = useSparklinePath({
    data: values,
    height: SPARKLINE_HEIGHT,
    width,
  });

  return (
    <Box ref={ref} width="100%">
      <Sparkline
        color={CHART_STROKE_COLOR}
        fillType="gradientDotted"
        height={SPARKLINE_HEIGHT}
        path={path}
        width={width}
      />
    </Box>
  );
}

export function ChartVariantsPreview() {
  const total = 12847.52;
  const compactValues = useMemo(
    () => generateSparklineValues('portfolio-3m', 90, total, 'up'),
    [],
  );

  const interactiveData = useMemo(
    () => ({
      '1M': generatePortfolioHistory(total, '1m', 30),
      '3M': generatePortfolioHistory(total, '3m', 90),
      '1Y': generatePortfolioHistory(total, '1y', 120),
    }),
    [],
  );

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <VStack gap={2} minWidth={320} width="100%">
      <FullWidthSparkline values={compactValues} />
      <Divider />
      <Box width="100%">
        <SparklineInteractive<ChartPeriod>
          compact
          data={interactiveData}
          defaultPeriod="3M"
          formatDate={formatDate}
          periods={PERIODS}
          strokeColor={CHART_STROKE_COLOR}
        />
      </Box>
    </VStack>
  );
}
