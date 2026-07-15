import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { MotionDiv } from './motion';
import type { MezoAction } from '../../data/mezoActions';
import { ACTION_LABELS, formatAmount } from '../../data/mezoActions';
import { ActionIcon } from './icons';
import { StripDetail } from './StripDetail';
import { GEOM, TIMING } from './constants';
import { MEZO_PALETTE, type MezoColorScheme } from './mezoTheme';

export type StripLayout = { x: number; y: number; w: number; h: number };

type Props = {
  action: MezoAction;
  layout: StripLayout;
  index: number;
  expanded: boolean;
  anticipating: boolean;
  dimmed: boolean;
  colorScheme: MezoColorScheme;
  clickable: boolean;
  onClick: () => void;
};

const ICON_HALF = 20;

export const HistoryStrip = ({
  action,
  layout,
  index,
  expanded,
  anticipating,
  dimmed,
  colorScheme,
  clickable,
  onClick,
}: Props) => {
  const reduceMotion = useReducedMotion();
  const palette = MEZO_PALETTE[colorScheme];
  const isLoan = action.type === 'loan';
  const hasNickname = Boolean(action.nickname);
  const title = action.nickname ?? ACTION_LABELS[action.type];

  const titleRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);
  const [textW, setTextW] = useState({ title: 0, amount: 0 });

  const measure = useCallback(() => {
    setTextW({
      title: titleRef.current?.offsetWidth ?? 0,
      amount: amountRef.current?.offsetWidth ?? 0,
    });
  }, []);

  useLayoutEffect(measure, [measure, title]);
  useLayoutEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) measure();
    });
    return () => {
      alive = false;
    };
  }, [measure]);

  const iconTarget = expanded
    ? isLoan
      ? {
          x: GEOM.expanded.badgeCenter.left - ICON_HALF,
          y: GEOM.expanded.badgeCenter.top - ICON_HALF,
          scale: GEOM.expanded.badgeIconScale,
          color: palette.badgeIcon,
        }
      : {
          x: GEOM.expanded.iconCenter.left - ICON_HALF,
          y: GEOM.expanded.iconCenter.top - ICON_HALF,
          scale: 1,
          color: palette.tileIcon,
        }
    : {
        x: GEOM.collapsed.iconCenter.left - ICON_HALF,
        y: GEOM.collapsed.iconCenter.top - ICON_HALF,
        scale: GEOM.collapsed.iconScale,
        color: palette.ink,
      };

  const titleScale = (hasNickname ? 12 : 13.5) / GEOM.expanded.title.fontSize;
  const titleTarget = expanded
    ? { x: GEOM.expanded.title.left, y: GEOM.expanded.title.top, scale: 1, color: palette.ink }
    : {
        x: GEOM.collapsed.iconCenter.left - (textW.title * titleScale) / 2,
        y: hasNickname ? GEOM.collapsed.nicknameTop : GEOM.collapsed.typeTop,
        scale: titleScale,
        color: hasNickname ? palette.mutedTitle : palette.ink,
      };

  const amountScale = 12.5 / GEOM.expanded.amount.fontSize;
  const amountTarget = expanded
    ? { x: GEOM.expanded.amount.left, y: GEOM.expanded.amount.top, scale: 1, color: palette.expandedAmount }
    : {
        x: GEOM.collapsed.iconCenter.left - (textW.amount * amountScale) / 2,
        y: hasNickname ? GEOM.collapsed.amountTopWithNickname : GEOM.collapsed.amountTop,
        scale: amountScale,
        color: palette.collapsedAmount,
      };

  const sharedTransition = (order: number, arc = false) => {
    if (reduceMotion) return { duration: 0 };
    const delay = order * TIMING.stagger;
    const color = { duration: 0.32, ease: 'easeOut' as const, delay };
    if (arc) {
      return {
        x: { ...TIMING.iconSpringX, delay },
        y: { ...TIMING.iconSpringY, delay },
        scale: { ...TIMING.spring, delay },
        color,
      };
    }
    return { ...TIMING.spring, delay, color };
  };

  const enterDelay = Math.min(index * 0.03, 0.45);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!clickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <MotionDiv
      className={`mezo-strip${clickable ? ' is-clickable' : ''}${expanded ? ' is-expanded' : ''}${anticipating ? ' is-anticipating' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-expanded={clickable ? expanded : undefined}
      aria-label={
        clickable
          ? `${ACTION_LABELS[action.type]}${action.nickname ? `, ${action.nickname}` : ''}, ${formatAmount(action.amount)}`
          : undefined
      }
      onKeyDown={handleKeyDown}
      initial={{ x: layout.x, y: layout.y, width: layout.w, height: layout.h }}
      animate={{ x: layout.x, y: layout.y, width: layout.w, height: layout.h }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.22 } }}
      transition={reduceMotion ? { duration: 0 } : TIMING.spring}
      style={{ zIndex: expanded ? 3 : dimmed ? 1 : 2 }}
      onClick={clickable ? onClick : undefined}
    >
      <MotionDiv
        className="mezo-strip-enter"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        animate={{
          opacity: dimmed ? TIMING.stagingOpacity : 1,
          scale: dimmed ? TIMING.stagingScale : 1,
        }}
        transition={
          reduceMotion
            ? { duration: 0.15, delay: enterDelay }
            : {
                delay: enterDelay,
                opacity: { duration: 0.3, ease: 'easeOut' },
                scale: { duration: 0.3, ease: 'easeOut' },
              }
        }
      >
        <div className="mezo-strip-card">
          <AnimatePresence initial={false}>
            {expanded && <StripDetail key="detail" action={action} />}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {!expanded && (
              <MotionDiv
                key="meta"
                className="mezo-strip-meta"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: reduceMotion
                    ? { duration: 0.15 }
                    : { delay: TIMING.reenterDelay, duration: 0.18 },
                }}
                exit={{ opacity: 0, transition: { duration: TIMING.exitFast } }}
              >
                {hasNickname && (
                  <div className="mezo-strip-type" style={{ top: GEOM.collapsed.typeTop }}>
                    {ACTION_LABELS[action.type]}
                  </div>
                )}
                <div className="mezo-strip-date">{`${action.day}\nOct`}</div>
                <div className={`mezo-strip-dot is-${action.status}`} />
              </MotionDiv>
            )}
          </AnimatePresence>

          <MotionDiv
            className="mezo-shared mezo-shared-icon"
            initial={false}
            animate={iconTarget}
            transition={sharedTransition(0, true)}
          >
            <span className="mezo-shared-icon-inner">
              <ActionIcon type={action.type} size={40} strokeWidth={1.6} />
            </span>
          </MotionDiv>
          <MotionDiv
            ref={titleRef}
            className="mezo-shared mezo-shared-title"
            initial={false}
            animate={titleTarget}
            transition={sharedTransition(1)}
            style={{
              fontSize: GEOM.expanded.title.fontSize,
              transformOrigin: 'top left',
              fontWeight: expanded || !hasNickname ? 500 : 400,
            }}
          >
            {title}
          </MotionDiv>
          <MotionDiv
            ref={amountRef}
            className="mezo-shared mezo-shared-amount"
            initial={false}
            animate={amountTarget}
            transition={sharedTransition(2)}
            style={{ fontSize: GEOM.expanded.amount.fontSize, transformOrigin: 'top left' }}
          >
            {formatAmount(action.amount)}
          </MotionDiv>
        </div>
      </MotionDiv>
    </MotionDiv>
  );
};
