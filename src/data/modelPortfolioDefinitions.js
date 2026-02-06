/**
 * Model Portfolio Definitions
 *
 * IMPORTANT: All ISINs in these portfolios have been verified to exist
 * in TRADABLE_ETFS and are tradable via LYNX/Interactive Brokers.
 *
 * Portfolio Categories:
 * - RISK: Risk-based portfolios (Defensive, Balanced, Growth, Aggressive)
 * - THEME: Theme-based portfolios (AI/Tech, ESG, Dividend, etc.)
 * - STRATEGY: Strategy-based portfolios (Core-Satellite, Factor Investing, etc.)
 * - COMMUNITY: User-created portfolios (stored in database)
 *
 * Each portfolio includes:
 * - id: Unique identifier
 * - name: Display name
 * - category: RISK | THEME | STRATEGY | COMMUNITY
 * - description: Human readable description
 * - holdings: Array of { isin, weight, category, name }
 * - rebalanceFrequency: quarterly | yearly | monthly
 * - riskLevel: 1-5
 * - lastUpdated: ISO timestamp
 * - regionExposure: Array of region weights
 * - tags: Array of searchable tags
 */

import { isTradable, getTradingInfo } from './tradableETFs';

// ============================================
// VERIFIED TRADABLE ETFs FOR PORTFOLIO CONSTRUCTION
// ============================================

