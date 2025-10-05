import React, { useState, useEffect, useCallback } from 'react';
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
  // Initialize state from localStorage
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('currentPage');
    return saved || 'landing';
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : [
    {
      id: 1,
      name: 'Jan Pietersen',
      email: 'jan.pietersen@email.nl',
      password: 'demo123',
      address: 'Hoofdstraat 45',
      city: 'Amsterdam',
      phone: '+31 6 12345678',
      registeredAt: '2024-01-15T10:30:00.000Z',
      investmentDetails: {
        goal: 'Vermogensopbouw',
        horizon: '20',
        amount: '50000',
        monthlyContribution: '500',
        riskProfile: 'Offensief'
      },
      portfolio: [
        { naam: 'iShares Core MSCI World UCITS ETF', isin: 'IE00B4L5Y983', categorie: 'Aandelen', weight: 50, 'ter p.a.': '0.20%' },
        { naam: 'Xtrackers MSCI Emerging Markets UCITS ETF', isin: 'IE00BTJRMP35', categorie: 'Aandelen', weight: 15, 'ter p.a.': '0.18%' },
        { naam: 'iShares Core Euro Corporate Bond UCITS ETF', isin: 'IE00B3F81R35', categorie: 'Obligaties', weight: 20, 'ter p.a.': '0.20%' },
        { naam: 'iShares Physical Gold ETC', isin: 'IE00B579F325', categorie: 'Commodities', weight: 10, 'ter p.a.': '0.25%' },
        { naam: 'iShares Developed Markets Property Yield UCITS ETF', isin: 'IE00B1FZS350', categorie: 'Vastgoed', weight: 5, 'ter p.a.': '0.59%' }
      ],
      transactions: [
        { date: '2024-01-15', type: 'Storting', amount: 50000, description: 'Initiele storting' },
        { date: '2024-02-01', type: 'Storting', amount: 500, description: 'Maandelijkse storting' },
        { date: '2024-03-01', type: 'Storting', amount: 500, description: 'Maandelijkse storting' },
        { date: '2024-04-01', type: 'Storting', amount: 500, description: 'Maandelijkse storting' },
        { date: '2024-05-01', type: 'Storting', amount: 500, description: 'Maandelijkse storting' }
      ],
      portfolioValue: 52450,
      totalReturn: 4.9
    },
    {
      id: 2,
      name: 'Sophie van der Berg',
      email: 'sophie.vandenberg@email.nl',
      password: 'demo123',
      address: 'Kerkstraat 12',
      city: 'Rotterdam',
      phone: '+31 6 23456789',
      registeredAt: '2024-02-20T14:15:00.000Z',
      investmentDetails: {
        goal: 'Pensioen',
        horizon: '30',
        amount: '100000',
        monthlyContribution: '1000',
        riskProfile: 'Neutraal'
      },
      portfolio: [
        { naam: 'Vanguard FTSE All-World UCITS ETF', isin: 'IE00B3RBWM25', categorie: 'Aandelen', weight: 40, 'ter p.a.': '0.22%' },
        { naam: 'iShares Core Euro Government Bond UCITS ETF', isin: 'IE00B4WXJJ64', categorie: 'Obligaties', weight: 40, 'ter p.a.': '0.09%' },
        { naam: 'iShares Global Infrastructure UCITS ETF', isin: 'IE00B1FZS467', categorie: 'Vastgoed', weight: 10, 'ter p.a.': '0.65%' },
        { naam: 'Invesco Physical Gold ETC', isin: 'IE00B579F325', categorie: 'Commodities', weight: 10, 'ter p.a.': '0.12%' }
      ],
      transactions: [
        { date: '2024-02-20', type: 'Storting', amount: 100000, description: 'Initiële storting' },
        { date: '2024-03-01', type: 'Storting', amount: 1000, description: 'Maandelijkse storting' },
        { date: '2024-04-01', type: 'Storting', amount: 1000, description: 'Maandelijkse storting' },
        { date: '2024-05-01', type: 'Storting', amount: 1000, description: 'Maandelijkse storting' }
      ],
      portfolioValue: 103780,
      totalReturn: 3.78
    },
    {
      id: 3,
      name: 'Thomas de Vries',
      email: 'thomas.devries@email.nl',
      password: 'demo123',
      address: 'Molenlaan 88',
      city: 'Utrecht',
      phone: '+31 6 34567890',
      registeredAt: '2024-03-10T09:45:00.000Z',
      investmentDetails: {
        goal: 'Vermogensopbouw',
        horizon: '10',
        amount: '25000',
        monthlyContribution: '250',
        riskProfile: 'Zeer Offensief'
      },
      portfolio: [
        { naam: 'iShares MSCI World UCITS ETF', isin: 'IE00B0M62Q58', categorie: 'Aandelen', weight: 70, 'ter p.a.': '0.20%' },
        { naam: 'Xtrackers MSCI Emerging Markets UCITS ETF', isin: 'IE00BTJRMP35', categorie: 'Aandelen', weight: 20, 'ter p.a.': '0.18%' },
        { naam: 'Wisdomtree Physical Gold', isin: 'JE00B1VS3770', categorie: 'Commodities', weight: 10, 'ter p.a.': '0.39%' }
      ],
      transactions: [
        { date: '2024-03-10', type: 'Storting', amount: 25000, description: 'Initiële storting' },
        { date: '2024-04-01', type: 'Storting', amount: 250, description: 'Maandelijkse storting' },
        { date: '2024-05-01', type: 'Storting', amount: 250, description: 'Maandelijkse storting' }
      ],
      portfolioValue: 26890,
      totalReturn: 7.12
    },
    {
      id: 4,
      name: 'Emma Jansen',
      email: 'emma.jansen@email.nl',
      password: 'demo123',
      address: 'Parkweg 23',
      city: 'Den Haag',
      phone: '+31 6 45678901',
      registeredAt: '2024-04-05T16:20:00.000Z',
      investmentDetails: {
        goal: 'Inkomsten',
        horizon: '15',
        amount: '75000',
        monthlyContribution: '750',
        riskProfile: 'Defensief'
      },
      portfolio: [
        { naam: 'iShares Core Euro Government Bond UCITS ETF', isin: 'IE00B4WXJJ64', categorie: 'Obligaties', weight: 60, 'ter p.a.': '0.09%' },
        { naam: 'Vanguard FTSE All-World UCITS ETF', isin: 'IE00B3RBWM25', categorie: 'Aandelen', weight: 20, 'ter p.a.': '0.22%' },
        { naam: 'iShares Developed Markets Property Yield UCITS ETF', isin: 'IE00B1FZS350', categorie: 'Vastgoed', weight: 15, 'ter p.a.': '0.59%' },
        { naam: 'Lyxor Euro Government Bond 1-3Y UCITS ETF', isin: 'LU1287023342', categorie: 'Money market', weight: 5, 'ter p.a.': '0.17%' }
      ],
      transactions: [
        { date: '2024-04-05', type: 'Storting', amount: 75000, description: 'Initiële storting' },
        { date: '2024-05-01', type: 'Storting', amount: 750, description: 'Maandelijkse storting' }
      ],
      portfolioValue: 76320,
      totalReturn: 1.74
    },
    {
      id: 5,
      name: 'Lars Bakker',
      email: 'lars.bakker@email.nl',
      password: 'demo123',
      address: 'Dorpsstraat 156',
      city: 'Eindhoven',
      phone: '+31 6 56789012',
      registeredAt: '2024-05-12T11:00:00.000Z',
      investmentDetails: {
        goal: 'Vermogensopbouw',
        horizon: '25',
        amount: '150000',
        monthlyContribution: '2000',
        riskProfile: 'Neutraal'
      },
      portfolio: [
        { naam: 'iShares Core MSCI World UCITS ETF', isin: 'IE00B4L5Y983', categorie: 'Aandelen', weight: 45, 'ter p.a.': '0.20%' },
        { naam: 'iShares Core Euro Corporate Bond UCITS ETF', isin: 'IE00B3F81R35', categorie: 'Obligaties', weight: 35, 'ter p.a.': '0.20%' },
        { naam: 'iShares Global Infrastructure UCITS ETF', isin: 'IE00B1FZS467', categorie: 'Vastgoed', weight: 10, 'ter p.a.': '0.65%' },
        { naam: 'iShares Physical Gold ETC', isin: 'IE00B579F325', categorie: 'Commodities', weight: 10, 'ter p.a.': '0.25%' }
      ],
      transactions: [
        { date: '2024-05-12', type: 'Storting', amount: 150000, description: 'Initiële storting' }
      ],
      portfolioValue: 150450,
      totalReturn: 0.30
    }
  ]});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('portfolio');
    return saved ? JSON.parse(saved) : [];
  });
  const [portfolioType, setPortfolioType] = useState(() => {
    const saved = localStorage.getItem('portfolioType');
    return saved || null;
  });
  const [investmentDetails, setInvestmentDetails] = useState(() => {
    const saved = localStorage.getItem('investmentDetails');
    return saved ? JSON.parse(saved) : {
      goal: '',
      goalCustom: '',
      horizon: '',
      horizonCustom: '',
      amount: '',
      amountCustom: '',
      monthlyContribution: '500',
      monthlyContributionCustom: '',
      riskProfile: ''
    };
  });
  const [portfolioValue, setPortfolioValue] = useState(10000);
  const [showEditPortfolio, setShowEditPortfolio] = useState(false);
  const [customBuildStep, setCustomBuildStep] = useState('profile'); // 'profile', 'categories', 'selectETFs'
  const [selectedProfile, setSelectedProfile] = useState(() => {
    const saved = localStorage.getItem('selectedProfile');
    return saved || null;
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoriesCompleted, setCategoriesCompleted] = useState(() => {
    const saved = localStorage.getItem('categoriesCompleted');
    return saved ? JSON.parse(saved) : {};
  });

  const premadePortfolios = {
    'bonds100': {
      name: '100% Obligaties',
      allocation: { 'Obligaties': 100 },
      expectedReturn: 0.025, // 2.5%
      stdDev: 0.05 // 5%
    },
    'defensive': {
      name: 'Defensief',
      allocation: { 'Aandelen': 25, 'Obligaties': 60, 'Commodities': 5, 'Vastgoed': 5, 'Money market': 5 },
      expectedReturn: 0.035, // 3.5%
      stdDev: 0.08 // 8%
    },
    'neutral': {
      name: 'Neutraal',
      allocation: { 'Aandelen': 50, 'Obligaties': 35, 'Commodities': 5, 'Vastgoed': 5, 'Money market': 5 },
      expectedReturn: 0.05, // 5%
      stdDev: 0.11 // 11%
    },
    'offensive': {
      name: 'Offensief',
      allocation: { 'Aandelen': 65, 'Obligaties': 20, 'Commodities': 7.5, 'Vastgoed': 5, 'Money market': 2.5 },
      expectedReturn: 0.06, // 6%
      stdDev: 0.13 // 13%
    },
    'veryOffensive': {
      name: 'Zeer Offensief',
      allocation: { 'Aandelen': 75, 'Obligaties': 10, 'Commodities': 10, 'Vastgoed': 5 },
      expectedReturn: 0.07, // 7%
      stdDev: 0.15 // 15%
    },
    'stocks100': {
      name: '100% Aandelen',
      allocation: { 'Aandelen': 85, 'Commodities': 10, 'Vastgoed': 5 },
      expectedReturn: 0.08, // 8%
      stdDev: 0.16 // 16%
    },
    'free': {
      name: 'Vrije Portefeuille',
      allocation: {}, // No fixed allocation - user chooses freely
      expectedReturn: 0.06, // 6% estimated
      stdDev: 0.12 // 12% estimated
    }
  };

useEffect(() => {
  const loadETFs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/ETF_overzicht_met_subcategorie.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      // Dynamically import xlsx
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData && jsonData.length > 0) {
        // Filter out empty rows (rows without naam or isin)
        const validETFs = jsonData.filter(etf =>
          etf.naam && etf.naam.trim() !== '' &&
          etf.isin && etf.isin.trim() !== ''
        );
        console.log(`Loaded ${validETFs.length} valid ETFs from Excel (filtered from ${jsonData.length} rows)`);
        setEtfs(validETFs);
        setFilteredEtfs(validETFs);
      } else {
        console.warn('Excel file is empty, using sample data');
        setEtfs(SAMPLE_ETFS);
        setFilteredEtfs(SAMPLE_ETFS);
      }
    } catch (error) {
      console.error('Error loading Excel file:', error);
      console.log('Using sample ETF data as fallback');
      setEtfs(SAMPLE_ETFS);
      setFilteredEtfs(SAMPLE_ETFS);
    }
    setLoading(false);
  };

  loadETFs();
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

  // Save user and currentPage to localStorage when they change
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  // Save customers to localStorage when they change
  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  // Save portfolio data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    if (portfolioType) {
      localStorage.setItem('portfolioType', portfolioType);
    }
  }, [portfolioType]);

  useEffect(() => {
    localStorage.setItem('investmentDetails', JSON.stringify(investmentDetails));
  }, [investmentDetails]);

  useEffect(() => {
    if (selectedProfile) {
      localStorage.setItem('selectedProfile', selectedProfile);
    }
  }, [selectedProfile]);

  useEffect(() => {
    localStorage.setItem('categoriesCompleted', JSON.stringify(categoriesCompleted));
  }, [categoriesCompleted]);

  // Redirect to correct page on mount if user is logged in
  useEffect(() => {
    if (user && user.role) {
      if (user.role === 'accountmanager') {
        if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'register') {
          setCurrentPage('customerDatabase');
        }
      } else if (user.role === 'customer') {
        if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'register') {
          // Check if customer has active investments
          if (user.investmentDetails && user.investmentDetails.riskProfile) {
            setCurrentPage('dashboard');
          } else {
            setCurrentPage('mainDashboard');
          }
        }
      }
    } else if (!user && (currentPage !== 'landing' && currentPage !== 'login' && currentPage !== 'register')) {
      // If no user is logged in and we're on a protected page, redirect to landing
      setCurrentPage('landing');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogin = (email, password) => {
    // Check if accountmanager login
    if (email === 'admin@etfportal.nl' && password === 'admin123') {
      setUser({ email, name: 'Account Manager', role: 'accountmanager' });
      setCurrentPage('customerDatabase');
      return true;
    }

    // Regular user login
    const customer = customers.find(c => c.email === email);
    if (customer && customer.password === password) {
      setUser({ ...customer, role: 'customer' });

      // Check if customer has investment details (active portfolio)
      // Redirect to dashboard if they have investment details, otherwise to main menu
      if (customer.investmentDetails && customer.investmentDetails.riskProfile) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('mainDashboard');
      }
      return true;
    }

    return false;
  };

  const handleRegister = (name, email, password, address, city, phone) => {
    const newCustomer = {
      id: Date.now(),
      name,
      email,
      password,
      address,
      city,
      phone,
      registeredAt: new Date().toISOString(),
      portfolio: [],
      investmentDetails: {},
      role: 'customer'
    };

    setCustomers(prev => [...prev, newCustomer]);
    setUser({ ...newCustomer });
    setCurrentPage('mainDashboard');
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

    // For free portfolio, distribute equally across all categories
    if (profile === 'free' || Object.keys(allocation).length === 0) {
      const numCategories = Object.keys(byCategory).length;
      const weightPerCategory = 100 / numCategories;

      const updatedPortfolio = [];
      Object.entries(byCategory).forEach(([category, etfs]) => {
        const weightPerETF = weightPerCategory / etfs.length;
        etfs.forEach(etf => {
          updatedPortfolio.push({ ...etf, weight: weightPerETF });
        });
      });
      return updatedPortfolio;
    }

    // Calculate weights for fixed allocation profiles
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
      setSelectedProfile(type); // Store the selected profile type
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

      // Check if weights are within profile constraints
      if (selectedProfile && selectedProfile !== 'free') {
        const profileConfig = premadePortfolios[selectedProfile];
        const categoryWeights = {};

        tempPortfolio.forEach(etf => {
          const cat = etf.categorie;
          categoryWeights[cat] = (categoryWeights[cat] || 0) + etf.weight;
        });

        // Validate category weights match profile allocation
        for (const [category, weight] of Object.entries(categoryWeights)) {
          const targetWeight = profileConfig.allocation[category] || 0;
          if (Math.abs(weight - targetWeight) > 0.5) {
            alert(`Weging voor ${category} moet ${targetWeight}% zijn (nu ${weight.toFixed(1)}%). Dit komt niet overeen met je gekozen profiel.`);
            return;
          }
        }
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

    // Calculate category weights
    const categoryWeights = {};
    tempPortfolio.forEach(etf => {
      const cat = etf.categorie;
      categoryWeights[cat] = (categoryWeights[cat] || 0) + (etf.weight || 0);
    });
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Portfolio Aanpassen</h2>
              <p className="text-sm text-gray-600 mt-1">Wijzig de wegingen van je ETF's</p>
            </div>
            <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700">×</button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
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

              {selectedProfile && selectedProfile !== 'free' && (
                <div className="border-t pt-3">
                  <div className="text-sm font-medium mb-2">Doelverdeling per categorie ({premadePortfolios[selectedProfile].name}):</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(premadePortfolios[selectedProfile].allocation).map(([cat, target]) => {
                      const current = categoryWeights[cat] || 0;
                      const isValid = Math.abs(current - target) < 0.5;
                      return (
                        <div key={cat} className={`flex justify-between p-2 rounded ${isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                          <span>{cat}:</span>
                          <span className="font-medium">
                            {current.toFixed(1)}% / {target}%
                            {isValid ? ' ✓' : ' ✗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Je kunt alleen wegingen binnen dezelfde categorie aanpassen. De totale weging per categorie moet gelijk blijven aan het profiel.
                  </p>
                </div>
              )}
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

  const MainDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex justify-between items-center">
            <div className="text-xl sm:text-2xl font-bold text-white">Hucha</div>
            <div className="flex items-center gap-4 sm:gap-6">
              <button onClick={() => setCurrentPage('mainDashboard')} className="text-[#28EBCF] font-medium text-sm sm:text-base">Home</button>
              <div className="text-sm text-gray-400 hidden sm:block">
                {user?.name?.split(' ')[0]}
              </div>
              <button
                onClick={() => {
                  setUser(null);
                  setCurrentPage('landing');
                }}
                className="text-gray-400 hover:text-white transition-colors font-medium text-sm sm:text-base"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-white">
            Welkom, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-base sm:text-lg text-gray-400">
            Wat wil je vandaag doen?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <button
            onClick={() => setCurrentPage('etfDatabase')}
            className="bg-[#1A1B1F] border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-[#28EBCF] transition-all group text-left"
          >
            <div className="text-4xl sm:text-5xl mb-4">📊</div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white group-hover:text-[#28EBCF] transition-colors">ETF Database</h3>
            <p className="text-sm sm:text-base text-gray-400">
              Ontdek en filter alle beschikbare ETF's
            </p>
          </button>

          <button
            onClick={() => {
              setPortfolio([]);
              setSelectedProfile(null);
              setPortfolioType('custom');
              setCurrentPage('portfolioBuilder');
            }}
            className="bg-[#1A1B1F] border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-[#28EBCF] transition-all group text-left"
          >
            <div className="text-4xl sm:text-5xl mb-4">🔧</div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white group-hover:text-[#28EBCF] transition-colors">Zelf Samenstellen</h3>
            <p className="text-sm sm:text-base text-gray-400">
              Bouw je eigen portfolio stap voor stap
            </p>
          </button>

          <button
            onClick={() => {
              setPortfolioType('premade');
              setCurrentPage('portfolioBuilder');
            }}
            className="bg-[#1A1B1F] border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-[#28EBCF] transition-all group text-left"
          >
            <div className="text-4xl sm:text-5xl mb-4">✨</div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white group-hover:text-[#28EBCF] transition-colors">Vooraf Samengesteld</h3>
            <p className="text-sm sm:text-base text-gray-400">
              Kies uit onze kant-en-klare portfolio's
            </p>
          </button>
        </div>

        {portfolio.length > 0 && (
          <div className="mt-8 sm:mt-12 bg-[#1A1B1F] border border-gray-800 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 text-white">Je Huidige Portfolio</h2>
            <p className="text-sm sm:text-base text-gray-400 mb-6">Je hebt {portfolio.length} ETF's in je portfolio</p>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="px-6 py-3 bg-[#28EBCF] text-[#0A0B0D] rounded-lg hover:bg-[#20D4BA] transition-all font-semibold"
            >
              Bekijk Portfolio
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const LandingPage = () => {
    const scrollToSection = (id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation with Menu */}
      <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Hucha</div>
                <div className="text-xs sm:text-sm text-gray-400">Investeren voor iedereen</div>
              </div>

              {/* Menu Items */}
              <div className="hidden md:flex gap-6">
                <button onClick={() => scrollToSection('hero')} className="text-gray-300 hover:text-[#28EBCF] transition-colors font-medium">
                  Home
                </button>
                <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-[#28EBCF] transition-colors font-medium">
                  Voordelen
                </button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-gray-300 hover:text-[#28EBCF] transition-colors font-medium">
                  Hoe het werkt
                </button>
                <button onClick={() => scrollToSection('pricing')} className="text-gray-300 hover:text-[#28EBCF] transition-colors font-medium">
                  Prijzen
                </button>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => setCurrentPage('login')}
                className="px-4 sm:px-6 py-2 sm:py-2.5 text-white hover:text-[#28EBCF] transition-colors font-medium text-sm sm:text-base"
              >
                Login
              </button>
              <button
                onClick={() => setCurrentPage('register')}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#28EBCF] text-gray-900 rounded-lg hover:bg-[#20D4BA] transition-all font-semibold text-sm sm:text-base"
              >
                Start nu
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex items-center">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start">
          <div className="text-white">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
              Beheer nu je eigen vermogen
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 text-gray-300 leading-relaxed">
              Beleg nu in een paar klikken in de hele wereld. Heel simpel en overzichtelijk. Met eventueel onze ondersteuning wanneer je vragen hebt.
            </p>
            <button
              onClick={() => setCurrentPage('register')}
              className="px-8 sm:px-10 py-3.5 sm:py-4 bg-[#28EBCF] text-gray-900 rounded-lg text-base sm:text-lg hover:bg-[#20D4BA] transition-all font-bold"
            >
              Begin met beleggen →
            </button>
          </div>

          <div className="relative flex justify-center items-center">
            {/* iPhone Mockup */}
            <div className="relative w-[280px] sm:w-[320px] md:w-[360px]">
              {/* iPhone Frame */}
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl border-8 border-gray-700">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-b-2xl z-10"></div>

                {/* Screen Content */}
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  {/* Portfolio Dashboard Preview */}
                  <div className="p-3 sm:p-4">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-white font-bold text-sm">Mijn Dashboard</div>
                      <div className="text-gray-400 text-xs">Jan</div>
                    </div>

                    {/* Portfolio Value Card */}
                    <div className="bg-gradient-to-br from-[#28EBCF] to-[#20D4BA] rounded-xl p-3 mb-3">
                      <div className="text-[#0A0B0D] text-xs font-medium mb-1">Totale Waarde</div>
                      <div className="text-[#0A0B0D] text-2xl font-bold mb-1">€52,450</div>
                      <div className="text-[#0A0B0D] text-xs">+€2,450 (+4.9%)</div>
                    </div>

                    {/* Performance Chart */}
                    <div className="bg-[#1A1B1F] border border-gray-800 rounded-xl p-3 mb-3">
                      <div className="text-white text-xs font-semibold mb-2">Performance</div>
                      {/* Simple Line Chart Illustration */}
                      <div className="relative h-20">
                        <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                          <path
                            d="M 0,30 L 20,25 L 40,28 L 60,18 L 80,15 L 100,10"
                            fill="none"
                            stroke="#28EBCF"
                            strokeWidth="2"
                          />
                          <path
                            d="M 0,30 L 20,25 L 40,28 L 60,18 L 80,15 L 100,10 L 100,40 L 0,40 Z"
                            fill="url(#gradient)"
                            opacity="0.3"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#28EBCF" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                    {/* Portfolio Holdings - ETF Names */}
                    <div className="bg-[#1A1B1F] border border-gray-800 rounded-xl p-3 mb-3">
                      <div className="text-white text-xs font-semibold mb-2">Mijn ETF's</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-[10px] font-medium truncate">iShares Core MSCI World</div>
                            <div className="text-gray-400 text-[9px]">IE00B4L5Y983</div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-white text-[10px] font-medium">50%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-[10px] font-medium truncate">Xtrackers MSCI EM</div>
                            <div className="text-gray-400 text-[9px]">IE00BTJRMP35</div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-white text-[10px] font-medium">15%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-[10px] font-medium truncate">iShares Euro Bond</div>
                            <div className="text-gray-400 text-[9px]">IE00B3F81R35</div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-white text-[10px] font-medium">20%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button className="flex-1 bg-[#28EBCF] text-gray-900 rounded-lg py-2 text-[10px] font-semibold">
                        Geld Storten
                      </button>
                      <button className="flex-1 border border-gray-700 text-white rounded-lg py-2 text-[10px] font-semibold">
                        Geld Opnemen
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-[#28EBCF] opacity-20 blur-3xl rounded-full -z-10"></div>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Bij Hucha wordt beleggen leuk!</h2>
            <p className="text-xl text-gray-300">Je hebt toegang tot ruim 3000 ETF's wereldwijd.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#1A1B1F] border border-gray-700 rounded-2xl p-8 text-center hover:border-[#28EBCF] transition-all">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-white mb-4">Overzichtelijk</h3>
              <p className="text-gray-300">Alle ETF's overzichtelijk op één plek. Filter en vergelijk eenvoudig.</p>
            </div>

            <div className="bg-[#1A1B1F] border border-gray-700 rounded-2xl p-8 text-center hover:border-[#28EBCF] transition-all">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-2xl font-bold text-white mb-4">Makkelijk</h3>
              <p className="text-gray-300">Stel in een paar klikken je eigen portfolio samen. Simpel en intuïtief.</p>
            </div>

            <div className="bg-[#1A1B1F] border border-gray-700 rounded-2xl p-8 text-center hover:border-[#28EBCF] transition-all">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-2xl font-bold text-white mb-4">Geen overbodige kosten</h3>
              <p className="text-gray-300">Transparante prijzen zonder verborgen beheerkosten.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Hoe het werkt</h2>
            <p className="text-xl text-gray-300">Bij Hucha hoef je geen professional te zijn om je eigen vermogen te beheren</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="bg-gradient-to-br from-[#28EBCF]/20 to-[#20D4BA]/10 rounded-3xl p-12 border border-[#28EBCF]/30">
              <div className="text-8xl text-center">🛠️</div>
            </div>
            <div className="text-white">
              <h3 className="text-3xl font-bold mb-6">Stel je eigen portefeuille samen</h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                Stel heel eenvoudig je eigen portefeuille samen met hulp van onze tools.
                Je kunt ook kiezen voor van te voren samengestelde portefeuilles.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white md:order-2">
              <h3 className="text-3xl font-bold mb-6">Maak een account en begin</h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                Maak eenvoudig een account aan en ontdek de wereld van beleggen.
                Toegang tot de hele database aan ETF's en alle tools om je eigen modelportefeuille te maken.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-3xl p-12 border border-purple-500/30 md:order-1">
              <div className="text-8xl text-center">🚀</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Transparante prijzen</h2>
            <p className="text-xl text-gray-300">Kies het plan dat bij jou past</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-[#1A1B1F] border-2 border-gray-700 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Gratis Account</h3>
              <div className="text-5xl font-bold text-white mb-6">€0<span className="text-xl text-gray-400">/jaar</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-[#28EBCF] text-xl">✓</span>
                  <span className="text-gray-300">Toegang tot hele ETF database (3000+)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#28EBCF] text-xl">✓</span>
                  <span className="text-gray-300">Maak modelportefeuilles</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#28EBCF] text-xl">✓</span>
                  <span className="text-gray-300">Gebruik alle tools</span>
                </li>
              </ul>
              <button onClick={() => setCurrentPage('register')} className="w-full py-3 border-2 border-gray-600 text-white rounded-lg hover:border-[#28EBCF] transition-all font-semibold">
                Start Gratis
              </button>
            </div>

            {/* Paid Plan */}
            <div className="bg-gradient-to-br from-[#28EBCF]/10 to-[#20D4BA]/5 border-2 border-[#28EBCF] rounded-2xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#28EBCF] text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                POPULAIR
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Belegger Account</h3>
              <div className="text-5xl font-bold text-white mb-6">€250<span className="text-xl text-gray-400">/jaar</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-[#28EBCF] text-xl">✓</span>
                  <span className="text-gray-300">Alles van Gratis Account</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#28EBCF] text-xl">✓</span>
                  <span className="text-gray-300">Investeer echt geld</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#28EBCF] text-xl">✓</span>
                  <span className="text-gray-300">Geld storten en opnemen</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#28EBCF] text-xl">✓</span>
                  <span className="text-gray-300">Portfolio tracking</span>
                </li>
              </ul>
              <button onClick={() => setCurrentPage('register')} className="w-full py-3 bg-[#28EBCF] text-gray-900 rounded-lg hover:bg-[#20D4BA] transition-all font-bold">
                Upgrade Naar Belegger
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Klaar om te beginnen?</h2>
          <p className="text-xl text-gray-300 mb-10">Maak vandaag nog een gratis account aan en ontdek de mogelijkheden</p>
          <button
            onClick={() => setCurrentPage('register')}
            className="px-12 py-4 bg-[#28EBCF] text-gray-900 rounded-lg text-xl hover:bg-[#20D4BA] transition-all font-bold"
          >
            Begin met beleggen →
          </button>
        </div>
      </section>
    </div>
    );
  };

  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLoginClick = () => {
      const success = handleLogin(email, password);
      if (!success) {
        setError('Onjuiste email of wachtwoord');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <button onClick={() => setCurrentPage('landing')} className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Hucha
            </button>
          </div>
        </nav>

        <div className="max-w-md mx-auto mt-8 sm:mt-12 md:mt-20 px-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Welkom terug</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Email"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700">Wachtwoord</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Wachtwoord"
                />
              </div>

              <button
                onClick={handleLoginClick}
                className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all font-semibold mt-4 sm:mt-6"
              >
                Inloggen
              </button>
            </div>

            <p className="text-center mt-5 sm:mt-6 text-xs sm:text-sm text-gray-600">
              Geen account?{' '}
              <button onClick={() => setCurrentPage('register')} className="text-indigo-600 hover:underline font-semibold">
                Registreer hier
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const RegisterPage = () => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = () => {
      if (!name || !address || !city || !phone || !email || !password) {
        alert('Vul alstublieft alle velden in');
        return;
      }
      handleRegister(name, email, password, address, city, phone);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <button onClick={() => setCurrentPage('landing')} className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Hucha
            </button>
          </div>
        </nav>

        <div className="max-w-md mx-auto mt-6 sm:mt-8 md:mt-12 mb-8 px-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 border border-gray-100">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Maak een gratis account</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Vul uw gegevens in om te registreren</p>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-700">Volledige Naam *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jan Jansen"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-700">Adres *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Straatnaam 123"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-700">Woonplaats *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Amsterdam"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-700">Telefoonnummer *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+31 6 12345678"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-700">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jan@voorbeeld.nl"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-700">Wachtwoord *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimaal 8 tekens"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all font-semibold mt-4 sm:mt-6"
              >
                Account aanmaken
              </button>

              <p className="text-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4">
                Heeft u al een account?{' '}
                <button onClick={() => setCurrentPage('login')} className="text-indigo-600 font-semibold hover:underline">
                  Log in
                </button>
              </p>
            </div>
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
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Hucha</div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
                <button onClick={() => setCurrentPage('mainDashboard')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors text-xs sm:text-sm md:text-base">
                  Home
                </button>
                {portfolio.length > 0 && (
                  <button onClick={() => setCurrentPage('portfolioOverview')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors text-xs sm:text-sm md:text-base">
                    Portfolio ({portfolio.length})
                  </button>
                )}
                <div className="hidden sm:block text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-indigo-700 font-semibold truncate max-w-[100px]">
                  {user?.name?.split(' ')[0]}
                </div>
                <button
                  onClick={() => {
                    setUser(null);
                    setCurrentPage('landing');
                  }}
                  className="text-gray-600 hover:text-gray-800 font-medium text-xs sm:text-sm md:text-base"
                >
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">ETF Database</h1>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
              <input
                type="text"
                placeholder="Zoek op naam of ISIN..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="sm:col-span-2 px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              />

              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Alle Categorieën</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <select
                value={filters.subcategory}
                onChange={(e) => setFilters({...filters, subcategory: e.target.value})}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Alle Subcategorieën</option>
                {subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>

              <select
                value={filters.currency}
                onChange={(e) => setFilters({...filters, currency: e.target.value})}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Alle Valuta's</option>
                {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              Aantal ETFs: {filteredEtfs.length} {etfs.length === SAMPLE_ETFS.length && <span className="text-orange-600">(Sample data - upload Excel voor volledige database)</span>}
            </div>
          </div>
          
          {/* Mobile view - Cards */}
          <div className="block md:hidden space-y-3">
            {filteredEtfs.map((etf, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-3 border border-gray-100">
                <button
                  onClick={() => setSelectedETF(etf)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-left hover:underline text-sm w-full mb-2"
                >
                  {etf.naam}
                </button>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div><span className="text-gray-500">ISIN:</span> <span className="font-medium">{etf.isin}</span></div>
                  <div><span className="text-gray-500">Cat:</span> <span className="font-medium">{etf.categorie}</span></div>
                  <div><span className="text-gray-500">TER:</span> <span className="font-medium">{etf['ter p.a.']}</span></div>
                  <div><span className="text-gray-500">YTD:</span> <span className={`font-medium ${safeParseFloat(etf.ytd) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{etf.ytd}</span></div>
                </div>
                <button
                  onClick={() => addToPortfolio(etf)}
                  className="w-full px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  + Toevoegen aan Portfolio
                </button>
              </div>
            ))}
          </div>

          {/* Desktop view - Table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
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
    const [categoryFilters, setCategoryFilters] = React.useState({
      subcategorie: '',
      currency: '',
      distribution: ''
    });

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
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Hucha</div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
                <button onClick={() => setCurrentPage('mainDashboard')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors text-xs sm:text-sm md:text-base">Home</button>
                {portfolio.length > 0 && <button onClick={() => setCurrentPage('portfolioOverview')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors text-xs sm:text-sm md:text-base">Portfolio ({portfolio.length})</button>}
                <div className="hidden sm:block text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-indigo-700 font-semibold truncate max-w-[100px]">{user?.name?.split(' ')[0]}</div>
                <button
                  onClick={() => {
                    setUser(null);
                    setCurrentPage('landing');
                  }}
                  className="text-gray-600 hover:text-gray-800 font-medium text-xs sm:text-sm md:text-base"
                >
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Kies je beleggingsstrategie</h1>
          <p className="text-center text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 md:mb-12 px-4">Stel zelf een portfolio samen of kies een vooraf samengestelde portfolio</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-12">
            <button onClick={() => {
              setPortfolioType('custom');
              setCustomBuildStep('profile');
              setSelectedProfile(null);
              setSelectedCategory(null);
              setCategoriesCompleted({});
              setPortfolio([]);
            }} className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-all border border-gray-100 text-left">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎯</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Zelf Samenstellen</h3>
              <p className="text-sm sm:text-base text-gray-600">Kies een profiel en selecteer je eigen ETF's per categorie</p>
            </button>

            <button onClick={() => setPortfolioType('premade')} className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-all border border-gray-100 text-left">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📊</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Vooraf Samengesteld</h3>
              <p className="text-sm sm:text-base text-gray-600">Kies een portfolio op basis van risicoprofiel</p>
            </button>
          </div>
          
          {portfolioType === 'custom' && customBuildStep === 'profile' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Stap 1: Kies je risicoprofiel</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Object.entries(premadePortfolios).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedProfile(key);
                      setCustomBuildStep('categories');
                    }}
                    className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all text-left border border-gray-100 hover:border-indigo-300"
                  >
                    <h4 className="font-bold text-base sm:text-lg mb-2">{config.name}</h4>
                    <div className="text-xs sm:text-sm text-gray-600 mb-3">
                      {Object.entries(config.allocation).map(([cat, pct]) => (
                        <div key={cat}>{cat}: {pct}%</div>
                      ))}
                    </div>
                    <div className="text-xs sm:text-sm text-indigo-600 font-medium">Verwacht rendement: {(config.expectedReturn * 100).toFixed(1)}%</div>
                    <div className="text-xs sm:text-sm text-gray-600">Risico (std dev): {(config.stdDev * 100).toFixed(1)}%</div>
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
                        setCategoryFilters({ subcategorie: '', currency: '', distribution: '' });
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
                    setCategoryFilters({ subcategorie: '', currency: '', distribution: '' });
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
              
              {/* Filter Buttons */}
              {(() => {
                const allCategoryETFs = etfs.filter(etf => etf.categorie === selectedCategory);
                const subcategories = [...new Set(allCategoryETFs.map(e => e.subcategorie))].filter(Boolean).sort();
                const currencies = [...new Set(allCategoryETFs.map(e => e['fund ccy']))].filter(Boolean).sort();
                const distributions = [...new Set(allCategoryETFs.map(e => e.distribution))].filter(Boolean).sort();

                return (
                  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                    <h3 className="font-bold mb-4">Filters</h3>

                    {/* Subcategorie Filter */}
                    {subcategories.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm mb-2">Subcategorie</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setCategoryFilters({...categoryFilters, subcategorie: ''})}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              !categoryFilters.subcategorie
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Alle
                          </button>
                          {subcategories.map(sub => (
                            <button
                              key={sub}
                              onClick={() => setCategoryFilters({...categoryFilters, subcategorie: sub})}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                categoryFilters.subcategorie === sub
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Currency Filter */}
                    {currencies.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm mb-2">Valuta</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setCategoryFilters({...categoryFilters, currency: ''})}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              !categoryFilters.currency
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Alle
                          </button>
                          {currencies.map(curr => (
                            <button
                              key={curr}
                              onClick={() => setCategoryFilters({...categoryFilters, currency: curr})}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                categoryFilters.currency === curr
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {curr}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Distribution Filter */}
                    {distributions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Distributie</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setCategoryFilters({...categoryFilters, distribution: ''})}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              !categoryFilters.distribution
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Alle
                          </button>
                          {distributions.map(dist => (
                            <button
                              key={dist}
                              onClick={() => setCategoryFilters({...categoryFilters, distribution: dist})}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                categoryFilters.distribution === dist
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {dist}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

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
                      {etfs.filter(etf => {
                        if (etf.categorie !== selectedCategory) return false;
                        if (categoryFilters.subcategorie && etf.subcategorie !== categoryFilters.subcategorie) return false;
                        if (categoryFilters.currency && etf['fund ccy'] !== categoryFilters.currency) return false;
                        if (categoryFilters.distribution && etf.distribution !== categoryFilters.distribution) return false;
                        return true;
                      }).map((etf, idx) => {
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
              <button
                onClick={() => {
                  setUser(null);
                  setCurrentPage('landing');
                }}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </nav>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Portfolio Overzicht</h1>
            <div className="flex gap-3">
              <button onClick={() => setShowEditPortfolio(true)} className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium">Portfolio Aanpassen</button>
              <button
                onClick={() => {
                  // Set demo investment details for fictive portfolio
                  setInvestmentDetails({
                    goal: 'Demo',
                    horizon: '10',
                    amount: '10000',
                    riskProfile: selectedProfile ? premadePortfolios[selectedProfile]?.name || 'Neutraal' : 'Neutraal'
                  });
                  setPortfolioValue(10000);
                  setCurrentPage('dashboard');
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Fictieve Portfolio Behouden
              </button>
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
            <div className="space-y-6">
              {Object.entries(
                portfolio.reduce((acc, etf) => {
                  const category = etf.categorie || 'Overig';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(etf);
                  return acc;
                }, {})
              ).map(([category, etfs]) => (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-lg text-gray-800">{category}</h4>
                      <span className="text-sm font-medium text-gray-600">
                        {etfs.reduce((sum, e) => sum + (e.weight || 0), 0).toFixed(1)}% van portfolio
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">ETF</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Weging</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">TER</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Return 2024</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {etfs.map((etf, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{etf.naam}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{(etf.weight || 0).toFixed(1)}%</td>
                            <td className="px-4 py-3 text-sm text-right">{etf['ter p.a.']}</td>
                            <td className={`px-4 py-3 text-sm text-right ${safeParseFloat(etf['2024']) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{etf['2024']}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showEditPortfolio && <EditPortfolioModal onClose={() => setShowEditPortfolio(false)} />}
      </div>
    );
  };

  const CustomPortfolioBuilder = () => {
    const [localFilters, setLocalFilters] = React.useState({
      subcategorie: '',
      currency: '',
      distribution: ''
    });

    const renderProfileSelection = () => {
      const profiles = [
        { key: 'bonds100', name: '100% Obligaties', icon: '🛡️', desc: 'Zeer laag risico, stabiele inkomsten' },
        { key: 'defensive', name: 'Defensief', icon: '🏰', desc: 'Gediversifieerd met focus op obligaties en vastgoed' },
        { key: 'neutral', name: 'Neutraal', icon: '⚖️', desc: 'Gebalanceerde mix van aandelen, obligaties en vastgoed' },
        { key: 'offensive', name: 'Offensief', icon: '🚀', desc: 'Focus op aandelen met commodities en vastgoed' },
        { key: 'veryOffensive', name: 'Zeer Offensief', icon: '💎', desc: 'Maximale groei met aandelen, commodities en vastgoed' },
        { key: 'stocks100', name: '100% Aandelen', icon: '📈', desc: 'Volledig gefocust op aandelengr oei met vastgoed' },
        { key: 'free', name: 'Vrije Portefeuille', icon: '✨', desc: 'Kies zelf alle categorieën inclusief crypto' }
      ];

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <div className="text-2xl font-bold text-blue-600">ETF PORTAL</div>
              <button onClick={() => setCurrentPage('mainDashboard')} className="text-gray-700 hover:text-blue-600">
                ← Terug naar Dashboard
              </button>
            </div>
          </nav>

          <div className="max-w-6xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-center mb-4">Kies je Risicoprofiel</h1>
            <p className="text-center text-gray-600 mb-12">Selecteer het profiel dat het beste bij jouw beleggingsdoelen past</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map(profile => (
                <button
                  key={profile.key}
                  onClick={() => {
                    setSelectedProfile(profile.key);
                    setCategoriesCompleted({});
                    setPortfolio([]);
                    setCustomBuildStep('categories');
                  }}
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-blue-500 text-left"
                >
                  <div className="text-5xl mb-4">{profile.icon}</div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-800">{profile.name}</h3>
                  <p className="text-gray-600 text-sm">{profile.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    };

    const renderCategorySelection = () => {
      if (!selectedProfile) {
        setCustomBuildStep('profile');
        return null;
      }

      const profileConfig = premadePortfolios[selectedProfile];
      let availableCategories = [];

      if (selectedProfile === 'bonds100') {
        availableCategories = ['Obligaties'];
      } else if (selectedProfile === 'stocks100') {
        availableCategories = ['Aandelen'];
      } else if (selectedProfile === 'free') {
        availableCategories = ['Aandelen', 'Obligaties', 'Commodities', 'Vastgoed', 'Money market', 'Crypto ETF'];
      } else {
        availableCategories = Object.keys(profileConfig.allocation);
      }

      const categoryIcons = {
        'Aandelen': '📈',
        'Obligaties': '📊',
        'Commodities': '⚡',
        'Vastgoed': '🏢',
        'Money market': '💰',
        'Money Market': '💰',
        'Crypto ETF': '₿',
        'Crypto': '₿'
      };

      // For free portfolio, at least one category must be completed
      // For other profiles, all categories must be completed
      const allCategoriesCompleted = selectedProfile === 'free'
        ? Object.keys(categoriesCompleted).some(cat => categoriesCompleted[cat])
        : availableCategories.every(cat => categoriesCompleted[cat]);

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <div className="text-2xl font-bold text-blue-600">ETF PORTAL</div>
              <button onClick={() => setCustomBuildStep('profile')} className="text-gray-700 hover:text-blue-600">
                ← Terug naar Profiel Selectie
              </button>
            </div>
          </nav>

          <div className="max-w-6xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-center mb-4">Selecteer Beleggingscategorieën</h1>
            <p className="text-center text-gray-600 mb-4">Profiel: <span className="font-bold text-blue-600">{profileConfig.name}</span></p>
            <p className="text-center text-gray-600 mb-12">
              {selectedProfile === 'free'
                ? 'Klik op categorieën om ETF\'s te selecteren (kies minimaal 1 categorie)'
                : 'Klik op een categorie om ETF\'s te selecteren (minimaal 1 per categorie)'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {availableCategories.map(category => {
                const isCompleted = categoriesCompleted[category];
                const allocation = profileConfig.allocation?.[category] || 0;

                return (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setCustomBuildStep('selectETFs');
                      setLocalFilters({ subcategorie: '', currency: '', distribution: '' });
                    }}
                    className={`rounded-2xl shadow-lg p-8 transition-all transform hover:scale-105 border-2 text-left ${
                      isCompleted
                        ? 'bg-green-50 border-green-500'
                        : 'bg-white border-transparent hover:border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-5xl">{categoryIcons[category] || '📦'}</div>
                      {isCompleted && <div className="text-3xl">✅</div>}
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-800">{category}</h3>
                    {allocation > 0 && <p className="text-gray-600">Weging: {allocation}%</p>}
                    {isCompleted && (
                      <p className="text-green-600 text-sm mt-2">
                        {portfolio.filter(p => p.categorie === category).length} ETF(s) geselecteerd
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {allCategoriesCompleted && (
              <div className="text-center">
                <button
                  onClick={() => setCurrentPage('portfolioOverview')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-bold hover:shadow-2xl transition-all"
                >
                  Ga naar Portfolio Overzicht →
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderETFSelection = () => {
      if (!selectedCategory) {
        setCustomBuildStep('categories');
        return null;
      }

      // Get all ETFs in this category for filter options
      const allCategoryETFs = etfs.filter(etf => etf.categorie === selectedCategory);
      const subcategories = [...new Set(allCategoryETFs.map(e => e.subcategorie))].filter(Boolean).sort();
      const currencies = [...new Set(allCategoryETFs.map(e => e['fund ccy']))].filter(Boolean).sort();
      const distributions = [...new Set(allCategoryETFs.map(e => e.distribution))].filter(Boolean).sort();

      // Apply filters
      const categoryETFs = allCategoryETFs.filter(etf => {
        if (localFilters.subcategorie && etf.subcategorie !== localFilters.subcategorie) return false;
        if (localFilters.currency && etf['fund ccy'] !== localFilters.currency) return false;
        if (localFilters.distribution && etf.distribution !== localFilters.distribution) return false;
        return true;
      });

      const selectedInCategory = portfolio.filter(p => p.categorie === selectedCategory);

      const handleETFToggle = (etf) => {
        const isSelected = selectedInCategory.some(p => p.isin === etf.isin);

        if (isSelected) {
          // Remove from portfolio
          setPortfolio(prev => {
            const updated = prev.filter(p => p.isin !== etf.isin);
            return recalculateWeights(updated, selectedProfile);
          });
        } else {
          // Add to portfolio
          addToPortfolio(etf);
        }
      };

      const handleContinue = () => {
        if (selectedInCategory.length > 0) {
          setCategoriesCompleted(prev => ({ ...prev, [selectedCategory]: true }));
          setSelectedCategory(null);
          setCustomBuildStep('categories');
        }
      };

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <div className="text-2xl font-bold text-blue-600">ETF PORTAL</div>
              <button onClick={() => {
                setSelectedCategory(null);
                setCustomBuildStep('categories');
                setLocalFilters({ subcategorie: '', currency: '', distribution: '' });
              }} className="text-gray-700 hover:text-blue-600">
                ← Terug naar Categorieën
              </button>
            </div>
          </nav>

          <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-center mb-4">Selecteer ETF's voor {selectedCategory}</h1>
            <p className="text-center text-gray-600 mb-8">
              {selectedInCategory.length} ETF(s) geselecteerd (minimaal 1 vereist) • {categoryETFs.length} ETF(s) gevonden
            </p>

            {/* Filter Buttons */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              {/* Subcategorie Filter */}
              {subcategories.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Subcategorie</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setLocalFilters({...localFilters, subcategorie: ''})}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        !localFilters.subcategorie
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Alle
                    </button>
                    {subcategories.map(sub => (
                      <button
                        key={sub}
                        onClick={() => setLocalFilters({...localFilters, subcategorie: sub})}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          localFilters.subcategorie === sub
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Currency Filter */}
              {currencies.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Valuta</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setLocalFilters({...localFilters, currency: ''})}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        !localFilters.currency
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Alle
                    </button>
                    {currencies.map(curr => (
                      <button
                        key={curr}
                        onClick={() => setLocalFilters({...localFilters, currency: curr})}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          localFilters.currency === curr
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Distribution Filter */}
              {distributions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Distributie</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setLocalFilters({...localFilters, distribution: ''})}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        !localFilters.distribution
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Alle
                    </button>
                    {distributions.map(dist => (
                      <button
                        key={dist}
                        onClick={() => setLocalFilters({...localFilters, distribution: dist})}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          localFilters.distribution === dist
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {dist}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              {categoryETFs.map(etf => {
                const isSelected = selectedInCategory.some(p => p.isin === etf.isin);

                return (
                  <button
                    key={etf.isin}
                    onClick={() => handleETFToggle(etf)}
                    className={`bg-white rounded-xl shadow p-6 transition-all text-left border-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">{etf.naam}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">ISIN:</span>
                            <div className="font-medium">{etf.isin}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">TER:</span>
                            <div className="font-medium">{etf['ter p.a.']}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Grootte:</span>
                            <div className="font-medium">€{formatNumber(etf['fund size (in m €)'])}M</div>
                          </div>
                          <div>
                            <span className="text-gray-600">2024:</span>
                            <div className={`font-medium ${parseFloat(etf['2024']) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {etf['2024']}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {isSelected && <div className="text-3xl">✅</div>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedInCategory.length > 0 && (
              <div className="text-center">
                <button
                  onClick={handleContinue}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-all"
                >
                  Bevestig Selectie →
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };

    if (customBuildStep === 'profile') return renderProfileSelection();
    if (customBuildStep === 'categories') return renderCategorySelection();
    if (customBuildStep === 'selectETFs') return renderETFSelection();
  };

  const PurchasePage = () => {
    const [step, setStep] = useState(1);
    const [showGoalCustom, setShowGoalCustom] = useState(false);
    const [showHorizonCustom, setShowHorizonCustom] = useState(false);
    const [showAmountCustom, setShowAmountCustom] = useState(false);
    const [showMonthlyCustom, setShowMonthlyCustom] = useState(false);
    
    // Pre-fill the risk profile if already selected, but still show step 1
    useEffect(() => {
      if (selectedProfile && premadePortfolios[selectedProfile] && !investmentDetails.riskProfile) {
        setInvestmentDetails(prev => ({
          ...prev,
          riskProfile: premadePortfolios[selectedProfile].name
        }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProfile]);
    
    const canProceed = investmentDetails.goal && investmentDetails.horizon && investmentDetails.amount && investmentDetails.monthlyContribution && investmentDetails.riskProfile;
    
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">ETF PORTAL</div>
            <button
              onClick={() => {
                setUser(null);
                setCurrentPage('landing');
              }}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Uitloggen
            </button>
          </div>
        </nav>
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
                <label className="block text-lg font-bold mb-4">Maandelijkse Storting</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, monthlyContribution: '100'}); setShowMonthlyCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.monthlyContribution === '100' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>€ 100</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, monthlyContribution: '250'}); setShowMonthlyCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.monthlyContribution === '250' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>€ 250</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, monthlyContribution: '500'}); setShowMonthlyCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.monthlyContribution === '500' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>€ 500</button>
                  <button onClick={() => { setShowMonthlyCustom(true); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${showMonthlyCustom ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>Anders</button>
                </div>
                {showMonthlyCustom && <input type="text" value={investmentDetails.monthlyContributionCustom} onChange={(e) => { const val = e.target.value.replace(/[^\d]/g, ''); setInvestmentDetails({...investmentDetails, monthlyContribution: val, monthlyContributionCustom: val}); }} placeholder="€ 0" className="mt-3 w-full px-4 py-3 border-2 border-blue-400 rounded focus:outline-none focus:border-blue-600 text-lg" />}
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
    const [isAnimating, setIsAnimating] = useState(false);
    const metrics = calculatePortfolioMetrics();

    const horizon = parseInt(investmentDetails.horizon) || 10;
    const initialValue = parseFloat(investmentDetails.amount) || 10000;
    const monthlyContribution = parseFloat(investmentDetails.monthlyContribution) || 500;
    const months = horizon * 12;

    // Get portfolio configuration
    const selectedPortfolioKey = Object.keys(premadePortfolios).find(
      key => premadePortfolios[key].name === investmentDetails.riskProfile
    );
    const portfolioConfig = premadePortfolios[selectedPortfolioKey] || premadePortfolios['neutral'];
    const avgReturn = portfolioConfig.expectedReturn;
    const stdDev = portfolioConfig.stdDev;

    // Helper function for Box-Muller transform to generate normal distribution
    const generateNormalRandom = useCallback((mean, stdDev) => {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return mean + stdDev * z0;
    }, []);

    // Monte Carlo simulation
    const runMonteCarloSimulation = useCallback((scenarios = 200) => {
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialValue, months, avgReturn, stdDev, generateNormalRandom]);

    // Generate static data once when component mounts
    useEffect(() => {
      if (portfolio && portfolio.length > 0 && !staticPerformanceData) {
        const generatedData = runMonteCarloSimulation(1000);
        setStaticPerformanceData(generatedData);
        setCurrentMonth(0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [portfolio]);

    // Animate month by month - 1 second per month
    useEffect(() => {
      if (isAnimating && staticPerformanceData && currentMonth < months) {
        const timer = setTimeout(() => {
          setCurrentMonth(prev => prev + 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (isAnimating && currentMonth >= months) {
        // Stop animation when we reach the end
        setIsAnimating(false);
      }
    }, [isAnimating, currentMonth, months, staticPerformanceData]);

    const toggleAnimation = () => {
      if (currentMonth >= months) {
        // Restart from beginning
        setCurrentMonth(0);
        setIsAnimating(true);
      } else {
        setIsAnimating(!isAnimating);
      }
    };

    const resetSimulation = () => {
      setCurrentMonth(0);
      setIsAnimating(true);
    };
    
    // Check if portfolio is empty
    if (!portfolio || portfolio.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md">
            <div className="text-6xl mb-6">📊</div>
            <h2 className="text-2xl font-bold mb-4">Geen Portfolio</h2>
            <p className="text-gray-600 mb-6">
              Je hebt nog geen portfolio samengesteld. Ga terug om een portfolio te maken.
            </p>
            <button
              onClick={() => setCurrentPage('mainDashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Terug naar Dashboard
            </button>
          </div>
        </div>
      );
    }

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold text-white">Hucha</div>
            <div className="flex items-center gap-6">
              <button onClick={() => setCurrentPage('dashboard')} className="text-[#28EBCF] font-medium">Dashboard</button>
              <button onClick={() => setCurrentPage('etfDatabase')} className="text-gray-400 hover:text-white">ETF Database</button>
              <div className="text-sm text-gray-400">{user?.name}</div>
              <button
                onClick={() => {
                  setUser(null);
                  setCurrentPage('landing');
                }}
                className="text-gray-400 hover:text-white font-medium"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </nav>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Mijn Dashboard</h1>
            <div className="flex gap-3">
              <button onClick={() => alert('Geld storten functionaliteit komt binnenkort')} className="px-6 py-3 bg-[#28EBCF] text-gray-900 rounded-lg hover:bg-[#20D4BA] font-semibold">Geld Storten</button>
              <button onClick={() => alert('Geld opnemen functionaliteit komt binnenkort')} className="px-6 py-3 border-2 border-gray-700 text-white rounded-lg hover:border-[#28EBCF] font-semibold">Geld Opnemen</button>
              <button onClick={() => setShowEditPortfolio(true)} className="px-6 py-3 border-2 border-gray-700 text-white rounded-lg hover:border-[#28EBCF] font-medium">Portfolio Aanpassen</button>
              <button onClick={() => setShowRebalance(true)} className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium">Portfolio Balanceren</button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white rounded-lg shadow p-4 md:p-6"><div className="text-xs md:text-sm text-gray-600 mb-1">Totale Waarde</div><div className="text-xl md:text-3xl font-bold">{formatEuro(animatedPortfolioValue)}</div><div className={`text-xs md:text-sm mt-2 ${parseFloat(totalReturn) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{parseFloat(totalReturn) >= 0 ? '↑' : '↓'} {totalReturn}%</div></div>
            <div className="bg-white rounded-lg shadow p-4 md:p-6"><div className="text-xs md:text-sm text-gray-600 mb-1">Inleg</div><div className="text-xl md:text-3xl font-bold">{formatEuro(initialValue)}</div></div>
            <div className="bg-white rounded-lg shadow p-4 md:p-6"><div className="text-xs md:text-sm text-gray-600 mb-1">Winst/Verlies</div><div className={`text-xl md:text-3xl font-bold ${animatedPortfolioValue >= initialValue ? 'text-green-600' : 'text-red-600'}`}>{formatEuro(animatedPortfolioValue - initialValue)}</div></div>
            <div className="bg-white rounded-lg shadow p-4 md:p-6"><div className="text-xs md:text-sm text-gray-600 mb-1">Aantal ETF's</div><div className="text-xl md:text-3xl font-bold">{portfolio.length}</div></div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg mb-2">Waardeontwikkeling ({horizon} jaar horizon)</h3>
                <div className="text-sm text-gray-600">
                  Monte Carlo simulatie met {(avgReturn * 100).toFixed(1)}% verwacht rendement en {(stdDev * 100).toFixed(1)}% risico
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleAnimation}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    isAnimating
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isAnimating ? '⏸ Pauzeer' : currentMonth >= months ? '🔄 Herstarten' : '▶ Start'}
                </button>
                <button
                  onClick={resetSimulation}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
                >
                  ↺ Reset
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-4">
              Voortgang: Maand {currentMonth} van {months} ({((currentMonth / months) * 100).toFixed(0)}%)
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
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">Asset Allocatie</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-4">Portfolio Metrices</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-gray-600">Aantal Holdings:</span><span className="font-bold text-purple-600">{portfolio.reduce((total, etf) => total + (parseInt(etf.holdings) || 0), 0).toLocaleString('nl-NL')}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Gemiddelde TER:</span><span className="font-bold text-blue-600">{metrics.avgTER.toFixed(2)}%</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Verwacht Rendement:</span><span className="font-bold text-green-600">{(avgReturn * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Risico (Std Dev):</span><span className="font-bold text-orange-600">{(stdDev * 100).toFixed(1)}%</span></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Portfolio Holdings</h3>
            <div className="space-y-6">
              {Object.entries(
                portfolio.reduce((acc, etf) => {
                  const category = etf.categorie || 'Overig';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(etf);
                  return acc;
                }, {})
              ).map(([category, etfs]) => (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-lg text-gray-800">{category}</h4>
                      <span className="text-sm font-medium text-gray-600">
                        {etfs.reduce((sum, e) => sum + (e.weight || 0), 0).toFixed(1)}% van portfolio • {formatEuro(etfs.reduce((sum, e) => sum + (animatedPortfolioValue * (e.weight || 0) / 100), 0))}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">ETF</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Weging</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Waarde</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Return</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {etfs.map((etf, idx) => {
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
              ))}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowRebalance(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-6">Portfolio Balanceren</h2>
              <p className="text-gray-600 mb-6">
                Door te balanceren worden alle wegingen aangepast naar de oorspronkelijke verdeling van je gekozen risicoprofiel: 
                <span className="font-bold text-indigo-600"> {selectedProfile ? premadePortfolios[selectedProfile].name : 'Aangepast'}</span>
              </p>
              
              {selectedProfile ? (
                <>
                  <div className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-200">
                    <h3 className="font-bold mb-3">Doelverdeling:</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(premadePortfolios[selectedProfile].allocation).map(([cat, pct]) => (
                        <div key={cat} className="flex justify-between">
                          <span>{cat}</span>
                          <span className="font-medium">{pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h3 className="font-bold mb-3">Huidige verdeling:</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(metrics.categories).map(([cat, value]) => (
                        <div key={cat} className="flex justify-between">
                          <span>{cat}</span>
                          <span className="font-medium">{value.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => { 
                        const rebalanced = recalculateWeights(portfolio, selectedProfile);
                        setPortfolio(rebalanced);
                        alert('Portfolio succesvol gebalanceerd naar ' + premadePortfolios[selectedProfile].name + ' profiel!'); 
                        setShowRebalance(false); 
                      }} 
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
                    >
                      Balanceren naar {premadePortfolios[selectedProfile].name}
                    </button>
                    <button 
                      onClick={() => setShowRebalance(false)} 
                      className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all"
                    >
                      Annuleren
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                      Geen risicoprofiel geselecteerd. Balanceren is alleen mogelijk als je een profiel hebt gekozen tijdens het samenstellen.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowRebalance(false)} 
                    className="w-full py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                  >
                    Sluiten
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
        {showEditPortfolio && <EditPortfolioModal onClose={() => setShowEditPortfolio(false)} />}
      </div>
    );
  };

  const CustomerDatabasePage = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = customers.filter(customer => {
      const search = searchTerm.toLowerCase();
      return (
        customer.name.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search) ||
        customer.phone.toLowerCase().includes(search) ||
        customer.city.toLowerCase().includes(search)
      );
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">ETF PORTAL - Account Manager</div>
            <button onClick={() => { setUser(null); setCurrentPage('landing'); }} className="text-gray-700 hover:text-blue-600">
              Uitloggen
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Klanten Database</h1>
            <button
              onClick={() => {
                const saved = localStorage.getItem('customers');
                if (saved) {
                  setCustomers(JSON.parse(saved));
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              Ververs Data
            </button>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Zoek op naam, email, telefoon of woonplaats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <p className="text-gray-600 mb-4">
            {searchTerm ? `${filteredCustomers.length} van ${customers.length} klanten` : `Totaal aantal klanten: ${customers.length}`}
          </p>

          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Naam</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Telefoon</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Woonplaats</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Geregistreerd</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'Geen klanten gevonden' : 'Nog geen geregistreerde klanten'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{customer.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.city}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(customer.registeredAt).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCurrentPage('customerDetail');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                          Bekijk Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const CustomerDetailPage = () => {
    if (!selectedCustomer) {
      setCurrentPage('customerDatabase');
      return null;
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">ETF PORTAL - Account Manager</div>
            <div className="flex gap-4">
              <button onClick={() => setCurrentPage('customerDatabase')} className="text-gray-700 hover:text-blue-600">
                ← Terug naar Database
              </button>
              <button onClick={() => { setUser(null); setCurrentPage('landing'); }} className="text-gray-700 hover:text-blue-600">
                Uitloggen
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Klant Gegevens</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-600">Persoonlijke Informatie</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Naam:</span>
                  <div className="font-medium">{selectedCustomer.name}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <div className="font-medium">{selectedCustomer.email}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Telefoon:</span>
                  <div className="font-medium">{selectedCustomer.phone}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Adres:</span>
                  <div className="font-medium">{selectedCustomer.address}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Woonplaats:</span>
                  <div className="font-medium">{selectedCustomer.city}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Geregistreerd op:</span>
                  <div className="font-medium">
                    {new Date(selectedCustomer.registeredAt).toLocaleDateString('nl-NL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-600">Beleggingsinformatie</h2>
              <div className="space-y-3">
                {selectedCustomer.investmentDetails?.goal ? (
                  <>
                    <div>
                      <span className="text-sm text-gray-600">Doelstelling:</span>
                      <div className="font-medium">{selectedCustomer.investmentDetails.goal}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Horizon:</span>
                      <div className="font-medium">{selectedCustomer.investmentDetails.horizon} jaar</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Beleggingsbedrag:</span>
                      <div className="font-medium">€ {parseInt(selectedCustomer.investmentDetails.amount || 0).toLocaleString('nl-NL')}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Maandelijkse storting:</span>
                      <div className="font-medium">€ {parseInt(selectedCustomer.investmentDetails.monthlyContribution || 0).toLocaleString('nl-NL')}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Risicoprofiel:</span>
                      <div className="font-medium">{selectedCustomer.investmentDetails.riskProfile || 'Niet ingesteld'}</div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">Nog geen beleggingsinformatie beschikbaar</p>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio Performance */}
          {selectedCustomer.portfolioValue && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-600">Portfolio Waarde</h2>
                <div className="text-3xl font-bold text-gray-900">
                  € {selectedCustomer.portfolioValue.toLocaleString('nl-NL')}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-600">Totaal Rendement</h2>
                <div className={`text-3xl font-bold ${selectedCustomer.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedCustomer.totalReturn >= 0 ? '+' : ''}{selectedCustomer.totalReturn}%
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Portfolio</h2>
            {selectedCustomer.portfolio && selectedCustomer.portfolio.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">ETF</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Categorie</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Weging</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">TER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedCustomer.portfolio.map((etf, idx) => {
                      const fullETF = etfs.find(e => e.isin === etf.isin) || etf;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => setSelectedETF(fullETF)}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                            >
                              {etf.naam}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm">{etf.categorie}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{(etf.weight || 0).toFixed(1)}%</td>
                          <td className="px-4 py-3 text-sm text-right">{etf['ter p.a.']}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">Klant heeft nog geen portfolio samengesteld</p>
            )}
          </div>

          {/* Transaction History */}
          {selectedCustomer.transactions && selectedCustomer.transactions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-600">Transactie Geschiedenis</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">Datum</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Beschrijving</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Bedrag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedCustomer.transactions.map((transaction, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(transaction.date).toLocaleDateString('nl-NL')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            transaction.type === 'Storting' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{transaction.description}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                          + € {transaction.amount.toLocaleString('nl-NL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans">
      {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'register' && <RegisterPage />}
      {currentPage === 'mainDashboard' && <MainDashboard />}
      {currentPage === 'etfDatabase' && <ETFDatabasePage />}
      {currentPage === 'customPortfolioBuilder' && <CustomPortfolioBuilder />}
      {currentPage === 'portfolioBuilder' && <PortfolioBuilderPage />}
      {currentPage === 'portfolioOverview' && <PortfolioOverviewPage />}
      {currentPage === 'purchase' && <PurchasePage />}
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'customerDatabase' && <CustomerDatabasePage />}
      {currentPage === 'customerDetail' && <CustomerDetailPage />}
      {selectedETF && <ETFDetailModal etf={selectedETF} onClose={() => setSelectedETF(null)} />}
    </div>
  );
};

export default ETFPortal;