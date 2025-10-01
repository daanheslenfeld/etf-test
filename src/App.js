import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

// Sample ETF data
const SAMPLE_ETFS = [
  {
    categorie: "Aandelen",
    subcategorie: "Verenigde Staten",
    naam: "iShares Core S&P 500 UCITS ETF USD (Acc)",
    isin: "IE00B5BMR087",
    "fund ccy": "USD",
    "fund size (in m €)": "107487",
    "ter p.a.": "0.07%",
    ytd: "-1.41%",
    "2024": "32.62%",
    "2023": "21.54%",
    "2022": "-13.30%",
    "2021": "39.07%",
    "volatility 1y": "20.03%",
    "volatility 3y": "17.84%",
    distribution: "Accumulating",
    sustainability: "No",
    holdings: "505",
    replication: "Full replication",
    "inception date": "19.05.10"
  },
  {
    categorie: "Aandelen",
    subcategorie: "Wereldwijd",
    naam: "iShares Core MSCI World UCITS ETF USD (Acc)",
    isin: "IE00B4L5Y983",
    "fund ccy": "USD",
    "fund size (in m €)": "99778",
    "ter p.a.": "0.20%",
    ytd: "1.46%",
    "2024": "26.24%",
    "2023": "19.55%",
    "2022": "-12.96%",
    "2021": "32.10%",
    "volatility 1y": "16.24%",
    "volatility 3y": "14.88%",
    distribution: "Accumulating",
    sustainability: "No",
    holdings: "1326",
    replication: "Optimized",
    "inception date": "25.09.09"
  },
  {
    categorie: "Aandelen",
    subcategorie: "Verenigde Staten",
    naam: "Vanguard S&P 500 UCITS ETF (USD) Distributing",
    isin: "IE00B3XXRP09",
    "fund ccy": "USD",
    "fund size (in m €)": "41289",
    "ter p.a.": "0.07%",
    ytd: "-1.42%",
    "2024": "32.62%",
    "2023": "21.54%",
    "2022": "-13.29%",
    "2021": "39.08%",
    "volatility 1y": "20.76%",
    "volatility 3y": "18.13%",
    distribution: "Distributing",
    sustainability: "No",
    holdings: "503",
    replication: "Full replication",
    "inception date": "22.05.12"
  },
  {
    categorie: "Aandelen",
    subcategorie: "Opkomende markten",
    naam: "iShares Core MSCI Emerging Markets IMI UCITS ETF (Acc)",
    isin: "IE00BKM4GZ66",
    "fund ccy": "USD",
    "fund size (in m €)": "23513",
    "ter p.a.": "0.18%",
    ytd: "6.72%",
    "2024": "14.04%",
    "2023": "7.69%",
    "2022": "-14.16%",
    "2021": "7.29%",
    "volatility 1y": "15.14%",
    "volatility 3y": "13.78%",
    distribution: "Accumulating",
    sustainability: "No",
    holdings: "3045",
    replication: "Optimized",
    "inception date": "07.04.14"
  },
  {
    categorie: "Obligaties",
    subcategorie: "Wereldwijd",
    naam: "iShares Core Global Aggregate Bond UCITS ETF EUR Hedged (Acc)",
    isin: "IE00BDBRDM35",
    "fund ccy": "EUR",
    "fund size (in m €)": "8456",
    "ter p.a.": "0.10%",
    ytd: "2.15%",
    "2024": "5.23%",
    "2023": "3.87%",
    "2022": "-12.45%",
    "2021": "1.23%",
    "volatility 1y": "5.67%",
    "volatility 3y": "8.92%",
    distribution: "Accumulating",
    sustainability: "No",
    holdings: "9876",
    replication: "Optimized",
    "inception date": "14.10.15"
  },
  {
    categorie: "Obligaties",
    subcategorie: "Europa",
    naam: "iShares Core Euro Government Bond UCITS ETF (Dist)",
    isin: "IE00B4WXJJ64",
    "fund ccy": "EUR",
    "fund size (in m €)": "6234",
    "ter p.a.": "0.09%",
    ytd: "3.42%",
    "2024": "6.78%",
    "2023": "5.12%",
    "2022": "-18.23%",
    "2021": "-2.34%",
    "volatility 1y": "6.23%",
    "volatility 3y": "9.45%",
    distribution: "Distributing",
    sustainability: "No",
    holdings: "456",
    replication: "Full replication",
    "inception date": "10.09.09"
  },
  {
    categorie: "Aandelen",
    subcategorie: "Europa",
    naam: "iShares STOXX Europe 600 UCITS ETF (DE)",
    isin: "DE0002635307",
    "fund ccy": "EUR",
    "fund size (in m €)": "12567",
    "ter p.a.": "0.20%",
    ytd: "4.56%",
    "2024": "18.34%",
    "2023": "14.23%",
    "2022": "-8.67%",
    "2021": "24.56%",
    "volatility 1y": "14.56%",
    "volatility 3y": "16.23%",
    distribution: "Distributing",
    sustainability: "No",
    holdings: "600",
    replication: "Full replication",
    "inception date": "20.02.04"
  },
  {
    categorie: "Aandelen",
    subcategorie: "Technology",
    naam: "iShares S&P 500 Information Technology Sector UCITS ETF",
    isin: "IE00B3WJKG14",
    "fund ccy": "USD",
    "fund size (in m €)": "8934",
    "ter p.a.": "0.15%",
    ytd: "8.23%",
    "2024": "45.67%",
    "2023": "48.23%",
    "2022": "-25.34%",
    "2021": "34.56%",
    "volatility 1y": "24.56%",
    "volatility 3y": "26.78%",
    distribution: "Accumulating",
    sustainability: "No",
    holdings: "78",
    replication: "Full replication",
    "inception date": "15.10.09"
  },
  {
    categorie: "Commodities",
    subcategorie: "Goud",
    naam: "iShares Physical Gold ETC",
    isin: "IE00B4ND3602",
    "fund ccy": "USD",
    "fund size (in m €)": "15678",
    "ter p.a.": "0.12%",
    ytd: "12.34%",
    "2024": "18.45%",
    "2023": "13.12%",
    "2022": "-0.34%",
    "2021": "-3.45%",
    "volatility 1y": "12.34%",
    "volatility 3y": "14.56%",
    distribution: "Accumulating",
    sustainability: "No",
    holdings: "1",
    replication: "Physical",
    "inception date": "09.12.11"
  },
  {
    categorie: "Vastgoed",
    subcategorie: "Wereldwijd",
    naam: "iShares Developed Markets Property Yield UCITS ETF",
    isin: "IE00B1FZS350",
    "fund ccy": "USD",
    "fund size (in m €)": "3456",
    "ter p.a.": "0.59%",
    ytd: "5.67%",
    "2024": "12.34%",
    "2023": "-8.45%",
    "2022": "-22.34%",
    "2021": "28.67%",
    "volatility 1y": "18.45%",
    "volatility 3y": "22.34%",
    distribution: "Distributing",
    sustainability: "No",
    holdings: "345",
    replication: "Optimized",
    "inception date": "13.10.06"
  }
];