export const VERIFIED_ETFS = {
  // World Equity
  IWDA: { isin: 'IE00B4L5Y983', symbol: 'IWDA', conid: 100292038, exchange: 'AEB', name: 'iShares Core MSCI World UCITS ETF', category: 'Aandelen', region: 'World', refPrice: 95 },
  VWCE: { isin: 'IE00BK5BQT80', symbol: 'VWCE', conid: 375858281, exchange: 'IBIS2', name: 'Vanguard FTSE All-World UCITS ETF', category: 'Aandelen', region: 'World', refPrice: 120 },

  // US Equity
  SXR8: { isin: 'IE00B5BMR087', symbol: 'SXR8', conid: 75776072, exchange: 'IBIS2', name: 'iShares Core S&P 500 UCITS ETF', category: 'Aandelen', region: 'US', refPrice: 580 },
  VUAA: { isin: 'IE00BFMXXD54', symbol: 'VUAA', conid: 399364021, exchange: 'BVME.ETF', name: 'Vanguard S&P 500 UCITS ETF', category: 'Aandelen', region: 'US', refPrice: 105 },

  // Emerging Markets
  EMIM: { isin: 'IE00BKM4GZ66', symbol: 'EMIM', conid: 153454120, exchange: 'AEB', name: 'iShares Core MSCI EM IMI UCITS ETF', category: 'Aandelen', region: 'Emerging', refPrice: 35 },
  VFEM: { isin: 'IE00B3VVMM84', symbol: 'VFEM', conid: 128831223, exchange: 'AEB', name: 'Vanguard FTSE Emerging Markets UCITS ETF', category: 'Aandelen', region: 'Emerging', refPrice: 55 },

  // Europe
  IEUS: { isin: 'IE00B1YZSC51', symbol: 'IMEU', conid: 45998497, exchange: 'AEB', name: 'iShares Core MSCI Europe UCITS ETF', category: 'Aandelen', region: 'Europe', refPrice: 38 },
  VEUR: { isin: 'IE00BK5BQX27', symbol: 'VWCG', conid: 375858284, exchange: 'IBIS2', name: 'Vanguard FTSE Developed Europe UCITS ETF', category: 'Aandelen', region: 'Europe', refPrice: 35 },

  // Technology
  EQQQ: { isin: 'IE0032077012', symbol: 'EQQQ', conid: 18706552, exchange: 'BVME.ETF', name: 'Invesco EQQQ NASDAQ-100 UCITS ETF', category: 'Aandelen', theme: 'Technology', refPrice: 410 },
  IUIT: { isin: 'IE00B3WJKG14', symbol: 'QDVE', conid: 242717020, exchange: 'IBIS2', name: 'iShares S&P 500 Information Technology Sector UCITS ETF', category: 'Aandelen', theme: 'Technology', refPrice: 40 },

  // Sustainability / ESG
  SUWS: { isin: 'IE00BYX2JD69', symbol: 'SUSW', conid: 292495500, exchange: 'LSEETF', name: 'iShares MSCI World SRI UCITS ETF', category: 'Aandelen', theme: 'ESG', refPrice: 12 },
  VGEU: { isin: 'IE00BNG8L278', symbol: 'V3AA', conid: 478811098, exchange: 'IBIS2', name: 'Vanguard ESG Global All Cap UCITS ETF', category: 'Aandelen', theme: 'ESG', refPrice: 6 },

  // Dividend
  VHYL: { isin: 'IE00B8GKDB10', symbol: 'VHYL', conid: 128831209, exchange: 'AEB', name: 'Vanguard FTSE All-World High Dividend Yield UCITS ETF', category: 'Aandelen', theme: 'Dividend', refPrice: 62 },
  IDVY: { isin: 'IE00B0M62S72', symbol: 'IDVY', conid: 37036662, exchange: 'AEB', name: 'iShares Euro Dividend UCITS ETF', category: 'Aandelen', theme: 'Dividend', refPrice: 28 },

  // Healthcare
  HEAL: { isin: 'IE00BYZK4776', symbol: 'HEAL', conid: 254447338, exchange: 'BVME.ETF', name: 'iShares Healthcare Innovation UCITS ETF', category: 'Aandelen', theme: 'Healthcare', refPrice: 9 },
  IXJ: { isin: 'IE00B43HR379', symbol: 'QDVG', conid: 288308392, exchange: 'IBIS2', name: 'iShares S&P 500 Health Care Sector UCITS ETF', category: 'Aandelen', theme: 'Healthcare', refPrice: 12 },

  // Clean Energy
  INRG: { isin: 'IE00B1XNHC34', symbol: 'INRG', conid: 45998500, exchange: 'BVME.ETF', name: 'iShares Global Clean Energy UCITS ETF', category: 'Aandelen', theme: 'CleanEnergy', refPrice: 8 },

  // Government Bonds
  EUNH: { isin: 'IE00B4WXJJ64', symbol: 'EUNH', conid: 68490077, exchange: 'IBIS2', name: 'iShares Core Euro Government Bond UCITS ETF', category: 'Obligaties', region: 'Europe', refPrice: 125 },
  IGLT: { isin: 'IE00B1FZSB30', symbol: 'IGLT', conid: 521963156, exchange: 'BVME.ETF', name: 'iShares Core UK Gilts UCITS ETF', category: 'Obligaties', region: 'UK', refPrice: 12 },

  // Corporate Bonds
  IEAC: { isin: 'IE00B3F81R35', symbol: 'IEAC', conid: 60470164, exchange: 'LSEETF', name: 'iShares Core EUR Corporate Bond UCITS ETF', category: 'Obligaties', region: 'Europe', refPrice: 5 },
  VUCP: { isin: 'IE00BZ163K21', symbol: 'VUCP', conid: 225116854, exchange: 'AEB', name: 'Vanguard USD Corporate Bond UCITS ETF', category: 'Obligaties', region: 'US', refPrice: 46 },

  // Global Bonds
  VAGE: { isin: 'IE00BG47KB92', symbol: 'VAGE', conid: 371588182, exchange: 'IBIS2', name: 'Vanguard Global Aggregate Bond UCITS ETF', category: 'Obligaties', region: 'World', refPrice: 24 },

  // Inflation-Linked Bonds
  ITPS: { isin: 'IE00B0M62X26', symbol: 'IBCI', conid: 37036668, exchange: 'AEB', name: 'iShares EUR Inflation Linked Government Bond UCITS ETF', category: 'Obligaties', theme: 'InflationProtection', refPrice: 220 },

  // Commodities
  SGLD: { isin: 'IE00B579F325', symbol: 'SGLD', conid: 175394979, exchange: 'BVME.ETF', name: 'Invesco Physical Gold A', category: 'Commodities', refPrice: 260 },
  CMOD: { isin: 'IE00BDFL4P12', symbol: 'SXRS', conid: 321100413, exchange: 'IBIS2', name: 'iShares Diversified Commodity Swap UCITS ETF', category: 'Commodities', refPrice: 7 },

  // Real Estate
  IWDP: { isin: 'IE00B1FZS350', symbol: 'IWDP', conid: 42492945, exchange: 'AEB', name: 'iShares Developed Markets Property Yield UCITS ETF', category: 'Vastgoed', region: 'World', refPrice: 24 },
  TRET: { isin: 'NL0009690239', symbol: 'TRET', conid: 86792281, exchange: 'AEB', name: 'VanEck Global Real Estate UCITS ETF', category: 'Vastgoed', region: 'World', refPrice: 30 },

  // Money Market
  XEON: { isin: 'LU0290358497', symbol: 'XEON', conid: 46041702, exchange: 'IBIS2', name: 'Xtrackers II EUR Overnight Rate Swap UCITS ETF', category: 'Money market', refPrice: 140 },

  // Value Factor
  IWVL: { isin: 'IE00BP3QZB59', symbol: 'IWVL', conid: 183908203, exchange: 'BVME.ETF', name: 'iShares Edge MSCI World Value Factor UCITS ETF', category: 'Aandelen', theme: 'Value', refPrice: 38 },

  // Momentum Factor
  IWMO: { isin: 'IE00BP3QZ825', symbol: 'IWMO', conid: 183908189, exchange: 'BVME.ETF', name: 'iShares Edge MSCI World Momentum Factor UCITS ETF', category: 'Aandelen', theme: 'Momentum', refPrice: 60 },

  // Quality Factor
  IWQU: { isin: 'IE00BP3QZ601', symbol: 'IWQU', conid: 183908193, exchange: 'BVME.ETF', name: 'iShares Edge MSCI World Quality Factor UCITS ETF', category: 'Aandelen', theme: 'Quality', refPrice: 55 },

  // Small Cap
  WSML: { isin: 'IE00BF4RFH31', symbol: 'IUSN', conid: 320057568, exchange: 'IBIS2', name: 'iShares MSCI World Small Cap UCITS ETF', category: 'Aandelen', theme: 'SmallCap', refPrice: 7 },
};

