import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';
import { COPERNICUS_DISPLAY, JETBRAINS_MONO, STYRENE_SANS } from './fontTokens';

/**
 * design-mvp cream + coral (Claude.com reference).
 * Color-expert notes baked in:
 * - Semantic *text* greens/ambers darkened for WCAG AA on cream.
 * - Fill/wash tokens keep MVP vivid hexes.
 * - Dark mode: navy floor; lifted coral for chrome.
 */

const mvp = {
  canvas: '#faf9f5',
  soft: '#f5f0e8',
  card: '#efe9de',
  creamStrong: '#e8e0d2',
  hairline: '#e6dfd8',
  ink: '#141413',
  bodyStrong: '#252523',
  muted: '#6c6a64',
  mutedSoft: '#8e8b82',
  coral: '#cc785c',
  coralActive: '#a9583e',
  coralDisabled: '#e6dfd8',
  teal: '#5db8a6',
  amber: '#e8a55a',
  success: '#5db872',
  successText: '#2f7a4a',
  warning: '#d4a017',
  warningText: '#8a680d',
  error: '#c64545',
  onPrimary: '#ffffff',
  navy: '#181715',
  navyElevated: '#252320',
  navySoft: '#1f1e1b',
  onDark: '#faf9f5',
  onDarkSoft: '#a09d96',
  coralDark: '#e08a6e',
  coralWashLight: '#f5ebe6',
  successWashLight: '#e8f5ec',
  warningWashLight: '#f7f0d9',
  errorWashLight: '#f8e8e8',
  coralWashDark: '#2a1814',
  successWashDark: '#122418',
  warningWashDark: '#2a220c',
  errorWashDark: '#2a1214',
} as const;

