import type { MezoActionType } from '../../data/mezoActions';

export const STRIP_W = 94;
export const STRIP_GAP = 22;
export const STRIP_MIN_H = 210;
export const STRIP_MAX_H = 330;
export const EXPANDED_W = 880;
/** compact expanded card for stake / swap / transfer / deposit / bridge */
export const EXPANDED_W_SIMPLE = 560;
export const EXPANDED_H = 432;

export function expandedWidthFor(type: MezoActionType): number {
  return type === 'loan' ? EXPANDED_W : EXPANDED_W_SIMPLE;
}

/**
 * Shared timing scale for the expand/collapse choreography.
 * Micro exits ~100-120ms, content entrances staggered 180-240ms,
 * position/size changes ride the layout spring.
 */
export const TIMING = {
  spring: { type: 'spring' as const, stiffness: 170, damping: 26, mass: 0.9 },
  /** softer vertical spring on the icon for a subtle arc path */
  iconSpringY: { type: 'spring' as const, stiffness: 120, damping: 28, mass: 0.9 },
  iconSpringX: { type: 'spring' as const, stiffness: 200, damping: 24, mass: 0.9 },
  tileSpring: { type: 'spring' as const, stiffness: 300, damping: 22 },
  /** per-shared-element delay: icon 0, title 1, amount 2 */
  stagger: 0.04,
  exitFast: 0.1,
  exitContent: 0.12,
  exitSink: 8,
  /** reverse-stagger step on collapse (buttons → pane → tile) */
  exitStagger: 0.04,
  enterTile: 0.12,
  enterPane: 0.18,
  enterButtons: 0.24,
  /** stagger inside the right pane (schedule rows, status rows, health) */
  innerStagger: 0.03,
  /** collapsed-only meta fades back in after the card has mostly shrunk */
  reenterDelay: 0.15,
  rise: 12,
  /** brief wind-up before expand spring (anticipation) */
  anticipationMs: 80,
  /** non-focused strips while one is expanded (staging) */
  stagingOpacity: 0.55,
  stagingScale: 0.97,
};

/**
 * Card-local coordinates for the shared elements (icon, title, amount) in
 * both states. Collapsed values mirror the old flex stack (18px padding,
 * 94px-wide card, centered); expanded values mirror the .mezo-detail layout
 * (24px padding + 8px left-pane inset -> content origin at 32,32).
 */
export const GEOM = {
  collapsed: {
    iconCenter: { left: STRIP_W / 2, top: 25 },
    iconScale: 14 / 40,
    typeTop: 40,
    nicknameTop: 66,
    amountTop: 68,
    amountTopWithNickname: 93,
  },
  expanded: {
    tile: { left: 32, top: 32, size: 104 },
    /** center of the tile — where non-loan icons land at full size */
    iconCenter: { left: 84, top: 84 },
    /** center of the loan badge (bottom-right of the tile) */
    badgeCenter: { left: 130, top: 130 },
    badgeIconScale: 13 / 40,
    title: { left: 32, top: 160, fontSize: 34 },
    amount: { left: 32, top: 214, fontSize: 19 },
  },
};
