export type WorkflowStep = {
  id: string;
  action: string;
  outcome: string;
};

export type WorkflowPhase = {
  number: number;
  title: string;
  summary: string;
  steps: WorkflowStep[];
  keyFiles: string[];
  cdsComponents: string[];
};

export type IterationRow = {
  iteration: string;
  reference: string;
  built: string;
};

export type ComponentMapRow = {
  region: string;
  file: string;
  cds: string;
};

export type StackRow = {
  layer: string;
  choice: string;
  notes: string;
};

export const PREREQUISITES = [
  'Node 22 (see .nvmrc)',
  'Familiarity with CDS component docs at cds.coinbase.com',
  'Optional: Zerion API key for wallet positions (VITE_ZERION_API_KEY in .env)',
  'Optional: OpenRouter API key for AI verdicts (VITE_OPENROUTER_API_KEY in .env)',
];

export const ITERATION_LOOP_STEPS = [
  'Attach a Coinbase (or target) screenshot as reference',
  'Audit the CDS catalog for matching primitives (Sparkline, Table, Card, etc.)',
  'Build one section with CDS layout tokens — not raw CSS first',
  'Compare side-by-side in the browser preview',
  'Select elements in preview for micro-fixes (spacing, weights, icons)',
  'Reuse shared list primitives (DashboardTableList, PriceList) before adding new row markup',
  'Repeat until the section matches; move to the next region',
];

