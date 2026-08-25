import { GUIDE_PREVIEW_WIDTH_NARROW } from './previewConstants';

export type DeepDiveChapter = {
  id: string;
  title: string;
  body: string;
  steps: string[];
  previewKey: import('./previews').PreviewKey | [import('./previews').PreviewKey, import('./previews').PreviewKey];
  previewWidth?: number;
  previewOverflow?: 'hidden' | 'visible';
};

export const HERO = {
  title: 'Build a dashboard',
  subtitle:
    'A step-by-step guide to assembling a personal portfolio app from wallet data, DeFi positions, and the tools you choose — not a walled garden that mines your holdings for ads. Your net worth, your positions, your keys: the data should stay yours.',
};

export const DEEP_DIVE_CHAPTERS: DeepDiveChapter[] = [
  {
    id: 'shell',
    title: 'Shell — sidebar and routing',
    body: 'Fixed sidebar with Home, My assets, Transactions, Borrow, Vote, and Pools — no section labels. Main column scrolls; collapsed nav tooltips portal outside the shell.',
    steps: [
      'Bootstrap from the CDS Vite template; ThemeProvider wraps defiTheme (see Theme chapter)',
      'Mount DefiSidebar + Navbar inside a 100vh HStack; main column scrolls alone',
      'Route navConfig entries to HomeDashboard, HoldingsView, TransactionsView, BorrowView, VoteView, PoolsView',
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
    body: 'Manage recurring buys up top, then a full-width divider, Activity heading, and LP-only rows with Details · Amount · Date. Green and red signed amounts show direction.',
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
    previewWidth: GUIDE_PREVIEW_WIDTH_NARROW,
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
    id: 'verdicts-deviation',
    title: 'AI health — performance deviation',
    body: 'Rebased portfolio vs BTC over the trailing window. Gap callout marks the widest spread; hatch fill between the lines shows relative drift.',
    steps: [
      'Real Zerion balance + fungible charts; BTC overlay rebased to 100',
      'computeDeviationMetrics — net worth % − BTC % (pp), simple ahead/behind copy',
      'DeviationChart — portfolio vs BTC lines with max-gap badge',
      'Chart panel uses a soft bgLine tint behind the plot',
    ],
    previewKey: 'verdicts-deviation',
  },
  {
    id: 'verdicts-allocation',
    title: 'AI health — allocation performance',
    body: 'Sleeve returns broken into Cash · Crypto · DeFi · Liquidity bars with 1D / 30D / 1Y tabs. Bars enter with stagger; period change morphs in parallel.',
    steps: [
      'AllocationPerformanceCard — sleeve month performance with period tabs',
      'useSleeveMonthPerformance — Zerion fungible charts per token category',
      'groupPoolPositions + tokenCategories drive sleeve totals',
      'CSS scaleY enter animation on first view; ease-in-out on tab change',
    ],
    previewKey: 'verdicts-allocation',
  },
  {
    id: 'verdicts-score',
    title: 'AI health — portfolio score',
    body: 'Deterministic health score (0–100) with risk, consistency, and diversification arcs. AI refines arc labels when OpenRouter is connected.',
    steps: [
      'computePortfolioHealthScore — drawdown, vs BTC, concentration, LP signals',
      'computeArcScores — rule-based arc values from wallet + pool data',
      'HealthArcGauge — three semicircle fills with staggered enter',
      'InsightsRollingNumber on the score readout',
    ],
    previewKey: 'verdicts-health-arc',
    previewOverflow: 'visible',
  },
  {
    id: 'verdicts-daily',
    title: 'AI health — daily performance',
    body: 'Daily Performance stacks dollar change and period % over a heatmap of recent days. Green and blush cells show up/down days at a glance.',
    steps: [
      'computeDailyPerformance — heatmap cells from raw portfolio series',
      'DailyHeatmap + signed change row under display2 amount',
      'Soft mint / blush cell fills — not strict PnL red/green',
      'AI dailyInsight copy when OpenRouter is connected',
    ],
    previewKey: 'verdicts-daily',
  },
  {
    id: 'verdicts-ai',
    title: 'AI health — narrative & yield',
    body: 'One OpenRouter call writes crypto insight copy and calibrates bento cards. Potential yield shows matched APY and idle-book breakdown. High-severity issues toast and land in the Navbar inbox.',
    steps: [
      'One portfolio OpenRouter synthesis (narrative + chips + alert copy)',
      'CryptoInsightsCard — DefiLlama trending protocols as chips',
      'YieldIdleCard — matched yield APY and stables vs rest bar',
      'In-app alerts: high → toast + inbox; medium/low → inbox only',
    ],
    previewKey: ['verdicts-crypto', 'verdicts-yield'],
  },
  {
    id: 'theme',
    title: 'Theme — cream, coral, and type',
    body: 'design-mvp cream surfaces with coral chrome, Copernicus display type, Riforma UI, and Riforma Mono tabular numbers. Chart lines use portfolio teal and BTC amber — coral is accent only. PnL stays strict green/red; bento heatmaps use soft mint and blush.',
    steps: [
      'defiTheme.ts — extend CDS defaultTheme with cream spectrum, coral fgPrimary, and dark navy floor',
      'fontTokens.ts + fonts.css + cream/riforma font-face imports in main.tsx — Copernicus / Riforma / Riforma Mono',
      'App.tsx sets --chart-portfolio, --chart-benchmark, --chart-accent per color scheme',
      'DeviationChart, health arcs, and allocation bars read chart CSS vars — not PnL polarity',
      'DailyHeatmap soft fills; fgPositive / fgNegative reserved for signed money',
    ],
    previewKey: 'theme',
  },
  {
    id: 'polish',
    title: 'Polish — motion and interaction',
    body: 'Lottie nav icons in a 3×2 grid, quick-action icons on a row below, Pressable row feedback across lists, and design.md tokens for spacing and motion discipline.',
    steps: [
      'AnimatedNavIcon — six sidebar entries in a 3×2 grid',
      'AnimatedQuickActionIcon — four actions on their own row below',
      'HomePressableRow on every interactive list row',
      'Spacing and fgPrimary scarcity from design.md — chart color rules in Theme chapter',
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
