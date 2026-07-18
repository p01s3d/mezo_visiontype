export type MezoColorScheme = 'light' | 'dark';

/** RYBitten Apple 90s — duckbutter hero, firewatch + heavenlysky accents */
export const MEZO_COLORS = {
  duckbutter: {
    50: '#f7ecd0',
    100: '#f3eacf',
    200: '#e8e2c5',
    300: '#d2d3ad',
    400: '#cecb8d',
    500: '#e1cc62',
    600: '#f6c735',
    700: '#d98f17',
    800: '#975108',
    900: '#512b08',
    950: '#1c110a',
  },
  firewatch: {
    50: '#faedcf',
    100: '#f9eaca',
    500: '#f08665',
    600: '#cc5a54',
    700: '#844667',
    800: '#4e3154',
    900: '#2d2433',
    950: '#131315',
  },
  heavenlysky: {
    50: '#faeccf',
    500: '#6c91ad',
    600: '#2384ba',
    700: '#437e76',
    800: '#466034',
    900: '#283518',
  },
} as const;

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
    ink: MEZO_COLORS.duckbutter[950],
    mutedTitle: MEZO_COLORS.duckbutter[800],
    collapsedAmount: MEZO_COLORS.duckbutter[900],
    expandedAmount: MEZO_COLORS.duckbutter[800],
    tileIcon: MEZO_COLORS.duckbutter[50],
    badgeIcon: MEZO_COLORS.duckbutter[50],
    chartStroke: MEZO_COLORS.duckbutter[700],
    chartFillStart: 'rgba(217, 143, 23, 0.28)',
    chartMarkerFill: MEZO_COLORS.duckbutter[50],
  },
  dark: {
    ink: MEZO_COLORS.duckbutter[50],
    mutedTitle: MEZO_COLORS.duckbutter[300],
    collapsedAmount: MEZO_COLORS.duckbutter[100],
    expandedAmount: MEZO_COLORS.duckbutter[300],
    tileIcon: MEZO_COLORS.duckbutter[50],
    badgeIcon: MEZO_COLORS.duckbutter[50],
    chartStroke: MEZO_COLORS.duckbutter[500],
    chartFillStart: 'rgba(225, 204, 98, 0.28)',
    chartMarkerFill: MEZO_COLORS.duckbutter[950],
  },
};