export const WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    number: 1,
    title: 'Specify the library and bootstrap',
    summary: 'Chose CDS + Vite, bootstrapped the template, and retuned nav for Portfolio sections (Home, My assets, Transactions, Earn).',
    steps: [
      {
        id: '1.1',
        action: 'Paste CDS templates docs and choose Vite (SPA, fast dashboard iteration)',
        outcome: 'Stack decision locked',
      },
      {
        id: '1.2',
        action: 'Bootstrap via gitpick coinbase/cds/tree/master/templates/vite-app',
        outcome: 'Working shell: sidebar, navbar, asset table, sidebar cards',
      },
      {
        id: '1.3',
        action: 'Rename to defi-system, git init, retune nav for portfolio sections',
        outcome: 'Domain-specific scaffold',
      },
    ],
    keyFiles: ['package.json', 'src/App.tsx', 'src/data/navConfig.ts'],
    cdsComponents: ['Sidebar', 'NavigationBar', 'Table', 'Card', 'ThemeProvider'],
  },
  {
    number: 2,
    title: 'Make it real with live data',
    summary: 'Added DefiLlama market tables, wagmi wallet connect, and Zerion portfolio positions behind a Vite proxy.',
    steps: [
      {
        id: '2.1',
        action: 'Wire DefiLlama (yields.llama.fi/pools, api.llama.fi/protocols)',
        outcome: 'Market tables show real APY and TVL',
      },
      {
        id: '2.2',
        action: 'Add useDefiData hook and nav-based filtering in defiViews.ts',
        outcome: 'Each sidebar section shows a different data slice',
      },
      {
        id: '2.3',
        action: 'Integrate wagmi for wallet connect',
        outcome: 'UserMenu and on-chain identity',
      },
      {
        id: '2.4',
        action: 'Personal portfolio via Zerion (Vite proxy for API key)',
        outcome: 'Wallet positions and token holdings',
      },
    ],
    keyFiles: [
      'src/api/defillama.ts',
      'src/hooks/useDefiData.ts',
      'src/hooks/useWalletPositions.ts',
      'src/api/zerion.ts',
      'vite.config.ts',
    ],
    cdsComponents: ['Banner', 'Spinner', 'Pagination', 'Button'],
  },
  {
    number: 3,
    title: 'Screenshot-driven Home UI',
    summary: 'Built HomeDashboard from Coinbase screenshots — balance, allocation, For you nudges, prices table, and trade rail.',
    steps: [
      {
        id: '3.1',
        action: 'Full Coinbase home screenshot → HomeDashboard shell with trade rail',
        outcome: 'Balance, allocation, For you, prices, DashboardWithTradeRail',
      },
      {
        id: '3.2',
        action: 'Cropped balance screenshot → BalanceOverview + BalanceBreakdown',
        outcome: 'Sparkline beside display2 balance; Cash / Crypto / DeFi allocation',
      },
      {
        id: '3.3',
        action: 'Trade panel screenshot → TradePanel + AssetSelectorList',
        outcome: 'Order dropdown, numeric input, MAX, connected pay/buy icons',
      },
      {
        id: '3.4',
        action: 'Prices table screenshot → PricesSection + PriceList',
        outcome: 'Watchlist dropdown, sparklines, buy/watchlist actions',
      },
      {
        id: '3.5',
        action: 'Browser element selection for micro-fixes',
        outcome: 'Font weights, icon colors, divider spacing, row alignment',
      },
    ],
    keyFiles: [
      'src/components/Home/HomeDashboard.tsx',
      'src/components/Home/BalanceOverview.tsx',
      'src/components/Home/BalanceBreakdown.tsx',
      'src/components/Home/TradePanel.tsx',
      'src/components/Home/PricesSection.tsx',
      'src/components/Home/PriceList.tsx',
    ],
    cdsComponents: ['Sparkline', 'SegmentedTabs', 'Dropdown', 'Divider', 'Pressable'],
  },
  {
    number: 4,
    title: 'Codify design rules',
    summary: 'Captured marketing tokens in design.md and applied Riforma fonts through defiTheme.',
    steps: [
      {
        id: '4.1',
        action: 'Paste Coinbase marketing design language into design.md',
        outcome: 'Marketing hex → CDS token mapping (fgPrimary, bgSecondaryWash, space scale)',
      },
      {
        id: '4.2',
        action: 'Apply Riforma fonts at theme level in defiTheme.ts',
        outcome: 'Brand substitute for CoinbaseDisplay / CoinbaseSans',
      },
    ],
    keyFiles: ['design.md', 'src/theme/defiTheme.ts', 'src/assets/fonts/riforma/'],
    cdsComponents: ['ThemeProvider', 'Text font tokens', 'space / borderRadius tokens'],
  },
  {
    number: 5,
    title: 'Brand, motion, and shell polish',
    summary: 'Portfolio logo, Lottie nav, HomePressableRow interactions, fixed 100vh shell, and PortalProvider tooltips.',
    steps: [
      {
        id: '5.1',
        action: 'Portfolio bar-chart mark in CDSLogo',
        outcome: 'src/components/CDSLogo/index.tsx — branded as Portfolio',
      },
      {
        id: '5.2',
        action: 'Lottie animated sidebar nav (Home, My assets, Transactions, Earn)',
        outcome: 'DefiSidebar, navConfig.ts, navIcons.ts',
      },
      {
        id: '5.3',
        action: 'Lottie quick-action icons',
        outcome: 'AnimatedQuickActionIcon + lottie-react',
      },
      {
        id: '5.4',
        action: 'Press/hover feedback on rows and cards',
        outcome: 'HomePressableRow wrapping interactive surfaces',
      },
      {
        id: '5.5',
        action: 'Fixed shell scroll + portaled tooltips',
        outcome: 'PortalProvider, 100vh layout, collapsed nav tooltips unclipped',
      },
    ],
    keyFiles: [
      'src/components/CDSLogo/index.tsx',
      'src/components/Sidebar/DefiSidebar.tsx',
      'src/components/Home/AnimatedQuickActionIcon.tsx',
      'src/components/Home/HomePressableRow.tsx',
      'src/App.tsx',
    ],
    cdsComponents: ['Pressable', 'Icon', 'Sidebar', 'PortalProvider', 'Tooltip'],
  },
  {
    number: 6,
    title: 'Portfolio v1 product pages',
    summary: 'Shipped My assets, LP Transactions, and Pools pages with shared DashboardTableList, FilterGroup, and Zerion wallet data.',
    steps: [
      {
        id: '6.1',
        action: 'Group holdings by Cash / Crypto / DeFi via tokenCategories.ts',
        outcome: 'Category tabs, totals below tabs, demo portfolio when disconnected',
      },
      {
        id: '6.2',
        action: 'My assets page with shared DashboardTableList grid',
        outcome: 'HoldingsView + HoldingsList — Name, Balance, Current price columns',
      },
      {
        id: '6.3',
        action: 'For you nudges from holdings in portfolioNudges.ts',
        outcome: 'Horizontal dismissible cards — concentration, chain, ETH yield, stables',
      },
      {
        id: '6.4',
        action: 'Transactions page — LP-only activity from Zerion',
        outcome: 'Manage row, divider above Activity, LpTransactionsList',
      },
      {
        id: '6.5',
        action: 'Pools page — grouped liquidity positions with unrealized PnL',
        outcome: 'PoolsView + PoolsList — total balance, Pool · Value · PnL',
      },
      {
        id: '6.6',
        action: 'Persist trade rail on Home, My assets, Transactions, and Pools',
        outcome: 'DashboardWithTradeRail shared layout wrapper',
      },
    ],
    keyFiles: [
      'src/components/Home/HoldingsView.tsx',
      'src/components/Home/HoldingsList.tsx',
      'src/components/Home/TransactionsView.tsx',
      'src/components/Home/LpTransactionsList.tsx',
      'src/components/Home/PoolsView.tsx',
      'src/components/Home/PoolsList.tsx',
      'src/components/Home/DashboardTableList.tsx',
      'src/components/Home/FilterGroup.tsx',
      'src/utils/groupPoolPositions.ts',
      'src/utils/poolPnl.ts',
      'src/utils/portfolioNudges.ts',
      'src/utils/tokenCategories.ts',
      'src/data/demoLpTransactions.ts',
      'src/data/demoPools.ts',
    ],
    cdsComponents: ['VStack', 'HStack', 'Divider', 'Pressable', 'Text', 'Dropdown'],
  },
  {
    number: 7,
    title: 'AI position health',
    summary:
      'Joined Zerion positions to DefiLlama signals, ranked candidates with rules, and called OpenRouter on Home load for Hold / Reduce / Exit cards plus Chip badges across the portfolio.',
    steps: [
      {
        id: '7.1',
        action: 'Join wallet LP / tokens to DefiLlama pools via matchPoolToDefiLlama',
        outcome: 'Market APY, TVL, and 24h change available per position',
      },
      {
        id: '7.2',
        action: 'Rule pre-filter in healthSignals.ts → HealthCandidate list',
        outcome: 'Only risky or opportunity-rich positions reach the model',
      },
      {
        id: '7.3',
        action: 'OpenRouter client + positionVerdictPrompt (≤4 calls, session cache)',
        outcome: 'JSON Hold / Reduce / Exit with short reasoning',
      },
      {
        id: '7.4',
        action: 'ForYouSection verdict cards + HealthIndicator on lists',
        outcome: 'Home cards, holdings/pools chips, risky-deposit Banner',
      },
      {
        id: '7.5',
        action: 'protocolLinks + dismiss/refetch via verdictSessionCache',
        outcome: 'DEX deep links and dismissible cards without refetch spam',
      },
    ],
    keyFiles: [
      'src/hooks/usePositionHealth.ts',
      'src/utils/healthSignals.ts',
      'src/utils/matchPoolToDefiLlama.ts',
      'src/api/openrouter.ts',
      'src/prompts/positionVerdictPrompt.ts',
      'src/components/Home/ForYouSection.tsx',
      'src/components/Home/ForYouCard.tsx',
      'src/components/Home/HealthIndicator.tsx',
      'src/data/demoVerdicts.ts',
      'src/utils/protocolLinks.ts',
      'src/utils/verdictSessionCache.ts',
    ],
    cdsComponents: ['Chip', 'Banner', 'Tooltip', 'Pictogram', 'Pressable', 'Button'],
  },
];

