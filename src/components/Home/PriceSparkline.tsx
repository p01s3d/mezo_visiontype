import { useMemo } from 'react';
import { useSparklinePath } from '@coinbase/cds-common/visualizations/useSparklinePath';
import { Sparkline } from '@coinbase/cds-web/visualizations';
import { generateSparklineValues } from '../../utils/chartData';

type PriceSparklineProps = {
  seed: string;
  endValue: number;
  trend: 'up' | 'down' | 'flat';
  width?: number;
  height?: number;
  color?: string;
};

export const PriceSparkline = ({
  seed,
  endValue,
  trend,
  width = 96,
  height = 32,
  color,
}: PriceSparklineProps) => {
  const data = useMemo(
    () => generateSparklineValues(seed, 24, endValue, trend),
    [seed, endValue, trend],
  );
  const path = useSparklinePath({ data, width, height });
  const strokeColor = color ?? (trend === 'down' ? '#CF202F' : '#0052FF');

  return (
    <Sparkline color={strokeColor} height={height} path={path} width={width} strokeType="solid" />
  );
};
