import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Scrubber } from '@coinbase/cds-web/visualizations/chart';
import { CHART_STROKE_COLOR } from '../../utils/chartData';
import { formatUsd } from '../../utils/format';

type AssetPriceLineChartProps = {
  values: number[];
  /** Unix seconds; falls back to evenly spaced recent times when omitted. */
  timestamps?: number[] | null;
  height?: number;
  color?: string;
  accessibilityLabel?: string;
};

function downsampleSeries(
  values: number[],
  timestamps: number[],
  maxPoints: number,
): { values: number[]; timestamps: number[] } {
  if (values.length <= maxPoints) return { values, timestamps };
  const step = Math.ceil(values.length / maxPoints);
  const nextValues: number[] = [];
  const nextTimestamps: number[] = [];
  for (let i = 0; i < values.length; i += step) {
    nextValues.push(values[i]);
    nextTimestamps.push(timestamps[i] ?? i);
  }
  const last = values.length - 1;
  if (nextValues[nextValues.length - 1] !== values[last]) {
    nextValues.push(values[last]);
    nextTimestamps.push(timestamps[last] ?? last);
  }
  return { values: nextValues, timestamps: nextTimestamps };
}

function fallbackTimestamps(count: number): number[] {
  const now = Math.floor(Date.now() / 1000);
  const step = 3600;
  return Array.from({ length: count }, (_, index) => now - (count - 1 - index) * step);
}

function formatScrubberDate(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dayOfWeek}, ${monthDay}, ${time}`;
}

/**
 * Full-width LineChart matching CDS “Asset Price with Dotted Area”:
 * scrubbing + dotted area fill under the price line.
 */
export function AssetPriceLineChart({
  values,
  timestamps = null,
  height = 220,
  color = CHART_STROKE_COLOR,
  accessibilityLabel = 'Portfolio balance chart',
}: AssetPriceLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(Math.floor(el.clientWidth), 200));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const seriesInput = useMemo(() => {
    const ts =
      timestamps && timestamps.length === values.length
        ? timestamps
        : fallbackTimestamps(values.length);
    return downsampleSeries(values, ts, 96);
  }, [values, timestamps]);

  const scrubberLabel = useCallback(
    (index: number) => {
      const price = seriesInput.values[index];
      const ts = seriesInput.timestamps[index];
      if (price === undefined || ts === undefined) return null;
      return (
        <>
          <tspan style={{ fontWeight: 'bold' }}>{formatUsd(price)}</tspan>{' '}
          {formatScrubberDate(ts)}
        </>
      );
    },
    [seriesInput],
  );

  const scrubberAccessibilityLabel = useCallback(
    (index: number) => {
      const price = seriesInput.values[index];
      const ts = seriesInput.timestamps[index];
      if (price === undefined || ts === undefined) return '';
      return `${formatUsd(price)} ${formatScrubberDate(ts)}`;
    },
    [seriesInput],
  );

  if (seriesInput.values.length < 2) {
    return null;
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <LineChart
        accessibilityLabel={accessibilityLabel}
        animate
        areaType="dotted"
        enableScrubbing
        height={height}
        inset={{ top: 48, bottom: 8, left: 0, right: 0 }}
        series={[
          {
            id: 'portfolio',
            data: seriesInput.values,
            color,
            transitions: {
              enter: { type: 'tween', duration: 0.85, ease: [0.23, 1, 0.32, 1] },
              update: { type: 'spring', stiffness: 180, damping: 28, mass: 1.1 },
            },
          },
        ]}
        showArea
        style={{ outlineColor: color }}
        transitions={{
          enter: { type: 'tween', duration: 0.85, ease: [0.23, 1, 0.32, 1] },
          update: { type: 'spring', stiffness: 180, damping: 28, mass: 1.1 },
        }}
        width={width}
      >
        <Scrubber
          accessibilityLabel={scrubberAccessibilityLabel}
          idlePulse
          label={scrubberLabel}
          labelElevated
        />
      </LineChart>
    </div>
  );
}