export const ITERATION_ROWS: IterationRow[] = [
  {
    iteration: 'Shell',
    reference: 'CDS Vite template + nav screenshot',
    built: 'DefiSidebar, Navbar, routing, PortalProvider',
  },
  {
    iteration: 'Home',
    reference: 'Full Coinbase home screenshot',
    built: 'Balance, allocation, For you, prices watchlist',
  },
  {
    iteration: 'My assets',
    reference: 'Coinbase assets list screenshot',
    built: 'HoldingsView — category tabs, DashboardTableList',
  },
  {
    iteration: 'Transactions',
    reference: 'Coinbase activity screenshot',
    built: 'TransactionsView — LP-only feed, divider above Activity',
  },
  {
    iteration: 'Pools',
    reference: 'Zerion grouped LP positions',
    built: 'PoolsView — total balance, PoolsList with unrealized PnL',
  },
  {
    iteration: 'Trade rail',
    reference: 'Trade panel screenshot',
    built: 'TradePanel, AssetSelectorList connector, quick actions',
  },
  {
    iteration: 'Market data',
    reference: 'DefiLlama + Zerion APIs',
    built: 'AssetList tables, wallet tokens and LP positions',
  },
  {
    iteration: 'AI health',
    reference: 'OpenRouter + Zerion charts + DefiLlama',
    built: 'CDS bento health cards; OpenRouter calibrates arcs + performance copy',
  },
  {
    iteration: 'Polish',
    reference: 'Sidebar tooltip + scroll fixes',
    built: 'Lottie nav, HomePressableRow, fixed shell',
  },
];

