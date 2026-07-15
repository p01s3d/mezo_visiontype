export type MezoColorScheme = 'light' | 'dark';

/** Reference palette — brand literals */
export const MEZO_COLORS = {
  blackStallion: '#0B1D26',
  bloodlust: '#661717',
  cuteCrab: '#E1383D',
  poodleSkirt: '#FDAEC0',
  everlastingIce: '#F2F8F7',
  goldenGinkgo: '#FDF43D',
  militantVegan: '#3C9A5B',
  smalt: '#1B3E9F',
} as const;

/** Derived neutrals (oklab mixes — keep in sync with mezo.css semantics) */
const MUTED_LIGHT = '#5a6b75';
const MUTED_DARK = '#b8c5c9';

/** JS-side tokens for animated SVG/chart elements */
export const MEZO_PALETTE: Record<
  MezoColorScheme,
  {
    ink: string;
    mutedTitle: string;
    collapsedAmount: string;
    expandedAmount: string;
    tileIcon: string;
    badgeIcon: string;
    chartStroke: string;
    chartFillStart: string;
    chartMarkerFill: string;
  }
> = {
  light: {
    ink: MEZO_COLORS.blackStallion,
    mutedTitle: MUTED_LIGHT,
    collapsedAmount: MEZO_COLORS.blackStallion,
    expandedAmount: MUTED_LIGHT,
    tileIcon: MEZO_COLORS.everlastingIce,
    badgeIcon: MEZO_COLORS.everlastingIce,
    chartStroke: MEZO_COLORS.smalt,
    chartFillStart: 'rgba(27, 62, 159, 0.22)',
    chartMarkerFill: MEZO_COLORS.everlastingIce,
  },
  dark: {
    ink: MEZO_COLORS.everlastingIce,
    mutedTitle: MUTED_DARK,
    collapsedAmount: MEZO_COLORS.everlastingIce,
    expandedAmount: MUTED_DARK,
    tileIcon: MEZO_COLORS.everlastingIce,
    badgeIcon: MEZO_COLORS.everlastingIce,
    chartStroke: MEZO_COLORS.smalt,
    chartFillStart: 'rgba(27, 62, 159, 0.32)',
    chartMarkerFill: MEZO_COLORS.blackStallion,
  },
};
