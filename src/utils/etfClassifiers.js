// ETF classificatie functies voor naam-gebaseerde metadata extractie
// Optimized: toLowerCase is called once per ETF, not per classifier

/**
 * Bepaal asset class van ETF
 */
function classifyAssetClassFast(nameLower, symbolLower) {
  // Crypto
  if (nameLower.includes('bitcoin') || nameLower.includes('ethereum') || nameLower.includes('crypto') ||
      nameLower.includes('blockchain') || nameLower.includes('solana') || nameLower.includes('cardano') ||
      symbolLower.includes('btc') || symbolLower.includes('eth')) {
    return 'crypto';
  }

  // Money Market
  if (nameLower.includes('money market') || nameLower.includes('overnight') || nameLower.includes('cash') ||
      nameLower.includes('liquidity') || nameLower.includes('ultra-short') || nameLower.includes('ultrashort') ||
      nameLower.includes('geldmarkt')) {
    return 'moneyMarket';
  }

  // Commodities
  if (nameLower.includes('gold') || nameLower.includes('silver') || nameLower.includes('commodity') ||
      nameLower.includes('commodities') || nameLower.includes('oil') || nameLower.includes('metal') ||
      nameLower.includes('agriculture') || nameLower.includes('platinum') || nameLower.includes('palladium') ||
      nameLower.includes('copper') || nameLower.includes('natural gas') || nameLower.includes('wheat') ||
      nameLower.includes('corn') || nameLower.includes('coffee') || nameLower.includes('sugar') ||
      nameLower.includes('goud') || nameLower.includes('zilver')) {
    return 'commodities';
  }

  // Obligaties / Fixed Income
  if (nameLower.includes('bond') || nameLower.includes('treasury') || nameLower.includes('corporate') ||
      nameLower.includes('government') || nameLower.includes('aggregate') || nameLower.includes('fixed income') ||
      nameLower.includes('gilt') || nameLower.includes('credit') || nameLower.includes('sovereign') ||
      nameLower.includes('high yield') || nameLower.includes('investment grade') || nameLower.includes('municipal') ||
      nameLower.includes('inflation linked') || nameLower.includes('tips') || nameLower.includes('obligatie')) {
    return 'bonds';
  }

  // Vastgoed
  if (nameLower.includes('real estate') || nameLower.includes('reit') || nameLower.includes('property') ||
      nameLower.includes('epra') || nameLower.includes('nareit') || nameLower.includes('listed property') ||
      nameLower.includes('vastgoed')) {
    return 'realEstate';
  }

  // Mixed / Multi-Asset
  if (nameLower.includes('multi-asset') || nameLower.includes('multi asset') || nameLower.includes('balanced') ||
      nameLower.includes('allocation') || nameLower.includes('portfolio') || nameLower.includes('lifecycle')) {
    return 'mixed';
  }

  return 'equity';
}

/**
 * Bepaal regio van ETF
 */