export const COMPONENT_MAP: ComponentMapRow[] = [
  { region: 'App shell', file: 'src/App.tsx', cds: 'ThemeProvider, PortalProvider, HStack' },
  { region: 'Sidebar', file: 'src/components/Sidebar/DefiSidebar.tsx', cds: 'Sidebar, Tooltip' },
  { region: 'Navbar', file: 'src/components/Navbar/index.tsx', cds: 'NavigationBar, IconButton' },
  { region: 'Home dashboard', file: 'src/components/Home/HomeDashboard.tsx', cds: 'Banner, Divider, VStack' },
  { region: 'Balance + chart', file: 'src/components/Home/BalanceOverview.tsx', cds: 'CompactLineChart, RollingUsdBalance' },
  { region: 'Allocation', file: 'src/components/Home/BalanceBreakdown.tsx', cds: 'Pressable, Text, HStack' },
  { region: 'Portfolio health', file: 'src/components/Home/HealthScorePanel.tsx', cds: 'Custom bento (dark) + Banner' },
  { region: 'Health score logic', file: 'src/utils/portfolioHealthScore.ts', cds: '— (logic only)' },
  { region: 'In-app alerts', file: 'src/utils/healthAlerts.ts', cds: 'Toast, Tray, NotificationBell' },
  { region: 'Balance charts', file: 'src/hooks/useWalletBalanceChart.ts', cds: 'CompactLineChart overlay' },
  { region: 'Prices table', file: 'src/components/Home/PricesSection.tsx', cds: 'Dropdown, Divider' },
  { region: 'Price rows', file: 'src/components/Home/PriceList.tsx', cds: 'HomePressableRow, PriceSparkline' },
  { region: 'Trade rail layout', file: 'src/components/Home/TradeRail.tsx', cds: 'HStack, Divider, VStack' },
  { region: 'Trade panel', file: 'src/components/Home/TradePanel.tsx', cds: 'SegmentedTabs, Dropdown, Button' },
  { region: 'Asset selectors', file: 'src/components/Home/AssetSelectorList.tsx', cds: 'TokenIcon, HomePressableRow' },
  { region: 'Quick actions', file: 'src/components/Home/QuickActions.tsx', cds: 'VStack, Pressable' },
  { region: 'My assets page', file: 'src/components/Home/HoldingsView.tsx', cds: 'Pressable tabs, RollingUsdBalance' },
  { region: 'Holdings table', file: 'src/components/Home/HoldingsList.tsx', cds: 'DashboardTableList, TokenIcon, Chip' },
  { region: 'Transactions page', file: 'src/components/Home/TransactionsView.tsx', cds: 'FilterGroup, Banner, DashboardSectionDivider' },
  { region: 'LP activity table', file: 'src/components/Home/LpTransactionsList.tsx', cds: 'DashboardTableList, Chip, Text' },
  { region: 'Pools page', file: 'src/components/Home/PoolsView.tsx', cds: 'RollingUsdBalance, PoolsList' },
  { region: 'Pool rows + PnL', file: 'src/components/Home/PoolsList.tsx', cds: 'DashboardTableList, PoolPnlValue, Chip' },
  { region: 'Pool grouping', file: 'src/utils/groupPoolPositions.ts', cds: '— (logic only)' },
  { region: 'Pool PnL join', file: 'src/utils/poolPnl.ts', cds: '— (logic only)' },
  { region: 'Shared table grid', file: 'src/components/Home/DashboardTableList.tsx', cds: 'Box grid, Text, Divider' },
  { region: 'Filter chips', file: 'src/components/Home/FilterGroup.tsx', cds: 'Pressable, IconButton' },
  { region: 'Portfolio nudges', file: 'src/utils/portfolioNudges.ts', cds: '— (logic only)' },
  { region: 'Health join', file: 'src/utils/matchPoolToDefiLlama.ts', cds: '— (logic only)' },
  { region: 'Health rules', file: 'src/utils/healthSignals.ts', cds: '— (logic only)' },
  { region: 'Position health', file: 'src/hooks/usePositionHealth.ts', cds: '— (logic only)' },
  { region: 'Portfolio AI prompt', file: 'src/prompts/portfolioHealthPrompt.ts', cds: '— (logic only)' },
  { region: 'OpenRouter synthesis', file: 'src/api/openrouter.ts', cds: '— (logic only)' },
  { region: 'Verdict cache', file: 'src/utils/verdictSessionCache.ts', cds: '— (logic only)' },
  { region: 'Demo health score', file: 'src/data/demoHealthScore.ts', cds: '— (demo data)' },
  { region: 'DEX deep links', file: 'src/utils/protocolLinks.ts', cds: '— (logic only)' },
  { region: 'Health badges', file: 'src/components/Home/HealthIndicator.tsx', cds: 'Chip, Tooltip' },
  { region: 'Market tables', file: 'src/components/AssetList/index.tsx', cds: 'Table, Banner, Pagination' },
];

