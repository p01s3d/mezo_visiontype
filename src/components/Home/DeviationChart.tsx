import { useEffect, useMemo, useState } from 'react';
import { Text } from '@coinbase/cds-web/typography';
import { useInViewOnce } from '../../hooks/useInViewOnce';

type DeviationChartProps = {
  portfolio: number[];
  benchmark: number[];
  /** End-of-window index (callout matches headline vs BTC). */
  maxGapIndex: number;
  /** End-of-window gap in pp — same value as the Performance Deviation headline. */
  maxGapPct: number;
  /** Unix seconds aligned with series — drives x-axis labels (historical, not forecast). */
  timestamps?: number[];
  height?: number;
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function downsample(data: number[], maxPoints: number): number[] {
  if (data.length <= maxPoints) return data;
  const out: number[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round((i / Math.max(maxPoints - 1, 1)) * (data.length - 1));
    out.push(data[index]);
  }
  return out;
}

/** Start / middle / end axis ticks from historical timestamps (no future dates). */
function axisLabelsFromTimestamps(timestamps: number[], tickCount = 3): string[] {
  if (timestamps.length < 2) return [];
  // Use first/last of the full series so dense Zerion month charts don't
  // collapse the axis to the first few days when values were downsampled.
  const start = timestamps[0];
  const end = timestamps[timestamps.length - 1];
  const spanDays = (end - start) / 86400;
  const labels: string[] = [];
  for (let i = 0; i < tickCount; i++) {
    const t = start + ((end - start) * i) / Math.max(tickCount - 1, 1);
    const d = new Date(t * 1000);
    if (spanDays <= 45) {
      labels.push(`${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`);
    } else {
      labels.push(MONTH_SHORT[d.getMonth()]);
    }
  }
  return labels;
}

export function DeviationChart({
  portfolio,
  benchmark,
  maxGapIndex,
  maxGapPct,
  timestamps = [],
  height = 160,
}: DeviationChartProps) {
  const width = 320;
  const pad = { t: 28, r: 12, b: 8, l: 8 };
  const [rootRef, inView] = useInViewOnce<HTMLDivElement>();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true);
      return;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setRevealed(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [inView]);

  const series = useMemo(() => {
    const n = Math.min(portfolio.length, benchmark.length);
    if (n < 2) return null;
    const p = downsample(portfolio.slice(0, n), 48);
    const b = downsample(benchmark.slice(0, n), 48);
    const gapIndexRaw = Math.min(maxGapIndex, n - 1);
    const gapIndex = Math.round((gapIndexRaw / Math.max(n - 1, 1)) * (p.length - 1));
    // Full timestamp window (not head-sliced to series length — that collapsed
    // dense month charts to ~first few days on the axis).
    const ts = timestamps.length >= 2 ? timestamps : [];
    return { p, b, gapIndex, labels: axisLabelsFromTimestamps(ts) };
  }, [portfolio, benchmark, maxGapIndex, timestamps]);

  if (!series) {
    return <div className="healthBento__skeleton" style={{ height, width: '100%' }} />;
  }

  const { p, b, gapIndex, labels } = series;
  const all = [...p, ...b];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const xAt = (i: number) => pad.l + (i / Math.max(p.length - 1, 1)) * innerW;
  const yAt = (v: number) => pad.t + (1 - (v - min) / span) * innerH;

  const linePath = (values: number[]) =>
    values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`)
      .join(' ');

  const base = yAt(min);
  const areaPath = [
    ...p.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`),
    `L ${xAt(p.length - 1).toFixed(1)} ${base}`,
    `L ${xAt(0).toFixed(1)} ${base}`,
    'Z',
  ].join(' ');

  const gx = xAt(gapIndex);
  const gyP = yAt(p[gapIndex]);
  const gyB = yAt(b[gapIndex]);
  const gapLabelTop = Math.min(gyP, gyB) - 10;
  const gapLabelLeftPct = (gx / width) * 100;
  const gapLabelTopPct = (Math.max(gapLabelTop, 14) / height) * 100;

  const months = labels.length > 0 ? labels : ['', '', ''];
  const gapLabel = `${maxGapPct > 0 ? '+' : ''}${maxGapPct.toFixed(2)}%`;
  const dashOffset = revealed ? 0 : 1;

  return (
    <div ref={rootRef} className="healthBento__deviationChart">
      <div className="healthBento__deviationPlot" style={{ height }}>
        <svg
          height={height}
          preserveAspectRatio="none"
          role="img"
          style={{ width: '100%', display: 'block' }}
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <pattern
              height="6"
              id="devHatch"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
              width="6"
            >
              <line
                stroke="var(--chart-portfolio, #5db8a6)"
                strokeOpacity="0.35"
                strokeWidth="1.5"
                x1="0"
                x2="0"
                y1="0"
                y2="6"
              />
            </pattern>
          </defs>

          <path
            className="healthBento__deviationArea"
            d={areaPath}
            fill="url(#devHatch)"
            opacity={revealed ? 0.9 : 0}
          />
          <path
            className="healthBento__deviationLine healthBento__deviationLine--btc"
            d={linePath(b)}
            fill="none"
            pathLength={1}
            stroke="var(--chart-benchmark, #e8a55a)"
            strokeDasharray={1}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth={2.5}
          />
          <path
            className="healthBento__deviationLine healthBento__deviationLine--portfolio"
            d={linePath(p)}
            fill="none"
            pathLength={1}
            stroke="var(--chart-portfolio, #5db8a6)"
            strokeDasharray={1}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth={2.5}
          />

          <g className="healthBento__deviationMarks" opacity={revealed ? 1 : 0}>
            <line
              stroke="var(--color-fgMuted, #5b616e)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              x1={gx}
              x2={gx}
              y1={Math.min(gyP, gyB)}
              y2={Math.max(gyP, gyB) + 8}
            />
            <circle cx={gx} cy={gyP} fill="var(--chart-portfolio, #5db8a6)" r={3.5} />
            <circle cx={gx} cy={gyB} fill="var(--chart-benchmark, #e8a55a)" r={3.5} />
          </g>
        </svg>

        <div
          className="healthBento__deviationGap"
          style={{
            left: `${gapLabelLeftPct}%`,
            top: `${gapLabelTopPct}%`,
            opacity: revealed ? 1 : 0,
          }}
        >
          <Text font="label2" tabularNumbers>
            {gapLabel}
          </Text>
        </div>
      </div>

      <div className="healthBento__deviationAxis">
        {months.map((label, i) => (
          <Text key={`${label}-${i}`} color="fgMuted" font="caption">
            {label}
          </Text>
        ))}
      </div>
    </div>
  );
}
