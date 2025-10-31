const YahooFinanceClass = require('yahoo-finance2').default;
const yahooFinance = new YahooFinanceClass();

// Mapping of ISIN to Yahoo Finance ticker symbols
// European ETFs typically trade on multiple exchanges, using the most liquid ones
const ISIN_TO_TICKER = {
  // iShares Core S&P 500 UCITS ETF USD (Acc)
  'IE00B5BMR087': 'CSPX.L',  // London Stock Exchange

  // iShares Core MSCI World UCITS ETF USD (Acc)
  'IE00B4L5Y983': 'IWDA.AS', // Amsterdam

  // Vanguard S&P 500 UCITS ETF (USD) Distributing
  'IE00B3XXRP09': 'VUSA.L',  // London

  // iShares Core MSCI Emerging Markets IMI UCITS ETF (Acc)
  'IE00BKM4GZ66': 'EMIM.L',  // London

  // iShares Core Global Aggregate Bond UCITS ETF EUR Hedged (Acc)
  'IE00BDBRDM35': 'AGGH.L',  // London

  // iShares Core Euro Government Bond UCITS ETF
  'IE00B4WXJJ64': 'SEGA.L',  // London

  // iShares Physical Gold ETC
  'IE00B4ND3602': 'IGLN.L',  // London
  'IE00B579F325': 'SGLN.L',  // London (alternative)

  // Vanguard FTSE All-World UCITS ETF
  'IE00B3RBWM25': 'VWRL.L',  // London

  // iShares MSCI World UCITS ETF
  'IE00B0M62Q58': 'IWRD.L',  // London

  // iShares Developed Markets Property Yield UCITS ETF
  'IE00B1FZS350': 'IWDP.L',  // London

  // Xtrackers MSCI World UCITS ETF
  'IE00BJ0KDQ92': 'XDWD.L',  // London

  // Xtrackers MSCI Emerging Markets UCITS ETF
  'IE00BTJRMP35': 'XMME.L',  // London

  // iShares Core Euro Corporate Bond UCITS ETF
  'IE00B3F81R35': 'IEAC.L',  // London

  // iShares Global Infrastructure UCITS ETF
  'IE00B1FZS467': 'INFR.L',  // London

  // iShares WELT UCITS ETF
  'IE00B4WJKG14': 'WELT.DE', // Xetra

  // iShares Gold - DE
  'DE0002635307': 'EWG2.DE', // Xetra
};

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

  const { isins } = req.body;

  if (!isins || !Array.isArray(isins)) {
    return res.status(400).json({
      success: false,
      message: 'ISINs array is required'
    });
  }

  try {
    const prices = {};
    const errors = [];

    // Fetch prices for each ISIN
    for (const isin of isins) {
      const ticker = ISIN_TO_TICKER[isin];

      if (!ticker) {
        errors.push(`No ticker mapping found for ISIN: ${isin}`);
        continue;
      }

      try {
        // Fetch quote with a timeout
        const quote = await yahooFinance.quote(ticker, {
          fields: ['regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent', 'currency']
        });

        if (quote && quote.regularMarketPrice) {
          prices[isin] = {
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            currency: quote.currency || 'EUR',
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
