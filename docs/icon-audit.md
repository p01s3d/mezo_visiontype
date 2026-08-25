# Icon audit: consolidate five parallel icon systems onto one library

> Filed as a doc because GitHub Issues is disabled on this repository. Move to an
> issue once Issues is enabled.

## Problem

Icons in this app come from **five unrelated sources** with no shared sizing, stroke,
or color contract. They don't look like one set because they aren't one set.

## Audit — what's actually in the tree today

### 1. CDS icons

`@coinbase/cds-web/icons`, used in **17 files**. The closest thing to a house
standard. Size props are spread across the whole scale with no rule about which
means what:

| size | uses |
| ---- | ---- |
| `s`  | 17   |
| `m`  | 7    |
| `l`  | 3    |
| `xl` | 2    |
| `xs` | 1    |

### 2. Lottie animated icons

`src/data/navIcons.ts` drives the sidebar. Several are semantically wrong because
they were picked for shape, not meaning:

| Nav item          | Sourced from                     |
| ----------------- | -------------------------------- |
| Pools             | `030 Weather/wind-2`             |
| Vote              | `024 warning check/tick-square`  |
| Rewards           | `023 Power/flash-circle`         |
| Logo (`CDSLogo`)  | `025 Random Misc/mirror`         |

Dark mode is handled in `AnimatedNavIcon.tsx` with `filter: brightness(0) invert(1)`
— it flattens every icon to pure white and would destroy any color an icon carries.

### 3. Hand-rolled inline SVG

`src/components/Mezo/icons.tsx`, 12 icons, no shared defaults:

- default sizes: `12`, `13`, `16`, `20`, `22`, `44`
- stroke widths: `1.7`, `1.8`, `1.9`

### 4. Remote raster PNGs

`assets.coincap.io` referenced from `demoTransactions.ts`, `AssetSelectorList.tsx`,
and `PricesTablePreview.tsx`. Runtime dependency on a third-party CDN with **no
fallback** — when the host is unreachable these render as broken-image boxes with
alt text, which is currently visible in the Buy panel (`USD` / `BTC`).

### 5. Raw `<img>`

Protocol logos in `CryptoInsightsCard.tsx`, bypassing the `TokenIcon` component
that exists for exactly this.

### Dead weight

`src/assets/icons/` vendors **3,800 Lottie JSON files across 30 packs — 39MB**.
**15 are imported.** The other ~3,785 ship in the repo and are never referenced.

## Proposal

**Standardize on CDS icons (`@coinbase/cds-web/icons`) as the single source for UI
icons.** It's already the most-used source, already a dependency, and already the
design system the rest of the app is built on — so this is consolidation onto the
existing standard, not adopting something new.

Three categories, three rules:

1. **UI icons → CDS.** Replace the hand-rolled `Mezo/icons.tsx` set. Define a size
   scale mapping (e.g. `xs` inline-with-text, `s` default UI, `m` primary actions,
   `l`+ display only) and apply it.
2. **Nav icons → keep Lottie, narrowly.** Animation is a real feature here. But
   re-source the semantically wrong ones, and replace the `brightness(0) invert(1)`
   hack with proper theme-aware color.
3. **Token/asset logos → not UI icons.** These are brand marks. Bundle a local set,
   and give `TokenIcon` a deterministic fallback (symbol monogram) so a CDN outage
   degrades instead of breaking.

Then prune the ~3,785 unused Lottie files (39MB → well under 1MB).

## Scope of work

- [ ] Inventory every icon call site and map each to its target category
- [ ] Agree the size scale and document it
- [ ] Migrate `Mezo/icons.tsx` call sites to CDS; delete the file
- [ ] Re-source semantically wrong nav icons
- [ ] Fix dark-mode nav coloring (drop the invert filter)
- [ ] Bundle token logos locally; add `TokenIcon` fallback
- [ ] Route `CryptoInsightsCard` through `TokenIcon`
- [ ] Prune unused Lottie packs from `src/assets/icons/`
- [ ] Add a lint rule or CI check against raw `<img>` / inline `<svg>` for icons

## Out of scope

Chart and data-viz SVG (`TimelineChart`, `DeviationChart`, `HealthArcGauge`) —
those are drawings, not icons.

## Open questions

- Does CDS cover every glyph currently hand-rolled? Any gap needs a documented
  exception path.
- Is the Lottie nav animation worth its remaining bundle cost, or should nav fall
  back to static CDS icons too?
