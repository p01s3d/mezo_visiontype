import { useMemo } from 'react';
import { generateSparklineValues } from '../../utils/chartData';
import { CompactLineChart } from './CompactLineChart';

type PriceSparklineProps = {
  seed: string;
  endValue: number;
  trend: 'up' | 'down' | 'flat';
  /** Real chart values from Zerion; when set, replaces synthetic series. */
  series?: number[] | null;
  width?: number;
  height?: number;
  color?: string;
};

export const PriceSparkline = ({
  seed,
  endValue,
  trend,
  series = null,
  width = 96,
  height = 32,
  color,
}: PriceSparklineProps) => {
  const data = useMemo(() => {
    if (series && series.length >= 2) return series;
    return generateSparklineValues(seed, 24, endValue, trend);
  }, [seed, endValue, trend, series]);

  const strokeColor =
    color ??
    (series && series.length >= 2
      ? series[series.length - 1] < series[0]
        ? 'var(--color-fgNegative, #c64545)'
        : 'var(--color-fgPositive, #2f7a4a)'
      : trend === 'down'
        ? 'var(--color-fgNegative, #c64545)'
        : 'var(--color-fgPositive, #2f7a4a)');

  return <CompactLineChart color={strokeColor} data={data} height={height} showArea width={width} />;
};
