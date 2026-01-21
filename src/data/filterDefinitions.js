// Categorie-specifieke filter configuratie voor ETF Browser
// JustETF-stijl met Nederlandse labels en progressive disclosure

// ============================================================================
// CATEGORIE DEFINITIES
// ============================================================================

export const CATEGORIES = [
  { value: 'equity', label: 'Aandelen', icon: 'TrendingUp' },
  { value: 'bonds', label: 'Obligaties', icon: 'Building' },
  { value: 'commodities', label: 'Commodities', icon: 'Gem' },
  { value: 'realEstate', label: 'Vastgoed', icon: 'Home' },
  { value: 'moneyMarket', label: 'Money Market', icon: 'Wallet' },
  { value: 'crypto', label: 'Crypto', icon: 'Bitcoin' },
  { value: 'mixed', label: 'Mixed', icon: 'Layers' },
];

// ============================================================================
// PROVIDER/AANBIEDER LIJST (Multi-select, searchable)
// ============================================================================

export const PROVIDERS = [
  { value: 'iShares', label: 'iShares (BlackRock)', count: 0 },
  { value: 'Vanguard', label: 'Vanguard', count: 0 },
  { value: 'SPDR', label: 'SPDR (State Street)', count: 0 },
  { value: 'Xtrackers', label: 'Xtrackers (DWS)', count: 0 },
  { value: 'Amundi', label: 'Amundi', count: 0 },
  { value: 'Invesco', label: 'Invesco', count: 0 },
  { value: 'Lyxor', label: 'Lyxor', count: 0 },
  { value: 'WisdomTree', label: 'WisdomTree', count: 0 },
  { value: 'VanEck', label: 'VanEck', count: 0 },
  { value: 'HSBC', label: 'HSBC', count: 0 },
  { value: 'UBS', label: 'UBS', count: 0 },
  { value: 'JPMorgan', label: 'JPMorgan', count: 0 },
  { value: 'Franklin', label: 'Franklin Templeton', count: 0 },
  { value: 'BNP', label: 'BNP Paribas', count: 0 },
  { value: 'Deka', label: 'Deka', count: 0 },
  { value: 'other', label: 'Overige', count: 0 },
];

// ============================================================================
// FILTER OPTIES PER TYPE
// ============================================================================