export const STACK_ROWS: StackRow[] = [
  { layer: 'UI framework', choice: 'React 19 + TypeScript', notes: 'Vite 7 SPA' },
  { layer: 'Design system', choice: '@coinbase/cds-web v9', notes: 'Icons + illustrations packages' },
  { layer: 'Theme', choice: 'defiTheme (Riforma fonts)', notes: 'Extends defaultTheme' },
  { layer: 'Wallet', choice: 'wagmi + viem', notes: 'Injected connector' },
  { layer: 'Market data', choice: 'DefiLlama APIs', notes: 'Pools + protocols, no key' },
  { layer: 'Portfolio', choice: 'Zerion API', notes: 'Proxied via vite.config.ts' },
  { layer: 'AI health', choice: 'OpenRouter (one portfolio call)', notes: 'Score + narrative + chips + alert copy' },
  { layer: 'Charts', choice: 'Zerion wallet + fungible charts', notes: 'BTC overlay via WBTC / env fungible id' },
  { layer: 'Motion', choice: 'lottie-react', notes: 'Sidebar + quick-action icons' },
  { layer: 'Overlays', choice: 'PortalProvider', notes: 'Tooltips, Tray inbox, Toast alerts' },
];

export const FLOW_PILLS = [
  'Specify CDS',
  'Vite template',
  'Live data',
  'Wallet',
  'Screenshots',
  'Portfolio v1',
  'Liquidity pools',
  'design.md',
  'AI verdicts',
  'Polish',
];
