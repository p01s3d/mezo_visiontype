export type MezoColorScheme = 'light' | 'dark';

const hexToRgba = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Neutral + status primitives sourced directly from uber/baseweb's
 * color-primitive-tokens.ts (the actual source behind the `baseui` npm
 * package — not vendored as a live dependency; baseui@18 requires Node
 * >=24, incompatible with this repo's Node ^22 pin).
 */
const baseUiPrimitiveColors = {
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F3F3F3',
  gray100: '#E8E8E8',
  gray200: '#DDDDDD',
  gray300: '#C6C6C6',
  gray400: '#A6A6A6',
  gray500: '#868686',
  gray600: '#727272',
  gray700: '#5E5E5E',
  gray800: '#4B4B4B',
  gray900: '#282828',
  gray50Dark: '#161616',
  gray100Dark: '#292929',
  gray200Dark: '#383838',
  gray300Dark: '#484848',
  gray400Dark: '#5D5D5D',
  gray500Dark: '#717171',
  gray600Dark: '#8C8C8C',
  gray700Dark: '#ABABAB',
  gray800Dark: '#C4C4C4',
  red50: '#FFF0EE',
  red600: '#DE1135',
  red600Dark: '#DE5B5D',
  green50: '#EAF6ED',
  green50Dark: '#081B0E',
  green600: '#0E8345',
  green600Dark: '#5C9D70',
} as const;

export const mezoOffRed = '#FF004D';

export const primitiveColors = {
  gray300: '#BBBBBB',

  yellow300: '#FAECD1',
  yellow400: '#F3CF8A',
  yellow500: '#F1A91F',
  yellow600: '#B97E0C',
  yellow700: '#944500',

  lime300: '#EEF3D8',
  lime400: '#C9DB85',
  lime500: '#A6C23A',
  lime600: '#78901C',
  lime700: '#4D5E0E',

  purple300: '#DEDEED',
  purple400: '#9D9BCA',
  purple500: '#5B58A7',
  purple600: '#4B47B2',
  purple700: '#2B26A4',

  blue300: '#E1F3FF',
  blue400: '#AEDFFF',
  blue500: '#46B6FE',
  blue600: '#0188DF',
  blue700: '#014A7A',

  brown300: '#D8C3A9',
  brown400: '#B7966C',
  brown500: '#8C6636',
  brown600: '#6A3C01',
  brown700: '#543104',
} as const;

export const coreColors = {
  accent: mezoOffRed,
  negative: baseUiPrimitiveColors.red600,
  warning: primitiveColors.yellow500,
  positive: baseUiPrimitiveColors.green600,
} as const;

export const semanticExtensionColors = {
  // Backgrounds
  backgroundStateDisabled: baseUiPrimitiveColors.gray100,
  backgroundOverlayDark: hexToRgba(baseUiPrimitiveColors.black, 0.5),
  backgroundOverlayElevation: hexToRgba(baseUiPrimitiveColors.black, 0),
  backgroundAccent: primitiveColors.blue600,
  backgroundNegative: coreColors.negative,
  backgroundWarning: coreColors.warning,
  backgroundPositive: coreColors.positive,
  backgroundAccentLight: primitiveColors.blue300,
  backgroundNegativeLight: baseUiPrimitiveColors.red50,
  backgroundWarningLight: primitiveColors.yellow300,
  backgroundPositiveLight: baseUiPrimitiveColors.green50,
  backgroundAlwaysDark: baseUiPrimitiveColors.black,
  backgroundAlwaysLight: baseUiPrimitiveColors.white,

  // Content
  contentAccent: mezoOffRed,
  contentNegative: coreColors.negative,
  contentWarning: primitiveColors.yellow600,
  contentPositive: coreColors.positive,
  contentStateDisabled: baseUiPrimitiveColors.gray400,

  // Border
  borderAccent: primitiveColors.blue600,
  borderAccentLight: primitiveColors.blue300,
  borderNegative: coreColors.negative,
  borderWarning: primitiveColors.yellow600,
} as const;

export const sharedComponentColors = {
  buttonPrimarySpinnerForeground: semanticExtensionColors.borderAccent,
  buttonSecondarySpinnerForeground: semanticExtensionColors.borderAccent,
  buttonTertiarySpinnerForeground: semanticExtensionColors.borderAccent,
  buttonDisabledSpinnerForeground: semanticExtensionColors.borderAccent,
} as const;

/**
 * JS-side tokens for animated SVG/canvas elements that can't read CSS
 * custom properties directly (StripCanvas icon/title/amount tweens,
 * TimelineChart stroke). Derived from the baseui-sourced neutrals above
 * plus the Mezo accent/status colors — not part of the uploaded token
 * file, which doesn't cover this layer.
 */
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
    ink: baseUiPrimitiveColors.black,
    mutedTitle: baseUiPrimitiveColors.gray500,
    collapsedAmount: baseUiPrimitiveColors.black,
    expandedAmount: baseUiPrimitiveColors.gray600,
    tileIcon: baseUiPrimitiveColors.white,
    badgeIcon: baseUiPrimitiveColors.white,
    chartStroke: mezoOffRed,
    chartFillStart: hexToRgba(mezoOffRed, 0.28),
    chartMarkerFill: baseUiPrimitiveColors.white,
  },
  dark: {
    ink: baseUiPrimitiveColors.white,
    mutedTitle: baseUiPrimitiveColors.gray500Dark,
    collapsedAmount: baseUiPrimitiveColors.white,
    expandedAmount: baseUiPrimitiveColors.gray600Dark,
    tileIcon: baseUiPrimitiveColors.white,
    badgeIcon: baseUiPrimitiveColors.white,
    chartStroke: mezoOffRed,
    chartFillStart: hexToRgba(mezoOffRed, 0.28),
    chartMarkerFill: baseUiPrimitiveColors.black,
  },
};
