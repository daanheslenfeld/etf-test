const YahooFinanceClass = require('yahoo-finance2').default;
const yahooFinance = new YahooFinanceClass({ validation: { logErrors: false } });

// Market indices tickers
const MARKET_INDICES = {
  'S&P 500': '^GSPC',
  'Dow Jones': '^DJI',
  'NASDAQ': '^IXIC',
  'AEX': '^AEX',
  'DAX': '^GDAXI',
  'FTSE 100': '^FTSE',
};

// Currency pairs
const CURRENCIES = {
  'EUR/USD': 'EURUSD=X',
  'GBP/USD': 'GBPUSD=X',
  'USD/JPY': 'USDJPY=X',
  'EUR/GBP': 'EURGBP=X',
};

// Commodities and crypto
const COMMODITIES = {
  'Gold': 'GC=F',
  'Bitcoin': 'BTC-USD',
  'Ethereum': 'ETH-USD',
};

// Mapping of ISIN to Yahoo Finance ticker symbols
const ISIN_TO_TICKER = {
  'IE00B5BMR087': 'CSPX.L',
  'IE00B4L5Y983': 'IWDA.AS',
  'IE00B3XXRP09': 'VUSA.L',
  'IE00BKM4GZ66': 'EMIM.L',
  'IE00BDBRDM35': 'AGGH.L',
  'IE00B4WXJJ64': 'SEGA.L',
  'IE00B4ND3602': 'IGLN.L',
  'IE00B579F325': 'SGLN.L',
  'IE00B3RBWM25': 'VWRL.L',
  'IE00B0M62Q58': 'IWRD.L',
  'IE00B1FZS350': 'IWDP.L',
  'IE00BJ0KDQ92': 'XDWD.L',
  'IE00BTJRMP35': 'XMME.L',
  'IE00B3F81R35': 'IEAC.L',
  'IE00B1FZS467': 'INFR.L',
  'IE00B4WJKG14': 'WELT.DE',
  'DE0002635307': 'EXSA.DE',
  'IE00B3WJKG14': 'IITU.L',
  'IE00BLF7VX27': 'SPPU.DE',     // SPDR Bloomberg SASB US Corporate ESG
  'IE00B3VWN393': 'CBU7.L',      // iShares USD Treasury Bond 3-7yr
  'DE000A0S9GB0': '4GLD.DE',     // Xetra-Gold
};

// Helper function to fetch a single quote
async function fetchQuote(ticker) {
  try {
    const quote = await yahooFinance.quote(ticker, {
      fields: ['regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent', 'currency', 'regularMarketPreviousClose']
    }, { validateResult: false });
    return quote;
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error.message);
    return null;
  }
}

// Get EUR exchange rate
async function getEurRate() {
  try {
    const eurUsd = await fetchQuote('EURUSD=X');
    const gbpUsd = await fetchQuote('GBPUSD=X');
    return {
      USD: eurUsd ? 1 / eurUsd.regularMarketPrice : 0.86, // fallback
      GBP: gbpUsd && eurUsd ? eurUsd.regularMarketPrice / gbpUsd.regularMarketPrice : 1.17, // EUR per GBP
      GBp: gbpUsd && eurUsd ? (eurUsd.regularMarketPrice / gbpUsd.regularMarketPrice) / 100 : 0.0117, // EUR per GBp (pence)
      EUR: 1
    };
  } catch (error) {
    return { USD: 0.86, GBP: 1.17, GBp: 0.0117, EUR: 1 };
  }
}

// Convert to EUR
function convertToEur(value, currency, rates) {
  if (currency === 'EUR') return value;
  if (currency === 'USD') return value * rates.USD;
  if (currency === 'GBP') return value * rates.GBP;
  if (currency === 'GBp') return value * rates.GBp;
  return value; // fallback
}

module.exports = async (req, res) => {
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

  const { isins, type } = req.body;

  // Handle market data request
  if (type === 'market') {
    try {
      const rates = await getEurRate();
      const indices = [];
      const currencies = [];
      const commodities = [];

      // Fetch indices
      for (const [name, ticker] of Object.entries(MARKET_INDICES)) {
        const quote = await fetchQuote(ticker);
        if (quote && quote.regularMarketPrice) {
          indices.push({
            name,
            value: quote.regularMarketPrice,
            change: quote.regularMarketChangePercent || 0,
            positive: (quote.regularMarketChangePercent || 0) >= 0
          });
        }
      }

      // Fetch currencies
      for (const [name, ticker] of Object.entries(CURRENCIES)) {
        const quote = await fetchQuote(ticker);
        if (quote && quote.regularMarketPrice) {
          currencies.push({
            name,
            value: quote.regularMarketPrice,
            change: quote.regularMarketChangePercent || 0,
            positive: (quote.regularMarketChangePercent || 0) >= 0
          });
        }
      }

      // Fetch commodities and convert to EUR
      for (const [name, ticker] of Object.entries(COMMODITIES)) {
        const quote = await fetchQuote(ticker);
        if (quote && quote.regularMarketPrice) {
          const valueInEur = convertToEur(quote.regularMarketPrice, quote.currency || 'USD', rates);
          commodities.push({
            name,
            symbol: name === 'Gold' ? 'XAU' : name === 'Bitcoin' ? 'BTC' : 'ETH',
            value: valueInEur,
            change: quote.regularMarketChangePercent || 0,
            positive: (quote.regularMarketChangePercent || 0) >= 0
          });
        }
      }

      return res.status(200).json({
        success: true,
        indices,
        currencies,
        commodities,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching market data:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch market data',
        error: error.message
      });
    }
  }

  // Handle ETF prices request
  if (!isins || !Array.isArray(isins)) {
    return res.status(400).json({
      success: false,
      message: 'ISINs array is required'
    });
  }

  try {
    const rates = await getEurRate();
    const prices = {};
    const errors = [];

    for (const isin of isins) {
      const ticker = ISIN_TO_TICKER[isin];

      if (!ticker) {
        errors.push(`No ticker mapping found for ISIN: ${isin}`);
        continue;
      }

      try {
        const quote = await yahooFinance.quote(ticker, {
          fields: ['regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent', 'currency']
        }, { validateResult: false });

        if (quote && quote.regularMarketPrice) {
          const priceInEur = convertToEur(quote.regularMarketPrice, quote.currency || 'EUR', rates);
          prices[isin] = {
            price: priceInEur,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            currency: 'EUR',
            ticker: ticker,
            timestamp: new Date().toISOString()
          };
        } else {
          errors.push(`No price data available for ${ticker} (ISIN: ${isin})`);
        }
      } catch (error) {
        console.error(`Error fetching price for ${ticker} (ISIN: ${isin}):`, error.message);
        errors.push(`Failed to fetch ${ticker}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      prices,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching ETF prices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ETF prices',
      error: error.message
    });
  }
};
