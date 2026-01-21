# Investment Portal Architecture

A clean, scalable component structure for the ETF investment portal.

---

## 1. Folder Structure

```
src/
├── components/
│   ├── common/                    # Reusable UI primitives
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Badge.js
│   │   ├── Dropdown.js
│   │   ├── MultiSelect.js
│   │   ├── SearchInput.js
│   │   ├── Table.js
│   │   ├── EmptyState.js
│   │   ├── LoadingSpinner.js
│   │   ├── Tooltip.js
│   │   └── index.js               # Barrel export
│   │
│   ├── layout/                    # Page structure components
│   │   ├── DashboardLayout.js
│   │   ├── Sidebar.js
│   │   ├── Header.js
│   │   ├── PageContainer.js
│   │   └── index.js
│   │
│   ├── dashboard/                 # Dashboard-specific components
│   │   ├── SummaryCards.js
│   │   ├── SummaryCard.js
│   │   ├── MarketTicker.js
│   │   ├── QuickActions.js
│   │   └── index.js
│   │
│   ├── portfolio/                 # Portfolio components
│   │   ├── PortfolioTable.js
│   │   ├── PortfolioRow.js
│   │   ├── PortfolioSummary.js
│   │   ├── PositionCard.js
│   │   ├── AllocationChart.js
│   │   └── index.js
│   │
│   ├── trading/                   # Trading components
│   │   ├── ETFBrowser.js
│   │   ├── OrderBasket.js
│   │   ├── OrderForm.js
│   │   ├── OrderRow.js
│   │   ├── TradeConfirmation.js
│   │   └── index.js
│   │
│   ├── filters/                   # Filter system (reusable)
│   │   ├── FilterPanel.js
│   │   ├── FilterSection.js
│   │   ├── FilterDropdown.js
│   │   ├── FilterMultiSelect.js
│   │   ├── ActiveFilterChips.js
│   │   ├── CategoryTabs.js
│   │   └── index.js
│   │
│   └── modals/                    # Modal components
│       ├── ModalContainer.js
│       ├── ConfirmationModal.js
│       ├── ErrorModal.js
│       ├── TradeModal.js
│       └── index.js
│
├── pages/                         # Page-level components
│   ├── Dashboard.js
│   ├── TradingDashboard.js
│   ├── Portfolio.js
│   ├── Settings.js
│   └── index.js
│
├── context/                       # React Context providers
│   ├── TradingContext.js          # IB connection, orders, account
│   ├── PortfolioContext.js        # Portfolio data, positions
│   ├── FilterContext.js           # Global filter state
│   ├── ModalContext.js            # Modal management
│   └── index.js
│
├── hooks/                         # Custom React hooks
│   ├── useETFFilters.js           # ETF filter logic
│   ├── usePortfolio.js            # Portfolio data access
│   ├── useTrading.js              # Trading operations
│   ├── useMarketData.js           # Real-time market data
│   ├── useLocalStorage.js         # Persistent state
│   ├── useDebounce.js             # Input debouncing
│   └── index.js
│
├── data/                          # Static data & configurations
│   ├── tradableETFs.js            # ETF universe
│   ├── filterDefinitions.js       # Filter configs per category
│   ├── categoryConfig.js          # Category metadata
│   └── constants.js               # App-wide constants
│
├── utils/                         # Utility functions
│   ├── etfClassifiers.js          # ETF classification logic
│   ├── portfolioUtils.js          # Portfolio calculations
│   ├── formatters.js              # Number/date formatting
│   ├── validators.js              # Input validation
│   └── api.js                     # API helpers
│
├── styles/                        # Global styles
│   ├── globals.css                # Base styles, Tailwind imports
│   └── variables.css              # CSS custom properties
│
└── App.js                         # Root component
```

---

## 2. Component Tree

