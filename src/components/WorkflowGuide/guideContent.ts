export type DeepDiveChapter = {
  id: string;
  title: string;
  body: string;
  steps: string[];
  previewKey: import('./previews').PreviewKey;
};

export const HERO = {
  title: 'Portfolio — build guide',
  subtitle:
    'Walk the product in order: open the app, check net worth on Home, drill into My assets, review LP activity on Transactions, manage liquidity on Pools, trade from the rail, explore market data, score positions with AI verdicts, then polish.',
};

export const DEEP_DIVE_CHAPTERS: DeepDiveChapter[] = [
  {
    id: 'shell',
    title: 'Shell — sidebar and routing',
    body: 'The app opens to a fixed sidebar, scrollable main column, and routes for Home, My assets, Transactions, Pools, and Earn sections. Collapsed nav tooltips portal outside the shell so they stay visible.',
    steps: [
      'Bootstrap from the CDS Vite template and extend defiTheme with Riforma fonts',
      'Mount DefiSidebar + Navbar inside a 100vh HStack; main column scrolls alone',
      'Route navConfig entries to HomeDashboard, HoldingsView, TransactionsView, PoolsView, or AssetList',
      'Wrap the tree in PortalProvider for tooltip overlays',
    ],
    previewKey: 'shell',
  },
  {
    id: 'home',
    title: 'Home — weekly net-worth check-in',
    body: 'The first screen after connect: total balance with a compact trend strip, then allocation into Cash / Crypto / DeFi / Liquidity pools. The preview shows only these two regions so they fit the card.',
    steps: [
      'BalanceOverview — display2 total with a right-aligned CompactLineChart',
      'BalanceBreakdown — allocation rows driven by tokenCategories.ts plus grouped LP total',
      'HealthScorePanel and PricesSection live below on the full page',
      'Wrap in DashboardWithTradeRail so Buy / Sell stays visible',
    ],
    previewKey: 'home',
  },
  {
    id: 'holdings',
    title: 'My assets — holdings by category',
    body: 'Drill down from Home: large total, underline tabs for Cash | Crypto | DeFi, category total below the tab row, then a table with Name · Balance · Current price.',
    steps: [
      'Add holdings to navConfig and route in App.tsx',
      'Group tokens with tokenCategories.ts; demo data when disconnected',
      'Category total below tabs (title2, light weight) — not on the tab row',
      'HoldingsList rows — icon, USD value + amount, unit price',
      'Reuse DashboardWithTradeRail',
    ],
    previewKey: 'holdings',
  },
  {
    id: 'transactions',
    title: 'Transactions — activity history',
    body: 'Manage recurring buys up top, then a full-width divider, Activity with filter chips, and LP-only rows with Details · Amount · Date. Green and red signed amounts show direction.',
    steps: [
      'Add Transactions nav with receipt icon',
      'fetchWalletLpTransactions — deposit, withdraw, claim from Zerion',
      'Recurring buys row, then DashboardSectionDivider above Activity',
      'LpTransactionsList — protocol + pool label, signed USD, formatted date',
      'Reuse DashboardTableList grid from My assets',
    ],
    previewKey: 'transactions',
  },
  {
    id: 'pools',
    title: 'Pools — liquidity positions',
    body: 'Earn → Pools shows total LP value at the top, then grouped Zerion positions: Pool · Value · Unrealized PnL (USD with % below). Demo data when disconnected.',
    steps: [
      'Route Pools nav to PoolsView (personal + liquidity view)',
      'groupPoolPositions — group Zerion legs by group_id',
      'fetchWalletFungiblePnl — join unrealized gain per fungible ID',
      'PoolsList + PoolPnlValue — compact dashboard table layout',
      'Reuse DashboardWithTradeRail',
    ],
    previewKey: 'pools',
  },
  {
    id: 'trade',
    title: 'Trade rail — buy from any page',
    body: 'A persistent right column on Home, My assets, Transactions, and Pools: segmented Buy / Sell / Convert, order-type dropdown, large amount input, connected Pay with / Buy rows, and flat quick actions.',
    steps: [
      'DashboardWithTradeRail — main column + vertical Divider + TradeRail',
      'TradePanel — SegmentedTabs, dropdown pill, MAX chip, primary CTA',
      'AssetSelectorList — shared icon column with connector line between rows',
      'QuickActions below a Divider — no elevated card wrapper',
    ],
    previewKey: 'trade',
  },
  {
    id: 'data',
    title: 'Market data — pools and protocols',
    body: 'Earn nav sections (Borrow, Market, Vaults) pull live APY and TVL from DefiLlama. Pools uses Zerion wallet LP positions instead. useDefiData handles fetch, refresh, and errors; defiViews.ts filters by active nav.',
    steps: [
      'fetchYieldPools and fetchProtocols in src/api/defillama.ts',
      'useDefiData loads on mount with optional refresh',
      'AssetList renders filtered pools or protocols per nav view',
      'Zerion wallet data powers Home, Pools, and My assets when connected',
    ],
    previewKey: 'data',
  },
  {
    id: 'verdicts',
    title: 'AI health — portfolio score + alerts',
    body: 'On Home load, Zerion history and DefiLlama signals feed a deterministic health score (0–100) with vs-BTC factors. One OpenRouter call writes the narrative and row chips. High-severity issues toast and land in the Navbar inbox.',
    steps: [
      'Real Zerion balance + fungible charts; BTC overlay rebased to 100',
      'computePortfolioHealthScore — drawdown, vs BTC, concentration, LP signals',
      'HealthScorePanel — CDS bento cards; AI calibrates arcs + performance copy',
      'One portfolio OpenRouter synthesis (narrative + chips + alert copy)',
      'In-app alerts: high → toast + inbox; medium/low → inbox only',
    ],
    previewKey: 'verdicts',
  },
  {
    id: 'polish',
    title: 'Polish — motion and interaction',
    body: 'Lottie icons in the sidebar on one row, quick-action icons on a second row, Pressable row feedback across lists, and design.md tokens for spacing and color discipline.',
    steps: [
      'AnimatedNavIcon — ten sidebar entries in a grid row',
      'AnimatedQuickActionIcon — four actions on their own row below',
      'HomePressableRow on every interactive list row',
      'defiTheme font stacks and fgPrimary scarcity from design.md',
      'Fixed shell — sidebar does not scroll with main content',
    ],
    previewKey: 'polish',
  },
];

// Re-export appendix data
export {
  COMPONENT_MAP,
  STACK_ROWS,
  type ComponentMapRow,
  type StackRow,
} from './workflowContent';
