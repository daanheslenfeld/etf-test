/**
 * Demo Mode Data
 * Realistic mock data for Vercel deployment without backend
 */

// Demo account info
export const demoAccountInfo = {
  broker_account_linked: true,
  ib_account_id: 'DEMO123456',
  account_type: 'Individual',
  base_currency: 'EUR',
  status: 'Active',
};

// Demo account summary
export const demoAccountSummary = {
  cash_balance: 15420.50,
  available_funds: 14850.25,
  portfolio_value: 52340.80,
  total_value: 67761.30,
  unrealized_pnl: 3240.50,
  unrealized_pnl_percent: 6.59,
  buying_power: 14850.25,
};

// Demo positions
export const demoPositions = [
  {
    symbol: 'IWDA',
    conid: 43645828,
    name: 'iShares Core MSCI World UCITS ETF',
    isin: 'IE00B4L5Y983',
    quantity: 125,
    avgCost: 78.50,
    marketPrice: 82.45,
    marketValue: 10306.25,
    unrealizedPnL: 493.75,
    unrealizedPnLPercent: 5.03,
    currency: 'EUR',
    exchange: 'AEB',
  },
  {
    symbol: 'VWCE',
    conid: 428759564,
    name: 'Vanguard FTSE All-World UCITS ETF',
    isin: 'IE00BK5BQT80',
    quantity: 85,
    avgCost: 105.20,
    marketPrice: 112.80,
    marketValue: 9588.00,
    unrealizedPnL: 646.00,
    unrealizedPnLPercent: 7.23,
    currency: 'EUR',
    exchange: 'AEB',
  },
  {
    symbol: 'EMIM',
    conid: 239782328,
    name: 'iShares Core MSCI EM IMI UCITS ETF',
    isin: 'IE00BKM4GZ66',
    quantity: 200,
    avgCost: 28.90,
    marketPrice: 30.15,
    marketValue: 6030.00,
    unrealizedPnL: 250.00,
    unrealizedPnLPercent: 4.33,
    currency: 'EUR',
    exchange: 'AEB',
  },
  {
    symbol: 'VUAA',
    conid: 362750943,
    name: 'Vanguard S&P 500 UCITS ETF',
    isin: 'IE00BFMXXD54',
    quantity: 60,
    avgCost: 85.40,
    marketPrice: 92.30,
    marketValue: 5538.00,
    unrealizedPnL: 414.00,
    unrealizedPnLPercent: 8.08,
    currency: 'EUR',
    exchange: 'AEB',
  },
  {
    symbol: 'EUNH',
    conid: 28905730,
    name: 'iShares Core Euro Government Bond',
    isin: 'IE00B4WXJJ64',
    quantity: 150,
    avgCost: 122.80,
    marketPrice: 119.45,
    marketValue: 17917.50,
    unrealizedPnL: -502.50,
    unrealizedPnLPercent: -2.73,
    currency: 'EUR',
    exchange: 'IBIS',
  },
  {
    symbol: 'SGLD',
    conid: 38709473,
    name: 'Invesco Physical Gold ETC',
    isin: 'IE00B579F325',
    quantity: 15,
    avgCost: 185.20,
    marketPrice: 198.40,
    marketValue: 2976.00,
    unrealizedPnL: 198.00,
    unrealizedPnLPercent: 7.13,
    currency: 'USD',
    exchange: 'LSE',
  },
];

// Demo market indices
export const demoIndices = [
  { symbol: 'AEX', name: 'AEX Index', price: 892.45, change: 4.23, change_percent: 0.48, currency: 'EUR' },
  { symbol: 'DAX', name: 'DAX', price: 19245.80, change: -32.50, change_percent: -0.17, currency: 'EUR' },
  { symbol: 'CAC40', name: 'CAC 40', price: 7823.15, change: 18.90, change_percent: 0.24, currency: 'EUR' },
  { symbol: 'FTSE', name: 'FTSE 100', price: 8245.60, change: 12.40, change_percent: 0.15, currency: 'GBP' },
  { symbol: 'S&P500', name: 'S&P 500', price: 5890.25, change: 28.75, change_percent: 0.49, currency: 'USD' },
  { symbol: 'NASDAQ', name: 'NASDAQ', price: 18456.30, change: 95.20, change_percent: 0.52, currency: 'USD' },
  { symbol: 'NIKKEI', name: 'Nikkei 225', price: 38245, change: -125, change_percent: -0.33, currency: 'JPY' },
];

