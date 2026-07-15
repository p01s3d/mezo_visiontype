# DeFi System — Design Guide

This document describes the **Coinbase consumer product visual language** (marketing + logged-in Home surfaces) and maps it to **CDS (`@coinbase/cds-web` v9)** tokens used in this repo.

**Stack:** React · Vite · CDS Web · `defiTheme` (`src/theme/defiTheme.ts`) · Riforma fonts (brand substitute for CoinbaseDisplay / CoinbaseSans / CoinbaseMono).

When building UI, prefer **CDS components + theme tokens** over raw CSS. Reference this doc for layout intent; reference CDS for implementation.

---

## CDS quick reference

| Marketing token | Hex | CDS token (light) | Notes |
|---|---|---|---|
| `{colors.primary}` | `#0052ff` | `fgPrimary`, `bgPrimary` | Coinbase Blue — scarce |
| `{colors.primary-active}` | `#003ecc` | Press state on `Button variant="primary"` | CDS handles internally |
| `{colors.canvas}` | `#ffffff` | `bg`, `bgElevation1` | Page floor |
| `{colors.surface-soft}` | `#f7f7f7` | `bgSecondaryWash` | Alternating bands |
| `{colors.surface-strong}` | `#eef0f3` | `bgAlternate`, `bgSecondary` | Search pills, icon plates |
| `{colors.surface-dark}` | `#0a0b0d` | `bgInverse`, `fg` (ink) | Dark heroes |
| `{colors.surface-dark-elevated}` | `#16181c` | `bgElevation2` (dark scheme) | Floating mockup cards |
| `{colors.hairline}` | `#dee1e6` | `bgLine` | 1px dividers |
| `{colors.ink}` | `#0a0b0d` | `fg` | Headlines, emphasis |
| `{colors.body}` | `#5b616e` | `fgMuted` | Running text |
| `{colors.muted}` | `#7c828a` | `fgMuted` (lighter contexts) | Sub-titles |
| `{colors.semantic-up}` | `#05b169` | `fgPositive` | Text only |
| `{colors.semantic-down}` | `#cf202f` | `fgNegative` | Text only |
| `{colors.on-primary}` | `#ffffff` | `fgInverse` on primary buttons | |

**Spacing (4px base → CDS `space` tokens):**

| Marketing | px | CDS `space` | Use |
|---|---|---|---|
| `xxs` | 4 | `0.5` | Tight inline gaps |
| `xs` | 8 | `1` | Chip padding, compact rows |
| `sm` | 12 | `1.5` | List row padding |
| `base` | 16 | `2` | Default padding, card gutters |
| `md` | 20 | — | Use `padding={2}` + manual 4px or `gap={2.5}` if needed |
| `lg` | 24 | `3` | Card grid gaps |
| `xl` | 32 | `4` | Feature card internal padding |
| `xxl` | 48 | `6` | Section sub-gaps |
| `section` | 96 | `10`–`12` | Major band rhythm (`paddingY={6}`–`{8}`) |

**Radius (marketing → CDS `borderRadius`):**

| Marketing | px | CDS | Use |
|---|---|---|---|
| `rounded.sm` | 8 | `200` | Compact rows |
| `rounded.md` | 12 | `300` | Form inputs (`TextInput`) |
| `rounded.lg` | 16 | `400` | Mid cards |
| `rounded.xl` | 24 | `500` | Feature cards |
| `rounded.pill` | 100px | `1000` | CTAs, search, badges |
| `rounded.full` | circle | `1000` + fixed `width`/`height` | Asset icons, avatars |

**Breakpoints (use CDS `MediaQueryProvider` + responsive props):**

| Name | Width | CDS / layout |
|---|---|---|
| Mobile | `< 640px` | `base` — stack columns, hide sidebar rail |
| Tablet | `640–1024px` | `tablet` — 2-up grids, compressed tables |
| Desktop | `1024–1280px` | `desktop` — sidebar + main + right rail |
| Wide | `> 1280px` | Cap main content ~720px center, rail ~360px |