```
App
├── AuthProvider
│   └── TradingProvider
│       └── PortfolioProvider
│           └── FilterProvider
│               └── ModalProvider
│                   └── Router
│                       ├── Dashboard (/)
│                       │   ├── DashboardLayout
│                       │   │   ├── Header
│                       │   │   ├── Sidebar
│                       │   │   └── PageContainer
│                       │   │       ├── SummaryCards
│                       │   │       │   ├── SummaryCard (Total Value)
│                       │   │       │   ├── SummaryCard (Portfolio)
│                       │   │       │   ├── SummaryCard (Cash)
│                       │   │       │   └── SummaryCard (Return)
│                       │   │       ├── MarketTicker
│                       │   │       └── PortfolioTable
│                       │   │           └── PortfolioRow[]
│                       │   │
│                       ├── TradingDashboard (/trading)
│                       │   ├── DashboardLayout
│                       │   │   └── PageContainer
│                       │   │       ├── ETFBrowser
│                       │   │       │   ├── CategoryTabs
│                       │   │       │   ├── SearchInput
│                       │   │       │   ├── FilterPanel
│                       │   │       │   │   ├── FilterSection[]
│                       │   │       │   │   │   └── FilterDropdown | FilterMultiSelect
│                       │   │       │   │   └── ActiveFilterChips
│                       │   │       │   └── Table
│                       │   │       │       └── ETFRow[]
│                       │   │       └── OrderBasket
│                       │   │           ├── OrderRow[]
│                       │   │           └── OrderForm
│                       │   │
│                       └── Portfolio (/portfolio)
│                           ├── DashboardLayout
│                           │   └── PageContainer
│                           │       ├── PortfolioSummary
│                           │       ├── AllocationChart
│                           │       └── PortfolioTable
│
└── ModalContainer (Portal)
    ├── ConfirmationModal
    ├── ErrorModal
    └── TradeModal
```

---

## 3. Component Responsibilities

### Layout Components

#### `DashboardLayout`
```jsx
// Wraps all pages with consistent structure
// Props: children, showSidebar, title
// Responsibilities:
// - Render Header, Sidebar, PageContainer
// - Handle responsive sidebar collapse
// - Manage page-level loading states
```

#### `Header`
```jsx
// Top navigation bar
// Responsibilities:
// - Display logo/branding
// - Connection status indicator
// - User menu / settings
// - Trading mode badge (PAPER/LIVE)
```

#### `Sidebar`
```jsx
// Navigation sidebar
// Responsibilities:
// - Navigation links with active states
// - Quick access to trading
// - Collapsible on mobile
```

#### `PageContainer`
```jsx
// Content wrapper with consistent padding
// Props: children, title, subtitle, actions
// Responsibilities:
// - Page title rendering
// - Action buttons (top right)
// - Consistent max-width and padding
```

---

### Dashboard Components

#### `SummaryCards`
```jsx
// Grid of financial summary cards
// Data source: PortfolioContext
// Responsibilities:
// - Fetch/display portfolio summary
// - Handle loading states
// - Responsive grid layout
```

#### `SummaryCard`
```jsx
// Individual metric card
// Props: title, value, change, changePercent, icon, trend
// Responsibilities:
// - Display formatted value
// - Show trend indicator (up/down/neutral)
// - Handle currency formatting
```

#### `MarketTicker`
```jsx
// Scrolling market indices
// Data source: useMarketData hook
// Responsibilities:
// - Fetch major indices (S&P 500, AEX, etc.)
// - Auto-refresh at interval
// - Animated scrolling display
```

---

### Portfolio Components

#### `PortfolioTable`
```jsx
// Main portfolio positions table
// Data source: PortfolioContext
// Props: positions, onSort, sortConfig
// Responsibilities:
// - Render sortable table
// - Handle empty state
// - Pagination (if needed)
```

#### `PortfolioRow`
```jsx
// Single position row
// Props: position, onAction
// Responsibilities:
// - Display position details
// - Format numbers/percentages
// - Action buttons (trade, details)
```

#### `AllocationChart`
```jsx
// Portfolio allocation visualization
// Props: allocations
// Responsibilities:
// - Pie/donut chart rendering
// - Legend with percentages
// - Hover tooltips
```

---

### Trading Components

#### `ETFBrowser`
```jsx
// Main ETF discovery component
// Data source: useETFFilters hook
// Responsibilities:
// - Coordinate filters, search, results
// - Handle category changes
// - Connect to OrderBasket
```

#### `OrderBasket`
```jsx
// Shopping cart for orders
// Data source: TradingContext
// Props: items, onRemove, onSubmit
// Responsibilities:
// - Display pending orders
// - Calculate totals
// - Submit all orders
```

#### `OrderForm`
```jsx
// Order entry form
// Props: etf, onSubmit, onCancel
// Responsibilities:
// - Quantity/amount input
// - Order type selection (market/limit)
// - Validation and preview
```

#### `TradeConfirmation`
```jsx
// Order confirmation modal
// Props: order, onConfirm, onCancel
// Responsibilities:
// - Display order summary
// - Show fees/costs
// - Confirm/cancel actions
```

