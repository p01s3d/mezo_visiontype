import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';
import { RIFORMA_MONO, RIFORMA_SANS } from './fontTokens';

/**
 * Mezo — off-red accent, baseui-derived neutrals (see mezoTheme.ts / #52).
 * Applies the same palette used by the Mezo app (src/components/Mezo/) to
 * this generic CDS dashboard shell, so both surfaces read as one brand.
 * - Semantic *text* greens/ambers darkened for WCAG AA on white.
 * - Fill/wash tokens keep the vivid source hexes.
 * - Dark mode: baseweb Dark neutrals floor; accent stays constant across
 *   themes (mirrors the choice already made in mezo.css).
 */

const mezo = {
  canvas: '#ffffff',
  soft: '#f3f3f3',
  card: '#e8e8e8',
  creamStrong: '#dddddd',
  hairline: '#dddddd',
  ink: '#000000',
  bodyStrong: '#282828',
  muted: '#727272',
  mutedSoft: '#868686',
  coral: '#ff004d',
  coralActive: '#cc003e',
  coralDisabled: '#dddddd',
  teal: '#0188df',
  amber: '#f3cf8a',
  success: '#009a51',
  successText: '#0e8345',
  warning: '#f1a91f',
  warningText: '#b97e0c',
  error: '#de1135',
  onPrimary: '#ffffff',
  navy: '#161616',
  navyElevated: '#292929',
  navySoft: '#161616',
  onDark: '#ffffff',
  onDarkSoft: '#8c8c8c',
  coralDark: '#ff004d',
  successWashLight: '#eaf6ed',
  warningWashLight: '#faecd1',
  errorWashLight: '#fff0ee',
  successWashDark: '#081b0e',
  warningWashDark: '#211201',
  errorWashDark: '#2e0608',
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
  id: 'defi-mezo' as const,
  // Display and UI both read Riforma now — matches mezo.css, closes the gap
  // where this shell's headline text was still on the Copernicus placeholder.
  fontFamily: withFontStack(RIFORMA_SANS, RIFORMA_SANS),
  fontFamilyMono: withMonoStack(RIFORMA_MONO),
  fontWeight,

  lightSpectrum: {
    ...defaultTheme.lightSpectrum,
    gray0: hexToRgbChannels('#ffffff'),
    gray5: hexToRgbChannels(mezo.canvas),
    gray10: hexToRgbChannels(mezo.soft),
    gray15: hexToRgbChannels(mezo.card),
    gray20: hexToRgbChannels(mezo.creamStrong),
    gray30: hexToRgbChannels(mezo.hairline),
    gray40: hexToRgbChannels(mezo.mutedSoft),
    gray50: hexToRgbChannels(mezo.muted),
    gray60: hexToRgbChannels(mezo.muted),
    gray70: hexToRgbChannels(mezo.bodyStrong),
    gray80: hexToRgbChannels(mezo.ink),
    gray90: hexToRgbChannels(mezo.navy),
    gray100: hexToRgbChannels(mezo.navy),
    // Brand spectrum → off-red
    blue0: hexToRgbChannels('#fff2f5'),
    blue5: hexToRgbChannels('#ffe6ec'),
    blue10: hexToRgbChannels('#ffd6e1'),
    blue20: hexToRgbChannels('#ffb3c6'),
    blue40: hexToRgbChannels(mezo.coral),
    blue50: hexToRgbChannels(mezo.coral),
    blue60: hexToRgbChannels(mezo.coralActive),
    blue70: hexToRgbChannels('#8f1a3a'),
    blue80: hexToRgbChannels('#6e1030'),
    blue90: hexToRgbChannels(mezo.navy),
    blue100: hexToRgbChannels(mezo.navy),
    green40: hexToRgbChannels(mezo.success),
    green60: hexToRgbChannels(mezo.successText),
    orange40: hexToRgbChannels(mezo.amber),
    orange60: hexToRgbChannels(mezo.warningText),
    yellow40: hexToRgbChannels(mezo.amber),
    yellow60: hexToRgbChannels(mezo.warning),
    red50: hexToRgbChannels(mezo.error),
    red60: hexToRgbChannels(mezo.error),
    teal40: hexToRgbChannels(mezo.teal),
    teal50: hexToRgbChannels(mezo.teal),
  },

  darkSpectrum: {
    ...defaultTheme.darkSpectrum,
    gray0: hexToRgbChannels(mezo.navy),
    gray5: hexToRgbChannels(mezo.navySoft),
    gray10: hexToRgbChannels(mezo.navyElevated),
    gray15: hexToRgbChannels(mezo.navyElevated),
    gray20: hexToRgbChannels('#383838'),
    gray50: hexToRgbChannels(mezo.onDarkSoft),
    gray60: hexToRgbChannels(mezo.onDarkSoft),
    gray90: hexToRgbChannels(mezo.onDark),
    gray100: hexToRgbChannels('#ffffff'),
    blue40: hexToRgbChannels(mezo.coral),
    blue50: hexToRgbChannels(mezo.coralDark),
    blue60: hexToRgbChannels(mezo.coralDark),
    green50: hexToRgbChannels(mezo.success),
    green60: hexToRgbChannels('#5c9d70'),
    yellow50: hexToRgbChannels(mezo.amber),
    teal50: hexToRgbChannels(mezo.teal),
    red50: hexToRgbChannels('#de5b5d'),
  },

  lightColor: {
    ...defaultTheme.lightColor,
    fg: rgb(mezo.ink),
    fgMuted: rgb(mezo.muted),
    fgInverse: rgb(mezo.onPrimary),
    fgPrimary: rgb(mezo.coral),
    fgWarning: rgb(mezo.warningText),
    fgPositive: rgb(mezo.successText),
    fgNegative: rgb(mezo.error),
    bg: rgb(mezo.canvas),
    bgAlternate: rgb(mezo.card),
    bgInverse: rgb(mezo.navy),
    bgOverlay: rgba(mezo.ink, 0.4),
    bgPrimary: rgb(mezo.coral),
    bgPrimaryWash: rgba(mezo.coral, 0.12),
    bgSecondary: rgb(mezo.soft),
    bgTertiary: rgb(mezo.creamStrong),
    bgSecondaryWash: rgb(mezo.soft),
    bgNegative: rgb(mezo.error),
    bgNegativeWash: rgb(mezo.errorWashLight),
    bgPositive: rgb(mezo.success),
    bgPositiveWash: rgb(mezo.successWashLight),
    bgWarning: rgb(mezo.warning),
    bgWarningWash: rgb(mezo.warningWashLight),
    bgLine: rgba(mezo.ink, 0.12),
    bgLineHeavy: rgba(mezo.ink, 0.35),
    bgLineInverse: rgb(mezo.onDark),
    bgLinePrimary: rgb(mezo.coral),
    bgLinePrimarySubtle: rgb('#ffb3c6'),
    bgElevation1: rgb(mezo.canvas),
    bgElevation2: rgb('#ffffff'),
    accentSubtleGreen: rgb(mezo.successWashLight),
    accentBoldGreen: rgb(mezo.successText),
    accentSubtleBlue: rgba(mezo.coral, 0.12),
    accentBoldBlue: rgb(mezo.coral),
    accentSubtlePurple: rgb(mezo.soft),
    accentBoldPurple: rgb(mezo.bodyStrong),
    accentSubtleYellow: rgb(mezo.warningWashLight),
    accentBoldYellow: rgb(mezo.amber),
    accentSubtleRed: rgb(mezo.errorWashLight),
    accentBoldRed: rgb(mezo.error),
    accentSubtleGray: rgb(mezo.card),
    accentBoldGray: rgb(mezo.ink),
    transparent: rgba(mezo.canvas, 0),
  },

  darkColor: {
    ...defaultTheme.darkColor,
    fg: rgb(mezo.onDark),
    fgInverse: rgb(mezo.ink),
    fgMuted: rgb(mezo.onDarkSoft),
    fgPrimary: rgb(mezo.coralDark),
    fgPositive: rgb('#5c9d70'),
    fgNegative: rgb('#de5b5d'),
    fgWarning: rgb(mezo.amber),
    bg: rgb(mezo.navy),
    bgAlternate: rgb(mezo.navyElevated),
    bgInverse: rgb(mezo.onDark),
    bgOverlay: rgba(mezo.navy, 0.55),
    bgPrimary: rgb(mezo.coralDark),
    bgPrimaryWash: rgba(mezo.coral, 0.22),
    bgSecondary: rgb(mezo.navySoft),
    bgTertiary: rgb(mezo.navyElevated),
    bgSecondaryWash: rgb(mezo.navySoft),
    bgNegative: rgb('#de5b5d'),
    bgNegativeWash: rgb(mezo.errorWashDark),
    bgPositive: rgb('#5c9d70'),
    bgPositiveWash: rgb(mezo.successWashDark),
    bgWarning: rgb(mezo.amber),
    bgWarningWash: rgb(mezo.warningWashDark),
    bgLine: rgba(mezo.onDarkSoft, 0.22),
    bgLineHeavy: rgba(mezo.onDarkSoft, 0.55),
    bgLineInverse: rgb(mezo.navy),
    bgLinePrimary: rgb(mezo.coralDark),
    bgLinePrimarySubtle: rgb(mezo.coralActive),
    bgElevation1: rgb(mezo.navyElevated),
    bgElevation2: rgb('#2e2b27'),
    accentSubtleGreen: rgb(mezo.successWashDark),
    accentBoldGreen: rgb('#5c9d70'),
    accentSubtleBlue: rgba(mezo.coral, 0.22),
    accentBoldBlue: rgb(mezo.coralDark),
    accentSubtlePurple: rgb(mezo.navySoft),
    accentBoldPurple: rgb(mezo.onDarkSoft),
    accentSubtleYellow: rgb(mezo.warningWashDark),
    accentBoldYellow: rgb(mezo.amber),
    accentSubtleRed: rgb(mezo.errorWashDark),
    accentBoldRed: rgb('#de5b5d'),
    accentSubtleGray: rgb(mezo.navyElevated),
    accentBoldGray: rgb(mezo.creamStrong),
    transparent: rgba(mezo.navy, 0),
  },

  lightIllustrationColor: {
    ...defaultTheme.lightIllustrationColor,
    primary: rgb(mezo.coral),
    black: rgb(mezo.ink),
    white: rgb(mezo.canvas),
    gray: rgb(mezo.creamStrong),
    gray2: rgb(mezo.ink),
    gray3: rgb(mezo.hairline),
    gray4: rgb(mezo.card),
    positive: rgb(mezo.success),
    negative: rgb(mezo.error),
    accent1: rgb(mezo.amber),
    accent2: rgb(mezo.teal),
    accent3: rgb(mezo.coralActive),
    accent4: rgb(mezo.coral),
    invert: rgb(mezo.ink),
    invert2: rgb(mezo.canvas),
  },

  darkIllustrationColor: {
    ...defaultTheme.darkIllustrationColor,
    primary: rgb(mezo.coralDark),
    black: rgb(mezo.navy),
    white: rgb(mezo.onDark),
    gray: rgb(mezo.navyElevated),
    positive: rgb('#5c9d70'),
    negative: rgb('#de5b5d'),
    accent1: rgb(mezo.amber),
    accent2: rgb(mezo.teal),
    accent3: rgb(mezo.coral),
    accent4: rgb(mezo.coralDark),
  },
};