const ETFPortal = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [etfs, setEtfs] = useState(SAMPLE_ETFS);
  const [filteredEtfs, setFilteredEtfs] = useState(SAMPLE_ETFS);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    currency: '',
    distribution: '',
    search: ''
  });
  const [selectedETF, setSelectedETF] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioType, setPortfolioType] = useState(null);
  const [investmentDetails, setInvestmentDetails] = useState({
    goal: '',
    goalCustom: '',
    horizon: '',
    horizonCustom: '',
    amount: '',
    amountCustom: '',
    riskProfile: ''
  });
  const [portfolioValue, setPortfolioValue] = useState(10000);
  const [monthlyContribution] = useState(500);
  const [showEditPortfolio, setShowEditPortfolio] = useState(false);
  const [editablePortfolio, setEditablePortfolio] = useState([]);
  const [customBuildStep, setCustomBuildStep] = useState('profile'); // 'profile', 'categories', 'selectETFs'
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoriesCompleted, setCategoriesCompleted] = useState({});

  const premadePortfolios = {
    'bonds100': { 
      name: '100% Obligaties', 
      allocation: { 'Obligaties': 100 },
      expectedReturn: 0.025, // 2.5%
      stdDev: 0.05 // 5%
    },
    'defensive': { 
      name: 'Defensief', 
      allocation: { 'Aandelen': 30, 'Obligaties': 65, 'Commodities': 5 },
      expectedReturn: 0.035, // 3.5%
      stdDev: 0.08 // 8%
    },
    'neutral': { 
      name: 'Neutraal', 
      allocation: { 'Aandelen': 55, 'Obligaties': 40, 'Commodities': 5 },
      expectedReturn: 0.05, // 5%
      stdDev: 0.11 // 11%
    },
    'offensive': { 
      name: 'Offensief', 
      allocation: { 'Aandelen': 72.5, 'Obligaties': 20, 'Commodities': 7.5 },
      expectedReturn: 0.06, // 6%
      stdDev: 0.13 // 13%
    },
    'veryOffensive': { 
      name: 'Zeer Offensief', 
      allocation: { 'Aandelen': 82.5, 'Obligaties': 10, 'Commodities': 7.5 },
      expectedReturn: 0.07, // 7%
      stdDev: 0.15 // 15%
    },
    'stocks100': { 
      name: '100% Aandelen', 
      allocation: { 'Aandelen': 90, 'Commodities': 10 },
      expectedReturn: 0.08, // 8%
      stdDev: 0.16 // 16%
    }
  };