function classifyRegionFast(nameLower) {
  if (nameLower.includes('world') || nameLower.includes('global') || nameLower.includes('all-world') ||
      nameLower.includes('acwi') || nameLower.includes('msci world') || nameLower.includes('ftse all-world')) {
    return 'world';
  }

  if (nameLower.includes('s&p 500') || nameLower.includes('s&p500') || nameLower.includes('nasdaq') ||
      nameLower.includes('msci usa') || nameLower.includes('dow jones') || nameLower.includes('russell') ||
      nameLower.includes('us ') || nameLower.includes('usa ') || nameLower.includes('united states') ||
      nameLower.includes('american') || nameLower.includes('crsp us') || nameLower.includes('north america')) {
    return 'usa';
  }

  if (nameLower.includes('europe') || nameLower.includes('euro ') || nameLower.includes('eurozone') ||
      nameLower.includes('stoxx') || nameLower.includes('eurostoxx') || nameLower.includes('msci emu') ||
      nameLower.includes('ftse developed europe') || nameLower.includes('msci europe')) {
    return 'europe';
  }

  if (nameLower.includes('japan') || nameLower.includes('nikkei') || nameLower.includes('topix') ||
      nameLower.includes('msci japan')) {
    return 'japan';
  }

  if (nameLower.includes('china') || nameLower.includes('chinese') || nameLower.includes('csi 300') ||
      nameLower.includes('hang seng') || nameLower.includes('msci china') || nameLower.includes('ftse china')) {
    return 'china';
  }

  if (nameLower.includes('emerging') || nameLower.includes('em ') || nameLower.includes('msci em') ||
      nameLower.includes('frontier') || nameLower.includes('developing')) {
    return 'emergingMarkets';
  }

  if (nameLower.includes('asia') || nameLower.includes('pacific') || nameLower.includes('apac') ||
      nameLower.includes('india') || nameLower.includes('korea') || nameLower.includes('taiwan') ||
      nameLower.includes('hong kong') || nameLower.includes('australia') || nameLower.includes('singapore') ||
      nameLower.includes('asean') || nameLower.includes('asx')) {
    return 'asiaPacific';
  }

  if (nameLower.includes('germany') || nameLower.includes('france') || nameLower.includes('uk ') ||
      nameLower.includes('switzerland') || nameLower.includes('brazil') || nameLower.includes('mexico') ||
      nameLower.includes('canada') || nameLower.includes('italy') || nameLower.includes('spain') ||
      nameLower.includes('netherlands') || nameLower.includes('sweden') || nameLower.includes('dax') ||
      nameLower.includes('cac') || nameLower.includes('ftse 100') || nameLower.includes('ibovespa')) {
    return 'specificCountry';
  }

  return 'world';
}

/**
 * Bepaal sector van ETF
 */
function classifySectorFast(nameLower) {
  if (nameLower.includes('technology') || nameLower.includes('tech') || nameLower.includes('information technology') ||
      nameLower.includes('digital') || nameLower.includes('software') || nameLower.includes('semiconductor') ||
      nameLower.includes('cyber') || nameLower.includes('cloud') || nameLower.includes('artificial intelligence') ||
      nameLower.includes(' ai ') || nameLower.includes('robotics') || nameLower.includes('automation')) {
    return 'technology';
  }

  if (nameLower.includes('health') || nameLower.includes('healthcare') || nameLower.includes('pharma') ||
      nameLower.includes('biotech') || nameLower.includes('medical') || nameLower.includes('genomics')) {
    return 'healthcare';
  }

  if (nameLower.includes('financial') || nameLower.includes('bank') || nameLower.includes('insurance') ||
      nameLower.includes('fintech')) {
    return 'financials';
  }

  if (nameLower.includes('energy') || nameLower.includes('oil ') || nameLower.includes('gas ') ||
      nameLower.includes('clean energy') || nameLower.includes('renewable') || nameLower.includes('solar') ||
      nameLower.includes('wind') || nameLower.includes('hydrogen') || nameLower.includes('battery')) {
    return 'energy';
  }

  if (nameLower.includes('industrial') || nameLower.includes('aerospace') || nameLower.includes('defence') ||
      nameLower.includes('defense') || nameLower.includes('machinery')) {
    return 'industrials';
  }

  if (nameLower.includes('consumer discretionary') || nameLower.includes('retail') || nameLower.includes('luxury') ||
      nameLower.includes('travel') || nameLower.includes('leisure') || nameLower.includes('gaming') ||
      nameLower.includes('e-commerce') || nameLower.includes('ecommerce')) {
    return 'consumerDiscretionary';
  }

  if (nameLower.includes('consumer staples') || nameLower.includes('food') || nameLower.includes('beverage') ||
      nameLower.includes('household') || nameLower.includes('personal care')) {
    return 'consumerStaples';
  }

  if (nameLower.includes('utilities') || nameLower.includes('utility') || nameLower.includes('electric')) {
    return 'utilities';
  }

  if (nameLower.includes('materials') || nameLower.includes('basic materials') || nameLower.includes('mining') ||
      nameLower.includes('chemicals') || nameLower.includes('steel')) {
    return 'materials';
  }

  if (nameLower.includes('communication') || nameLower.includes('media') || nameLower.includes('telecom') ||
      nameLower.includes('entertainment')) {
    return 'communication';
  }

  if (nameLower.includes('infrastructure') || nameLower.includes('transport') || nameLower.includes('logistics')) {
    return 'infrastructure';
  }

  return 'all';
}

