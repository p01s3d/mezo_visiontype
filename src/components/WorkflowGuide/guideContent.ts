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
    'Walk the product in order: open the app, check net worth on Home, drill into My assets, review Transactions, trade from the rail, then explore market data and polish.',
};

export const DEEP_DIVE_CHAPTERS: DeepDiveChapter[] = [
  {
    id: 'shell',
    title: 'Shell — sidebar and routing',
    body: 'The app opens to a fixed sidebar, scrollable main column, and routes for Home, My assets, Transactions, and Earn sections. Collapsed nav tooltips portal outside the shell so they stay visible.',
    steps: [
      'Bootstrap from the CDS Vite template and extend defiTheme with Riforma fonts',
      'Mount DefiSidebar + Navbar inside a 100vh HStack; main column scrolls alone',
      'Route navConfig entries to HomeDashboard, HoldingsView, TransactionsView, or AssetList',
      'Wrap the tree in PortalProvider for tooltip overlays',
    ],
    previewKey: 'shell',
  },
  {
    id: 'home',
    title: 'Home — weekly net-worth check-in',
    body: 'The first screen after connect: total balance with a compact trend strip, then allocation into Cash / Crypto / DeFi. The preview shows only these two regions so they fit the card.',
    steps: [
      'BalanceOverview — display2 total with a right-aligned Sparkline',
      'BalanceBreakdown — three allocation rows driven by tokenCategories.ts',
      'ForYouSection and PricesSection live below on the full page',
      'Wrap in DashboardWithTradeRail so Buy / Sell stays visible',
    ],
    previewKey: 'home',
  },
  {
    id: 'holdings',
    title: 'My assets — holdings by category',
    body: 'Drill down from Home: large total, underline tabs for Cash | Crypto | DeFi, category total on the tab row, then a table with Name · Balance · Current price.',
    steps: [
      'Add holdings to navConfig and route in App.tsx',
      'Group tokens with tokenCategories.ts; demo data when disconnected',
      'Extract DashboardTableList for shared column headers and row dividers',
      'HoldingsList rows — icon, USD value + amount, unit price',
      'Reuse DashboardWithTradeRail',
    ],
    previewKey: 'holdings',
  },
  {
    id: 'transactions',
    title: 'Transactions — activity history',
    body: 'Manage recurring buys up top, then activity rows with Details · Amount · Date. Green and red signed amounts show direction.',
    steps: [
      'Add Transactions nav with receipt icon',
      'demoTransactions.ts for sample buys, deposits, and sends',
      'Recurring buys row above the activity list',
      'TransactionsList — token or cash icon, two-line amount, formatted date',
      'Reuse DashboardTableList grid from My assets',
    ],
    previewKey: 'transactions',
  },
  {
    id: 'trade',
    title: 'Trade rail — buy from any page',
    body: 'A persistent right column on Home, My assets, and Transactions: segmented Buy / Sell / Convert, order-type dropdown, large amount input, connected Pay with / Buy rows, and flat quick actions.',
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
    body: 'Earn nav sections (Borrow, Market, Pools, Vaults) pull live APY and TVL from DefiLlama. useDefiData handles fetch, refresh, and errors; defiViews.ts filters by active nav.',
    steps: [
      'fetchYieldPools and fetchProtocols in src/api/defillama.ts',
      'useDefiData loads on mount with optional refresh',
      'AssetList renders filtered pools or protocols per nav view',
      'Zerion wallet data powers Home and My assets when connected',
    ],
    previewKey: 'data',
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