---

### Filter Components

#### `FilterPanel`
```jsx
// Container for all filter controls
// Props: category, filters, onFilterChange
// Responsibilities:
// - Render FilterSections based on category config
// - Coordinate filter state
// - Show/hide based on toggle
```

#### `FilterSection`
```jsx
// Collapsible group of related filters
// Props: title, filters, expanded, onToggle
// Responsibilities:
// - Render group of FilterDropdowns
// - Handle collapse/expand
// - Support for different layouts
```

#### `FilterDropdown`
```jsx
// Single-select filter dropdown
// Props: label, options, value, onChange
// Responsibilities:
// - Render dropdown UI
// - Handle selection
// - Show clear button when active
```

#### `FilterMultiSelect`
```jsx
// Multi-select filter (e.g., providers)
// Props: label, options, selected, onChange
// Responsibilities:
// - Render searchable multi-select
// - Checkbox-style selection
// - "X selected" display
```

#### `ActiveFilterChips`
```jsx
// Display of active filters
// Props: chips, onRemove, onClear
// Responsibilities:
// - Render removable chips
// - Color-code by filter type
// - "Clear all" button
```

#### `CategoryTabs`
```jsx
// Category selection tabs
// Props: categories, active, onChange, counts
// Responsibilities:
// - Render category buttons with icons
// - Show counts per category
// - Handle selection
```

---

### Common Components

#### `Card`
```jsx
// Reusable card container
// Props: children, padding, className
// Variants: default, elevated, interactive
```

#### `Button`
```jsx
// Reusable button component
// Props: children, variant, size, disabled, loading
// Variants: primary, secondary, ghost, danger
```

#### `Badge`
```jsx
// Status/count badge
// Props: children, variant, size
// Variants: default, success, warning, error, info
```

#### `Table`
```jsx
// Reusable table component
// Props: columns, data, sortable, onSort
// Features: sticky header, loading state
```

#### `EmptyState`
```jsx
// Empty state placeholder
// Props: icon, title, description, action
```

#### `LoadingSpinner`
```jsx
// Loading indicator
// Props: size, text
```

---

## 4. Filter Architecture

### Config-Driven Approach

```javascript
// data/filterDefinitions.js

export const CATEGORY_FILTERS = {
  equity: {
    sections: [
      {
        id: 'primary',
        title: 'Primaire Filters',
        collapsible: false,
        filters: [
          { id: 'region', type: 'single', label: 'Regio', options: 'REGION_OPTIONS' },
          { id: 'sector', type: 'single', label: 'Sector', options: 'SECTOR_OPTIONS' },
        ],
      },
      {
        id: 'secondary',
        title: 'Kenmerken',
        collapsible: true,
        defaultExpanded: false,
        filters: [
          { id: 'marketCap', type: 'single', label: 'Marktkapitalisatie', options: 'MARKET_CAP_OPTIONS' },
          { id: 'strategy', type: 'single', label: 'Strategie', options: 'STRATEGY_OPTIONS' },
        ],
      },
    ],
  },
  bonds: {
    sections: [
      {
        id: 'primary',
        title: 'Type Obligatie',
        filters: [
          { id: 'bondType', type: 'single', label: 'Type', options: 'BOND_TYPE_OPTIONS' },
          { id: 'duration', type: 'single', label: 'Looptijd', options: 'DURATION_OPTIONS' },
        ],
      },
    ],
  },
  // ... other categories
};

export const FILTER_OPTIONS = {
  REGION_OPTIONS: [
    { value: 'all', label: 'Alle Regio\'s' },
    { value: 'world', label: 'Wereld' },
    { value: 'europe', label: 'Europa' },
    // ...
  ],
  // ... other option sets
};
```

### FilterPanel Rendering