useEffect(() => {
  setEtfs(SAMPLE_ETFS);
  setFilteredEtfs(SAMPLE_ETFS);
}, []);


  useEffect(() => {
    let filtered = [...etfs];
    
    if (filters.category) {
      filtered = filtered.filter(etf => etf.categorie === filters.category);
    }
    if (filters.subcategory) {
      filtered = filtered.filter(etf => etf.subcategorie === filters.subcategory);
    }
    if (filters.currency) {
      filtered = filtered.filter(etf => etf['fund ccy'] === filters.currency);
    }
    if (filters.distribution) {
      filtered = filtered.filter(etf => etf.distribution === filters.distribution);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(etf => 
        etf.naam?.toLowerCase().includes(searchLower) ||
        etf.isin?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredEtfs(filtered);
  }, [filters, etfs]);

  const handleLogin = (email, password) => {
    setUser({ email, name: email.split('@')[0] });
    setCurrentPage('etfDatabase');
  };

  const handleRegister = (name, email, password) => {
    setUser({ email, name });
    setCurrentPage('etfDatabase');
  };

  const recalculateWeights = (portfolioToCalculate, profile) => {
    if (!profile) return portfolioToCalculate;
    
    const config = premadePortfolios[profile];
    const allocation = config.allocation;
    
    // Group ETFs by category
    const byCategory = {};
    portfolioToCalculate.forEach(etf => {
      const cat = etf.categorie;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(etf);
    });
    
    // Calculate weights
    const updatedPortfolio = [];
    Object.entries(byCategory).forEach(([category, etfs]) => {
      const categoryAllocation = allocation[category] || 0;
      const weightPerETF = categoryAllocation / etfs.length;
      
      etfs.forEach(etf => {
        updatedPortfolio.push({ ...etf, weight: weightPerETF });
      });
    });
    
    return updatedPortfolio;
  };

  const addToPortfolio = (etf, weight = 10) => {
    setPortfolio(prev => {
      const existing = prev.find(p => p.isin === etf.isin);
      if (existing) {
        return prev; // Don't add duplicates
      }
      const newPortfolio = [...prev, { ...etf, weight }];
      
      // Recalculate weights if we have a selected profile
      if (selectedProfile) {
        return recalculateWeights(newPortfolio, selectedProfile);
      }
      return newPortfolio;
    });
  };

  const createPremadePortfolio = (type) => {
    const config = premadePortfolios[type];
    const selectedETFs = [];
    
    Object.entries(config.allocation).forEach(([category, percentage]) => {
      let categoryETFs = etfs.filter(e => e.categorie === category);
      
      categoryETFs.sort((a, b) => {
        const sizeA = parseFloat(String(a['fund size (in m €)'] || '0').replace(',', ''));
        const sizeB = parseFloat(String(b['fund size (in m €)'] || '0').replace(',', ''));
        return sizeB - sizeA;
      });
      
      const topETFs = categoryETFs.slice(0, Math.min(3, categoryETFs.length));
      if (topETFs.length > 0) {
        const weightPerETF = percentage / topETFs.length;
        topETFs.forEach(etf => {
          selectedETFs.push({ ...etf, weight: weightPerETF });
        });
      }
    });
    
    if (selectedETFs.length > 0) {
      setPortfolio(selectedETFs);
      setCurrentPage('portfolioOverview');
    }
  };

  const calculatePortfolioMetrics = () => {
    if (!portfolio || portfolio.length === 0) {
      return { avgTER: 0, totalWeight: 0, categories: {}, backtestReturn: 0 };
    }
    
    const totalWeight = portfolio.reduce((sum, p) => sum + (p.weight || 0), 0);
    
    const avgTER = portfolio.reduce((sum, p) => {
      const terStr = String(p['ter p.a.'] || '0%').replace('%', '').trim();
      const ter = parseFloat(terStr) || 0;
      return sum + (ter * (p.weight || 0) / (totalWeight || 1));
    }, 0);
    
    const categories = {};
    portfolio.forEach(p => {
      const cat = p.categorie || 'Other';
      categories[cat] = (categories[cat] || 0) + (p.weight || 0);
    });
    
    const backtestReturn = portfolio.reduce((sum, p) => {
      const returnStr = String(p['2024'] || '0%').replace('%', '').trim();
      const return2024 = parseFloat(returnStr) || 0;
      return sum + (return2024 * (p.weight || 0) / (totalWeight || 1));
    }, 0);
    
    return { avgTER, totalWeight, categories, backtestReturn };
  };

  const safeParseFloat = (value) => {
    if (value === null || value === undefined) return 0;
    const str = String(value).replace('%', '').trim();
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('nl-NL').format(num);
  };

  const formatEuro = (value) => {
    return new Intl.NumberFormat('nl-NL', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const generateHoldings = () => {
    const stockHoldings = [
      { name: 'Apple Inc.', weight: 4.2, region: 'Verenigde Staten' },
      { name: 'Microsoft Corp.', weight: 3.8, region: 'Verenigde Staten' },
      { name: 'NVIDIA Corp.', weight: 3.5, region: 'Verenigde Staten' },
      { name: 'Amazon.com Inc.', weight: 2.9, region: 'Verenigde Staten' },
      { name: 'Meta Platforms Inc.', weight: 2.1, region: 'Verenigde Staten' },
      { name: 'Alphabet Inc. Class A', weight: 2.0, region: 'Verenigde Staten' },
      { name: 'Tesla Inc.', weight: 1.8, region: 'Verenigde Staten' },
      { name: 'Broadcom Inc.', weight: 1.5, region: 'Verenigde Staten' },
      { name: 'ASML Holding NV', weight: 1.4, region: 'Europa' },
      { name: 'Taiwan Semiconductor', weight: 1.3, region: 'Azië' },
      { name: 'JPMorgan Chase & Co.', weight: 1.2, region: 'Verenigde Staten' },
      { name: 'Johnson & Johnson', weight: 1.1, region: 'Verenigde Staten' },
      { name: 'Visa Inc.', weight: 1.0, region: 'Verenigde Staten' },
      { name: 'Procter & Gamble', weight: 0.9, region: 'Verenigde Staten' },
      { name: 'Mastercard Inc.', weight: 0.9, region: 'Verenigde Staten' },
      { name: 'Nestlé SA', weight: 0.8, region: 'Europa' },
      { name: 'Home Depot Inc.', weight: 0.8, region: 'Verenigde Staten' },
      { name: 'Bank of America', weight: 0.7, region: 'Verenigde Staten' },
      { name: 'AbbVie Inc.', weight: 0.7, region: 'Verenigde Staten' },
      { name: 'Coca-Cola Company', weight: 0.7, region: 'Verenigde Staten' }
    ];
    
    const moreHoldings = Array.from({length: 80}, (_, i) => ({
      name: `Bedrijf ${i + 21}`,
      weight: Math.max(0.1, 0.7 - (i * 0.007)),
      region: ['Verenigde Staten', 'Europa', 'Azië', 'Opkomende Markten'][i % 4]
    }));
    
    const bondHoldings = [
      { name: 'US Treasury 10Y', weight: 3.5, region: 'Verenigde Staten', maturity: '10 jaar', coupon: '4.2%' },
      { name: 'German Bund 10Y', weight: 2.8, region: 'Europa', maturity: '10 jaar', coupon: '2.5%' },
      { name: 'US Treasury 5Y', weight: 2.3, region: 'Verenigde Staten', maturity: '5 jaar', coupon: '4.0%' },
      { name: 'French OAT 10Y', weight: 1.9, region: 'Europa', maturity: '10 jaar', coupon: '3.1%' },
      { name: 'UK Gilt 10Y', weight: 1.7, region: 'Europa', maturity: '10 jaar', coupon: '4.5%' },
      { name: 'Italian BTP 10Y', weight: 1.5, region: 'Europa', maturity: '10 jaar', coupon: '4.8%' },
      { name: 'US Treasury 2Y', weight: 1.4, region: 'Verenigde Staten', maturity: '2 jaar', coupon: '4.8%' },
      { name: 'Spanish Bonos 10Y', weight: 1.2, region: 'Europa', maturity: '10 jaar', coupon: '3.5%' },
      { name: 'Japanese JGB 10Y', weight: 1.1, region: 'Azië', maturity: '10 jaar', coupon: '0.7%' },
      { name: 'Dutch DSL 10Y', weight: 1.0, region: 'Europa', maturity: '10 jaar', coupon: '2.8%' }
    ];
    
    const moreBonds = Array.from({length: 90}, (_, i) => ({
      name: `Obligatie ${i + 11}`,
      weight: Math.max(0.05, 1.0 - (i * 0.01)),
      region: ['Verenigde Staten', 'Europa', 'Azië'][i % 3],
      maturity: ['2 jaar', '5 jaar', '10 jaar', '30 jaar'][i % 4],
      coupon: `${(Math.random() * 4 + 1).toFixed(1)}%`
    }));
    
    const hasStocks = portfolio.some(etf => etf.categorie === 'Aandelen');
    const hasBonds = portfolio.some(etf => etf.categorie === 'Obligaties');
    
    return {
      stocks: hasStocks ? [...stockHoldings, ...moreHoldings] : [],
      bonds: hasBonds ? [...bondHoldings, ...moreBonds] : []
    };
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  const EditPortfolioModal = ({ onClose }) => {
    const [tempPortfolio, setTempPortfolio] = useState([...portfolio]);
    
    const updateWeight = (isin, newWeight) => {
      setTempPortfolio(prev => prev.map(etf => 
        etf.isin === isin ? {...etf, weight: parseFloat(newWeight) || 0} : etf
      ));
    };
    
    const removeETF = (isin) => {
      setTempPortfolio(prev => prev.filter(etf => etf.isin !== isin));
    };
    
    const saveChanges = () => {
      const totalWeight = tempPortfolio.reduce((sum, etf) => sum + (etf.weight || 0), 0);
      if (Math.abs(totalWeight - 100) > 0.1) {
        alert(`Let op: Totale weging is ${totalWeight.toFixed(1)}%. Dit moet 100% zijn.`);
        return;
      }
      setPortfolio(tempPortfolio);
      onClose();
    };
    
    const normalizeWeights = () => {
      const total = tempPortfolio.reduce((sum, etf) => sum + (etf.weight || 0), 0);
      if (total > 0) {
        setTempPortfolio(prev => prev.map(etf => ({
          ...etf,
          weight: (etf.weight / total) * 100
        })));
      }
    };
    
    const totalWeight = tempPortfolio.reduce((sum, etf) => sum + (etf.weight || 0), 0);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Portfolio Aanpassen</h2>
              <p className="text-sm text-gray-600 mt-1">Wijzig de wegingen van je ETF's</p>
            </div>
            <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700">×</button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-600">Totale Weging:</span>
                  <span className={`ml-2 text-xl font-bold ${Math.abs(totalWeight - 100) < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalWeight.toFixed(1)}%
                  </span>
                </div>
                <button
                  onClick={normalizeWeights}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Normaliseer naar 100%
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {tempPortfolio.map((etf, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{etf.naam}</div>
                      <div className="text-xs text-gray-600">{etf.categorie} • {etf.isin}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={etf.weight || 0}
                          onChange={(e) => updateWeight(etf.isin, e.target.value)}
                          className="w-20 px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500 text-right"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                        <span className="text-sm font-medium">%</span>
                      </div>
                      <button
                        onClick={() => removeETF(etf.isin)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Verwijder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {tempPortfolio.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Je portfolio is leeg. Voeg ETF's toe vanaf de ETF Database pagina.
              </div>
            )}
            
            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={() => setCurrentPage('etfDatabase')}
                className="flex-1 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
              >
                + ETF Toevoegen
              </button>
              <button
                onClick={saveChanges}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Wijzigingen Opslaan
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
        
        {showEditPortfolio && <EditPortfolioModal onClose={() => setShowEditPortfolio(false)} />}
      </div>
    );
  };

  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ETF PORTAL</div>
          <div className="space-x-4">
            <button 
              onClick={() => setCurrentPage('login')}
              className="px-6 py-2 border-2 border-indigo-600 text-indigo-600 rounded-full hover:bg-indigo-50 transition-all font-medium"
            >
              Inloggen
            </button>
            <button 
              onClick={() => setCurrentPage('register')}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:shadow-lg transition-all font-medium"
            >
              Open een rekening →
            </button>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Bouw je eigen ETF portfolio
            </h1>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              Investeer slim in ETF's met ons gebruiksvriendelijke platform. 
              Begin vandaag nog met beleggen tegen lage kosten.
            </p>
            <button 
              onClick={() => setCurrentPage('register')}
              className="px-8 py-4 bg-white text-indigo-600 rounded-full text-lg hover:shadow-2xl transition-all font-bold"
            >
              Open je rekening →
            </button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white border border-white/20 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">
              Start met beleggen
            </h3>
            <p className="opacity-90 leading-relaxed">
              Ontdek onze database met {etfs.length} ETF's en stel je eigen portfolio samen 
              of kies uit onze vooraf samengestelde strategieën.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={() => setCurrentPage('landing')} className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ETF PORTAL
            </button>
          </div>
        </nav>
        
        <div className="max-w-md mx-auto mt-20 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Welkom terug</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Gebruikersnaam</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Wachtwoord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Password"
              />
            </div>
            
            <button
              onClick={() => handleLogin(email, password)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              Inloggen
            </button>
          </div>
          
          <p className="text-center mt-6 text-sm text-gray-600">
            Geen account?{' '}
            <button onClick={() => setCurrentPage('register')} className="text-indigo-600 hover:underline font-semibold">
              Registreer hier
            </button>
          </p>
        </div>
      </div>
    );
  };

  const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={() => setCurrentPage('landing')} className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ETF PORTAL
            </button>
          </div>
        </nav>
        
        <div className="max-w-md mx-auto mt-20 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Maak een gratis account</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Naam</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Wachtwoord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            <button
              onClick={() => handleRegister(name, email, password)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              Account aanmaken
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ETFDatabasePage = () => {
    const categories = [...new Set(etfs.map(e => e.categorie).filter(Boolean))];
    const subcategories = [...new Set(etfs.map(e => e.subcategorie).filter(Boolean))];
    const currencies = [...new Set(etfs.map(e => e['fund ccy']).filter(Boolean))];
    
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">ETF data laden...</div>
            <div className="text-gray-600">Even geduld aub</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ETF PORTAL</div>
            <div className="flex items-center gap-6">
              <button onClick={() => setCurrentPage('etfDatabase')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                ETF Database
              </button>
              <button onClick={() => setCurrentPage('portfolioBuilder')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                Portfolio Samenstellen
              </button>
              {portfolio.length > 0 && (
                <button onClick={() => setCurrentPage('portfolioOverview')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                  Mijn Portfolio ({portfolio.length})
                </button>
              )}
              <div className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-indigo-700 font-semibold">{user?.name}</div>
            </div>
          </div>
        </nav>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">ETF Database</h1>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="grid grid-cols-5 gap-4 mb-4">
              <input
                type="text"
                placeholder="Zoek op naam of ISIN..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="col-span-2 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              />
              
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Alle Categorieën</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              
              <select
                value={filters.subcategory}
                onChange={(e) => setFilters({...filters, subcategory: e.target.value})}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Alle Subcategorieën</option>
                {subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
              
              <select
                value={filters.currency}
                onChange={(e) => setFilters({...filters, currency: e.target.value})}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Alle Valuta's</option>
                {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              Aantal ETFs: {filteredEtfs.length} {etfs.length === SAMPLE_ETFS.length && <span className="text-orange-600">(Sample data - upload Excel voor volledige database)</span>}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Naam</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ISIN</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categorie</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">TER</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">YTD</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">2024</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEtfs.map((etf, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedETF(etf)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-left hover:underline"
                        >
                          {etf.naam}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{etf.isin}</td>
                      <td className="px-4 py-3 text-sm">{etf.categorie}</td>
                      <td className="px-4 py-3 text-sm text-right">{etf['ter p.a.']}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${safeParseFloat(etf.ytd) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {etf.ytd}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${safeParseFloat(etf['2024']) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {etf['2024']}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => addToPortfolio(etf)}
                          className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-lg hover:shadow-lg transition-all font-medium"
                        >
                          + Portfolio
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getTopHoldingsForETF = (etf) => {
    const subcategory = etf.subcategorie || '';
    const category = etf.categorie || '';
    
    // Generate appropriate holdings based on ETF type
    if (category === 'Aandelen') {
      if (subcategory.includes('Verenigde Staten') || subcategory.includes('S&P 500')) {
        return [
          { name: 'Apple Inc.', weight: 7.2, sector: 'Technology' },
          { name: 'Microsoft Corp.', weight: 6.8, sector: 'Technology' },
          { name: 'NVIDIA Corp.', weight: 5.9, sector: 'Technology' },
          { name: 'Amazon.com Inc.', weight: 3.8, sector: 'Consumer Discretionary' },
          { name: 'Meta Platforms Inc.', weight: 2.5, sector: 'Technology' },
          { name: 'Alphabet Inc. Class A', weight: 2.3, sector: 'Technology' },
          { name: 'Berkshire Hathaway', weight: 1.9, sector: 'Financials' },
          { name: 'Tesla Inc.', weight: 1.8, sector: 'Consumer Discretionary' },
          { name: 'Broadcom Inc.', weight: 1.7, sector: 'Technology' },
          { name: 'JPMorgan Chase & Co.', weight: 1.5, sector: 'Financials' }
        ];
      } else if (subcategory.includes('Wereldwijd') || subcategory.includes('World')) {
        return [
          { name: 'Apple Inc.', weight: 4.8, sector: 'Technology' },
          { name: 'Microsoft Corp.', weight: 4.2, sector: 'Technology' },
          { name: 'NVIDIA Corp.', weight: 3.5, sector: 'Technology' },
          { name: 'Amazon.com Inc.', weight: 2.4, sector: 'Consumer Discretionary' },
          { name: 'Meta Platforms Inc.', weight: 1.8, sector: 'Technology' },
          { name: 'Alphabet Inc.', weight: 1.7, sector: 'Technology' },
          { name: 'Tesla Inc.', weight: 1.3, sector: 'Consumer Discretionary' },
          { name: 'ASML Holding NV', weight: 1.2, sector: 'Technology' },
          { name: 'Nestlé SA', weight: 1.1, sector: 'Consumer Staples' },
          { name: 'JPMorgan Chase', weight: 1.0, sector: 'Financials' }
        ];
      } else if (subcategory.includes('Europa')) {
        return [
          { name: 'ASML Holding NV', weight: 5.2, sector: 'Technology' },
          { name: 'Nestlé SA', weight: 4.8, sector: 'Consumer Staples' },
          { name: 'LVMH Moët Hennessy', weight: 3.9, sector: 'Consumer Discretionary' },
          { name: 'Novo Nordisk A/S', weight: 3.6, sector: 'Healthcare' },
          { name: 'SAP SE', weight: 2.8, sector: 'Technology' },
          { name: 'Roche Holding AG', weight: 2.5, sector: 'Healthcare' },
          { name: 'Shell plc', weight: 2.3, sector: 'Energy' },
          { name: 'AstraZeneca PLC', weight: 2.1, sector: 'Healthcare' },
          { name: 'Siemens AG', weight: 1.9, sector: 'Industrials' },
          { name: 'TotalEnergies SE', weight: 1.8, sector: 'Energy' }
        ];
      } else if (subcategory.includes('Technology')) {
        return [
          { name: 'Apple Inc.', weight: 21.5, sector: 'Technology Hardware' },
          { name: 'Microsoft Corp.', weight: 20.2, sector: 'Software' },
          { name: 'NVIDIA Corp.', weight: 18.8, sector: 'Semiconductors' },
          { name: 'Broadcom Inc.', weight: 5.4, sector: 'Semiconductors' },
          { name: 'Oracle Corp.', weight: 4.2, sector: 'Software' },
          { name: 'Salesforce Inc.', weight: 3.8, sector: 'Software' },
          { name: 'Adobe Inc.', weight: 3.5, sector: 'Software' },
          { name: 'Cisco Systems', weight: 3.1, sector: 'Networking' },
          { name: 'Advanced Micro Devices', weight: 2.9, sector: 'Semiconductors' },
          { name: 'Qualcomm Inc.', weight: 2.6, sector: 'Semiconductors' }
        ];
      } else if (subcategory.includes('Opkomende')) {
        return [
          { name: 'Taiwan Semiconductor', weight: 8.7, sector: 'Technology' },
          { name: 'Tencent Holdings', weight: 4.5, sector: 'Technology' },
          { name: 'Samsung Electronics', weight: 4.2, sector: 'Technology' },
          { name: 'Alibaba Group', weight: 2.8, sector: 'Consumer Discretionary' },
          { name: 'Meituan', weight: 1.9, sector: 'Consumer Discretionary' },
          { name: 'Reliance Industries', weight: 1.7, sector: 'Energy' },
          { name: 'HDFC Bank', weight: 1.5, sector: 'Financials' },
          { name: 'Infosys Ltd.', weight: 1.4, sector: 'Technology' },
          { name: 'China Construction Bank', weight: 1.3, sector: 'Financials' },
          { name: 'Vale SA', weight: 1.2, sector: 'Materials' }
        ];
      }
    } else if (category === 'Obligaties') {
      if (subcategory.includes('Europa')) {
        return [
          { name: 'German Bund 10Y', weight: 18.5, maturity: '10 jaar', rating: 'AAA' },
          { name: 'French OAT 10Y', weight: 15.2, maturity: '10 jaar', rating: 'AA' },
          { name: 'Italian BTP 10Y', weight: 12.8, maturity: '10 jaar', rating: 'BBB' },
          { name: 'Spanish Bonos 10Y', weight: 10.3, maturity: '10 jaar', rating: 'A' },
          { name: 'Dutch DSL 10Y', weight: 8.7, maturity: '10 jaar', rating: 'AAA' },
          { name: 'Belgian OLO 10Y', weight: 6.5, maturity: '10 jaar', rating: 'AA' },
          { name: 'Austrian Bund 10Y', weight: 5.2, maturity: '10 jaar', rating: 'AA+' },
          { name: 'Finnish Govt Bond 10Y', weight: 4.8, maturity: '10 jaar', rating: 'AA+' },
          { name: 'Portuguese OT 10Y', weight: 4.2, maturity: '10 jaar', rating: 'BBB+' },
          { name: 'Irish Govt Bond 10Y', weight: 3.8, maturity: '10 jaar', rating: 'AA-' }
        ];
      } else {
        return [
          { name: 'US Treasury 10Y', weight: 15.8, maturity: '10 jaar', rating: 'AAA' },
          { name: 'US Treasury 5Y', weight: 12.3, maturity: '5 jaar', rating: 'AAA' },
          { name: 'German Bund 10Y', weight: 9.7, maturity: '10 jaar', rating: 'AAA' },
          { name: 'UK Gilt 10Y', weight: 8.2, maturity: '10 jaar', rating: 'AA' },
          { name: 'Japanese JGB 10Y', weight: 7.5, maturity: '10 jaar', rating: 'A+' },
          { name: 'French OAT 10Y', weight: 6.8, maturity: '10 jaar', rating: 'AA' },
          { name: 'Canadian Govt 10Y', weight: 5.9, maturity: '10 jaar', rating: 'AAA' },
          { name: 'Australian Govt 10Y', weight: 5.2, maturity: '10 jaar', rating: 'AAA' },
          { name: 'US Treasury 2Y', weight: 4.6, maturity: '2 jaar', rating: 'AAA' },
          { name: 'Swiss Govt 10Y', weight: 4.0, maturity: '10 jaar', rating: 'AAA' }
        ];
      }
    } else if (category === 'Commodities') {
      return [
        { name: 'Physical Gold Holdings', weight: 100, type: 'Precious Metal' }
      ];
    } else if (category === 'Vastgoed') {
      return [
        { name: 'Prologis Inc.', weight: 8.5, sector: 'Industrial REITs' },
        { name: 'American Tower Corp.', weight: 6.2, sector: 'Telecom REITs' },
        { name: 'Equinix Inc.', weight: 5.8, sector: 'Data Center REITs' },
        { name: 'Public Storage', weight: 4.9, sector: 'Storage REITs' },
        { name: 'Welltower Inc.', weight: 4.3, sector: 'Healthcare REITs' },
        { name: 'Simon Property Group', weight: 4.1, sector: 'Retail REITs' },
        { name: 'Realty Income Corp.', weight: 3.8, sector: 'Retail REITs' },
        { name: 'Digital Realty Trust', weight: 3.6, sector: 'Data Center REITs' },
        { name: 'AvalonBay Communities', weight: 3.4, sector: 'Residential REITs' },
        { name: 'Equity Residential', weight: 3.2, sector: 'Residential REITs' }
      ];
    }
    
    return [];
  };

  const ETFDetailModal = ({ etf, onClose }) => {
    if (!etf) return null;
    
    const historicalData = [
      { year: '2021', return: safeParseFloat(etf['2021']) },
      { year: '2022', return: safeParseFloat(etf['2022']) },
      { year: '2023', return: safeParseFloat(etf['2023']) },
      { year: '2024', return: safeParseFloat(etf['2024']) }
    ];
    
    const topHoldings = getTopHoldingsForETF(etf);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b px-3 py-2 flex justify-between items-center z-10 gap-2">
            <h2 className="text-base font-bold truncate">{etf.naam}</h2>
            <button onClick={onClose} className="text-4xl text-gray-500 hover:text-gray-700 flex-shrink-0 leading-none -mt-2">×</button>
          </div>
          
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="font-semibold mb-1">Basis Info</div>
                <div className="space-y-0.5">
                  <div className="flex justify-between"><span className="text-gray-600">ISIN:</span><span>{etf.isin}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Categorie:</span><span>{etf.categorie}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">TER:</span><span className="text-blue-600 font-medium">{etf['ter p.a.']}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">YTD:</span><span className={safeParseFloat(etf.ytd) >= 0 ? 'text-green-600' : 'text-red-600'}>{etf.ytd}</span></div>
                </div>
              </div>
              
              <div>
                <div className="font-semibold mb-1">Details</div>
                <div className="space-y-0.5">
                  <div className="flex justify-between"><span className="text-gray-600">Fund Size:</span><span>€{etf['fund size (in m €)']}M</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Vol 1Y:</span><span>{etf['volatility 1y']}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Holdings:</span><span>{etf.holdings}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Uitkering:</span><span>{etf.distribution}</span></div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="font-semibold mb-1 text-xs">Historisch Rendement</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={historicalData}>
                  <XAxis dataKey="year" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <Tooltip />
                  <Bar dataKey="return" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {topHoldings.length > 0 && (
              <div>
                <div className="font-semibold mb-1 text-xs">Top 10 Holdings</div>
                <div className="text-xs space-y-0.5 max-h-32 overflow-y-auto border rounded p-2">
                  {topHoldings.map((holding, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b last:border-0">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="text-gray-500 flex-shrink-0">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{holding.name}</div>
                          <div className="text-gray-600 text-[10px]">
                            {holding.sector || holding.rating || holding.type || '-'}
                          </div>
                        </div>
                      </div>
                      <span className="font-medium ml-2 flex-shrink-0">{holding.weight.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  addToPortfolio(etf);
                  onClose();
                }}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
              >
                + Portfolio
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 border-2 border-gray-300 rounded hover:bg-gray-50 text-xs font-medium"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PortfolioBuilderPage = () => {
    // Get required categories based on selected profile
    const getRequiredCategories = () => {
      if (!selectedProfile) return [];
      const config = premadePortfolios[selectedProfile];
      return Object.keys(config.allocation);
    };
    
    const requiredCategories = getRequiredCategories();
    const allCategoriesCompleted = requiredCategories.every(cat => categoriesCompleted[cat]);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ETF PORTAL</div>
            <div className="flex items-center gap-6">
              <button onClick={() => setCurrentPage('etfDatabase')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">ETF Database</button>
              <button onClick={() => setCurrentPage('portfolioBuilder')} className="text-indigo-600 font-semibold">Portfolio Samenstellen</button>
              {portfolio.length > 0 && <button onClick={() => setCurrentPage('portfolioOverview')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Mijn Portfolio ({portfolio.length})</button>}
              <div className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-indigo-700 font-semibold">{user?.name}</div>
            </div>
          </div>
        </nav>
        
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Kies je beleggingsstrategie</h1>
          <p className="text-center text-gray-600 mb-12">Stel zelf een portfolio samen of kies een van onze vooraf samengestelde portfolio's</p>
          
          <div className="grid grid-cols-2 gap-8 mb-12">
            <button onClick={() => { 
              setPortfolioType('custom'); 
              setCustomBuildStep('profile');
              setSelectedProfile(null);
              setSelectedCategory(null);
              setCategoriesCompleted({});
              setPortfolio([]);
            }} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all border border-gray-100">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-2">Zelf Samenstellen</h3>
              <p className="text-gray-600">Kies een profiel en selecteer je eigen ETF's per categorie</p>
            </button>
            
            <button onClick={() => setPortfolioType('premade')} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all border border-gray-100">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-2">Vooraf Samengesteld</h3>
              <p className="text-gray-600">Kies een portfolio op basis van risicoprofiel</p>
            </button>
          </div>
          
          {portfolioType === 'custom' && customBuildStep === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Stap 1: Kies je risicoprofiel</h2>
              <div className="grid grid-cols-3 gap-6">
                {Object.entries(premadePortfolios).map(([key, config]) => (
                  <button 
                    key={key} 
                    onClick={() => {
                      setSelectedProfile(key);
                      setCustomBuildStep('categories');
                    }} 
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all text-left border border-gray-100 hover:border-indigo-300"
                  >
                    <h4 className="font-bold text-lg mb-2">{config.name}</h4>
                    <div className="text-sm text-gray-600 mb-3">
                      {Object.entries(config.allocation).map(([cat, pct]) => (
                        <div key={cat}>{cat}: {pct}%</div>
                      ))}
                    </div>
                    <div className="text-sm text-indigo-600 font-medium">Verwacht rendement: {(config.expectedReturn * 100).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Risico (std dev): {(config.stdDev * 100).toFixed(1)}%</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {portfolioType === 'custom' && customBuildStep === 'categories' && selectedProfile && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Stap 2: Vul categorieën</h2>
                  <p className="text-gray-600">Geselecteerd profiel: {premadePortfolios[selectedProfile].name}</p>
                </div>
                <button 
                  onClick={() => {
                    setCustomBuildStep('profile');
                    setSelectedProfile(null);
                    setCategoriesCompleted({});
                    setPortfolio([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ← Profiel wijzigen
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mb-8">
                {requiredCategories.map(category => {
                  const isCompleted = categoriesCompleted[category];
                  const allocation = premadePortfolios[selectedProfile].allocation[category];
                  
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setCustomBuildStep('selectETFs');
                      }}
                      className={`p-6 rounded-2xl shadow-lg transition-all border-2 text-left ${
                        isCompleted 
                          ? 'bg-green-50 border-green-500' 
                          : 'bg-white border-gray-200 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">{category}</h3>
                        {isCompleted && <span className="text-2xl">✓</span>}
                      </div>
                      <p className="text-sm text-gray-600">Allocatie: {allocation}%</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {isCompleted ? 'Voltooid - Klik om aan te passen' : 'Klik om ETF\'s te selecteren'}
                      </p>
                    </button>
                  );
                })}
              </div>
              
              {allCategoriesCompleted && (
                <div className="text-center">
                  <button
                    onClick={() => setCurrentPage('portfolioOverview')}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:shadow-lg transition-all font-bold text-lg"
                  >
                    Ga naar Portfolio Overzicht →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {portfolioType === 'custom' && customBuildStep === 'selectETFs' && selectedCategory && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Stap 3: Selecteer ETF's voor {selectedCategory}</h2>
                  <p className="text-gray-600">Vereiste allocatie: {premadePortfolios[selectedProfile].allocation[selectedCategory]}%</p>
                </div>
                <button 
                  onClick={() => {
                    setCustomBuildStep('categories');
                    setSelectedCategory(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ← Terug naar categorieën
                </button>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <h3 className="font-semibold mb-4">Huidige selectie voor {selectedCategory}</h3>
                {portfolio.filter(etf => etf.categorie === selectedCategory).length === 0 ? (
                  <p className="text-gray-500 text-sm">Nog geen ETF's geselecteerd</p>
                ) : (
                  <div className="space-y-2">
                    {portfolio.filter(etf => etf.categorie === selectedCategory).map((etf, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">{etf.naam}</span>
                        <button
                          onClick={() => {
                            setPortfolio(prev => prev.filter(p => p.isin !== etf.isin));
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Verwijder
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setCategoriesCompleted(prev => ({ ...prev, [selectedCategory]: true }));
                    setCustomBuildStep('categories');
                    setSelectedCategory(null);
                  }}
                  className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  Klaar met {selectedCategory} →
                </button>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <h3 className="font-bold">Beschikbare {selectedCategory} ETF's</h3>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Naam</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">ISIN</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">TER</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">YTD</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Actie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {etfs.filter(etf => etf.categorie === selectedCategory).map((etf, idx) => {
                        const isAdded = portfolio.some(p => p.isin === etf.isin);
                        return (
                          <tr key={idx} className="hover:bg-indigo-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setSelectedETF(etf)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium text-left hover:underline"
                              >
                                {etf.naam}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{etf.isin}</td>
                            <td className="px-4 py-3 text-sm text-right">{etf['ter p.a.']}</td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${safeParseFloat(etf.ytd) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {etf.ytd}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isAdded ? (
                                <span className="text-xs text-green-600 font-medium">✓ Toegevoegd</span>
                              ) : (
                                <button
                                  onClick={() => addToPortfolio(etf, 10)}
                                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-lg hover:shadow-lg transition-all font-medium"
                                >
                                  + Toevoegen
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {portfolioType === 'premade' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Risicoprofielen</h2>
              <div className="grid grid-cols-3 gap-6">
                {Object.entries(premadePortfolios).map(([key, config]) => (
                  <button key={key} onClick={() => createPremadePortfolio(key)} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all text-left border border-gray-100 hover:border-indigo-300">
                    <h4 className="font-bold text-lg mb-2">{config.name}</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      {Object.entries(config.allocation).map(([cat, pct]) => <div key={cat}>{cat}: {pct}%</div>)}
                    </div>
                    <div className="text-sm text-indigo-600 font-medium">Verwacht rendement: {(config.expectedReturn * 100).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Risico (std dev): {(config.stdDev * 100).toFixed(1)}%</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PortfolioOverviewPage = () => {
    const metrics = calculatePortfolioMetrics();
    const categoryData = Object.entries(metrics.categories).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
    
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">ETF PORTAL</div>
            <div className="flex items-center gap-6">
              <button onClick={() => setCurrentPage('etfDatabase')} className="text-gray-700 hover:text-blue-600">ETF Database</button>
              <button onClick={() => setCurrentPage('portfolioBuilder')} className="text-gray-700 hover:text-blue-600">Portfolio Samenstellen</button>
              <button onClick={() => setCurrentPage('portfolioOverview')} className="text-blue-600 font-medium">Portfolio Overzicht</button>
              <div className="text-sm text-gray-600">{user?.name}</div>
            </div>
          </div>
        </nav>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Portfolio Overzicht</h1>
            <div className="flex gap-3">
              <button onClick={() => setShowEditPortfolio(true)} className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium">Portfolio Aanpassen</button>
              <button onClick={() => setCurrentPage('purchase')} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Portfolio Aankopen →</button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6"><div className="text-sm text-gray-600 mb-1">Totale TER</div><div className="text-2xl font-bold text-blue-600">{metrics.avgTER.toFixed(2)}%</div></div>
            <div className="bg-white rounded-lg shadow p-6"><div className="text-sm text-gray-600 mb-1">Aantal ETF's</div><div className="text-2xl font-bold">{portfolio.length}</div></div>
            <div className="bg-white rounded-lg shadow p-6"><div className="text-sm text-gray-600 mb-1">Backtested Return 2024</div><div className={`text-2xl font-bold ${metrics.backtestReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>{metrics.backtestReturn.toFixed(2)}%</div></div>
            <div className="bg-white rounded-lg shadow p-6"><div className="text-sm text-gray-600 mb-1">Risico Profiel</div><div className="text-2xl font-bold text-gray-800">Neutraal</div></div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="font-bold text-lg mb-4">Asset Allocatie</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Alle Holdings</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">ETF</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Categorie</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Weging</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">TER</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Return 2024</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {portfolio.map((etf, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{etf.naam}</td>
                      <td className="px-4 py-3 text-sm">{etf.categorie}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{(etf.weight || 0).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-right">{etf['ter p.a.']}</td>
                      <td className={`px-4 py-3 text-sm text-right ${safeParseFloat(etf['2024']) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{etf['2024']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PurchasePage = () => {
    const [step, setStep] = useState(selectedProfile && investmentDetails.riskProfile ? 2 : 1);
    const [showGoalCustom, setShowGoalCustom] = useState(false);
    const [showHorizonCustom, setShowHorizonCustom] = useState(false);
    const [showAmountCustom, setShowAmountCustom] = useState(false);
    
    // If profile already selected, pre-fill the risk profile
    useState(() => {
      if (selectedProfile && !investmentDetails.riskProfile) {
        setInvestmentDetails(prev => ({
          ...prev,
          riskProfile: premadePortfolios[selectedProfile].name
        }));
      }
    }, []);
    
    const canProceed = investmentDetails.goal && investmentDetails.horizon && investmentDetails.amount && investmentDetails.riskProfile;
    
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b"><div className="max-w-7xl mx-auto px-4 py-4"><div className="text-2xl font-bold text-blue-600">ETF PORTAL</div></div></nav>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8 text-center">Upgrade naar Betaald Account</h1>
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
              <div>
                <label className="block text-lg font-bold mb-4">Doelstelling</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, goal: 'Vermogensopbouw'}); setShowGoalCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.goal === 'Vermogensopbouw' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>Vermogensopbouw</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, goal: 'Pensioen'}); setShowGoalCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.goal === 'Pensioen' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>Pensioen</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, goal: 'Inkomsten'}); setShowGoalCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.goal === 'Inkomsten' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>Inkomsten</button>
                  <button onClick={() => { setShowGoalCustom(true); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${showGoalCustom ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>Anders</button>
                </div>
                {showGoalCustom && <input type="text" value={investmentDetails.goalCustom} onChange={(e) => setInvestmentDetails({...investmentDetails, goal: e.target.value, goalCustom: e.target.value})} placeholder="Vul je eigen doelstelling in" className="mt-3 w-full px-4 py-3 border-2 border-blue-400 rounded focus:outline-none focus:border-blue-600" />}
              </div>
              
              <div>
                <label className="block text-lg font-bold mb-4">Beleggingshorizon</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, horizon: '5'}); setShowHorizonCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.horizon === '5' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>5 jaar</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, horizon: '10'}); setShowHorizonCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.horizon === '10' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>10 jaar</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, horizon: '20'}); setShowHorizonCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.horizon === '20' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>20 jaar</button>
                  <button onClick={() => { setShowHorizonCustom(true); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${showHorizonCustom ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>Anders</button>
                </div>
                {showHorizonCustom && <input type="number" value={investmentDetails.horizonCustom} onChange={(e) => setInvestmentDetails({...investmentDetails, horizon: e.target.value, horizonCustom: e.target.value})} placeholder="Aantal jaren" className="mt-3 w-full px-4 py-3 border-2 border-blue-400 rounded focus:outline-none focus:border-blue-600" />}
              </div>
              
              <div>
                <label className="block text-lg font-bold mb-4">Te Beleggen Vermogen</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, amount: '10000'}); setShowAmountCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.amount === '10000' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>€ 10.000</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, amount: '25000'}); setShowAmountCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.amount === '25000' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>€ 25.000</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, amount: '50000'}); setShowAmountCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.amount === '50000' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>€ 50.000</button>
                  <button onClick={() => { setShowAmountCustom(true); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${showAmountCustom ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>Anders</button>
                </div>
                {showAmountCustom && <input type="text" value={investmentDetails.amountCustom} onChange={(e) => { const val = e.target.value.replace(/[^\d]/g, ''); setInvestmentDetails({...investmentDetails, amount: val, amountCustom: val}); }} placeholder="€ 0" className="mt-3 w-full px-4 py-3 border-2 border-blue-400 rounded focus:outline-none focus:border-blue-600 text-lg" />}
              </div>
              
              <div>
                <label className="block text-lg font-bold mb-4">Risicoprofiel</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(premadePortfolios).map(([key, config]) => (
                    <button key={key} onClick={() => setInvestmentDetails({...investmentDetails, riskProfile: config.name})} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.riskProfile === config.name ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>
                      <div>{config.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{(config.expectedReturn * 100).toFixed(1)}% verwacht rendement</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <button onClick={() => setStep(2)} disabled={!canProceed} className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg disabled:bg-gray-300 disabled:cursor-not-allowed">Volgende Stap →</button>
            </div>
          )}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6 text-center">
              <div className="text-6xl mb-4">💳</div>
              <h2 className="text-2xl font-bold">Stort je beginbedrag</h2>
              <p className="text-gray-600">Stort {formatEuro(parseInt(investmentDetails.amount))} via iDEAL om je portfolio te activeren</p>
              <div className="bg-blue-50 p-6 rounded-lg"><div className="text-4xl font-bold text-blue-600 mb-2">{formatEuro(parseInt(investmentDetails.amount))}</div><div className="text-sm text-gray-600">Te storten bedrag</div></div>
              <button onClick={() => { setPortfolioValue(parseFloat(investmentDetails.amount) || 10000); setCurrentPage('dashboard'); }} className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg">Betalen met iDEAL →</button>
              <button onClick={() => setStep(1)} className="text-gray-600 hover:text-gray-800">← Terug</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const DashboardPage = () => {
    const [showRebalance, setShowRebalance] = useState(false);
    const [showHoldings, setShowHoldings] = useState(false);
    const [holdingsView, setHoldingsView] = useState('top10');
    const [currentMonth, setCurrentMonth] = useState(0);
    const [staticPerformanceData, setStaticPerformanceData] = useState(null);
    const metrics = calculatePortfolioMetrics();
    
    const horizon = parseInt(investmentDetails.horizon) || 10;
    const initialValue = parseFloat(investmentDetails.amount) || 10000;
    const months = horizon * 12;
    
    // Get portfolio configuration
    const selectedPortfolioKey = Object.keys(premadePortfolios).find(
      key => premadePortfolios[key].name === investmentDetails.riskProfile
    );
    const portfolioConfig = premadePortfolios[selectedPortfolioKey] || premadePortfolios['neutral'];
    const avgReturn = portfolioConfig.expectedReturn;
    const stdDev = portfolioConfig.stdDev;
    
    // Helper function for Box-Muller transform to generate normal distribution
    const generateNormalRandom = (mean, stdDev) => {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return mean + stdDev * z0;
    };
    
    // Monte Carlo simulation
    const runMonteCarloSimulation = (scenarios = 200) => {
      const allSimulations = [];
      
      for (let sim = 0; sim < scenarios; sim++) {
        let value = initialValue;
        const simulation = [value];
        
        for (let month = 1; month <= months; month++) {
          // Add monthly contribution
          value += monthlyContribution;
          
          // Generate monthly return using normal distribution
          const monthlyReturn = generateNormalRandom(avgReturn / 12, stdDev / Math.sqrt(12));
          value = value * (1 + monthlyReturn);
          
          simulation.push(value);
        }
        allSimulations.push(simulation);
      }
      
      // Calculate percentiles for each month
      const performanceData = [];
      for (let month = 0; month <= months; month++) {
        const monthValues = allSimulations.map(sim => sim[month]).sort((a, b) => a - b);
        
        const date = new Date();
        date.setMonth(date.getMonth() + month);
        
        // Use 10th percentile for poor, median for expected, 90th percentile for good
        performanceData.push({
          date: date.toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' }),
          poor: monthValues[Math.floor(scenarios * 0.10)],
          expected: monthValues[Math.floor(scenarios * 0.50)],
          good: monthValues[Math.floor(scenarios * 0.90)],
          // Portfolio will be revealed progressively
          portfolioValue: monthValues[Math.floor(scenarios * 0.50)]
        });
      }
      
      return performanceData;
    };
    
    // Generate static data once when component mounts
    useEffect(() => {
      const generatedData = runMonteCarloSimulation(1000);
      setStaticPerformanceData(generatedData);
      setCurrentMonth(0);
    }, []);
    
    // Animate month by month - 1 second per month
    useEffect(() => {
      if (staticPerformanceData && currentMonth < months) {
        const timer = setTimeout(() => {
          setCurrentMonth(prev => prev + 1);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [currentMonth, months, staticPerformanceData]);
    
    if (!staticPerformanceData) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">Dashboard laden...</div>
            <div className="text-gray-600">Monte Carlo simulatie wordt berekend...</div>
          </div>
        </div>
      );
    }
    
    // Create display data with growing portfolio line
    const performanceData = staticPerformanceData.map((point, i) => ({
      ...point,
      portfolio: i <= currentMonth ? point.portfolioValue : null
    }));
    
    // Calculate current portfolio value based on animation progress
    const animatedPortfolioValue = staticPerformanceData[currentMonth]?.portfolioValue || initialValue;
    const totalReturn = ((animatedPortfolioValue - initialValue) / initialValue * 100).toFixed(2);
    const categoryData = Object.entries(metrics.categories).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
    
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">ETF PORTAL</div>
            <div className="flex items-center gap-6">
              <button onClick={() => setCurrentPage('dashboard')} className="text-blue-600 font-medium">Dashboard</button>
              <button onClick={() => setCurrentPage('etfDatabase')} className="text-gray-700 hover:text-blue-600">ETF Database</button>
              <div className="text-sm text-gray-600">{user?.name}</div>
            </div>
          </div>
        </nav>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Mijn Dashboard</h1>
            <div className="flex gap-3">
              <button onClick={() => setShowEditPortfolio(true)} className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium">Portfolio Aanpassen</button>
              <button onClick={() => setShowRebalance(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Portfolio Balanceren</button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6"><div className="text-sm text-gray-600 mb-1">Totale Waarde</div><div className="text-3xl font-bold">{formatEuro(animatedPortfolioValue)}</div><div className={`text-sm mt-2 ${parseFloat(totalReturn) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{parseFloat(totalReturn) >= 0 ? '↑' : '↓'} {totalReturn}%</div></div>
            <div className="bg-white rounded-lg shadow p-6"><div className="text-sm text-gray-600 mb-1">Inleg</div><div className="text-3xl font-bold">{formatEuro(initialValue)}</div></div>
            <div className="bg-white rounded-lg shadow p-6"><div className="text-sm text-gray-600 mb-1">Winst/Verlies</div><div className={`text-3xl font-bold ${animatedPortfolioValue >= initialValue ? 'text-green-600' : 'text-red-600'}`}>{formatEuro(animatedPortfolioValue - initialValue)}</div></div>
            <div className="bg-white rounded-lg shadow p-6"><div className="text-sm text-gray-600 mb-1">Aantal ETF's</div><div className="text-3xl font-bold">{portfolio.length}</div></div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="font-bold text-lg mb-2">Waardeontwikkeling ({horizon} jaar horizon)</h3>
            <div className="text-sm text-gray-600 mb-4">
              Monte Carlo simulatie met {(avgReturn * 100).toFixed(1)}% verwacht rendement en {(stdDev * 100).toFixed(1)}% risico
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={performanceData}>
                <XAxis 
                  dataKey="date" 
                  interval={Math.floor(months / 10)}
                />
                <YAxis 
                  tickFormatter={(value) => formatEuro(value)}
                  label={{ value: 'Portofolio Waarde', angle: -90, position: 'insideLeft' }}
                  domain={[
                    (dataMin) => Math.floor(dataMin * 0.9 / 1000) * 1000,
                    (dataMax) => Math.ceil(dataMax * 1.1 / 1000) * 1000
                  ]}
                />
                <Tooltip 
                  formatter={(value) => [formatEuro(value), '']}
                  labelFormatter={(label) => `Datum: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={() => initialValue} 
                  stroke="#999" 
                  strokeWidth={1} 
                  strokeDasharray="3 3" 
                  dot={false}
                  name="Startwaarde"
                />
                <Line type="monotone" dataKey="poor" stroke="#EF4444" strokeDasharray="5 5" name="Slecht Scenario (P10)" dot={false} />
                <Line type="monotone" dataKey="portfolio" stroke="#0088FE" strokeWidth={3} name="Jouw Portfolio (Median)" dot={false} connectNulls />
                <Line type="monotone" dataKey="expected" stroke="#FBBF24" strokeDasharray="5 5" name="Verwacht Scenario (Median)" dot={false} opacity={0.3} />
                <Line type="monotone" dataKey="good" stroke="#10B981" strokeDasharray="5 5" name="Goed Scenario (P90)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-600 text-center">
              Inclusief maandelijkse storting van {formatEuro(monthlyContribution)}. Gebaseerd op {portfolioConfig.name} risicoprofiel.
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-4">Asset Allocatie</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-4">Portfolio Metrices</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-gray-600">Gemiddelde TER:</span><span className="font-bold text-blue-600">{metrics.avgTER.toFixed(2)}%</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Verwacht Rendement:</span><span className="font-bold text-green-600">{(avgReturn * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Risico (Std Dev):</span><span className="font-bold text-orange-600">{(stdDev * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Aantal Holdings:</span><span className="font-bold">{portfolio.reduce((sum, p) => sum + parseInt(p.holdings || 0), 0)}</span></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Portfolio Holdings</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-sm font-medium">ETF</th><th className="px-4 py-2 text-right text-sm font-medium">Weging</th><th className="px-4 py-2 text-right text-sm font-medium">Waarde</th><th className="px-4 py-2 text-right text-sm font-medium">Return</th></tr></thead>
                <tbody className="divide-y">
                  {portfolio.map((etf, idx) => {
                    const etfValue = (animatedPortfolioValue * (etf.weight || 0) / 100);
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><button onClick={() => setSelectedETF(etf)} className="text-blue-600 hover:underline text-left">{etf.naam}</button></td>
                        <td className="px-4 py-3 text-right font-medium">{(etf.weight || 0).toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">{formatEuro(etfValue)}</td>
                        <td className={`px-4 py-3 text-right ${safeParseFloat(etf.ytd) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{etf.ytd}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {showHoldings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold">Portfolio Holdings</h2>
                <button onClick={() => setShowHoldings(false)} className="text-3xl text-gray-500 hover:text-gray-700 leading-none">×</button>
              </div>
              
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setHoldingsView('top10')}
                    className={`px-6 py-2 rounded-lg font-medium transition ${holdingsView === 'top10' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Top 10
                  </button>
                  <button
                    onClick={() => setHoldingsView('top100')}
                    className={`px-6 py-2 rounded-lg font-medium transition ${holdingsView === 'top100' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Top 100
                  </button>
                </div>
                
                {(() => {
                  const holdings = generateHoldings();
                  const limit = holdingsView === 'top10' ? 10 : 100;
                  
                  return (
                    <div className="space-y-8">
                      {holdings.stocks.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4">Aandelen</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Holding</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Regio</th>
                                  <th className="px-4 py-3 text-right text-sm font-medium">Weging</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {holdings.stocks.slice(0, limit).map((holding, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{holding.name}</td>
                                    <td className="px-4 py-3 text-sm">{holding.region}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">{holding.weight.toFixed(2)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {holdings.bonds.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4">Obligaties</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Holding</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Regio</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Looptijd</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Coupon</th>
                                  <th className="px-4 py-3 text-right text-sm font-medium">Weging</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {holdings.bonds.slice(0, limit).map((holding, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{holding.name}</td>
                                    <td className="px-4 py-3 text-sm">{holding.region}</td>
                                    <td className="px-4 py-3 text-sm">{holding.maturity}</td>
                                    <td className="px-4 py-3 text-sm">{holding.coupon}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">{holding.weight.toFixed(2)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                <div className="mt-6">
                  <button
                    onClick={() => setShowHoldings(false)}
                    className="w-full py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Sluiten
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showRebalance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-8">
              <h2 className="text-2xl font-bold mb-6">Portfolio Balanceren</h2>
              <p className="text-gray-600 mb-6">Door te balanceren worden alle wegingen weer teruggezet naar de oorspronkelijke verdeling.</p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-3">Benodigde Transacties:</h3>
                <div className="space-y-2 text-sm">
                  {portfolio.slice(0, 3).map((etf, idx) => (<div key={idx} className="flex justify-between"><span>{etf.naam}</span><span className="font-medium">{Math.random() > 0.5 ? 'Koop' : 'Verkoop'} {formatEuro(Math.random() * 500)}</span></div>))}
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => { alert('Portfolio succesvol gebalanceerd!'); setShowRebalance(false); }} className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Transacties Uitvoeren</button>
                <button onClick={() => setShowRebalance(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Annuleren</button>
              </div>
            </div>
          </div>
        )}
        
        {showEditPortfolio && <EditPortfolioModal onClose={() => setShowEditPortfolio(false)} />}
      </div>
    );
  };

  return (
    <div className="font-sans">
      {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'register' && <RegisterPage />}
      {currentPage === 'etfDatabase' && <ETFDatabasePage />}
      {currentPage === 'portfolioBuilder' && <PortfolioBuilderPage />}
      {currentPage === 'portfolioOverview' && <PortfolioOverviewPage />}
      {currentPage === 'purchase' && <PurchasePage />}
      {currentPage === 'dashboard' && <DashboardPage />}
      {selectedETF && <ETFDetailModal etf={selectedETF} onClose={() => setSelectedETF(null)} />}
    </div>
  );
};

export default ETFPortal;