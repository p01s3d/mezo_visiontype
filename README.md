# DeFi System

A DeFi dashboard built with [Coinbase Design System (CDS)](https://cds.coinbase.com) and Vite.

## Setup

```sh
nvm use
npx yarn
```

## Development

- `npx yarn dev` — run the app in development mode
- `npx yarn build` — build for production
- `npx yarn preview` — preview the production build

## Stack

- React 19 + TypeScript
- Vite 7
- `@coinbase/cds-web`, `@coinbase/cds-icons`, `@coinbase/cds-illustrations`

## Build guide

An in-app developer walkthrough with live CDS previews and real code from this repo. There is no sidebar link — open it by URL and share that link directly.

```sh
npx yarn dev
# then open http://localhost:5173/?guide
```

Production / preview builds use the same query: `/?guide`.

### What it covers

| Chapter | Topic |
| --- | --- |
| Shell | Sidebar, routing, PortalProvider |
| Home | Net worth, allocation breakdown, trade rail |
| My assets | Holdings by Cash / Crypto / DeFi |
| Transactions | LP activity history |
| Pools | Liquidity positions and unrealized PnL |
| Trade rail | Buy / Sell / Convert panel |
| Market data | DefiLlama pools and protocols |
| AI health | Deviation vs BTC, allocation bars, score arcs, daily heatmap, narrative & yield |
| Theme | Cream / coral palette, Copernicus · Styrene · JetBrains |
| Polish | Motion, pressable rows, spacing discipline |

Source: `src/components/WorkflowGuide/` (`guideContent.ts` for copy and chapters).

Static export helpers (optional): `yarn export:guide-preview` and `export/guide-static-draft/`.

## Documentation

Visit [cds.coinbase.com](https://cds.coinbase.com) for CDS component docs and theming guides.