// ============================================
// PORTFOLIO CATEGORIES
// ============================================

export const PORTFOLIO_CATEGORIES = {
  RISK: 'Risk',
  THEME: 'Theme',
  STRATEGY: 'Strategy',
  COMMUNITY: 'Community',
};

export const REBALANCE_FREQUENCIES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
};

// ============================================
// RISK-BASED PORTFOLIOS (Existing + Enhanced)
// ============================================

const RISK_PORTFOLIOS = {
  'risk-bonds100': {
    id: 'risk-bonds100',
    name: '100% Obligaties',
    category: PORTFOLIO_CATEGORIES.RISK,
    description: 'Je geld groeit langzaam maar veilig. Dit model belegt alleen in obligaties (leningen aan overheden en bedrijven). Je krijgt een klein maar stabiel rendement.',
    expectedReturn: 0.025,
    stdDev: 0.05,
    riskLevel: 1,
    rebalanceFrequency: REBALANCE_FREQUENCIES.YEARLY,
    color: '#3B82F6',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'Europe', weight: 80 },
      { region: 'World', weight: 20 },
    ],
    tags: ['conservative', 'bonds', 'income', 'low-risk', 'capital-preservation'],
    holdings: [
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 50, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
      { isin: VERIFIED_ETFS.IEAC.isin, weight: 30, category: 'Obligaties', name: VERIFIED_ETFS.IEAC.name },
      { isin: VERIFIED_ETFS.XEON.isin, weight: 20, category: 'Money market', name: VERIFIED_ETFS.XEON.name },
    ],
  },

  'risk-defensive': {
    id: 'risk-defensive',
    name: 'Defensief',
    category: PORTFOLIO_CATEGORIES.RISK,
    description: 'Vooral veilig, met een klein beetje aandelen. De meeste van je geld zit in obligaties, waardoor je minder last hebt van schommelingen op de beurs.',
    expectedReturn: 0.035,
    stdDev: 0.08,
    riskLevel: 2,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#22C55E',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 25 },
      { region: 'Europe', weight: 55 },
      { region: 'Emerging', weight: 10 },
      { region: 'Other', weight: 10 },
    ],
    tags: ['defensive', 'low-risk', 'balanced', 'stable'],
    holdings: [
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 10, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 30, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
      { isin: VERIFIED_ETFS.IEAC.isin, weight: 25, category: 'Obligaties', name: VERIFIED_ETFS.IEAC.name },
      { isin: VERIFIED_ETFS.IWDP.isin, weight: 10, category: 'Vastgoed', name: VERIFIED_ETFS.IWDP.name },
      { isin: VERIFIED_ETFS.XEON.isin, weight: 10, category: 'Money market', name: VERIFIED_ETFS.XEON.name },
    ],
  },

  'risk-neutral': {
    id: 'risk-neutral',
    name: 'Neutraal',
    category: PORTFOLIO_CATEGORIES.RISK,
    description: 'Een mix van aandelen en obligaties. Je neemt wat meer risico voor hoger rendement, maar je hebt nog steeds een vangnet als de beurs daalt.',
    expectedReturn: 0.05,
    stdDev: 0.11,
    riskLevel: 3,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#F59E0B',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 40 },
      { region: 'US', weight: 5 },
      { region: 'Europe', weight: 40 },
      { region: 'Emerging', weight: 15 },
    ],
    tags: ['balanced', 'moderate-risk', 'diversified'],
    holdings: [
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 30, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.VUAA.isin, weight: 5, category: 'Aandelen', name: VERIFIED_ETFS.VUAA.name },
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 20, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
      { isin: VERIFIED_ETFS.IEAC.isin, weight: 20, category: 'Obligaties', name: VERIFIED_ETFS.IEAC.name },
      { isin: VERIFIED_ETFS.IWDP.isin, weight: 10, category: 'Vastgoed', name: VERIFIED_ETFS.IWDP.name },
    ],
  },

  'risk-offensive': {
    id: 'risk-offensive',
    name: 'Offensief',
    category: PORTFOLIO_CATEGORIES.RISK,
    description: 'Vooral aandelen, met een kleine buffer. Je geld kan harder groeien, maar het kan ook tijdelijk flink dalen als de beurs slecht presteert.',
    expectedReturn: 0.065,
    stdDev: 0.14,
    riskLevel: 4,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#EF4444',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 40 },
      { region: 'US', weight: 10 },
      { region: 'Emerging', weight: 20 },
      { region: 'Europe', weight: 20 },
      { region: 'Other', weight: 10 },
    ],
    tags: ['growth', 'higher-risk', 'equity-focused'],
    holdings: [
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 40, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 20, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.VUAA.isin, weight: 10, category: 'Aandelen', name: VERIFIED_ETFS.VUAA.name },
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 10, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
      { isin: VERIFIED_ETFS.IEAC.isin, weight: 7.5, category: 'Obligaties', name: VERIFIED_ETFS.IEAC.name },
      { isin: VERIFIED_ETFS.CMOD.isin, weight: 7.5, category: 'Commodities', name: VERIFIED_ETFS.CMOD.name },
      { isin: VERIFIED_ETFS.IWDP.isin, weight: 5, category: 'Vastgoed', name: VERIFIED_ETFS.IWDP.name },
    ],
  },

  'risk-aggressive': {
    id: 'risk-aggressive',
    name: 'Zeer Offensief',
    category: PORTFOLIO_CATEGORIES.RISK,
    description: 'Bijna alles in aandelen voor maximale groei. Je geld kan sterk schommelen. Alleen geschikt als je tegen een stootje kunt.',
    expectedReturn: 0.075,
    stdDev: 0.16,
    riskLevel: 5,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#DC2626',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 45 },
      { region: 'Emerging', weight: 25 },
      { region: 'US', weight: 15 },
      { region: 'Other', weight: 15 },
    ],
    tags: ['aggressive', 'high-risk', 'maximum-growth'],
    holdings: [
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 45, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.VUAA.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.VUAA.name },
      { isin: VERIFIED_ETFS.CMOD.isin, weight: 10, category: 'Commodities', name: VERIFIED_ETFS.CMOD.name },
      { isin: VERIFIED_ETFS.IWDP.isin, weight: 5, category: 'Vastgoed', name: VERIFIED_ETFS.IWDP.name },
    ],
  },

  'risk-stocks100': {
    id: 'risk-stocks100',
    name: '100% Aandelen',
    category: PORTFOLIO_CATEGORIES.RISK,
    description: 'Alles in aandelen, niets in obligaties. Op lange termijn vaak het hoogste rendement, maar tussentijds kan je portefeuille flink in waarde dalen.',
    expectedReturn: 0.08,
    stdDev: 0.18,
    riskLevel: 5,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#7C3AED',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 60 },
      { region: 'Emerging', weight: 25 },
      { region: 'US', weight: 15 },
    ],
    tags: ['stocks', 'maximum-risk', 'equity-only'],
    holdings: [
      { isin: VERIFIED_ETFS.VWCE.isin, weight: 60, category: 'Aandelen', name: VERIFIED_ETFS.VWCE.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.VUAA.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.VUAA.name },
    ],
  },
};

