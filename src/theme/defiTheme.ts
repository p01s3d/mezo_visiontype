import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';
import { RIFORMA_MONO, RIFORMA_SANS } from './fontTokens';

const fontKeys = Object.keys(defaultTheme.fontFamily) as (keyof typeof defaultTheme.fontFamily)[];

function withFontStack(stack: string) {
  return Object.fromEntries(fontKeys.map((key) => [key, stack])) as typeof defaultTheme.fontFamily;
}

export const defiTheme = {
  ...defaultTheme,
  id: 'defi-riforma' as const,
  fontFamily: withFontStack(RIFORMA_SANS),
  fontFamilyMono: withFontStack(RIFORMA_MONO),
};