```jsx
// components/filters/FilterPanel.js

export function FilterPanel({ category, filters, onFilterChange }) {
  const config = CATEGORY_FILTERS[category];

  if (!config) return null;

  return (
    <div className="space-y-4">
      {config.sections.map((section) => (
        <FilterSection
          key={section.id}
          title={section.title}
          collapsible={section.collapsible}
          defaultExpanded={section.defaultExpanded}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {section.filters.map((filterDef) => {
              const options = getFilterOptions(filterDef.options);

              if (filterDef.type === 'multi') {
                return (
                  <FilterMultiSelect
                    key={filterDef.id}
                    label={filterDef.label}
                    options={options}
                    selected={filters[filterDef.id] || []}
                    onChange={(value) => onFilterChange(filterDef.id, value)}
                  />
                );
              }

              return (
                <FilterDropdown
                  key={filterDef.id}
                  label={filterDef.label}
                  options={options}
                  value={filters[filterDef.id] || 'all'}
                  onChange={(value) => onFilterChange(filterDef.id, value)}
                />
              );
            })}
          </div>
        </FilterSection>
      ))}
    </div>
  );
}
```

---

## 5. State Management

### Context Structure

```
┌─────────────────────────────────────────────────────────┐
│                      App                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │               TradingContext                     │   │
│  │  - IB connection state                          │   │
│  │  - Account info                                 │   │
│  │  - Order basket                                 │   │
│  │  - Trading mode (paper/live)                    │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │          PortfolioContext               │   │   │
│  │  │  - Positions (cached)                   │   │   │
│  │  │  - Account summary                      │   │   │
│  │  │  - Last updated timestamp               │   │   │
│  │  │  ┌─────────────────────────────────┐   │   │   │
│  │  │  │       FilterContext             │   │   │   │
│  │  │  │  - Active filters               │   │   │   │
│  │  │  │  - Search term                  │   │   │   │
│  │  │  │  - Sort config                  │   │   │   │
│  │  │  │  - Category                     │   │   │   │
│  │  │  └─────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### TradingContext

```javascript
// context/TradingContext.js

const TradingContext = createContext();

const initialState = {
  // Connection
  isConnected: false,
  isConnecting: false,
  connectionError: null,

  // Account
  account: null,
  tradingMode: 'paper', // 'paper' | 'live'

  // Order basket
  basket: [],

  // Loading states
  isLoading: false,
};

const ACTIONS = {
  SET_CONNECTED: 'SET_CONNECTED',
  SET_ACCOUNT: 'SET_ACCOUNT',
  ADD_TO_BASKET: 'ADD_TO_BASKET',
  REMOVE_FROM_BASKET: 'REMOVE_FROM_BASKET',
  CLEAR_BASKET: 'CLEAR_BASKET',
  SET_ERROR: 'SET_ERROR',
};

function tradingReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CONNECTED:
      return { ...state, isConnected: action.payload, isConnecting: false };
    case ACTIONS.ADD_TO_BASKET:
      return { ...state, basket: [...state.basket, action.payload] };
    // ... other cases
  }
}

export function TradingProvider({ children }) {
  const [state, dispatch] = useReducer(tradingReducer, initialState);

  // Connection management
  // Order operations
  // API calls

  return (
    <TradingContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </TradingContext.Provider>
  );
}
```

### PortfolioContext (with Caching)

```javascript
// context/PortfolioContext.js

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const initialState = {
  positions: [],
  summary: null,
  lastUpdated: null,
  isLoading: false,
  error: null,
};