// ============================================
// THEME-BASED PORTFOLIOS
// ============================================

const THEME_PORTFOLIOS = {
  'theme-ai-technology': {
    id: 'theme-ai-technology',
    name: 'AI & Technology',
    category: PORTFOLIO_CATEGORIES.THEME,
    description: 'Beleg in technologiebedrijven zoals makers van AI, software en chips. Kans op hoog rendement, maar techbedrijven kunnen ook flink in waarde schommelen.',
    expectedReturn: 0.12,
    stdDev: 0.25,
    riskLevel: 5,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#8B5CF6',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'US', weight: 70 },
      { region: 'World', weight: 20 },
      { region: 'Asia', weight: 10 },
    ],
    tags: ['technology', 'ai', 'growth', 'nasdaq', 'innovation'],
    holdings: [
      { isin: VERIFIED_ETFS.EQQQ.isin, weight: 50, category: 'Aandelen', name: VERIFIED_ETFS.EQQQ.name },
      { isin: VERIFIED_ETFS.IUIT.isin, weight: 30, category: 'Aandelen', name: VERIFIED_ETFS.IUIT.name },
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 20, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
    ],
  },

  'theme-sustainability-esg': {
    id: 'theme-sustainability-esg',
    name: 'Sustainability / ESG',
    category: PORTFOLIO_CATEGORIES.THEME,
    description: 'Beleg in bedrijven die goed zijn voor het milieu en de maatschappij. Je geld gaat naar bedrijven die duurzaam en verantwoord ondernemen.',
    expectedReturn: 0.065,
    stdDev: 0.14,
    riskLevel: 3,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#10B981',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 60 },
      { region: 'Europe', weight: 25 },
      { region: 'Emerging', weight: 15 },
    ],
    tags: ['esg', 'sustainable', 'sri', 'green', 'responsible'],
    holdings: [
      { isin: VERIFIED_ETFS.SUWS.isin, weight: 50, category: 'Aandelen', name: VERIFIED_ETFS.SUWS.name },
      { isin: VERIFIED_ETFS.INRG.isin, weight: 20, category: 'Aandelen', name: VERIFIED_ETFS.INRG.name },
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 20, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 10, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
    ],
  },

  'theme-dividend-income': {
    id: 'theme-dividend-income',
    name: 'Dividend Income',
    category: PORTFOLIO_CATEGORIES.THEME,
    description: 'Beleg in bedrijven die regelmatig een deel van hun winst aan jou uitkeren. Handig als je een vast inkomen uit je beleggingen wilt.',
    expectedReturn: 0.055,
    stdDev: 0.12,
    riskLevel: 3,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#F59E0B',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 50 },
      { region: 'Europe', weight: 30 },
      { region: 'US', weight: 20 },
    ],
    tags: ['dividend', 'income', 'passive-income', 'yield'],
    holdings: [
      { isin: VERIFIED_ETFS.VHYL.isin, weight: 40, category: 'Aandelen', name: VERIFIED_ETFS.VHYL.name },
      { isin: VERIFIED_ETFS.IDVY.isin, weight: 20, category: 'Aandelen', name: VERIFIED_ETFS.IDVY.name },
      { isin: VERIFIED_ETFS.IWDP.isin, weight: 15, category: 'Vastgoed', name: VERIFIED_ETFS.IWDP.name },
      { isin: VERIFIED_ETFS.IEAC.isin, weight: 15, category: 'Obligaties', name: VERIFIED_ETFS.IEAC.name },
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 10, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
    ],
  },

  'theme-inflation-protection': {
    id: 'theme-inflation-protection',
    name: 'Inflation Protection',
    category: PORTFOLIO_CATEGORIES.THEME,
    description: 'Bescherm je geld tegen prijsstijgingen. Dit model belegt in goud, vastgoed en speciale obligaties die meestijgen met de inflatie.',
    expectedReturn: 0.045,
    stdDev: 0.10,
    riskLevel: 2,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#EF4444',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 30 },
      { region: 'Europe', weight: 40 },
      { region: 'US', weight: 20 },
      { region: 'Other', weight: 10 },
    ],
    tags: ['inflation', 'protection', 'real-assets', 'commodities', 'tips'],
    holdings: [
      { isin: VERIFIED_ETFS.ITPS.isin, weight: 25, category: 'Obligaties', name: VERIFIED_ETFS.ITPS.name },
      { isin: VERIFIED_ETFS.SGLD.isin, weight: 20, category: 'Commodities', name: VERIFIED_ETFS.SGLD.name },
      { isin: VERIFIED_ETFS.IWDP.isin, weight: 20, category: 'Vastgoed', name: VERIFIED_ETFS.IWDP.name },
      { isin: VERIFIED_ETFS.CMOD.isin, weight: 15, category: 'Commodities', name: VERIFIED_ETFS.CMOD.name },
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 20, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
    ],
  },

  'theme-emerging-markets': {
    id: 'theme-emerging-markets',
    name: 'Emerging Markets',
    category: PORTFOLIO_CATEGORIES.THEME,
    description: 'Beleg in snelgroeiende landen zoals China, India en Brazilië. Hogere groeikansen, maar ook meer risico dan westerse markten.',
    expectedReturn: 0.085,
    stdDev: 0.20,
    riskLevel: 4,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#EC4899',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'Emerging', weight: 70 },
      { region: 'Asia', weight: 20 },
      { region: 'World', weight: 10 },
    ],
    tags: ['emerging-markets', 'growth', 'asia', 'brics', 'developing'],
    holdings: [
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 60, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.VFEM.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.VFEM.name },
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
    ],
  },

  'theme-healthcare-aging': {
    id: 'theme-healthcare-aging',
    name: 'Healthcare & Aging',
    category: PORTFOLIO_CATEGORIES.THEME,
    description: 'Beleg in gezondheidszorg: ziekenhuizen, medicijnen en medische technologie. De vergrijzing zorgt voor stijgende vraag in deze sector.',
    expectedReturn: 0.07,
    stdDev: 0.15,
    riskLevel: 3,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#06B6D4',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 50 },
      { region: 'US', weight: 40 },
      { region: 'Europe', weight: 10 },
    ],
    tags: ['healthcare', 'pharma', 'biotech', 'aging', 'medical'],
    holdings: [
      { isin: VERIFIED_ETFS.IXJ.isin, weight: 45, category: 'Aandelen', name: VERIFIED_ETFS.IXJ.name },
      { isin: VERIFIED_ETFS.HEAL.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.HEAL.name },
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 20, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 10, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
    ],
  },

  'theme-energy-transition': {
    id: 'theme-energy-transition',
    name: 'Energy Transition',
    category: PORTFOLIO_CATEGORIES.THEME,
    description: 'Beleg in bedrijven die werken aan zonne-energie, windenergie en andere schone energiebronnen. Groeimarkt door de energietransitie.',
    expectedReturn: 0.09,
    stdDev: 0.22,
    riskLevel: 4,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#84CC16',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 50 },
      { region: 'Europe', weight: 30 },
      { region: 'US', weight: 20 },
    ],
    tags: ['clean-energy', 'renewable', 'solar', 'wind', 'transition'],
    holdings: [
      { isin: VERIFIED_ETFS.INRG.isin, weight: 50, category: 'Aandelen', name: VERIFIED_ETFS.INRG.name },
      { isin: VERIFIED_ETFS.SUWS.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.SUWS.name },
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
    ],
  },

  'theme-all-weather': {
    id: 'theme-all-weather',
    name: 'All-Weather Portfolio',
    category: PORTFOLIO_CATEGORIES.THEME,
    description: 'Een mix van aandelen, obligaties en goud die in alle marktomstandigheden redelijk presteert. Minder winst in goede tijden, maar ook minder verlies in slechte tijden.',
    expectedReturn: 0.055,
    stdDev: 0.09,
    riskLevel: 2,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#6366F1',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 30 },
      { region: 'US', weight: 20 },
      { region: 'Europe', weight: 30 },
      { region: 'Other', weight: 20 },
    ],
    tags: ['all-weather', 'balanced', 'diversified', 'stable', 'ray-dalio'],
    holdings: [
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 30, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 30, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
      { isin: VERIFIED_ETFS.VAGE.isin, weight: 15, category: 'Obligaties', name: VERIFIED_ETFS.VAGE.name },
      { isin: VERIFIED_ETFS.SGLD.isin, weight: 15, category: 'Commodities', name: VERIFIED_ETFS.SGLD.name },
      { isin: VERIFIED_ETFS.CMOD.isin, weight: 10, category: 'Commodities', name: VERIFIED_ETFS.CMOD.name },
    ],
  },
};