export const FILTER_OPTIONS = {
  // Regio opties
  region: [
    { value: 'all', label: 'Alle Regio\'s' },
    { value: 'world', label: 'Wereld' },
    { value: 'europe', label: 'Europa' },
    { value: 'usa', label: 'Verenigde Staten' },
    { value: 'emergingMarkets', label: 'Opkomende Markten' },
    { value: 'asiaPacific', label: 'Azië-Pacific' },
    { value: 'japan', label: 'Japan' },
    { value: 'china', label: 'China' },
    { value: 'specificCountry', label: 'Specifiek Land' },
  ],

  // Sector opties (aandelen)
  sector: [
    { value: 'all', label: 'Alle Sectoren' },
    { value: 'technology', label: 'Technologie' },
    { value: 'healthcare', label: 'Gezondheidszorg' },
    { value: 'financials', label: 'Financiële Diensten' },
    { value: 'energy', label: 'Energie' },
    { value: 'industrials', label: 'Industrie' },
    { value: 'consumerDiscretionary', label: 'Cyclische Consumptiegoederen' },
    { value: 'consumerStaples', label: 'Basisconsumptiegoederen' },
    { value: 'utilities', label: 'Nutsbedrijven' },
    { value: 'materials', label: 'Materialen' },
    { value: 'communication', label: 'Communicatie' },
    { value: 'infrastructure', label: 'Infrastructuur' },
  ],

  // Market cap opties
  marketCap: [
    { value: 'all', label: 'Alle' },
    { value: 'large', label: 'Large Cap' },
    { value: 'mid', label: 'Mid Cap' },
    { value: 'small', label: 'Small Cap' },
  ],

  // Strategie opties (aandelen)
  strategy: [
    { value: 'all', label: 'Alle Strategieën' },
    { value: 'growth', label: 'Growth' },
    { value: 'value', label: 'Value' },
    { value: 'dividend', label: 'Dividend' },
    { value: 'esg', label: 'ESG / Duurzaam' },
    { value: 'momentum', label: 'Momentum' },
    { value: 'quality', label: 'Quality' },
    { value: 'lowVol', label: 'Low Volatility' },
  ],

  // Valuta opties
  currency: [
    { value: 'all', label: 'Alle Valuta' },
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' },
    { value: 'GBP', label: 'GBP' },
    { value: 'CHF', label: 'CHF' },
  ],

  // Obligatie type
  bondType: [
    { value: 'all', label: 'Alle Types' },
    { value: 'government', label: 'Staatsobligaties' },
    { value: 'corporate', label: 'Bedrijfsobligaties' },
    { value: 'highYield', label: 'High Yield' },
    { value: 'inflationLinked', label: 'Inflatiegekoppeld' },
    { value: 'aggregate', label: 'Aggregate' },
  ],

  // Looptijd
  duration: [
    { value: 'all', label: 'Alle Looptijden' },
    { value: 'short', label: 'Kort (0-3 jaar)' },
    { value: 'medium', label: 'Medium (3-7 jaar)' },
    { value: 'long', label: 'Lang (7+ jaar)' },
  ],

  // Credit rating
  creditRating: [
    { value: 'all', label: 'Alle Ratings' },
    { value: 'aaa', label: 'AAA' },
    { value: 'aa', label: 'AA' },
    { value: 'a', label: 'A' },
    { value: 'bbb', label: 'BBB' },
    { value: 'highYield', label: 'High Yield (BB en lager)' },
  ],

  // Commodity type
  commodityType: [
    { value: 'all', label: 'Alle Commodities' },
    { value: 'gold', label: 'Goud' },
    { value: 'silver', label: 'Zilver' },
    { value: 'preciousMetals', label: 'Edelmetalen' },
    { value: 'energy', label: 'Energie' },
    { value: 'agriculture', label: 'Landbouw' },
    { value: 'broad', label: 'Breed Mandje' },
  ],

  // Replicatie methode
  replication: [
    { value: 'all', label: 'Alle' },
    { value: 'physical', label: 'Fysiek' },
    { value: 'synthetic', label: 'Synthetisch' },
  ],

  // Vastgoed type
  propertyType: [
    { value: 'all', label: 'Alle Types' },
    { value: 'residential', label: 'Residentieel' },
    { value: 'commercial', label: 'Commercieel' },
    { value: 'reit', label: 'REIT' },
    { value: 'logistics', label: 'Logistiek' },
  ],

  // Crypto type
  cryptoType: [
    { value: 'all', label: 'Alle Crypto' },
    { value: 'bitcoin', label: 'Bitcoin' },
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'basket', label: 'Crypto Mandje' },
  ],

  // Mixed - risico niveau
  riskLevel: [
    { value: 'all', label: 'Alle Niveaus' },
    { value: 'conservative', label: 'Conservatief' },
    { value: 'balanced', label: 'Gebalanceerd' },
    { value: 'aggressive', label: 'Offensief' },
  ],

  // Mixed - asset allocatie
  allocation: [
    { value: 'all', label: 'Alle Allocaties' },
    { value: 'equity75', label: '75%+ Aandelen' },
    { value: 'equity50', label: '50-75% Aandelen' },
    { value: 'bonds50', label: '50%+ Obligaties' },
  ],
};

// ============================================================================
// CATEGORIE-SPECIFIEKE FILTER CONFIGURATIE
// Met flow order voor progressive disclosure
// ============================================================================