// Demo market data
export const demoMarketData = {
  IWDA: { conid: 43645828, bid: 82.42, ask: 82.48, last: 82.45, bidSize: 1250, askSize: 980, spread: 0.06, midPrice: 82.45, delayed: false, timestamp: Date.now() },
  VWCE: { conid: 428759564, bid: 112.75, ask: 112.85, last: 112.80, bidSize: 850, askSize: 720, spread: 0.10, midPrice: 112.80, delayed: false, timestamp: Date.now() },
  EMIM: { conid: 239782328, bid: 30.12, ask: 30.18, last: 30.15, bidSize: 2200, askSize: 1800, spread: 0.06, midPrice: 30.15, delayed: false, timestamp: Date.now() },
  VUAA: { conid: 362750943, bid: 92.25, ask: 92.35, last: 92.30, bidSize: 650, askSize: 580, spread: 0.10, midPrice: 92.30, delayed: false, timestamp: Date.now() },
  EUNH: { conid: 28905730, bid: 119.40, ask: 119.50, last: 119.45, bidSize: 450, askSize: 520, spread: 0.10, midPrice: 119.45, delayed: false, timestamp: Date.now() },
  SGLD: { conid: 38709473, bid: 198.30, ask: 198.50, last: 198.40, bidSize: 180, askSize: 220, spread: 0.20, midPrice: 198.40, delayed: false, timestamp: Date.now() },
  SXR8: { conid: 43645865, bid: 542.80, ask: 543.20, last: 543.00, bidSize: 320, askSize: 280, spread: 0.40, midPrice: 543.00, delayed: false, timestamp: Date.now() },
  IEAC: { conid: 28905731, bid: 132.15, ask: 132.25, last: 132.20, bidSize: 380, askSize: 420, spread: 0.10, midPrice: 132.20, delayed: false, timestamp: Date.now() },
  VAGE: { conid: 428759600, bid: 24.85, ask: 24.90, last: 24.88, bidSize: 1500, askSize: 1200, spread: 0.05, midPrice: 24.88, delayed: false, timestamp: Date.now() },
  IWDP: { conid: 43645900, bid: 24.30, ask: 24.38, last: 24.34, bidSize: 800, askSize: 650, spread: 0.08, midPrice: 24.34, delayed: false, timestamp: Date.now() },
  XEON: { conid: 54328976, bid: 138.42, ask: 138.48, last: 138.45, bidSize: 600, askSize: 550, spread: 0.06, midPrice: 138.45, delayed: false, timestamp: Date.now() },
};