/**
 * Bepaal market cap
 */
function classifyMarketCapFast(nameLower) {
  if (nameLower.includes('small cap') || nameLower.includes('small-cap') || nameLower.includes('smallcap')) {
    return 'small';
  }
  if (nameLower.includes('mid cap') || nameLower.includes('mid-cap') || nameLower.includes('midcap')) {
    return 'mid';
  }
  if (nameLower.includes('large cap') || nameLower.includes('large-cap') || nameLower.includes('largecap') ||
      nameLower.includes('mega cap') || nameLower.includes('blue chip')) {
    return 'large';
  }
  return 'all';
}

/**
 * Bepaal strategie
 */
function classifyStrategyFast(nameLower) {
  if (nameLower.includes('growth')) return 'growth';
  if (nameLower.includes('value') && !nameLower.includes('multi')) return 'value';
  if (nameLower.includes('dividend') || nameLower.includes('aristocrat') || nameLower.includes('income')) {
    return 'dividend';
  }
  if (nameLower.includes('esg') || nameLower.includes('sri') || nameLower.includes('sustainable') ||
      nameLower.includes('responsible') || nameLower.includes('climate') || nameLower.includes('paris') ||
      nameLower.includes('green') || nameLower.includes('clean') || nameLower.includes('low carbon')) {
    return 'esg';
  }
  if (nameLower.includes('momentum')) return 'momentum';
  if (nameLower.includes('quality')) return 'quality';
  if (nameLower.includes('low volatility') || nameLower.includes('min vol') ||
      nameLower.includes('minimum volatility') || nameLower.includes('low vol')) {
    return 'lowVol';
  }
  return 'all';
}

/**
 * Bepaal obligatie type
 */
function classifyBondTypeFast(nameLower) {
  if (nameLower.includes('government') || nameLower.includes('sovereign') || nameLower.includes('treasury') ||
      nameLower.includes('gilt') || nameLower.includes('bund') || nameLower.includes('oat') ||
      nameLower.includes('staat')) {
    return 'government';
  }
  if (nameLower.includes('corporate') || nameLower.includes('investment grade') ||
      (nameLower.includes('credit') && !nameLower.includes('high yield'))) {
    return 'corporate';
  }
  if (nameLower.includes('high yield') || nameLower.includes('high-yield') || nameLower.includes('hy ') ||
      nameLower.includes('junk') || nameLower.includes('fallen angel')) {
    return 'highYield';
  }
  if (nameLower.includes('inflation') || nameLower.includes('tips') || nameLower.includes('linker') ||
      nameLower.includes('il ') || nameLower.includes('real return')) {
    return 'inflationLinked';
  }
  if (nameLower.includes('aggregate') || nameLower.includes('agg') || nameLower.includes('total bond') ||
      nameLower.includes('broad market')) {
    return 'aggregate';
  }
  return 'all';
}

/**
 * Bepaal looptijd/duration
 */
function classifyDurationFast(nameLower) {
  if (nameLower.includes('ultra short') || nameLower.includes('ultra-short') || nameLower.includes('0-1') ||
      nameLower.includes('floating rate') || nameLower.includes('variable rate')) {
    return 'short';
  }
  if (nameLower.includes('short') || nameLower.includes('1-3') || nameLower.includes('1-5') ||
      nameLower.includes('0-3') || nameLower.includes('0-5')) {
    return 'short';
  }
  if (nameLower.includes('intermediate') || nameLower.includes('medium') || nameLower.includes('3-7') ||
      nameLower.includes('5-7') || nameLower.includes('3-5') || nameLower.includes('5-10')) {
    return 'medium';
  }
  if (nameLower.includes('long') || nameLower.includes('10+') || nameLower.includes('10-20') ||
      nameLower.includes('20+') || nameLower.includes('15+') || nameLower.includes('7-10') ||
      nameLower.includes('long duration') || nameLower.includes('long-dated')) {
    return 'long';
  }
  return 'all';
}

/**
 * Bepaal credit rating
 */
