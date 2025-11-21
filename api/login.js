const { createClient } = require('@supabase/supabase-js');
const YahooFinanceClass = require('yahoo-finance2').default;
const yahooFinance = new YahooFinanceClass();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rfmbhdgfovnglegqxjnj.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

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
  'DE0002635307': 'EWG2.DE',
};

// Fetch real-time prices for portfolio ETFs
async function fetchETFPrices(portfolio) {
  if (!portfolio || portfolio.length === 0) {
    return { portfolio, pricesLastUpdated: null };
  }

  const isins = portfolio.map(item => item.isin).filter(Boolean);
  if (isins.length === 0) {
    return { portfolio, pricesLastUpdated: null };
  }

  const prices = {};
  const timestamp = new Date().toISOString();

  // Fetch prices for each ISIN
  for (const isin of isins) {
    const ticker = ISIN_TO_TICKER[isin];
    if (!ticker) continue;

    try {
      const quote = await yahooFinance.quote(ticker, {
        fields: ['regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent', 'currency']
      });

      if (quote && quote.regularMarketPrice) {
        prices[isin] = {
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          currency: quote.currency || 'EUR'
        };
      }
    } catch (error) {
      console.error(`Error fetching price for ${ticker} (ISIN: ${isin}):`, error.message);
    }
  }

  // Attach prices to portfolio items
  const enrichedPortfolio = portfolio.map(item => ({
    ...item,
    currentPrice: prices[item.isin]?.price || null,
    priceChange: prices[item.isin]?.change || null,
    priceChangePercent: prices[item.isin]?.changePercent || null,
    currency: prices[item.isin]?.currency || null
  }));

  return { portfolio: enrichedPortfolio, pricesLastUpdated: timestamp };
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !customer) {
      return res.status(401).json({
        success: false,
        message: 'Onjuiste email of wachtwoord'
      });
    }

    // Email verification disabled
    // if (!customer.email_verified) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Je moet eerst je email bevestigen voordat je kunt inloggen. Controleer je inbox voor de verificatie link.',
    //     emailNotVerified: true
    //   });
    // }

    // Get portfolio
    const { data: portfolio } = await supabase
      .from('portfolio')
      .select('*')
      .eq('customer_id', customer.id);

    // Fetch real-time ETF prices
    const { portfolio: enrichedPortfolio, pricesLastUpdated } = await fetchETFPrices(portfolio || []);

    // Get investment details
    const { data: investmentDetails } = await supabase
      .from('investment_details')
      .select('*')
      .eq('customer_id', customer.id)
      .single();

    console.log('Login - Raw investment details from DB:', investmentDetails);
    console.log('Login - risk_profile value:', investmentDetails?.risk_profile);

    // Transform snake_case to camelCase for consistency with frontend
    const transformedInvestmentDetails = investmentDetails ? {
      goal: investmentDetails.goal,
      horizon: investmentDetails.horizon,
      amount: investmentDetails.amount,
      monthlyContribution: investmentDetails.monthly_contribution,
      riskProfile: investmentDetails.risk_profile,
      current_portfolio_value: investmentDetails.current_portfolio_value,
      total_return: investmentDetails.total_return,
      pricesLastUpdated: pricesLastUpdated
    } : { pricesLastUpdated };

    console.log('Login - Transformed investment details:', transformedInvestmentDetails);

    res.status(200).json({
      success: true,
      customer: {
        ...customer,
        portfolio: enrichedPortfolio,
        investmentDetails: transformedInvestmentDetails
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Login mislukt. Probeer opnieuw.'
    });
  }
};