export const CATEGORY_FILTERS = {
  // AANDELEN
  equity: {
    flowOrder: ['region', 'sector', 'marketCap', 'strategy', 'currency', 'providers'],
    sections: [
      {
        id: 'primary',
        label: 'Primaire Filters',
        priority: 1,
        filters: [
          { id: 'region', label: 'Regio', options: 'region', type: 'single' },
          { id: 'sector', label: 'Sector', options: 'sector', type: 'single' },
        ],
      },
      {
        id: 'secondary',
        label: 'Kenmerken',
        priority: 2,
        filters: [
          { id: 'marketCap', label: 'Marktkapitalisatie', options: 'marketCap', type: 'single' },
          { id: 'strategy', label: 'Strategie', options: 'strategy', type: 'single' },
        ],
      },
      {
        id: 'details',
        label: 'Details',
        priority: 3,
        filters: [
          { id: 'currency', label: 'Valuta', options: 'currency', type: 'single' },
        ],
      },
    ],
  },

  // OBLIGATIES
  bonds: {
    flowOrder: ['bondType', 'duration', 'creditRating', 'region', 'currency', 'providers'],
    sections: [
      {
        id: 'primary',
        label: 'Type Obligatie',
        priority: 1,
        filters: [
          { id: 'bondType', label: 'Type', options: 'bondType', type: 'single' },
          { id: 'duration', label: 'Looptijd', options: 'duration', type: 'single' },
        ],
      },
      {
        id: 'secondary',
        label: 'Kwaliteit & Regio',
        priority: 2,
        filters: [
          { id: 'creditRating', label: 'Credit Rating', options: 'creditRating', type: 'single' },
          { id: 'region', label: 'Regio', options: 'region', type: 'single' },
        ],
      },
      {
        id: 'details',
        label: 'Details',
        priority: 3,
        filters: [
          { id: 'currency', label: 'Valuta', options: 'currency', type: 'single' },
        ],
      },
    ],
  },

  // COMMODITIES
  commodities: {
    flowOrder: ['commodityType', 'replication', 'currency', 'providers'],
    sections: [
      {
        id: 'primary',
        label: 'Type Grondstof',
        priority: 1,
        filters: [
          { id: 'commodityType', label: 'Grondstof', options: 'commodityType', type: 'single' },
        ],
      },
      {
        id: 'secondary',
        label: 'Structuur',
        priority: 2,
        filters: [
          { id: 'replication', label: 'Replicatie', options: 'replication', type: 'single' },
        ],
      },
      {
        id: 'details',
        label: 'Details',
        priority: 3,
        filters: [
          { id: 'currency', label: 'Valuta', options: 'currency', type: 'single' },
        ],
      },
    ],
  },

  // VASTGOED
  realEstate: {
    flowOrder: ['region', 'propertyType', 'currency', 'providers'],
    sections: [
      {
        id: 'primary',
        label: 'Locatie & Type',
        priority: 1,
        filters: [
          { id: 'region', label: 'Regio', options: 'region', type: 'single' },
          { id: 'propertyType', label: 'Type Vastgoed', options: 'propertyType', type: 'single' },
        ],
      },
      {
        id: 'details',
        label: 'Details',
        priority: 2,
        filters: [
          { id: 'currency', label: 'Valuta', options: 'currency', type: 'single' },
        ],
      },
    ],
  },

  // MONEY MARKET
  moneyMarket: {
    flowOrder: ['currency', 'duration', 'providers'],
    sections: [
      {
        id: 'primary',
        label: 'Kenmerken',
        priority: 1,
        filters: [
          { id: 'currency', label: 'Valuta', options: 'currency', type: 'single' },
          { id: 'duration', label: 'Looptijd', options: 'duration', type: 'single' },
        ],
      },
    ],
  },

  // CRYPTO
  crypto: {
    flowOrder: ['cryptoType', 'replication', 'currency', 'providers'],
    sections: [
      {
        id: 'primary',
        label: 'Type Crypto',
        priority: 1,
        filters: [
          { id: 'cryptoType', label: 'Asset', options: 'cryptoType', type: 'single' },
        ],
      },
      {
        id: 'secondary',
        label: 'Structuur',
        priority: 2,
        filters: [
          { id: 'replication', label: 'Type', options: 'replication', type: 'single' },
        ],
      },
      {
        id: 'details',
        label: 'Details',
        priority: 3,
        filters: [
          { id: 'currency', label: 'Valuta', options: 'currency', type: 'single' },
        ],
      },
    ],
  },

  // MIXED / MULTI-ASSET
  mixed: {
    flowOrder: ['allocation', 'riskLevel', 'region', 'currency', 'providers'],
    sections: [
      {
        id: 'primary',
        label: 'Allocatie & Risico',
        priority: 1,
        filters: [
          { id: 'allocation', label: 'Asset Allocatie', options: 'allocation', type: 'single' },
          { id: 'riskLevel', label: 'Risico Niveau', options: 'riskLevel', type: 'single' },
        ],
      },
      {
        id: 'secondary',
        label: 'Regio',
        priority: 2,
        filters: [
          { id: 'region', label: 'Regio', options: 'region', type: 'single' },
        ],
      },
      {
        id: 'details',
        label: 'Details',
        priority: 3,
        filters: [
          { id: 'currency', label: 'Valuta', options: 'currency', type: 'single' },
        ],
      },
    ],
  },
};

