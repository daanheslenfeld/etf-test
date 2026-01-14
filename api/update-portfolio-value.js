const { createClient } = require('@supabase/supabase-js');
const YahooFinanceClass = require('yahoo-finance2').default;
const yahooFinance = new YahooFinanceClass({ validation: { logErrors: false } });

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rfmbhdgfovnglegqxjnj.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

// ISIN to Yahoo Finance ticker mapping
const ISIN_TO_TICKER = {
  'IE00B5BMR087': 'CSPX.L',      // iShares Core S&P 500
  'IE00B4L5Y983': 'IWDA.AS',     // iShares Core MSCI World
  'IE00B3XXRP09': 'VUSA.L',      // Vanguard S&P 500
  'IE00BKM4GZ66': 'EMIM.L',      // iShares Core MSCI EM IMI
  'IE00BDBRDM35': 'AGGH.L',      // iShares Core Global Aggregate Bond
  'IE00B4WXJJ64': 'SEGA.L',      // iShares Core Euro Government Bond
  'IE00B4ND3602': 'IGLN.L',      // iShares Physical Gold
  'IE00B579F325': 'SGLN.L',      // Invesco Physical Gold
  'IE00B3RBWM25': 'VWRL.L',      // Vanguard FTSE All-World
  'IE00B0M62Q58': 'IWRD.L',      // iShares MSCI World
  'IE00B1FZS350': 'IWDP.L',      // iShares Developed Markets Property
  'IE00BJ0KDQ92': 'XDWD.L',      // Xtrackers MSCI World
  'IE00BTJRMP35': 'XMME.L',      // Xtrackers MSCI Emerging Markets
  'IE00B3F81R35': 'IEAC.L',      // iShares Core Euro Corporate Bond
  'IE00B1FZS467': 'INFR.L',      // iShares Global Infrastructure
  'IE00B4WJKG14': 'WELT.DE',     // iShares MSCI World SRI
  'IE00B3WJKG14': 'IITU.L',      // iShares S&P 500 Info Tech Sector
  'DE0002635307': 'EXSA.DE',     // iShares STOXX Europe 600 (fixed ticker)
  'IE00BLF7VX27': 'SPPU.DE',     // SPDR Bloomberg SASB US Corporate ESG
  'IE00B3VWN393': 'CBU7.L',      // iShares USD Treasury Bond 3-7yr
  'DE000A0S9GB0': '4GLD.DE',     // Xetra-Gold
};

// Get EUR exchange rates
async function getEurRates() {
  try {
    const eurUsd = await yahooFinance.quote('EURUSD=X', {}, { validateResult: false });
    const gbpUsd = await yahooFinance.quote('GBPUSD=X', {}, { validateResult: false });
    return {
      USD: eurUsd ? 1 / eurUsd.regularMarketPrice : 0.86,
      GBP: gbpUsd && eurUsd ? eurUsd.regularMarketPrice / gbpUsd.regularMarketPrice : 1.17,
      GBp: gbpUsd && eurUsd ? (eurUsd.regularMarketPrice / gbpUsd.regularMarketPrice) / 100 : 0.0117,
      EUR: 1
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return { USD: 0.86, GBP: 1.17, GBp: 0.0117, EUR: 1 };
  }
}

// Convert to EUR
function convertToEur(value, currency, rates) {
  if (currency === 'EUR') return value;
  if (currency === 'USD') return value * rates.USD;
  if (currency === 'GBP') return value * rates.GBP;
  if (currency === 'GBp') return value * rates.GBp;
  return value;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { customer_id } = req.body;

  if (!customer_id) {
    return res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
  }

  try {
    // Get customer's portfolio with purchase data
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolio')
      .select('*')
      .eq('customer_id', customer_id);

    if (portfolioError) {
      throw portfolioError;
    }

    if (!portfolio || portfolio.length === 0) {
      return res.status(200).json({
        success: true,
        totalInvested: 0,
        currentValue: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        holdings: []
      });
    }

    // Get current exchange rates
    const rates = await getEurRates();

    // Calculate current value for each holding
    const holdings = [];
    let totalInvested = 0;
    let totalCurrentValue = 0;

    for (const item of portfolio) {
      const ticker = ISIN_TO_TICKER[item.isin];
      let currentPrice = null;
      let currentValue = null;
      let gain = null;
      let gainPercent = null;

      if (ticker && item.units) {
        try {
          const quote = await yahooFinance.quote(ticker, {}, { validateResult: false });
          if (quote && quote.regularMarketPrice) {
            currentPrice = convertToEur(quote.regularMarketPrice, quote.currency || 'EUR', rates);
            currentValue = item.units * currentPrice;

            if (item.invested_amount) {
              gain = currentValue - item.invested_amount;
              gainPercent = ((currentValue - item.invested_amount) / item.invested_amount) * 100;
            }
          }
        } catch (error) {
          console.error('Error fetching price for ' + ticker + ':', error.message);
        }
      }

      const investedAmount = item.invested_amount || 0;
      totalInvested += investedAmount;
      totalCurrentValue += currentValue || investedAmount;

      holdings.push({
        naam: item.naam,
        isin: item.isin,
        categorie: item.categorie,
        weight: item.weight,
        units: item.units,
        purchasePrice: item.purchase_price,
        purchaseDate: item.purchase_date,
        investedAmount: investedAmount,
        currentPrice: currentPrice,
        currentValue: currentValue,
        gain: gain,
        gainPercent: gainPercent
      });
    }

    const totalReturn = totalCurrentValue - totalInvested;
    const totalReturnPercent = totalInvested > 0
      ? ((totalCurrentValue - totalInvested) / totalInvested) * 100
      : 0;

    res.status(200).json({
      success: true,
      totalInvested: totalInvested,
      currentValue: totalCurrentValue,
      totalReturn: totalReturn,
      totalReturnPercent: totalReturnPercent,
      holdings: holdings,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error calculating portfolio value:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate portfolio value',
      error: error.message
    });
  }
};