function classifyCreditRatingFast(nameLower) {
  if (nameLower.includes('aaa')) return 'aaa';
  if (nameLower.includes(' aa') || nameLower.includes('-aa')) return 'aa';
  if (nameLower.includes(' a ') || nameLower.includes('-a-') || nameLower.includes(' a-rated')) return 'a';
  if (nameLower.includes('bbb') || nameLower.includes('investment grade')) return 'bbb';
  if (nameLower.includes('high yield') || nameLower.includes('hy ') || nameLower.includes('bb') ||
      nameLower.includes('junk') || nameLower.includes('sub-investment')) {
    return 'highYield';
  }
  return 'all';
}

/**
 * Bepaal commodity type
 */
function classifyCommodityTypeFast(nameLower) {
  if (nameLower.includes('gold') || nameLower.includes('goud')) return 'gold';
  if (nameLower.includes('silver') || nameLower.includes('zilver')) return 'silver';
  if (nameLower.includes('precious metal') || nameLower.includes('edelmetaal') ||
      nameLower.includes('platinum') || nameLower.includes('palladium')) {
    return 'preciousMetals';
  }
  if (nameLower.includes('oil') || nameLower.includes('natural gas') || nameLower.includes('energy') ||
      nameLower.includes('crude')) {
    return 'energy';
  }
  if (nameLower.includes('agriculture') || nameLower.includes('wheat') || nameLower.includes('corn') ||
      nameLower.includes('coffee') || nameLower.includes('sugar') || nameLower.includes('soybean')) {
    return 'agriculture';
  }
  if (nameLower.includes('broad') || nameLower.includes('commodity index') || nameLower.includes('diversified')) {
    return 'broad';
  }
  return 'all';
}

/**
 * Bepaal replicatie methode
 */
function classifyReplicationFast(nameLower) {
  if (nameLower.includes('synthetic') || nameLower.includes('swap') || nameLower.includes('unfunded')) {
    return 'synthetic';
  }
  if (nameLower.includes('physical') || nameLower.includes('direct') || nameLower.includes('optimised') ||
      nameLower.includes('optimized') || nameLower.includes('sampled') || nameLower.includes('full replication')) {
    return 'physical';
  }
  return 'all';
}

/**
 * Bepaal vastgoed type
 */
function classifyPropertyTypeFast(nameLower) {
  if (nameLower.includes('residential') || nameLower.includes('housing') || nameLower.includes('apartment')) {
    return 'residential';
  }
  if (nameLower.includes('commercial') || nameLower.includes('office') || nameLower.includes('retail')) {
    return 'commercial';
  }
  if (nameLower.includes('reit') || nameLower.includes('epra') || nameLower.includes('nareit')) {
    return 'reit';
  }
  if (nameLower.includes('logistics') || nameLower.includes('industrial') || nameLower.includes('warehouse')) {
    return 'logistics';
  }
  return 'all';
}

/**
 * Bepaal crypto type
 */
function classifyCryptoTypeFast(nameLower, symbolLower) {
  if (nameLower.includes('bitcoin') || symbolLower.includes('btc')) return 'bitcoin';
  if (nameLower.includes('ethereum') || symbolLower.includes('eth')) return 'ethereum';
  if (nameLower.includes('basket') || nameLower.includes('index') || nameLower.includes('diversified')) {
    return 'basket';
  }
  return 'all';
}

/**
 * Bepaal risico niveau
 */
function classifyRiskLevelFast(nameLower) {
  if (nameLower.includes('conservative') || nameLower.includes('defensive') ||
      nameLower.includes('cautious') || nameLower.includes('defensief')) {
    return 'conservative';
  }
  if (nameLower.includes('balanced') || nameLower.includes('moderate') || nameLower.includes('gebalanceerd')) {
    return 'balanced';
  }
  if (nameLower.includes('aggressive') || nameLower.includes('growth') ||
      nameLower.includes('dynamic') || nameLower.includes('offensief')) {
    return 'aggressive';
  }
  return 'all';
}

/**
 * Bepaal asset allocatie
 */