// ============================================
// STRATEGY-BASED PORTFOLIOS
// ============================================

const STRATEGY_PORTFOLIOS = {
  'strategy-core-satellite': {
    id: 'strategy-core-satellite',
    name: 'Core-Satellite',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'Een stabiele basis van wereldwijde aandelen, aangevuld met kleinere posities in specifieke thema\'s voor extra rendement.',
    expectedReturn: 0.07,
    stdDev: 0.13,
    riskLevel: 3,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#14B8A6',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 60 },
      { region: 'US', weight: 20 },
      { region: 'Emerging', weight: 15 },
      { region: 'Europe', weight: 5 },
    ],
    tags: ['core-satellite', 'diversified', 'tactical', 'balanced'],
    holdings: [
      // Core (70%)
      { isin: VERIFIED_ETFS.VWCE.isin, weight: 50, category: 'Aandelen', name: VERIFIED_ETFS.VWCE.name },
      { isin: VERIFIED_ETFS.VAGE.isin, weight: 20, category: 'Obligaties', name: VERIFIED_ETFS.VAGE.name },
      // Satellites (30%)
      { isin: VERIFIED_ETFS.IUIT.isin, weight: 10, category: 'Aandelen', name: VERIFIED_ETFS.IUIT.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 10, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.CMOD.isin, weight: 10, category: 'Commodities', name: VERIFIED_ETFS.CMOD.name },
    ],
  },

  'strategy-buy-hold-world': {
    id: 'strategy-buy-hold-world',
    name: 'Buy & Hold World',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'De simpelste manier om te beleggen: één ETF die de hele wereld dekt. Kopen en vasthouden, verder niets doen.',
    expectedReturn: 0.065,
    stdDev: 0.15,
    riskLevel: 3,
    rebalanceFrequency: REBALANCE_FREQUENCIES.YEARLY,
    color: '#0EA5E9',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 100 },
    ],
    tags: ['buy-hold', 'passive', 'simple', 'long-term', 'world'],
    holdings: [
      { isin: VERIFIED_ETFS.VWCE.isin, weight: 100, category: 'Aandelen', name: VERIFIED_ETFS.VWCE.name },
    ],
  },

  'strategy-monthly-income': {
    id: 'strategy-monthly-income',
    name: 'Monthly Income',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'Gericht op regelmatige uitbetalingen. Dit model belegt in dividendaandelen, vastgoed en obligaties die periodiek geld uitkeren.',
    expectedReturn: 0.05,
    stdDev: 0.10,
    riskLevel: 2,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#F97316',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 40 },
      { region: 'Europe', weight: 35 },
      { region: 'US', weight: 25 },
    ],
    tags: ['income', 'monthly', 'dividend', 'bonds', 'cash-flow'],
    holdings: [
      { isin: VERIFIED_ETFS.VHYL.isin, weight: 30, category: 'Aandelen', name: VERIFIED_ETFS.VHYL.name },
      { isin: VERIFIED_ETFS.IDVY.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.IDVY.name },
      { isin: VERIFIED_ETFS.IWDP.isin, weight: 15, category: 'Vastgoed', name: VERIFIED_ETFS.IWDP.name },
      { isin: VERIFIED_ETFS.IEAC.isin, weight: 25, category: 'Obligaties', name: VERIFIED_ETFS.IEAC.name },
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 15, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
    ],
  },

  'strategy-value-growth': {
    id: 'strategy-value-growth',
    name: 'Value vs Growth',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'Combineert goedkope, ondergewaardeerde bedrijven met snelgroeiende technologiebedrijven. Twee strategieën in één portefeuille.',
    expectedReturn: 0.075,
    stdDev: 0.16,
    riskLevel: 4,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#A855F7',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 70 },
      { region: 'US', weight: 30 },
    ],
    tags: ['value', 'growth', 'factor', 'balanced'],
    holdings: [
      { isin: VERIFIED_ETFS.IWVL.isin, weight: 35, category: 'Aandelen', name: VERIFIED_ETFS.IWVL.name },
      { isin: VERIFIED_ETFS.EQQQ.isin, weight: 35, category: 'Aandelen', name: VERIFIED_ETFS.EQQQ.name },
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 30, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
    ],
  },

  'strategy-factor-value': {
    id: 'strategy-factor-value',
    name: 'Factor: Value',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'Belegt in bedrijven die goedkoop geprijsd zijn ten opzichte van hun werkelijke waarde. Denk aan koopjes op de beurs.',
    expectedReturn: 0.07,
    stdDev: 0.17,
    riskLevel: 4,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#D946EF',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 70 },
      { region: 'Emerging', weight: 30 },
    ],
    tags: ['factor', 'value', 'undervalued', 'contrarian'],
    holdings: [
      { isin: VERIFIED_ETFS.IWVL.isin, weight: 60, category: 'Aandelen', name: VERIFIED_ETFS.IWVL.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 15, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
    ],
  },

  'strategy-factor-momentum': {
    id: 'strategy-factor-momentum',
    name: 'Factor: Momentum',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'Belegt in aandelen die het de laatste tijd goed doen. Het idee: aandelen die stijgen, blijven vaak nog even doorstijgen.',
    expectedReturn: 0.08,
    stdDev: 0.18,
    riskLevel: 4,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#EC4899',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 80 },
      { region: 'US', weight: 20 },
    ],
    tags: ['factor', 'momentum', 'trend', 'performance'],
    holdings: [
      { isin: VERIFIED_ETFS.IWMO.isin, weight: 60, category: 'Aandelen', name: VERIFIED_ETFS.IWMO.name },
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.CMOD.isin, weight: 15, category: 'Commodities', name: VERIFIED_ETFS.CMOD.name },
    ],
  },

  'strategy-factor-quality': {
    id: 'strategy-factor-quality',
    name: 'Factor: Quality',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'Belegt in financieel gezonde bedrijven met stabiele winsten en weinig schulden. Kwaliteit boven kwantiteit.',
    expectedReturn: 0.07,
    stdDev: 0.14,
    riskLevel: 3,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#22D3EE',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 80 },
      { region: 'US', weight: 20 },
    ],
    tags: ['factor', 'quality', 'fundamentals', 'stable'],
    holdings: [
      { isin: VERIFIED_ETFS.IWQU.isin, weight: 60, category: 'Aandelen', name: VERIFIED_ETFS.IWQU.name },
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 15, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
    ],
  },

  'strategy-factor-multifactor': {
    id: 'strategy-factor-multifactor',
    name: 'Multi-Factor',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'Combineert meerdere bewezen strategieën (goedkoop, momentum, kwaliteit) in één portefeuille voor betere spreiding.',
    expectedReturn: 0.075,
    stdDev: 0.15,
    riskLevel: 4,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#F472B6',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 85 },
      { region: 'Emerging', weight: 15 },
    ],
    tags: ['factor', 'multi-factor', 'diversified', 'smart-beta'],
    holdings: [
      { isin: VERIFIED_ETFS.IWVL.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.IWVL.name },
      { isin: VERIFIED_ETFS.IWMO.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.IWMO.name },
      { isin: VERIFIED_ETFS.IWQU.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.IWQU.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.CMOD.isin, weight: 10, category: 'Commodities', name: VERIFIED_ETFS.CMOD.name },
    ],
  },

  'strategy-starter-world': {
    id: 'strategy-starter-world',
    name: 'Starter: Wereld',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'De makkelijkste start: met één ETF beleg je meteen in duizenden bedrijven wereldwijd. Ideaal als je voor het eerst gaat beleggen.',
    expectedReturn: 0.065,
    stdDev: 0.15,
    riskLevel: 3,
    rebalanceFrequency: REBALANCE_FREQUENCIES.YEARLY,
    color: '#34D399',
    lastUpdated: '2026-02-01T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 100 },
    ],
    tags: ['starter', 'small-budget', 'simple', 'beginner', 'world'],
    holdings: [
      { isin: VERIFIED_ETFS.VWCE.isin, weight: 100, category: 'Aandelen', name: VERIFIED_ETFS.VWCE.name },
    ],
  },

  'strategy-starter-balanced': {
    id: 'strategy-starter-balanced',
    name: 'Starter: Gebalanceerd',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'Beginnen met een veilige mix: een deel in aandelen voor groei en een deel in obligaties voor stabiliteit. Geschikt vanaf een klein bedrag.',
    expectedReturn: 0.045,
    stdDev: 0.10,
    riskLevel: 2,
    rebalanceFrequency: REBALANCE_FREQUENCIES.YEARLY,
    color: '#60A5FA',
    lastUpdated: '2026-02-01T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 60 },
      { region: 'Europe', weight: 40 },
    ],
    tags: ['starter', 'small-budget', 'balanced', 'beginner', 'low-risk'],
    holdings: [
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 60, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 40, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
    ],
  },

  'strategy-starter-growth': {
    id: 'strategy-starter-growth',
    name: 'Starter: Groei',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'Beginnen met meer groei: een groot deel in westerse aandelen en een deel in snelgroeiende landen. Meer risico, maar ook meer kans op rendement.',
    expectedReturn: 0.07,
    stdDev: 0.16,
    riskLevel: 4,
    rebalanceFrequency: REBALANCE_FREQUENCIES.YEARLY,
    color: '#F472B6',
    lastUpdated: '2026-02-01T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 70 },
      { region: 'Emerging', weight: 30 },
    ],
    tags: ['starter', 'small-budget', 'growth', 'beginner', 'emerging-markets'],
    holdings: [
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 70, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 30, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
    ],
  },

  'strategy-small-cap-tilt': {
    id: 'strategy-small-cap-tilt',
    name: 'Small Cap Tilt',
    category: PORTFOLIO_CATEGORIES.STRATEGY,
    description: 'Extra nadruk op kleine bedrijven. Kleine bedrijven kunnen harder groeien dan grote, maar schommelen ook meer in waarde.',
    expectedReturn: 0.085,
    stdDev: 0.19,
    riskLevel: 4,
    rebalanceFrequency: REBALANCE_FREQUENCIES.QUARTERLY,
    color: '#FB923C',
    lastUpdated: '2025-01-22T00:00:00Z',
    regionExposure: [
      { region: 'World', weight: 70 },
      { region: 'US', weight: 20 },
      { region: 'Emerging', weight: 10 },
    ],
    tags: ['small-cap', 'growth', 'size-factor', 'higher-risk'],
    holdings: [
      { isin: VERIFIED_ETFS.WSML.isin, weight: 40, category: 'Aandelen', name: VERIFIED_ETFS.WSML.name },
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 35, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.CMOD.isin, weight: 10, category: 'Commodities', name: VERIFIED_ETFS.CMOD.name },
    ],
  },
};