// ============================================================================
// FILTER CHIP KLEUREN
// ============================================================================

export const FILTER_CHIP_COLORS = {
  region: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  sector: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  marketCap: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  strategy: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
  currency: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  bondType: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  duration: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  creditRating: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  commodityType: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  replication: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  propertyType: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  cryptoType: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  riskLevel: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  allocation: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  providers: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' },
};

// ============================================================================
// HELPER FUNCTIES
// ============================================================================

/**
 * Haal standaard filter waarden op voor een categorie
 */
export function getDefaultFilters(category = 'equity') {
  const config = CATEGORY_FILTERS[category];
  if (!config) return { providers: [] };

  const defaults = { providers: [] };
  config.sections.forEach(section => {
    section.filters.forEach(filter => {
      defaults[filter.id] = 'all';
    });
  });
  return defaults;
}

/**
 * Haal filter opties op basis van options key
 */
export function getFilterOptions(optionsKey) {
  return FILTER_OPTIONS[optionsKey] || [];
}

/**
 * Haal het label op voor een filter waarde
 */
export function getFilterValueLabel(filterId, value) {
  if (filterId === 'providers') {
    const provider = PROVIDERS.find(p => p.value === value);
    return provider?.label || value;
  }

  const optionsKey = Object.keys(FILTER_OPTIONS).find(key =>
    FILTER_OPTIONS[key].some(opt => opt.value === value)
  );

  if (optionsKey) {
    const option = FILTER_OPTIONS[optionsKey].find(opt => opt.value === value);
    return option?.label || value;
  }
  return value;
}

/**
 * Controleer of filters actief zijn (niet op 'all' of leeg)
 */
export function hasActiveFilters(filters) {
  return Object.entries(filters).some(([key, value]) => {
    if (key === 'providers') return Array.isArray(value) && value.length > 0;
    return value !== 'all';
  });
}

/**
 * Genereer filter chips voor weergave
 */
export function getFilterChips(filters, category) {
  const chips = [];
  const config = CATEGORY_FILTERS[category];
  if (!config) return chips;

  // Voeg provider chips toe
  if (filters.providers && filters.providers.length > 0) {
    filters.providers.forEach(providerValue => {
      const colors = FILTER_CHIP_COLORS.providers;
      chips.push({
        id: `providers-${providerValue}`,
        filterId: 'providers',
        value: providerValue,
        label: getFilterValueLabel('providers', providerValue),
        filterLabel: 'Aanbieder',
        ...colors,
      });
    });
  }

  // Voeg andere filter chips toe
  config.sections.forEach(section => {
    section.filters.forEach(filter => {
      const value = filters[filter.id];
      if (value && value !== 'all') {
        const colors = FILTER_CHIP_COLORS[filter.id] || {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30'
        };
        chips.push({
          id: `${filter.id}-${value}`,
          filterId: filter.id,
          value,
          label: getFilterValueLabel(filter.id, value),
          filterLabel: filter.label,
          ...colors,
        });
      }
    });
  });

  return chips;
}

/**
 * Bepaal welke sectie als volgende geopend moet worden (progressive disclosure)
 */
export function getNextSectionToExpand(filters, category, currentExpanded) {
  const config = CATEGORY_FILTERS[category];
  if (!config) return null;

  const flowOrder = config.flowOrder || [];

  // Vind de eerste filter in flowOrder die nog niet is ingevuld
  for (const filterId of flowOrder) {
    if (filterId === 'providers') continue; // Providers worden apart behandeld

    const value = filters[filterId];
    if (!value || value === 'all') {
      // Vind de sectie waar deze filter in zit
      for (const section of config.sections) {
        if (section.filters.some(f => f.id === filterId)) {
          return section.id;
        }
      }
    }
  }

  return null;
}