export function PortfolioProvider({ children }) {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);
  const { state: tradingState } = useTrading();

  // Load from localStorage on mount (offline support)
  useEffect(() => {
    const cached = localStorage.getItem('portfolio_cache');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      if (age < CACHE_DURATION) {
        dispatch({ type: 'SET_PORTFOLIO', payload: data });
      }
    }
  }, []);

  // Fetch fresh data when connected
  const fetchPortfolio = useCallback(async () => {
    if (!tradingState.isConnected) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await api.getPortfolio();
      dispatch({ type: 'SET_PORTFOLIO', payload: data });

      // Cache for offline
      localStorage.setItem('portfolio_cache', JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [tradingState.isConnected]);

  return (
    <PortfolioContext.Provider value={{ state, fetchPortfolio }}>
      {children}
    </PortfolioContext.Provider>
  );
}
```

### FilterContext

```javascript
// context/FilterContext.js

const initialState = {
  category: 'equity',
  filters: {},
  searchTerm: '',
  sortBy: 'name',
  sortDir: 'asc',
};

export function FilterProvider({ children }) {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  // Reset filters when category changes
  const setCategory = useCallback((category) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const setFilter = useCallback((filterId, value) => {
    dispatch({ type: 'SET_FILTER', payload: { filterId, value } });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  return (
    <FilterContext.Provider value={{ state, setCategory, setFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}
```

---

## 6. Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│                        User Action                              │
│                    (click filter, search)                       │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                      FilterContext                              │
│                   dispatch(SET_FILTER)                          │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                    useETFFilters Hook                           │
│   - Reads filter state from context                            │
│   - Applies filters to cached enrichedETFs                     │
│   - Returns filteredETFs (memoized)                            │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                       ETFBrowser                                │
│   - Receives filteredETFs                                       │
│   - Renders Table with results                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Offline Support Strategy

### Cached Data
| Data | Storage | Duration | Refresh |
|------|---------|----------|---------|
| ETF Universe | Static import | Permanent | Build time |
| Portfolio | localStorage | 5 min | On connect |
| Market Data | Memory | 1 min | Auto-refresh |
| Filter State | Memory | Session | User action |

### Offline Behavior
```javascript
// When disconnected:
// 1. Show cached portfolio data
// 2. Show "Last updated: X minutes ago"
// 3. Disable trading actions
// 4. Allow browsing ETFs (static data)
// 5. Auto-reconnect in background

function OfflineIndicator() {
  const { isConnected, lastConnected } = useTrading();

  if (isConnected) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
      <span className="text-amber-400 text-sm">
        Offline - Showing cached data from {formatRelativeTime(lastConnected)}
      </span>
    </div>
  );
}
```

---

## 8. Performance Optimizations

### Memoization Strategy
```javascript
// Expensive computations are memoized at the hook level
const enrichedETFs = useMemo(() => computeEnrichedETFs(), []);
const filteredETFs = useMemo(() => applyFilters(enrichedETFs, filters), [enrichedETFs, filters]);
const categoryCounts = useMemo(() => computeCounts(enrichedETFs), [enrichedETFs]);
```

### Virtualization (for large lists)
```javascript
// Use react-window for lists > 100 items
import { FixedSizeList } from 'react-window';

function VirtualizedETFList({ items }) {
  return (
    <FixedSizeList
      height={500}
      itemCount={items.length}
      itemSize={60}
    >
      {({ index, style }) => (
        <ETFRow style={style} etf={items[index]} />
      )}
    </FixedSizeList>
  );
}
```

### Code Splitting
```javascript
// Lazy load heavy components
const TradingDashboard = lazy(() => import('./pages/TradingDashboard'));
const Portfolio = lazy(() => import('./pages/Portfolio'));

// In router
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/trading" element={<TradingDashboard />} />
</Suspense>
```

---

## 9. Implementation Priority

### Phase 1: Core Structure
1. [ ] Create folder structure
2. [ ] Extract common components (Button, Card, Badge)
3. [ ] Create DashboardLayout
4. [ ] Set up context providers

### Phase 2: Filter System
5. [ ] Create FilterDropdown component
6. [ ] Create FilterMultiSelect component
7. [ ] Create FilterSection component
8. [ ] Create FilterPanel component
9. [ ] Create ActiveFilterChips component

### Phase 3: Dashboard
10. [ ] Create SummaryCard component
11. [ ] Create SummaryCards container
12. [ ] Create MarketTicker component

### Phase 4: Trading
13. [ ] Refactor ETFBrowser to use new filter components
14. [ ] Create OrderBasket component
15. [ ] Create TradeConfirmation modal

### Phase 5: Polish
16. [ ] Add loading states
17. [ ] Add error boundaries
18. [ ] Add offline indicators
19. [ ] Performance optimization

---

## 10. File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FilterPanel.js` |
| Hooks | camelCase with `use` prefix | `useETFFilters.js` |
| Context | PascalCase with `Context` suffix | `TradingContext.js` |
| Utils | camelCase | `formatters.js` |
| Constants | SCREAMING_SNAKE_CASE (exports) | `export const API_BASE_URL` |
| CSS Modules | kebab-case | `filter-panel.module.css` |

---

## 11. Import Conventions

```javascript
// 1. React imports
import React, { useState, useEffect, useMemo } from 'react';

// 2. Third-party libraries
import { TrendingUp, Search } from 'lucide-react';

// 3. Context/Hooks
import { useTrading } from '../context/TradingContext';
import { useETFFilters } from '../hooks/useETFFilters';

// 4. Components (relative)
import { Card, Button, Badge } from '../common';
import { FilterPanel } from '../filters';

// 5. Utils/Data
import { formatCurrency } from '../utils/formatters';
import { CATEGORY_FILTERS } from '../data/filterDefinitions';

// 6. Styles (if any)
import styles from './Component.module.css';
```