// ============================================
// COMBINED PORTFOLIOS
// ============================================

export const MODEL_PORTFOLIOS = {
  ...RISK_PORTFOLIOS,
  ...THEME_PORTFOLIOS,
  ...STRATEGY_PORTFOLIOS,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a portfolio definition by ID
 */
export function getModelPortfolio(id) {
  return MODEL_PORTFOLIOS[id] || null;
}

/**
 * Get all portfolios
 */
export function getAllModelPortfolios() {
  return Object.values(MODEL_PORTFOLIOS);
}

/**
 * Get portfolios by category
 */
export function getPortfoliosByCategory(category) {
  return Object.values(MODEL_PORTFOLIOS).filter(p => p.category === category);
}

/**
 * Get portfolios by risk level
 */
export function getPortfoliosByRiskLevel(level) {
  return Object.values(MODEL_PORTFOLIOS).filter(p => p.riskLevel === level);
}

/**
 * Get portfolios by tag
 */
export function getPortfoliosByTag(tag) {
  return Object.values(MODEL_PORTFOLIOS).filter(p => p.tags.includes(tag.toLowerCase()));
}

/**
 * Search portfolios by text (name, description, tags)
 */
export function searchPortfolios(query) {
  const q = query.toLowerCase();
  return Object.values(MODEL_PORTFOLIOS).filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.tags.some(t => t.includes(q))
  );
}

