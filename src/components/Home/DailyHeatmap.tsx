import { useEffect, useState } from 'react';
import type { HeatmapCell } from '../../utils/bentoHealthMetrics';
import { useInViewOnce } from '../../hooks/useInViewOnce';

type DailyHeatmapProps = {
  cells: HeatmapCell[];
};

function cellClass(cell: HeatmapCell): string {
  if (!cell.inMonth) return 'healthBento__heatCell healthBento__heatCell--out';
  if (cell.returnPct == null) return 'healthBento__heatCell healthBento__heatCell--flat';
  if (cell.returnPct > 1.5) return 'healthBento__heatCell healthBento__heatCell--posStrong';
  if (cell.returnPct > 0.15) return 'healthBento__heatCell healthBento__heatCell--pos';
  if (cell.returnPct < -1.5) return 'healthBento__heatCell healthBento__heatCell--negStrong';
  if (cell.returnPct < -0.15) return 'healthBento__heatCell healthBento__heatCell--neg';
  return 'healthBento__heatCell healthBento__heatCell--flat';
}

export function DailyHeatmap({ cells }: DailyHeatmapProps) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>();
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

  return (
    <div
      ref={ref}
      aria-label="Daily performance heatmap"
      className={`healthBento__heatmap${revealed ? ' is-revealed' : ''}`}
      role="img"
    >
      {cells.map((cell, index) => (
        <div
          key={`${cell.inMonth ? 'in' : 'out'}-${cell.day}-${index}`}
          className={cellClass(cell)}
          style={{ ['--heat-delay' as string]: `${Math.min(index, 28) * 35}ms` }}
          title={
            cell.inMonth && cell.returnPct != null
              ? `Day ${cell.day}: ${cell.returnPct >= 0 ? '+' : ''}${cell.returnPct.toFixed(2)}%`
              : cell.inMonth
                ? `Day ${cell.day}`
                : undefined
          }
        />
      ))}
    </div>
  );
}