---

## Overview

Coinbase reads like an institutional financial brand that happens to trade crypto — the marketing surfaces are quiet, white-canvas, editorially-spaced, and almost monochromatic. The single brand voltage is **Coinbase Blue** (`fgPrimary` — `#0052ff`), used scarcely: every primary CTA pill, the brand wordmark, and inline emphasis links. Beyond that one blue, the system is white canvas + ink + soft gray elevation bands + a deep near-black editorial canvas (`bgInverse` — `#0a0b0d`) for full-bleed product-mockup heroes.

Type pairs a **display face** for hero headlines with a **sans face** for body, captions, and navigation. Display sits at **weight 400** — not 700+ typical of trading platforms. The choice signals editorial calm and institutional trust rather than fintech urgency.

> **This repo:** Riforma substitutes CoinbaseDisplay / CoinbaseSans; Riforma Mono substitutes CoinbaseMono. Configured in `src/theme/defiTheme.ts` and `src/assets/fonts/riforma/`.

The page rhythm rotates three modes: bright white editorial sections, soft-gray elevation bands, and **full-bleed dark editorial heroes** carrying layered product-UI mockup cards. The dark hero with floating dashboard mockups is the single most distinctive component.

**Key characteristics:**
- Single accent color: `fgPrimary` (#0052ff) carries every primary CTA, wordmark, and inline brand link. Used scarcely.
- Modest display weights — CDS `display1` / `display2` at weight **400**, never 700+.
- Editorial pill geometry: every CTA uses `borderRadius={1000}`; every asset glyph is a circle; cards use `borderRadius={500}` (24px). Sharp corners absent.
- Full-bleed dark heroes with floating product-UI cards: `bgInverse` band + elevated cards is the brand's strongest signature pattern.
- Trading semantics: `fgPositive` / `fgNegative` — text color only, never background fills.
- 96px section rhythm — generous editorial pacing (`paddingY={6}` or `space.10` between major bands).

---

## Colors

### Brand & accent

| Token | Hex | CDS | Use |
|---|---|---|---|
| Coinbase Blue | `#0052ff` | `fgPrimary`, `bgPrimary` | Primary CTA pill, wordmark, inline links |
| Blue active | `#003ecc` | Primary button pressed state | CDS `Button variant="primary"` |
| Blue disabled | `#a8b8cc` | Disabled primary | CDS disabled button styles |
| Accent yellow | `#f4b000` | — (illustration only) | Bitcoin glyph fills in feature cards; not an action color |

### Surface

| Token | Hex | CDS | Use |
|---|---|---|---|
| Canvas | `#ffffff` | `bg` | Default page floor |
| Surface soft | `#f7f7f7` | `bgSecondaryWash` | Alternating band |
| Surface strong | `#eef0f3` | `bgAlternate` | Secondary buttons, search pills, icon plates |
| Surface dark | `#0a0b0d` | `bgInverse` | Dark heroes, CTA bands |
| Surface dark elevated | `#16181c` | `bgElevation2` (dark) | Floating mockup cards in dark heroes |

### Hairlines

| Token | Hex | CDS | Use |
|---|---|---|---|
| Hairline | `#dee1e6` | `bgLine` | 1px `Divider` on white |
| Hairline soft | `#eef0f3` | `bgAlternate` | Lighter divider |

### Text

| Token | Hex | CDS | Use |
|---|---|---|---|
| Ink | `#0a0b0d` | `fg` | Display headings, nav, emphasis |
| Body | `#5b616e` | `fgMuted` | Running text |
| Muted | `#7c828a` | `fgMuted` | Sub-titles, breadcrumbs |
| On primary | `#ffffff` | `fgInverse` | Text on blue CTAs |
| On dark | `#ffffff` | `fgInverse` | Text on dark heroes |

### Trading semantics

| Token | Hex | CDS | Use |
|---|---|---|---|
| Semantic up | `#05b169` | `fgPositive` | Price up — **text only** |
| Semantic down | `#cf202f` | `fgNegative` | Price down — **text only** |

**CDS usage:**
```tsx
<Text color="fgPositive">{formatPercentChange(change)}</Text>
<Text color="fgNegative">…</Text>
<Button variant="primary">…</Button>  {/* bgPrimary */}
<Box background="bgAlternate">…</Box>
<Divider />  {/* bgLine */}
```

---

## Typography

### Font families

| Coinbase | This repo | CDS token |
|---|---|---|
| CoinbaseDisplay | Riforma (weight 300–900) | `fontFamily.display*` |
| CoinbaseSans | Riforma | `fontFamily.body`, `headline`, `label*`, `title*` |
| CoinbaseMono | Riforma Mono | `fontFamilyMono.*` |
| CoinbaseIcons | `@coinbase/cds-icons` | `<Icon name="…" />` |

Fallback stack: `system-ui, 'Helvetica Neue', Helvetica, Arial, sans-serif`.

The display/body split is functional: display tokens carry hero headlines only; sans tokens carry everything else.

### Hierarchy — marketing → CDS

| Marketing token | Size | Weight | CDS `font` | Use in app |
|---|---|---|---|---|
| `display-mega` | 80px | 400 | `display1` (64px) or custom | Marketing heroes only |
| `display-xl` | 64px | 400 | `display1` | Large balance (if needed) |
| `display-lg` | 52px | 400 | `display3` | Section heads |
| `display-md` | 44px | 400 | — | CTA-band headlines |
| `display-sm` | 36px | 400 | `display2` | **Home total balance** |
| `title-lg` | 32px | 400 | `title1` | Card group titles |
| `title-md` | 18px | 600 | `title3` | Component titles, asset row primary |
| `title-sm` | 16px | 600 | `headline` | List labels, nav items |
| `body-md` | 16px | 400 | `body` | Default body |
| `body-sm` | 14px | 400 | `label2` | Secondary copy |
| `caption` | 13px | 400 | `legal` | Photo captions |
| `caption-strong` | 12px | 600 | `caption` | Badge labels (uppercase) |
| `number-display` | 18px | 500 | `title3` + `fontFamilyMono` | Prices, % change |
| `button` | 16px | 600 | `headline` on `Button` | CTA pill |
| `nav-link` | 14px | 500 | `label2` | Sidebar / top nav |

**CDS usage:**
```tsx
<Text font="display2">$1,234.56</Text>           {/* balance */}
<Text font="headline">Crypto</Text>               {/* row label */}
<Text font="label2" color="fgMuted">Balance</Text>
<Text font="title3">Prices</Text>                 {/* section title */}
```

### Principles

- **Display weight stays at 400.** CDS `fontWeight.display*` is 400 by default — do not override to 700.
- **Negative letter-spacing on display only** — apply via `style={{ letterSpacing: '-0.02em' }}` on `display*` if matching marketing heroes; body stays 0.
- **Mono on every number.** Use Riforma Mono for prices, balances, and percent changes. Prefer `fontFamilyMono` tokens or tabular contexts in market tables.
- **Do not mix display and sans in the same headline.**

### Font substitutes (licensed → this repo)

| Licensed | Substitute |
|---|---|
| CoinbaseDisplay | Riforma (Regular / Medium for emphasis) |
| CoinbaseSans | Riforma |
| CoinbaseMono | Riforma Mono |

---

## Layout

### Spacing system

- **Base unit:** 4px (CDS `space` scale).
- **Section padding:** `paddingY={6}`–`{8}` (48–64px) for editorial bands; `paddingY={10}` (80px) approximates 96px section rhythm.
- **Card internal padding:** `padding={4}` (32px) for feature cards.
- **Row padding:** `paddingY={1.5}` (12px) for asset rows; `paddingX={2}` (16px) for gutters.

### App shell grid (logged-in Home)

This app mirrors Coinbase Home's three-column shell:

```
┌──────────┬─────────────────────────────┬──────────────┐
│ Sidebar  │ Main (max ~720px)           │ Right rail   │
│ ~auto    │ Balance · For you · Prices  │ ~360px       │
│          │                             │ Trade + QA   │
└──────────┴─────────────────────────────┴──────────────┘
```

| Zone | Width | CDS layout |
|---|---|---|
| Sidebar | auto-collapse | `<Sidebar autoCollapse>` |
| Main | `flexGrow={1}`, `maxWidth={720}` | `<VStack>` sections separated by `<Divider />` |
| Right rail | `width={360}`, `minWidth={320}` | Flat — no card elevation on quick actions |
| Navbar | full width | `<NavigationBar>` + `<SearchInput compact>` |

**Main content sections (top → bottom):**
1. Balance header — `display2` + compact sparkline (right-aligned)
2. Crypto / Cash breakdown — 3-column rows + `caretRight`
3. For you — horizontal `UpsellCard` carousel
4. Prices — asset rows with sparkline, `fgPositive`/`fgNegative`, actions

**Right rail (top → bottom):**
1. `SegmentedTabs` — Buy / Sell / Convert
2. Order type dropdown pill
3. Large amount input + Max chip + BTC swap line
4. Pay with / Buy selector rows (connected icons)
5. Primary CTA pill
6. `Divider`
7. Quick actions — flat list, blue circle icons

### Whitespace philosophy

Generous editorial pacing — closer to Bloomberg or the FT than a trading terminal. Density lives in tables (Explore, Analytics), not on Home. Use `gap={2}`–`{3}` between components; `gap={0}` inside tight lists.

---

## Elevation & depth

| Level | Treatment | CDS |
|---|---|---|
| Flat | No shadow | Default — 80% of surfaces |
| Hairline border | 1px divider | `<Divider />`, `background="bgAlternate"` rows |
| Soft drop | `0 4px 12px rgba(0,0,0,0.04)` | `Card elevation={1}` sparingly |
| Photographic | Full-bleed mockups | Marketing only |

**Do not** add multiple shadow tiers. Quick actions and trade panel sit **flat** on the canvas (no card wrapper).

---

## Shapes

Pill for interactive, 24px radius for containers, full circle for icons. Sharp corners absent.

| Use | CDS |
|---|---|
| CTA buttons | `Button borderRadius={1000}` |
| Search | `SearchInput compact` (pill) |
| Order type chip | `Pressable borderRadius={1000}` |
| Feature cards | `Card` / `borderRadius={500}` |
| Asset icons | `borderRadius={1000}`, 40×40 or 32×32 |
| Form inputs | `TextInput` default (`borderRadius={300}`) |

---

## Components

### Navigation

| Pattern | CDS component | Tokens |
|---|---|---|
| Sidebar nav | `Sidebar`, `SidebarItem` | `fg` / `fgPrimary` active, `bgPrimaryWash` active wash |
| Top bar | `NavigationBar`, `NavigationTitle` | height ~64px, `paddingX={2}` |
| Search pill | `SearchInput compact` | `bgAlternate` fill |
| Wallet | `UserMenu` | `Button variant="secondary" compact` |

### Buttons

| Pattern | CDS | Spec |
|---|---|---|
| Primary pill | `Button variant="primary" block borderRadius={1000}` | Blue, white text, 44px height |
| Secondary | `Button variant="secondary"` | `bgAlternate` fill |
| Tertiary link | `Button variant="transparent"` or `Pressable` | `fgPrimary` text |
| Max chip | `Chip compact background="bgAlternate"` | Gray pill |

### Home — balance block

| Element | CDS | Layout |
|---|---|---|
| Total balance | `Text font="display2"` | Left |
| Sparkline | `Sparkline` 96×28, `#0052ff` | Right-aligned, no period labels |
| Crypto/Cash row | `HStack` 3 columns | Icon plate · Balance · Earn APY · `caretRight` |
| Earn APY | `Text color="fgPositive" font="label2"` | Green text only |

### Home — prices / market table

| Element | CDS | Layout |
|---|---|---|
| Section title | `Text font="title3"` | — |
| Asset row | `HStack` | Icon · name · sparkline · price · change · actions |
| Price | `Text font="label1"` | — |
| 24h change | `Text color="fgPositive\|fgNegative"` | **No background fill** |
| Sparkline | `Sparkline` + `useSparklinePath` | Red if down, blue if up |
| Table (Explore) | `Table`, `TableRow`, `TableCell` | Paginated, 8 rows/page |

### Home — trade panel

| Element | CDS | Notes |
|---|---|---|
| Tabs | `SegmentedTabs` | Buy / Sell / Convert |
| Order dropdown | `Dropdown` + `Pressable` pill | "One-time order" |
| Amount | Large native `input` + `Text font="display2"` suffix | Max `Chip` right |
| Swap line | `Icon arrowsUpDown` + blue `Text` | e.g. "0 BTC" |
| Selectors | `Pressable` rows + `CircleTokenIcon` | Vertical connector line |
| CTA | `Button variant="primary" block borderRadius={1000}` | "Top up USD wallet" |

### Home — quick actions

| Element | CDS | Notes |
|---|---|---|
| Container | `VStack` — **no Card** | Flat on canvas |
| Row | `Pressable` + `HStack` | Blue circle icon + `Text font="headline"` |
| Separator | `Divider` above section | — |

### Cards & upsells

| Pattern | CDS |
|---|---|
| For you carousel | `UpsellCard` in horizontal `HStack overflow="auto"` |
| Wallet summary | `Card`, `CardBody` |
| Data viz | `Sparkline`, `SparklineInteractive`, `LineChart` |

### Forms

| Pattern | CDS |
|---|---|
| Text input | `TextInput` — `borderRadius={300}`, hairline border |
| Search | `SearchInput compact` — pill, `bgAlternate` |
| Select | `Dropdown` + `SelectOption` |

### Tags & badges

| Pattern | CDS |
|---|---|
| Badge pill | `Chip` or `Tag` — `caption` font, `borderRadius={1000}` |

---

## Do's and don'ts

### Do

- Reserve `fgPrimary` for primary CTAs, wordmark, and inline accent links.
- Set every CTA to `borderRadius={1000}`; every asset glyph to a circle.
- Keep display headlines at weight 400 (`font="display1|display2|display3"`).
- Use dark/light band rotation as page rhythm where marketing pages exist.
- Render numerical values in mono (`fontFamilyMono` / Riforma Mono).
- Use `fgPositive` / `fgNegative` as **text color only** for price changes.
- Follow the three-column Home shell: sidebar · main · right rail.

### Don't

- Don't introduce a secondary brand color. Blue is the only action color.
- Don't bold display copy (`fontWeight` 700 on display tokens).
- Don't add multiple drop-shadow tiers.
- Don't use sharp corners on CTAs.
- Don't use green/red as button backgrounds.
- Don't wrap quick actions or trade panel in elevated cards — they sit flat.
- Don't use `SparklineInteractive` with period labels on the Home balance chart — use compact `Sparkline`.

---

## Responsive behavior

### Breakpoints

| Name | Width | Key changes |
|---|---|---|
| Mobile | `< 640px` | Stack main + rail; sidebar collapses; asset rows stack |
| Tablet | `640–1024px` | 2-up cards; compressed table columns |
| Desktop | `1024–1280px` | Full three-column Home layout |
| Wide | `> 1280px` | Main capped ~720px; content centered in flex region |

### CDS responsive props

```tsx
<Box width={{ base: '100%', desktop: 360 }} />
<VStack maxWidth={{ base: 500, desktop: 720 }} />
```

Use `MediaQueryProvider` (already in `App.tsx`) for breakpoint context.

### Touch targets

- Primary CTA: 44px min height — `Button` default.
- Hero CTA: 56px — `Button` with extra `paddingY`.
- Asset icon: 32–40px circle + row `paddingY={1.5}` → ~48px tap zone.
- Search pill: 44px — `SearchInput compact`.

### Collapsing strategy

- Sidebar: `autoCollapse` below desktop width.
- Home right rail: stack below main on mobile (future: `flexDirection={{ base: 'column', desktop: 'row' }}`).
- Balance sparkline: stays right-aligned on desktop; full width below on mobile.
- Market tables: horizontal scroll or stacked cells on mobile.

---

## Charts & data viz (CDS)

| Use | Component | Package |
|---|---|---|
| Balance trend (Home) | `Sparkline` | `@coinbase/cds-web/visualizations` |
| Interactive portfolio chart | `SparklineInteractive` or `LineChart` | prefer `LineChart` for new work |
| Price row sparkline | `Sparkline` + `useSparklinePath` | `@coinbase/cds-common` |
| Area / line charts | `LineChart`, `AreaChart` | `@coinbase/cds-web/visualizations/chart` |
| Loading | `ProgressCircle` | tables and data fetches |

Chart stroke color for brand line: `#0052ff` (`CHART_STROKE_COLOR` in `src/utils/chartData.ts`).

---

## Theming in code

```tsx
// src/App.tsx
import { ThemeProvider } from '@coinbase/cds-web';
import { defiTheme } from './theme/defiTheme';

<ThemeProvider theme={defiTheme} activeColorScheme="light">
  <MediaQueryProvider>…</MediaQueryProvider>
</ThemeProvider>
```

Extend `defiTheme` for color overrides — map marketing hex values to CDS `lightColor` / `darkColor` keys rather than scattering hex in components.

```tsx
// src/theme/defiTheme.ts — example color alignment
export const defiTheme = {
  ...defaultTheme,
  id: 'defi-riforma',
  fontFamily: withFontStack(RIFORMA_SANS),
  fontFamilyMono: withFontStack(RIFORMA_MONO),
  lightColor: {
    ...defaultTheme.lightColor,
    fgPrimary: 'rgb(0, 82, 255)',      // #0052ff
    fgPositive: 'rgb(5, 177, 105)',    // #05b169
    fgNegative: 'rgb(207, 32, 47)',    // #cf202f
  },
};
```

---

## Iteration guide

1. Focus on one component at a time. Map marketing tokens → CDS tokens using tables above.
2. New CTAs: `borderRadius={1000}`; new icon plates: circle; cards: `borderRadius={500}`.
3. Use CDS theme tokens (`fg`, `bgAlternate`, `font="headline"`) — avoid inline hex except chart blue `#0052ff`.
4. Hover states: CDS handles; document Default and Pressed only.
5. Display at 400, body at 400/600, numbers in mono.
6. Coinbase Blue stays scarce — one or two blue moments per band.

---

## Known gaps

- Riforma substitutes licensed Coinbase typefaces; swap to Coinbase fonts if licensed.
- In-product trading surfaces (order book, depth charts) are not fully implemented — trade panel is UI shell.
- Animation timings out of scope.
- Form validation states beyond focus not documented.
- Accent yellow (`#f4b000`) is illustration-only (Bitcoin glyphs).
- `defiTheme` currently overrides fonts only; semantic color hex alignment is documented but optional to implement.

---

## File map

| Path | Purpose |
|---|---|
| `design.md` | This guide |
| `src/theme/defiTheme.ts` | CDS theme extension |
| `src/theme/fontTokens.ts` | Riforma font stacks |
| `src/theme/fonts.css` | `--defaultFont-sans` / `--defaultFont-mono` CSS vars |
| `src/assets/fonts/riforma/` | WOFF2 files + `font-face.css` |
| `src/components/Home/` | Coinbase Home layout components |
| `src/utils/chartData.ts` | Sparkline data + `CHART_STROKE_COLOR` |