function classifyAllocationFast(nameLower) {
  if (nameLower.includes('80/20') || nameLower.includes('75/25') ||
      nameLower.includes('equity 80') || nameLower.includes('equity 75')) {
    return 'equity75';
  }
  if (nameLower.includes('60/40') || nameLower.includes('50/50') ||
      nameLower.includes('equity 60') || nameLower.includes('equity 50')) {
    return 'equity50';
  }
  if (nameLower.includes('20/80') || nameLower.includes('25/75') ||
      nameLower.includes('bond 80') || nameLower.includes('bond 75')) {
    return 'bonds50';
  }
  return 'all';
}

/**
 * Bepaal aanbieder/issuer
 */
function classifyIssuerFast(nameLower) {
  if (nameLower.includes('ishares')) return 'iShares';
  if (nameLower.includes('vanguard')) return 'Vanguard';
  if (nameLower.includes('spdr')) return 'SPDR';
  if (nameLower.includes('xtrackers')) return 'Xtrackers';
  if (nameLower.includes('amundi')) return 'Amundi';
  if (nameLower.includes('invesco')) return 'Invesco';
  if (nameLower.includes('wisdomtree')) return 'WisdomTree';
  if (nameLower.includes('vaneck')) return 'VanEck';
  if (nameLower.includes('lyxor')) return 'Lyxor';
  if (nameLower.includes('hsbc')) return 'HSBC';
  if (nameLower.includes('ubs')) return 'UBS';
  if (nameLower.includes('jpmorgan') || nameLower.includes('jp morgan')) return 'JPMorgan';
  if (nameLower.includes('franklin')) return 'Franklin';
  if (nameLower.includes('bnp')) return 'BNP';
  if (nameLower.includes('deka')) return 'Deka';
  return 'other';
}

/**
 * Verrijk ETF met alle classificaties - OPTIMIZED
 * toLowerCase is called once, not 15+ times
 */
export function enrichETF(etf) {
  const name = etf.name || '';
  const symbol = etf.symbol || '';

  // Convert to lowercase ONCE
  const nameLower = name.toLowerCase();
  const symbolLower = symbol.toLowerCase();

  return {
    ...etf,
    assetClass: classifyAssetClassFast(nameLower, symbolLower),
    region: classifyRegionFast(nameLower),
    sector: classifySectorFast(nameLower),
    marketCap: classifyMarketCapFast(nameLower),
    strategy: classifyStrategyFast(nameLower),
    bondType: classifyBondTypeFast(nameLower),
    duration: classifyDurationFast(nameLower),
    creditRating: classifyCreditRatingFast(nameLower),
    commodityType: classifyCommodityTypeFast(nameLower),
    replication: classifyReplicationFast(nameLower),
    propertyType: classifyPropertyTypeFast(nameLower),
    cryptoType: classifyCryptoTypeFast(nameLower, symbolLower),
    riskLevel: classifyRiskLevelFast(nameLower),
    allocation: classifyAllocationFast(nameLower),
    issuer: classifyIssuerFast(nameLower),
  };
}

// Legacy exports for backwards compatibility
export const classifyAssetClass = (name, symbol) => classifyAssetClassFast(name.toLowerCase(), (symbol || '').toLowerCase());
export const classifyRegion = (name) => classifyRegionFast(name.toLowerCase());
export const classifySector = (name) => classifySectorFast(name.toLowerCase());
export const classifyMarketCap = (name) => classifyMarketCapFast(name.toLowerCase());
export const classifyStrategy = (name) => classifyStrategyFast(name.toLowerCase());
export const classifyBondType = (name) => classifyBondTypeFast(name.toLowerCase());
export const classifyDuration = (name) => classifyDurationFast(name.toLowerCase());
export const classifyCreditRating = (name) => classifyCreditRatingFast(name.toLowerCase());
export const classifyCommodityType = (name) => classifyCommodityTypeFast(name.toLowerCase());
export const classifyReplication = (name) => classifyReplicationFast(name.toLowerCase());
export const classifyPropertyType = (name) => classifyPropertyTypeFast(name.toLowerCase());
export const classifyCryptoType = (name, symbol) => classifyCryptoTypeFast(name.toLowerCase(), (symbol || '').toLowerCase());
export const classifyRiskLevel = (name) => classifyRiskLevelFast(name.toLowerCase());
export const classifyAllocation = (name) => classifyAllocationFast(name.toLowerCase());
export const classifyIssuer = (name) => classifyIssuerFast(name.toLowerCase());
