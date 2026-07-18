import { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, ReferenceLine } from '@coinbase/cds-web/visualizations/chart';
import { CHART_STROKE_COLOR } from '../../utils/chartData';

type CompactLineChartProps = {
  data: number[];
  /** Optional second series (e.g. BTC benchmark), rendered muted. */
  overlayData?: number[] | null;
  color?: string;
  overlayColor?: string;
  height?: number;
  showArea?: boolean;
  width?: number;
  /** When true, fill parent width via ResizeObserver. */
  fillWidth?: boolean;
  maxPoints?: number;
};

function downsample(data: number[], maxPoints: number): number[] {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

export function CompactLineChart({
  data,
  overlayData = null,
  color = CHART_STROKE_COLOR,
  overlayColor = '#A1A1AA',
  height = 28,
  showArea = true,
  width = 96,
  fillWidth = false,
  maxPoints = 24,
}: CompactLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(width);

  useEffect(() => {
    if (!fillWidth) {
      setMeasuredWidth(width);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const update = () => setMeasuredWidth(Math.max(Math.floor(el.clientWidth), 120));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fillWidth, width]);

  const chartWidth = fillWidth ? measuredWidth : width;
  const seriesData = useMemo(() => downsample(data, maxPoints), [data, maxPoints]);
  const overlaySeries = useMemo(
    () => (overlayData && overlayData.length > 1 ? downsample(overlayData, maxPoints) : null),
    [overlayData, maxPoints],
  );

  const referenceY = seriesData[0] ?? 0;

  const series = useMemo(() => {
    const pathTransitions = {
      enter: { type: 'tween' as const, duration: 0.75, ease: [0.23, 1, 0.32, 1] as const },
      update: { type: 'spring' as const, stiffness: 200, damping: 28, mass: 1 },
    };
    const primary = {
      id: 'series',
      color,
      data: seriesData,
      transitions: pathTransitions,
    };
    if (!overlaySeries) return [primary];
    return [
      {
        id: 'btc',
        color: overlayColor,
        data: overlaySeries,
        transitions: pathTransitions,
      },
      primary,
    ];
  }, [color, overlayColor, overlaySeries, seriesData]);

  const chart = (
    <LineChart
      animate
      enableScrubbing={false}
      height={height}
      inset={0}
      series={series}
      showArea={showArea && !overlaySeries}
      transitions={{
        enter: { type: 'tween', duration: 0.75, ease: [0.23, 1, 0.32, 1] },
        update: { type: 'spring', stiffness: 200, damping: 28, mass: 1 },
      }}
      width={chartWidth}
    >
      <ReferenceLine dataY={referenceY} />
    </LineChart>
  );

  if (!fillWidth) return chart;

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {chart}
    </div>
  );
}