// Demo tradability data
export const demoTradability = {
  tradable_etfs: [
    { isin: 'IE00B4L5Y983', symbol: 'IWDA', name: 'iShares Core MSCI World UCITS ETF', tradable_via_lynx: true, contract: { conid: 43645828, symbol: 'IWDA', exchange: 'AEB', currency: 'EUR' } },
    { isin: 'IE00BK5BQT80', symbol: 'VWCE', name: 'Vanguard FTSE All-World UCITS ETF', tradable_via_lynx: true, contract: { conid: 428759564, symbol: 'VWCE', exchange: 'AEB', currency: 'EUR' } },
    { isin: 'IE00BKM4GZ66', symbol: 'EMIM', name: 'iShares Core MSCI EM IMI UCITS ETF', tradable_via_lynx: true, contract: { conid: 239782328, symbol: 'EMIM', exchange: 'AEB', currency: 'EUR' } },
    { isin: 'IE00BFMXXD54', symbol: 'VUAA', name: 'Vanguard S&P 500 UCITS ETF', tradable_via_lynx: true, contract: { conid: 362750943, symbol: 'VUAA', exchange: 'AEB', currency: 'EUR' } },
    { isin: 'IE00B4WXJJ64', symbol: 'EUNH', name: 'iShares Core Euro Government Bond', tradable_via_lynx: true, contract: { conid: 28905730, symbol: 'EUNH', exchange: 'IBIS', currency: 'EUR' } },
    { isin: 'IE00B579F325', symbol: 'SGLD', name: 'Invesco Physical Gold ETC', tradable_via_lynx: true, contract: { conid: 38709473, symbol: 'SGLD', exchange: 'LSE', currency: 'USD' } },
    { isin: 'IE00B5BMR087', symbol: 'SXR8', name: 'iShares Core S&P 500 UCITS ETF', tradable_via_lynx: true, contract: { conid: 43645865, symbol: 'SXR8', exchange: 'IBIS', currency: 'EUR' } },
    { isin: 'IE00B3F81R35', symbol: 'IEAC', name: 'iShares Core EUR Corporate Bond', tradable_via_lynx: true, contract: { conid: 28905731, symbol: 'IEAC', exchange: 'IBIS', currency: 'EUR' } },
    { isin: 'IE00BG47KB92', symbol: 'VAGE', name: 'Vanguard Global Aggregate Bond', tradable_via_lynx: true, contract: { conid: 428759600, symbol: 'VAGE', exchange: 'AEB', currency: 'EUR' } },
    { isin: 'IE00B1FZS350', symbol: 'IWDP', name: 'iShares Developed Markets Property Yield', tradable_via_lynx: true, contract: { conid: 43645900, symbol: 'IWDP', exchange: 'AEB', currency: 'EUR' } },
    { isin: 'LU0290358497', symbol: 'XEON', name: 'Xtrackers II EUR Overnight Rate Swap', tradable_via_lynx: true, contract: { conid: 54328976, symbol: 'XEON', exchange: 'IBIS', currency: 'EUR' } },
  ],
  metadata: {
    total_checked: 3200,
    total_tradable: 2847,
    total_blocked: 353,
    checked_at: new Date().toISOString(),
  },
};

// Demo safety limits
export const demoSafetyLimits = {
  max_order_size: 100,
  max_order_value: 10000,
  max_orders: 50,
  max_exposure: 50000,
  orders_remaining: 48,
  exposure_remaining: 45000,
  order_count: 2,
  total_exposure: 5000,
  trading_mode: 'DEMO',
  is_demo: true,
};

// Demo ETFs list
export const demoETFs = [
  { symbol: 'IWDA', name: 'iShares Core MSCI World UCITS ETF', isin: 'IE00B4L5Y983', category: 'Aandelen', region: 'Wereld' },
  { symbol: 'VWCE', name: 'Vanguard FTSE All-World UCITS ETF', isin: 'IE00BK5BQT80', category: 'Aandelen', region: 'Wereld' },
  { symbol: 'EMIM', name: 'iShares Core MSCI EM IMI UCITS ETF', isin: 'IE00BKM4GZ66', category: 'Aandelen', region: 'Opkomende markten' },
  { symbol: 'VUAA', name: 'Vanguard S&P 500 UCITS ETF', isin: 'IE00BFMXXD54', category: 'Aandelen', region: 'VS' },
  { symbol: 'SXR8', name: 'iShares Core S&P 500 UCITS ETF', isin: 'IE00B5BMR087', category: 'Aandelen', region: 'VS' },
  { symbol: 'EUNH', name: 'iShares Core Euro Government Bond', isin: 'IE00B4WXJJ64', category: 'Obligaties', region: 'Europa' },
  { symbol: 'IEAC', name: 'iShares Core EUR Corporate Bond', isin: 'IE00B3F81R35', category: 'Obligaties', region: 'Europa' },
  { symbol: 'VAGE', name: 'Vanguard Global Aggregate Bond', isin: 'IE00BG47KB92', category: 'Obligaties', region: 'Wereld' },
  { symbol: 'SGLD', name: 'Invesco Physical Gold ETC', isin: 'IE00B579F325', category: 'Grondstoffen', region: 'Wereld' },
  { symbol: 'IWDP', name: 'iShares Developed Markets Property Yield', isin: 'IE00B1FZS350', category: 'Vastgoed', region: 'Wereld' },
  { symbol: 'XEON', name: 'Xtrackers II EUR Overnight Rate Swap', isin: 'LU0290358497', category: 'Geldmarkt', region: 'Europa' },
];

// Demo orders (empty by default)
export const demoOrders = [];

// Demo health check
export const demoHealth = {
  status: 'healthy',
  trading_mode: 'DEMO',
  is_demo: true,
  ib_gateway: {
    connected: true,
    account: 'DEMO123456',
    trading_mode: 'demo',
  },
};
