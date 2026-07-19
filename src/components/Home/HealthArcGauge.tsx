import { useEffect, useState } from 'react';
import { Tooltip } from '@coinbase/cds-web/overlays';
import { useInViewOnce } from '../../hooks/useInViewOnce';

import './healthBento.css';

type HealthArcGaugeProps = {
  risk: number;
  consistency: number;
  diversification: number;
  /** Overall width of the SVG (labels + arcs). */
  width?: number;
  /** Overall height of the SVG. */
  height?: number;
};

type ArcDef = {
  id: string;
  label: string;
  tooltip: string;
  progress: number;
  radius: number;
  stroke: string;
};

/** SVG coords: 0° = right, angles increase clockwise (y-down). */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

const START_ANGLE = 180; // rotated another 90° CW (was 90→360)
const TOTAL_SWEEP = 270; // 3/4 circle → ends at 450° ≡ 90°
const END_ANGLE = START_ANGLE + TOTAL_SWEEP;
const R_OUTER = 124;

/**
 * 3/4 circle: 180° → 450° (≡90°) clockwise.
 * progress 0–1 fills along that path.
 */
function arcPath(cx: number, cy: number, r: number, progress: number) {
  const sweep = Math.max(0.02, Math.min(1, progress)) * TOTAL_SWEEP;
  const end = START_ANGLE + sweep;
  const s = polar(cx, cy, r, START_ANGLE);
  const e = polar(cx, cy, r, end);
  // large-arc = 1 when sweep > 180
  const large = sweep > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function HealthArcGauge({
  risk,
  consistency,
  diversification,
  width = 420,
  height = 300,
}: HealthArcGaugeProps) {
  const [rootRef, inView] = useInViewOnce<HTMLDivElement>();
  // Stay at 0 until in view, then one frame later reveal so CSS transition runs from empty.
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

  const stroke = 16;
  const gap = stroke + 8;
  const rOuter = R_OUTER;
  const rMid = rOuter - gap;
  const rInner = rMid - gap;

  // Leave room for labels on the left; arc cluster on the right
  const cx = width - rOuter - stroke;
  const cy = height * 0.5;

  const endAngleNorm = END_ANGLE % 360; // 360° → 0° (right)

  // All arcs: higher fill = better (risk inverted → Safety)
  const arcs: ArcDef[] = [
    {
      id: 'diversification',
      label: 'Diversification',
      tooltip:
        'How evenly value is spread across stables, L1, DeFi, and LP. Fuller means less sleeve concentration.',
      progress: diversification,
      radius: rOuter,
      stroke: 'var(--color-fg, #141413)',
    },
    {
      id: 'consistency',
      label: 'Consistency',
      tooltip:
        'How smooth day-to-day returns have been. Fuller means lower daily volatility over the chart window.',
      progress: consistency,
      radius: rMid,
      stroke: 'var(--chart-portfolio, #5db8a6)',
    },
    {
      id: 'safety',
      label: 'Safety',
      tooltip:
        'How cushioned the book looks. Fuller means lower drawdown, less concentration, and fewer high-stress signals.',
      progress: 1 - Math.max(0, Math.min(1, risk)),
      radius: rInner,
      stroke: 'var(--chart-benchmark, #e8a55a)',
    },
  ];

  // Keys at track end (90° = bottom). Stack labels to match end-cap Y.
  const labelX = 4;
  const labelColEnd = 128;
  const labelOrder = [...arcs].reverse(); // Safety (inner) → Diversification (outer)
  const labelYs = labelOrder.map((arc) => polar(cx, cy, arc.radius, endAngleNorm).y);

  return (
    <div ref={rootRef} style={{ width: '100%', height: '100%' }}>
      <svg
        height={height}
        overflow="visible"
        preserveAspectRatio="xMaxYMid meet"
        role="img"
        style={{ display: 'block' }}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        <title>Portfolio health arcs</title>
        {arcs.map((arc) => {
          const end = polar(cx, cy, arc.radius, endAngleNorm);
          const track = arcPath(cx, cy, arc.radius, 1);
          const progress = Math.max(0, Math.min(1, arc.progress));
          const dashOffset = revealed ? 1 - progress : 1;

          return (
            <g aria-hidden key={arc.id}>
              <path
                d={track}
                fill="none"
                stroke="var(--color-bgLine, #dee1e6)"
                strokeLinecap="round"
                strokeWidth={stroke}
              />
              <path
                className={`healthArcGauge__fill healthArcGauge__fill--${arc.id}`}
                d={arcPath(cx, cy, arc.radius, 1)}
                fill="none"
                pathLength={1}
                stroke={arc.stroke}
                strokeDasharray={1}
                strokeLinecap="round"
                strokeWidth={stroke}
                style={{ strokeDashoffset: dashOffset }}
              />
              <circle
                cx={end.x}
                cy={end.y}
                fill="var(--color-bg, #fff)"
                r={5}
                stroke="var(--color-fgMuted, #5b616e)"
                strokeWidth={1.5}
              />
            </g>
          );
        })}

        {labelOrder.map((arc, index) => {
          const end = polar(cx, cy, arc.radius, endAngleNorm);
          const ly = labelYs[index];
          return (
            <g key={`label-${arc.id}`}>
              <foreignObject height={24} width={labelColEnd - labelX} x={labelX} y={ly - 12}>
                <div className="healthArcGauge__labelWrap">
                  <Tooltip content={arc.tooltip} maxWidth={280}>
                    <span className="healthArcGauge__label" tabIndex={0}>
                      {arc.label}
                    </span>
                  </Tooltip>
                </div>
              </foreignObject>
              <line
                aria-hidden
                stroke="var(--color-fgMuted, #5b616e)"
                strokeOpacity={0.4}
                strokeWidth={1}
                x1={labelColEnd}
                x2={end.x - 8}
                y1={ly}
                y2={end.y}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