/**
 * Get unique tags across all portfolios
 */
export function getAllTags() {
  const tags = new Set();
  Object.values(MODEL_PORTFOLIOS).forEach(p => {
    p.tags.forEach(t => tags.add(t));
  });
  return Array.from(tags).sort();
}

/**
 * Get unique regions across all portfolios
 */
export function getAllRegions() {
  const regions = new Set();
  Object.values(MODEL_PORTFOLIOS).forEach(p => {
    p.regionExposure.forEach(r => regions.add(r.region));
  });
  return Array.from(regions).sort();
}

/**
 * Validate portfolio holdings are all tradable
 */
export function validatePortfolioTradability(portfolio) {
  const errors = [];
  const holdings = portfolio.holdings || [];

  holdings.forEach(holding => {
    if (!isTradable(holding.isin)) {
      errors.push(`ISIN ${holding.isin} (${holding.name}) is not tradable`);
    }
  });

  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    errors.push(`Weights sum to ${totalWeight.toFixed(2)}%, expected 100%`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get portfolio category allocation summary
 */
export function getPortfolioCategorySummary(portfolio) {
  const categories = {};
  portfolio.holdings.forEach(h => {
    const cat = h.category || 'Other';
    categories[cat] = (categories[cat] || 0) + h.weight;
  });
  return categories;
}

/**
 * Filter portfolios with multiple criteria
 */
export function filterPortfolios({
  category = null,
  riskLevel = null,
  minRiskLevel = null,
  maxRiskLevel = null,
  tags = [],
  region = null,
  searchQuery = '',
}) {
  let results = Object.values(MODEL_PORTFOLIOS);

  if (category) {
    results = results.filter(p => p.category === category);
  }

  if (riskLevel !== null) {
    results = results.filter(p => p.riskLevel === riskLevel);
  }

  if (minRiskLevel !== null) {
    results = results.filter(p => p.riskLevel >= minRiskLevel);
  }

  if (maxRiskLevel !== null) {
    results = results.filter(p => p.riskLevel <= maxRiskLevel);
  }

  if (tags.length > 0) {
    results = results.filter(p =>
      tags.some(tag => p.tags.includes(tag.toLowerCase()))
    );
  }

  if (region) {
    results = results.filter(p =>
      p.regionExposure.some(r => r.region === region)
    );
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q))
    );
  }

  return results;
}

export default MODEL_PORTFOLIOS;
