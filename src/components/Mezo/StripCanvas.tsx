import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { MotionDiv } from './motion';
import type { MezoAction } from '../../data/mezoActions';
import { MEZO_ACTIONS, TIMELINE_DOMAIN, TIMELINE_TICKS } from '../../data/mezoActions';
import type { ViewMode } from './MezoApp';
import { HistoryStrip, type StripLayout } from './HistoryStrip';
import { TimelineChart } from './TimelineChart';
import {
  EXPANDED_H,
  STRIP_GAP,
  STRIP_MAX_H,
  STRIP_MIN_H,
  STRIP_W,
  expandedWidthFor,
} from './constants';
import type { MezoColorScheme } from './mezoTheme';

type Props = {
  actions: MezoAction[];
  view: ViewMode;
  expandedId: string | null;
  anticipatingId: string | null;
  colorScheme: MezoColorScheme;
  onToggle: (id: string) => void;
};

/** deterministic -0.5..0.5 from the action id, drives the skyline stagger */
function stagger(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5;
}

const AMOUNTS = MEZO_ACTIONS.map((a) => a.amount);
const MIN_AMOUNT = Math.min(...AMOUNTS);
const MAX_AMOUNT = Math.max(...AMOUNTS);

function heightFor(amount: number): number {
  const t = (amount - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT);
  return Math.round(STRIP_MIN_H + t * (STRIP_MAX_H - STRIP_MIN_H));
}

const EDGE_PAD = 40;
const TIMELINE_PAD_LEFT = 70;
const TIMELINE_PAD_RIGHT = 150;
/** minimum px per day so timeline strips keep breathing room when scrolled */
const TIMELINE_DAY_PX = 104;
const CHART_SPRING = { type: 'spring' as const, stiffness: 120, damping: 22 };

export const StripCanvas = ({ actions, view, expandedId, anticipatingId, colorScheme, onToggle }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isTimeline = view === 'timeline';
  const dayCount = TIMELINE_DOMAIN.max - TIMELINE_DOMAIN.min;

  const contentW = useMemo(() => {
    if (size.w === 0) return 0;
    if (isTimeline) {
      return Math.max(
        size.w,
        TIMELINE_PAD_LEFT + TIMELINE_PAD_RIGHT + dayCount * TIMELINE_DAY_PX,
      );
    }
    const totalW =
      actions.reduce(
        (sum, a) => sum + (a.id === expandedId ? expandedWidthFor(a.type) : STRIP_W),
        0,
      ) + STRIP_GAP * Math.max(actions.length - 1, 0);
    return Math.max(size.w, totalW + EDGE_PAD * 2);
  }, [actions, expandedId, isTimeline, size.w, dayCount]);

  const xCenterForDay = useCallback(
    (day: number) => {
      const { min } = TIMELINE_DOMAIN;
      return (
        TIMELINE_PAD_LEFT +
        ((day - min) / dayCount) * (contentW - TIMELINE_PAD_LEFT - TIMELINE_PAD_RIGHT)
      );
    },
    [contentW, dayCount],
  );

  const chartH = Math.min(250, Math.max(180, size.h * 0.42));

  const layouts = useMemo(() => {
    const map = new Map<string, StripLayout>();
    if (size.w === 0) return map;

    if (!isTimeline) {
      const widths = actions.map((a) =>
        a.id === expandedId ? expandedWidthFor(a.type) : STRIP_W,
      );
      const totalW =
        widths.reduce((sum, w) => sum + w, 0) + STRIP_GAP * Math.max(actions.length - 1, 0);
      let x = Math.max((contentW - totalW) / 2, EDGE_PAD);
      const centerY = size.h * 0.46;

      actions.forEach((action, i) => {
        const expanded = action.id === expandedId;
        const h = expanded ? EXPANDED_H : heightFor(action.amount);
        const offset = expanded ? 0 : stagger(action.id) * 100;
        map.set(action.id, {
          x,
          y: Math.max(centerY - h / 2 + offset, 8),
          w: widths[i],
          h,
        });
        x += widths[i] + STRIP_GAP;
      });
    } else {
      actions.forEach((action) => {
        const h = heightFor(action.amount);
        map.set(action.id, {
          x: xCenterForDay(action.day) - STRIP_W / 2,
          y: 20 + (stagger(action.id) + 0.5) * 70,
          w: STRIP_W,
          h,
        });
      });
    }
    return map;
  }, [actions, isTimeline, expandedId, size, contentW, xCenterForDay]);

  // translate vertical mouse-wheel input into horizontal scrolling (trackpads
  // already emit deltaX); without this a regular wheel does nothing
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // keep the expanded card in view; show "Today" when entering the timeline
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isTimeline) {
      el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: 'smooth' });
      return;
    }
    if (expandedId) {
      const layout = layouts.get(expandedId);
      if (layout) {
        el.scrollTo({
          left: layout.x - (el.clientWidth - layout.w) / 2,
          behavior: 'smooth',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedId, isTimeline]);

  const axisY = size.h - 26;

  return (
    <div className="mezo-canvas" ref={scrollRef}>
      <div className="mezo-canvas-inner" style={{ width: contentW || '100%' }}>
        <AnimatePresence>
          {isTimeline && size.w > 0 && (
            <MotionDiv
              key="chart"
              className="mezo-chart-wrap"
              style={{ height: chartH, zIndex: 0 }}
              initial={reduceMotion ? { opacity: 0 } : { y: chartH + 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: chartH + 60, opacity: 0 }}
              transition={reduceMotion ? { duration: 0.2 } : CHART_SPRING}
            >
              <TimelineChart width={contentW} height={chartH} xForDay={xCenterForDay} colorScheme={colorScheme} />
            </MotionDiv>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isTimeline &&
            size.w > 0 &&
            TIMELINE_TICKS.map((tick, i) => {
              const x = xCenterForDay(tick.day);
              return (
                <MotionDiv
                  key={tick.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.25 + i * 0.08 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <div
                    className="mezo-connector"
                    style={{ left: x, top: 60, height: axisY - 78 }}
                  />
                  <div className="mezo-tick" style={{ left: x, top: axisY }}>
                    {tick.label}
                  </div>
                </MotionDiv>
              );
            })}
        </AnimatePresence>

        <AnimatePresence>
          {size.w > 0 &&
            actions.map((action, index) => {
              const layout = layouts.get(action.id);
              if (!layout) return null;
              return (
                <HistoryStrip
                  key={action.id}
                  action={action}
                  layout={layout}
                  index={index}
                  expanded={action.id === expandedId}
                  anticipating={action.id === anticipatingId}
                  dimmed={expandedId !== null && action.id !== expandedId}
                  colorScheme={colorScheme}
                  clickable={!isTimeline}
                  onClick={() => onToggle(action.id)}
                />
              );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
};
