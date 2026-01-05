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

// Fetch live ETF prices
async function fetchETFPrices(isins) {
  const rates = await getEurRates();
  const prices = {};

  for (const isin of isins) {
    const ticker = ISIN_TO_TICKER[isin];
    if (!ticker) {
      console.log('No ticker mapping for ISIN: ' + isin);
      continue;
    }

    try {
      const quote = await yahooFinance.quote(ticker, {}, { validateResult: false });
      if (quote && quote.regularMarketPrice) {
        const priceInEur = convertToEur(quote.regularMarketPrice, quote.currency || 'EUR', rates);
        prices[isin] = priceInEur;
      }
    } catch (error) {
      console.error('Error fetching price for ' + ticker + ':', error.message);
    }
  }

  return prices;
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

  const { customer_id, portfolio, investmentDetails, account_type, kycData, wealthProofDocument, onboardingData } = req.body;

  if (!customer_id) {
    return res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
  }

  try {
    // Update customer with account type if provided
    if (account_type) {
      await supabase
        .from('customers')
        .update({ account_type })
        .eq('id', customer_id);
    }

    // Save KYC data including ID document image if provided
    if (kycData) {
      const kycUpdate = {
        kyc_data: JSON.stringify(kycData)
      };

      // If there's an ID image, store it separately for easier retrieval
      if (kycData.idImage) {
        kycUpdate.id_document_image = kycData.idImage;
      }

      await supabase
        .from('customers')
        .update(kycUpdate)
        .eq('id', customer_id);

      console.log('KYC data saved for customer:', customer_id);
    }

    // Save wealth proof document if provided
    if (wealthProofDocument) {
      await supabase
        .from('customers')
        .update({ wealth_proof_document: wealthProofDocument })
        .eq('id', customer_id);

      console.log('Wealth proof document saved for customer:', customer_id);
    }

    // Save onboarding data (questionnaire answers and risk profile recommendation) if provided
    if (onboardingData) {
      await supabase
        .from('customers')
        .update({ onboarding_data: JSON.stringify(onboardingData) })
        .eq('id', customer_id);

      console.log('Onboarding data saved for customer:', customer_id);
    }

    // Delete existing portfolio items for this customer
    await supabase
      .from('portfolio')
      .delete()
      .eq('customer_id', customer_id);

    // Insert new portfolio items with real price tracking
    if (portfolio && portfolio.length > 0) {
      const now = new Date().toISOString();
      const totalInvestment = investmentDetails?.amount || 10000;

      // Fetch live ETF prices for all ISINs in the portfolio
      const isins = portfolio.map(item => item.isin);
      const livePrices = await fetchETFPrices(isins);
      console.log('Fetched live prices:', livePrices);

      const portfolioItems = portfolio.map(item => {
        const purchasePrice = livePrices[item.isin] || null;
        const weight = item.weight / 100; // Convert percentage to decimal
        const investedAmount = totalInvestment * weight;
        const units = purchasePrice ? investedAmount / purchasePrice : null;

        return {
          customer_id,
          naam: item.naam,
          isin: item.isin,
          categorie: item.categorie,
          weight: item.weight,
          ter_pa: item['ter p.a.'] || item.ter_pa,
          purchase_price: purchasePrice,
          units: units,
          invested_amount: investedAmount,
          purchase_date: now,
          created_at: now,
          updated_at: now
        };
      });

      console.log('Saving portfolio with real prices:', portfolioItems);

      const { error: portfolioError } = await supabase
        .from('portfolio')
        .insert(portfolioItems);

      if (portfolioError) {
        throw portfolioError;
      }
    }

    // Save or update investment details
    if (investmentDetails && Object.keys(investmentDetails).length > 0) {
      console.log('Saving investment details:', investmentDetails);
      console.log('riskProfile value:', investmentDetails.riskProfile);

      const { data: existing } = await supabase
        .from('investment_details')
        .select('id')
        .eq('customer_id', customer_id)
        .single();

      const investmentData = {
        customer_id,
        goal: investmentDetails.goal,
        horizon: investmentDetails.horizon,
        amount: investmentDetails.amount,
        monthly_contribution: investmentDetails.monthlyContribution,
        risk_profile: investmentDetails.riskProfile
      };

      console.log('Saving to database:', investmentData);

      if (existing) {
        await supabase
          .from('investment_details')
          .update(investmentData)
          .eq('customer_id', customer_id);
      } else {
        await supabase
          .from('investment_details')
          .insert([investmentData]);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Portfolio saved successfully'
    });

  } catch (error) {
    console.error('DETAILED ERROR saving portfolio:', error);
    console.error('Error message:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      message: 'Failed to save portfolio',
      error: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
      fullError: error
    });
  }
};
