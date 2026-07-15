import { useMemo } from 'react';
import { WEALTH_SERIES } from '../../data/mezoActions';
import { MEZO_PALETTE, type MezoColorScheme } from './mezoTheme';

type Props = {
  width: number;
  height: number;
  xForDay: (day: number) => number;
  colorScheme: MezoColorScheme;
};

const MARKER_DAYS = new Set([1, 3, 5, 8, 10, 12, 13, 15, 16, 18, 20, 21, 22]);

export const TimelineChart = ({ width, height, xForDay, colorScheme }: Props) => {
  const colors = MEZO_PALETTE[colorScheme];

  const { linePath, areaPath, points, last } = useMemo(() => {
    const values = WEALTH_SERIES.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padTop = 24;
    const padBottom = 34;
    const yFor = (v: number) =>
      padTop + (1 - (v - min) / (max - min)) * (height - padTop - padBottom);

    const pts = WEALTH_SERIES.map((p) => ({
      day: p.day,
      x: xForDay(p.day),
      y: yFor(p.value),
    }));
    pts.unshift({ day: 0, x: 0, y: yFor(WEALTH_SERIES[0].value * 0.99) });

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const area = `${line} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`;

    return { linePath: line, areaPath: area, points: pts, last: pts[pts.length - 1] };
  }, [width, height, xForDay]);

  const gradId = `mezo-wealth-fill-${colorScheme}`;

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.chartStroke} stopOpacity="0.34" />
            <stop offset="100%" stopColor={colors.chartStroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={colors.chartStroke}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        {points
          .filter((p) => MARKER_DAYS.has(p.day))
          .map((p) => (
            <circle
              key={p.day}
              cx={p.x}
              cy={p.y}
              r={3}
              fill={colors.chartMarkerFill}
              stroke={colors.chartStroke}
              strokeWidth={1.5}
            />
          ))}
      </svg>
      <div className="mezo-chart-pill" style={{ left: last.x - 10, top: last.y }}>
        total wealth
      </div>
    </div>
  );
};