function hexToRgbChannels(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function rgb(hex: string): `rgb(${string})` {
  return `rgb(${hexToRgbChannels(hex)})`;
}

function rgba(hex: string, alpha: number): `rgba(${string})` {
  return `rgba(${hexToRgbChannels(hex)},${alpha})`;
}

const fontKeys = Object.keys(defaultTheme.fontFamily) as (keyof typeof defaultTheme.fontFamily)[];

function withFontStack(
  displayStack: string,
  uiStack: string,
): typeof defaultTheme.fontFamily {
  return Object.fromEntries(
    fontKeys.map((key) => {
      if (key === 'display1' || key === 'display2' || key === 'display3') {
        return [key, displayStack];
      }
      return [key, uiStack];
    }),
  ) as typeof defaultTheme.fontFamily;
}

function withMonoStack(stack: string) {
  return Object.fromEntries(fontKeys.map((key) => [key, stack])) as typeof defaultTheme.fontFamilyMono;
}

/** CDS 600 roles → Medium 500 (no Semibold file). */
const fontWeight = {
  ...defaultTheme.fontWeight,
  title1: '500',
  title3: '500',
  headline: '500',
  label1: '500',
  caption: '500',
} as typeof defaultTheme.fontWeight;

export const defiTheme = {
  ...defaultTheme,
  id: 'defi-cream' as const,
  fontFamily: withFontStack(COPERNICUS_DISPLAY, STYRENE_SANS),
  fontFamilyMono: withMonoStack(JETBRAINS_MONO),
  fontWeight,

  lightSpectrum: {
    ...defaultTheme.lightSpectrum,
    gray0: hexToRgbChannels('#ffffff'),
    gray5: hexToRgbChannels(mvp.canvas),
    gray10: hexToRgbChannels(mvp.soft),
    gray15: hexToRgbChannels(mvp.card),
    gray20: hexToRgbChannels(mvp.creamStrong),
    gray30: hexToRgbChannels(mvp.hairline),
    gray40: hexToRgbChannels(mvp.mutedSoft),
    gray50: hexToRgbChannels(mvp.muted),
    gray60: hexToRgbChannels(mvp.muted),
    gray70: hexToRgbChannels(mvp.bodyStrong),
    gray80: hexToRgbChannels(mvp.ink),
    gray90: hexToRgbChannels(mvp.navy),
    gray100: hexToRgbChannels(mvp.navy),
    // Brand spectrum → coral
    blue0: hexToRgbChannels(mvp.coralWashLight),
    blue5: hexToRgbChannels('#f0ddd4'),
    blue10: hexToRgbChannels('#e8cfc3'),
    blue20: hexToRgbChannels('#dfb19f'),
    blue40: hexToRgbChannels(mvp.coral),
    blue50: hexToRgbChannels(mvp.coral),
    blue60: hexToRgbChannels(mvp.coralActive),
    blue70: hexToRgbChannels('#8f4a34'),
    blue80: hexToRgbChannels('#6e3928'),
    blue90: hexToRgbChannels(mvp.navy),
    blue100: hexToRgbChannels(mvp.navy),
    green40: hexToRgbChannels(mvp.success),
    green60: hexToRgbChannels(mvp.successText),
    orange40: hexToRgbChannels(mvp.amber),
    orange60: hexToRgbChannels(mvp.warningText),
    yellow40: hexToRgbChannels(mvp.amber),
    yellow60: hexToRgbChannels(mvp.warning),
    red50: hexToRgbChannels(mvp.error),
    red60: hexToRgbChannels(mvp.error),
    teal40: hexToRgbChannels(mvp.teal),
    teal50: hexToRgbChannels(mvp.teal),
  },

  darkSpectrum: {
    ...defaultTheme.darkSpectrum,
    gray0: hexToRgbChannels(mvp.navy),
    gray5: hexToRgbChannels(mvp.navySoft),
    gray10: hexToRgbChannels(mvp.navyElevated),
    gray15: hexToRgbChannels(mvp.navyElevated),
    gray20: hexToRgbChannels('#35322e'),
    gray50: hexToRgbChannels(mvp.onDarkSoft),
    gray60: hexToRgbChannels(mvp.onDarkSoft),
    gray90: hexToRgbChannels(mvp.onDark),
    gray100: hexToRgbChannels('#ffffff'),
    blue40: hexToRgbChannels(mvp.coral),
    blue50: hexToRgbChannels(mvp.coralDark),
    blue60: hexToRgbChannels(mvp.coralDark),
    green50: hexToRgbChannels(mvp.success),
    green60: hexToRgbChannels('#6fcf8a'),
    yellow50: hexToRgbChannels(mvp.amber),
    teal50: hexToRgbChannels(mvp.teal),
    red50: hexToRgbChannels('#e06a6a'),
  },

  lightColor: {
    ...defaultTheme.lightColor,
    fg: rgb(mvp.ink),
    fgMuted: rgb(mvp.muted),
    fgInverse: rgb(mvp.onPrimary),
    fgPrimary: rgb(mvp.coral),
    fgWarning: rgb(mvp.warningText),
    fgPositive: rgb(mvp.successText),
    fgNegative: rgb(mvp.error),
    bg: rgb(mvp.canvas),
    bgAlternate: rgb(mvp.card),
    bgInverse: rgb(mvp.navy),
    bgOverlay: rgba(mvp.ink, 0.4),
    bgPrimary: rgb(mvp.coral),
    bgPrimaryWash: rgb(mvp.coralWashLight),
    bgSecondary: rgb(mvp.soft),
    bgTertiary: rgb(mvp.creamStrong),
    bgSecondaryWash: rgb(mvp.soft),
    bgNegative: rgb(mvp.error),
    bgNegativeWash: rgb(mvp.errorWashLight),
    bgPositive: rgb(mvp.success),
    bgPositiveWash: rgb(mvp.successWashLight),
    bgWarning: rgb(mvp.warning),
    bgWarningWash: rgb(mvp.warningWashLight),
    bgLine: rgba(mvp.ink, 0.12),
    bgLineHeavy: rgba(mvp.ink, 0.35),
    bgLineInverse: rgb(mvp.onDark),
    bgLinePrimary: rgb(mvp.coral),
    bgLinePrimarySubtle: rgb('#dfb19f'),
    bgElevation1: rgb(mvp.canvas),
    bgElevation2: rgb('#ffffff'),
    accentSubtleGreen: rgb(mvp.successWashLight),
    accentBoldGreen: rgb(mvp.successText),
    accentSubtleBlue: rgb(mvp.coralWashLight),
    accentBoldBlue: rgb(mvp.coral),
    accentSubtlePurple: rgb(mvp.soft),
    accentBoldPurple: rgb(mvp.bodyStrong),
    accentSubtleYellow: rgb(mvp.warningWashLight),
    accentBoldYellow: rgb(mvp.amber),
    accentSubtleRed: rgb(mvp.errorWashLight),
    accentBoldRed: rgb(mvp.error),
    accentSubtleGray: rgb(mvp.card),
    accentBoldGray: rgb(mvp.ink),
    transparent: rgba(mvp.canvas, 0),
  },

  darkColor: {
    ...defaultTheme.darkColor,
    fg: rgb(mvp.onDark),
    fgInverse: rgb(mvp.ink),
    fgMuted: rgb(mvp.onDarkSoft),
    fgPrimary: rgb(mvp.coralDark),
    fgPositive: rgb('#6fcf8a'),
    fgNegative: rgb('#e06a6a'),
    fgWarning: rgb(mvp.amber),
    bg: rgb(mvp.navy),
    bgAlternate: rgb(mvp.navyElevated),
    bgInverse: rgb(mvp.onDark),
    bgOverlay: rgba(mvp.navy, 0.55),
    bgPrimary: rgb(mvp.coralDark),
    bgPrimaryWash: rgb(mvp.coralWashDark),
    bgSecondary: rgb(mvp.navySoft),
    bgTertiary: rgb(mvp.navyElevated),
    bgSecondaryWash: rgb(mvp.navySoft),
    bgNegative: rgb('#e06a6a'),
    bgNegativeWash: rgb(mvp.errorWashDark),
    bgPositive: rgb('#6fcf8a'),
    bgPositiveWash: rgb(mvp.successWashDark),
    bgWarning: rgb(mvp.amber),
    bgWarningWash: rgb(mvp.warningWashDark),
    bgLine: rgba(mvp.onDarkSoft, 0.22),
    bgLineHeavy: rgba(mvp.onDarkSoft, 0.55),
    bgLineInverse: rgb(mvp.navy),
    bgLinePrimary: rgb(mvp.coralDark),
    bgLinePrimarySubtle: rgb(mvp.coralActive),
    bgElevation1: rgb(mvp.navyElevated),
    bgElevation2: rgb('#2e2b27'),
    accentSubtleGreen: rgb(mvp.successWashDark),
    accentBoldGreen: rgb('#6fcf8a'),
    accentSubtleBlue: rgb(mvp.coralWashDark),
    accentBoldBlue: rgb(mvp.coralDark),
    accentSubtlePurple: rgb(mvp.navySoft),
    accentBoldPurple: rgb(mvp.onDarkSoft),
    accentSubtleYellow: rgb(mvp.warningWashDark),
    accentBoldYellow: rgb(mvp.amber),
    accentSubtleRed: rgb(mvp.errorWashDark),
    accentBoldRed: rgb('#e06a6a'),
    accentSubtleGray: rgb(mvp.navyElevated),
    accentBoldGray: rgb(mvp.creamStrong),
    transparent: rgba(mvp.navy, 0),
  },

  lightIllustrationColor: {
    ...defaultTheme.lightIllustrationColor,
    primary: rgb(mvp.coral),
    black: rgb(mvp.ink),
    white: rgb(mvp.canvas),
    gray: rgb(mvp.creamStrong),
    gray2: rgb(mvp.ink),
    gray3: rgb(mvp.hairline),
    gray4: rgb(mvp.card),
    positive: rgb(mvp.success),
    negative: rgb(mvp.error),
    accent1: rgb(mvp.amber),
    accent2: rgb(mvp.teal),
    accent3: rgb(mvp.coralActive),
    accent4: rgb(mvp.coral),
    invert: rgb(mvp.ink),
    invert2: rgb(mvp.canvas),
  },

  darkIllustrationColor: {
    ...defaultTheme.darkIllustrationColor,
    primary: rgb(mvp.coralDark),
    black: rgb(mvp.navy),
    white: rgb(mvp.onDark),
    gray: rgb(mvp.navyElevated),
    positive: rgb('#6fcf8a'),
    negative: rgb('#e06a6a'),
    accent1: rgb(mvp.amber),
    accent2: rgb(mvp.teal),
    accent3: rgb(mvp.coral),
    accent4: rgb(mvp.coralDark),
  },
};
