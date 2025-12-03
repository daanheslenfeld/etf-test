const { createClient } = require('@supabase/supabase-js');
const YahooFinanceClass = require('yahoo-finance2').default;
const yahooFinance = new YahooFinanceClass({ validation: { logErrors: false } });

const supabase = createClient(
  'https://rfmbhdgfovnglegqxjnj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

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
  'IE00B3WJKG14': 'IITU.L',
  'DE0002635307': 'EXSA.DE',
  'IE00BLF7VX27': 'SPPU.DE',
  'IE00B3VWN393': 'CBU7.L',
  'DE000A0S9GB0': '4GLD.DE',
};

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
    return { USD: 0.86, GBP: 1.17, GBp: 0.0117, EUR: 1 };
  }
}

function convertToEur(value, currency, rates) {
  if (currency === 'EUR') return value;
  if (currency === 'USD') return value * rates.USD;
  if (currency === 'GBP') return value * rates.GBP;
  if (currency === 'GBp') return value * rates.GBp;
  return value;
}

async function populateExistingPortfolios() {
  console.log('Starting portfolio data population...');

  // Get all customers with investment details
  const { data: investments } = await supabase
    .from('investment_details')
    .select('customer_id, amount');

  console.log('Found', investments ? investments.length : 0, 'customers with investments');

  const rates = await getEurRates();
  console.log('Exchange rates:', rates);

  // Fetch all current prices
  const prices = {};
  for (const [isin, ticker] of Object.entries(ISIN_TO_TICKER)) {
    try {
      const quote = await yahooFinance.quote(ticker, {}, { validateResult: false });
      if (quote && quote.regularMarketPrice) {
        prices[isin] = convertToEur(quote.regularMarketPrice, quote.currency || 'EUR', rates);
        console.log(ticker + ':', prices[isin].toFixed(2), 'EUR');
      }
    } catch (e) {
      console.log(ticker + ': ERROR');
    }
  }

  if (!investments) {
    console.log('No investments found');
    return;
  }

  // Update each customer's portfolio
  for (const inv of investments) {
    const totalInvestment = inv.amount || 10000;

    // Get their portfolio items
    const { data: portfolio } = await supabase
      .from('portfolio')
      .select('*')
      .eq('customer_id', inv.customer_id);

    if (!portfolio || portfolio.length === 0) continue;

    console.log('\nUpdating customer', inv.customer_id, 'with', totalInvestment, 'EUR investment');

    for (const item of portfolio) {
      const currentPrice = prices[item.isin];
      if (!currentPrice) {
        console.log('  No price for', item.isin);
        continue;
      }

      const weight = (item.weight || 0) / 100;
      const investedAmount = totalInvestment * weight;
      const units = investedAmount / currentPrice;

      const { error } = await supabase
        .from('portfolio')
        .update({
          purchase_price: currentPrice,
          units: units,
          invested_amount: investedAmount,
          purchase_date: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) {
        console.log('  Error updating', item.naam ? item.naam.substring(0, 20) : 'unknown', ':', error.message);
      } else {
        console.log('  Updated', item.naam ? item.naam.substring(0, 25) : 'unknown', ': units=' + units.toFixed(4) + ', price=' + currentPrice.toFixed(2));
      }
    }
  }

  console.log('\nDone!');
}

populateExistingPortfolios();
