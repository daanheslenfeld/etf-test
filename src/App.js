import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Search, User, DollarSign, PieChart, BarChart3, Settings, X, Globe, Leaf, ArrowRight, ArrowLeft, Home, LogOut, Activity, Target, Zap, MapPin, AlertTriangle, CheckCircle, Calculator } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, AreaChart, Area } from 'recharts';

const ETFInvestmentPlatform = () => {
  // Main navigation state
  const [currentPage, setCurrentPage] = useState('homepage');
  const [user, setUser] = useState(null);
  const [showETFDetail, setShowETFDetail] = useState(null);
  
  // Logout function
  const handleLogout = () => {
    setUser(null);
    setCurrentPage('homepage');
    setOnboardingStep(1);
    setOnboardingData({
      portfolioChoice: '',
      riskProfile: '',
      horizon: '',
      investmentAmount: '',
      modelTheme: ''
    });
  };
  
  // Currency formatting
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    portfolioChoice: '',
    riskProfile: '',
    horizon: '',
    investmentAmount: '',
    modelTheme: ''
  });
  
  // ETF data and portfolio state
  const [etfs, setEtfs] = useState([]);
  const [selectedPortfolioType, setSelectedPortfolioType] = useState('model');
  const [customPortfolio, setCustomPortfolio] = useState({});
  
  // UI state
  const [filters, setFilters] = useState({
    category: 'alle',
    region: 'alle',
    provider: 'alle',
    esg: false,
    minSize: 0,
    maxTER: 2,
    search: '',
    currency: 'alle',
    dividend: false
  });

  // Risk profiles data
  const riskProfiles = {
    defensief: {
      name: 'Defensief',
      description: 'Kapitaalbehoud staat voorop, beperkt risico',
      maxLoss: '5-10%',
      timeHorizon: '1-3 jaar'
    },
    neutraal: {
      name: 'Neutraal', 
      description: 'Gebalanceerd tussen risico en rendement',
      maxLoss: '10-20%',
      timeHorizon: '3-7 jaar'
    },
    offensief: {
      name: 'Offensief',
      description: 'Hogere rendementen, meer volatiliteit accepteren',
      maxLoss: '20-30%', 
      timeHorizon: '5-10 jaar'
    },
    zeerOffensief: {
      name: 'Zeer Offensief',
      description: 'Maximaal rendement, hoge risicotolerantie',
      maxLoss: '30%+',
      timeHorizon: '10+ jaar'
    }
  };

  // Model portfolio themes
  const modelPortfolioThemes = {
    wereldwijd: {
      name: 'Wereldwijd Gespreid',
      description: 'Breed gespreide wereldwijde portfolio voor optimale diversificatie',
      icon: Globe,
      color: 'bg-slate-600',
      expectedReturn: { neutraal: 6.1, defensief: 4.2, offensief: 7.8, zeerOffensief: 9.5 },
      volatility: { neutraal: 12.3, defensief: 8.5, offensief: 16.2, zeerOffensief: 22.1 }
    },
    dividend: {
      name: 'Hoog Dividend',
      description: 'Focus op dividend betalende aandelen voor regelmatige inkomsten',
      icon: DollarSign,
      color: 'bg-slate-700',
      expectedReturn: { neutraal: 5.5, defensief: 3.8, offensief: 7.2, zeerOffensief: 8.8 },
      volatility: { neutraal: 11.5, defensief: 7.8, offensief: 15.1, zeerOffensief: 20.5 }
    },
    technologie: {
      name: 'Technologie Focus',
      description: 'Zwaartepunt op innovatieve technologie bedrijven',
      icon: Zap,
      color: 'bg-slate-800',
      expectedReturn: { neutraal: 7.8, defensief: 5.2, offensief: 10.1, zeerOffensief: 12.5 },
      volatility: { neutraal: 18.5, defensief: 12.1, offensief: 24.8, zeerOffensief: 32.1 }
    }
  };

  // ETF categories
  const etfCategories = {
    aandelen: { name: 'Aandelen', subcategories: ['Europa', 'Nederland', 'Verenigde Staten', 'Japan', 'China', 'Opkomende markten', 'Wereldwijd'] },
    obligaties: { name: 'Obligaties', subcategories: ['Euro obligaties', 'VS obligaties', 'Wereldwijde obligaties'] },
    sectoren: { name: 'Sectoren', subcategories: ['Technologie', 'Gezondheidszorg', 'Financieel', 'Energie', 'Vastgoed'] },
    grondstoffen: { name: 'Grondstoffen', subcategories: ['Goud', 'Olie', 'Landbouw', 'Edelmetalen'] },
    alle: { name: 'Alle categorieën', subcategories: [] }
  };

  // Model portfolios
  const modelPortfolios = {
    balanced: {
      name: 'Neutraal',
      description: 'Gebalanceerd risico en rendement',
      expectedReturn: 6.1,
      allocations: {
        'Vanguard FTSE Developed World UCITS ETF': 50,
        'iShares Core Euro Government Bond UCITS ETF': 25,
        'Xtrackers MSCI Emerging Markets UCITS ETF': 15,
        'Vanguard EUR Corporate Bond UCITS ETF': 10
      }
    }
  };

  // Generate ETF data
  useEffect(() => {
    const generateETFs = () => {
      const providers = ['Vanguard', 'iShares', 'SPDR', 'Xtrackers', 'Amundi'];
      const currencies = ['EUR', 'USD', 'GBP'];
      
      const realisticETFs = [
        { name: 'Vanguard FTSE Developed World UCITS ETF', category: 'aandelen', subcategory: 'Wereldwijd', provider: 'Vanguard', ter: 0.12, aum: 12500, expectedReturn: 7.2, esg: false },
        { name: 'iShares Core MSCI World UCITS ETF', category: 'aandelen', subcategory: 'Wereldwijd', provider: 'iShares', ter: 0.20, aum: 25000, expectedReturn: 7.1, esg: false },
        { name: 'Vanguard S&P 500 UCITS ETF', category: 'aandelen', subcategory: 'Verenigde Staten', provider: 'Vanguard', ter: 0.07, aum: 25000, expectedReturn: 8.2, esg: false },
        { name: 'iShares Core Euro Government Bond UCITS ETF', category: 'obligaties', subcategory: 'Euro obligaties', provider: 'iShares', ter: 0.09, aum: 8500, expectedReturn: 2.1, esg: false },
        { name: 'Vanguard EUR Corporate Bond UCITS ETF', category: 'obligaties', subcategory: 'Euro obligaties', provider: 'Vanguard', ter: 0.09, aum: 2200, expectedReturn: 2.8, esg: false },
        { name: 'Xtrackers MSCI Emerging Markets UCITS ETF', category: 'aandelen', subcategory: 'Opkomende markten', provider: 'Xtrackers', ter: 0.19, aum: 3200, expectedReturn: 8.3, esg: false },
        { name: 'iShares MSCI World ESG Screened UCITS ETF', category: 'aandelen', subcategory: 'Wereldwijd', provider: 'iShares', ter: 0.20, aum: 5500, expectedReturn: 6.8, esg: true }
      ];

      const etfData = [];
      
      realisticETFs.forEach((baseEtf, index) => {
        const etf = {
          ...baseEtf,
          id: `ETF${index.toString().padStart(3, '0')}`,
          isin: 'IE' + Math.random().toString(36).substr(2, 10).toUpperCase(),
          riskScore: Math.max(1, Math.min(6, Math.ceil((baseEtf.expectedReturn - 2) / 1.5))),
          currency: currencies[Math.floor(Math.random() * currencies.length)],
          price: (Math.random() * 300 + 25).toFixed(2),
          change1d: ((Math.random() - 0.5) * 4).toFixed(2),
          change1y: ((Math.random() - 0.5) * 40).toFixed(2),
          dividend: Math.random() > 0.7 ? (Math.random() * 4).toFixed(2) : '0.00',
          holdings: generateHoldings(),
          performance: generatePerformanceData()
        };
        etfData.push(etf);
      });

      // Generate additional ETFs
      for (let i = etfData.length; i < 100; i++) {
        const categoryKeys = Object.keys(etfCategories).filter(key => key !== 'alle');
        const category = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
        const subcategories = etfCategories[category].subcategories;
        const subcategory = subcategories[Math.floor(Math.random() * subcategories.length)];
        const provider = providers[Math.floor(Math.random() * providers.length)];
        
        const baseReturn = category === 'aandelen' ? 7 : category === 'obligaties' ? 3 : 5;
        const expectedReturn = baseReturn + (Math.random() - 0.5) * 4;
        
        etfData.push({
          id: `ETF${i.toString().padStart(3, '0')}`,
          name: `${provider} ${subcategory} UCITS ETF`,
          isin: 'IE' + Math.random().toString(36).substr(2, 10).toUpperCase(),
          category,
          subcategory,
          provider,
          ter: (Math.random() * 1.2 + 0.05).toFixed(2),
          aum: Math.floor(Math.random() * 15000 + 50),
          expectedReturn: expectedReturn.toFixed(1),
          riskScore: Math.max(1, Math.min(6, Math.ceil((expectedReturn - 2) / 1.5))),
          currency: currencies[Math.floor(Math.random() * currencies.length)],
          esg: Math.random() > 0.8,
          price: (Math.random() * 400 + 15).toFixed(2),
          change1d: ((Math.random() - 0.5) * 6).toFixed(2),
          change1y: ((Math.random() - 0.5) * 60).toFixed(2),
          dividend: Math.random() > 0.7 ? (Math.random() * 5).toFixed(2) : '0.00',
          holdings: generateHoldings(),
          performance: generatePerformanceData()
        });
      }
      
      return etfData.sort((a, b) => a.name.localeCompare(b.name));
    };

    const generateHoldings = () => {
      const companies = ['Apple Inc.', 'Microsoft Corp.', 'Amazon.com Inc.', 'Alphabet Inc.', 'Tesla Inc.', 'NVIDIA Corp.'];
      return companies.slice(0, 5).map((company, index) => ({
        name: company,
        weight: (Math.random() * 5 + 1).toFixed(2),
        sector: 'Technology'
      }));
    };

    const generatePerformanceData = () => {
      const data = [];
      let value = 100;
      for (let i = 0; i < 30; i++) {
        value += (Math.random() - 0.48) * 1.5;
        data.push({
          date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: parseFloat(value.toFixed(2))
        });
      }
      return data;
    };

    setEtfs(generateETFs());
  }, []);

  // Enhanced filtering
  const filteredETFs = useMemo(() => {
    return etfs.filter(etf => {
      if (filters.category !== 'alle' && etf.category !== filters.category) return false;
      if (filters.region !== 'alle' && etf.subcategory !== filters.region) return false;
      if (filters.provider !== 'alle' && etf.provider !== filters.provider) return false;
      if (filters.currency !== 'alle' && etf.currency !== filters.currency) return false;
      if (filters.esg && !etf.esg) return false;
      if (filters.dividend && parseFloat(etf.dividend) === 0) return false;
      if (etf.aum < filters.minSize) return false;
      if (parseFloat(etf.ter) > filters.maxTER) return false;
      if (filters.search && !etf.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [etfs, filters]);

  // Get current portfolio
  const getCurrentPortfolio = () => {
    if (selectedPortfolioType === 'model') {
      const modelData = modelPortfolios.balanced;
      const portfolio = {};
      Object.entries(modelData.allocations).forEach(([etfName, weight]) => {
        const etf = etfs.find(e => e.name === etfName);
        if (etf) {
          portfolio[etf.isin] = { etf, weight };
        }
      });
      return portfolio;
    }
    return customPortfolio;
  };

  // Calculate portfolio metrics
  const getPortfolioMetrics = () => {
    const portfolio = getCurrentPortfolio();
    const etfList = Object.values(portfolio);
    
    if (etfList.length === 0) {
      return { expectedReturn: 0, totalTER: 0, avgRiskScore: 0, esgScore: 0, totalWeight: 0 };
    }

    const totalWeight = etfList.reduce((sum, item) => sum + item.weight, 0);
    const expectedReturn = etfList.reduce((sum, item) => sum + (parseFloat(item.etf.expectedReturn) * item.weight / totalWeight), 0);
    const totalTER = etfList.reduce((sum, item) => sum + (parseFloat(item.etf.ter) * item.weight / totalWeight), 0);
    const avgRiskScore = etfList.reduce((sum, item) => sum + (item.etf.riskScore * item.weight / totalWeight), 0);
    const esgScore = etfList.reduce((sum, item) => sum + ((item.etf.esg ? 100 : 0) * item.weight / totalWeight), 0);

    return {
      expectedReturn: expectedReturn.toFixed(1),
      totalTER: totalTER.toFixed(2),
      avgRiskScore: avgRiskScore.toFixed(1),
      esgScore: esgScore.toFixed(0),
      totalWeight: totalWeight.toFixed(1)
    };
  };

  // Add ETF to portfolio
  const addETFToPortfolio = (etf) => {
    setCustomPortfolio(prev => ({
      ...prev,
      [etf.isin]: { etf, weight: 10 }
    }));
    alert(`${etf.name} toegevoegd aan portfolio`);
  };

  // ETF Detail Modal
  const ETFDetailModal = ({ etf, onClose }) => {
    if (!etf) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[70vh] overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{etf.name}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span>ISIN: {etf.isin}</span>
                  <span>{etf.provider}</span>
                  <span>TER: {etf.ter}%</span>
                  {etf.esg && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">ESG</span>}
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-3">Performance</h3>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={etf.performance}>
                      <Area type="monotone" dataKey="value" stroke="#475569" fill="#475569" fillOpacity={0.3} />
                      <Tooltip formatter={(value) => [`€${value}`, 'Koers']} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Belangrijke Gegevens</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Fondsvermogen:</span>
                    <span>€{etf.aum}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verwacht Rendement:</span>
                    <span className="text-green-600">{etf.expectedReturn}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risicoscore:</span>
                    <span>{etf.riskScore}/6</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-3">Top Holdings</h3>
              <div className="space-y-2">
                {etf.holdings.slice(0, 5).map((holding, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{holding.name}</span>
                    <span>{holding.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Sluiten
              </button>
              <button 
                onClick={() => {
                  addETFToPortfolio(etf);
                  onClose();
                }}
                className="flex-1 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                Voeg toe aan Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Onboarding Component
  const OnboardingWizard = () => {
    const handleNext = () => {
      if (onboardingStep === 5 && onboardingData.portfolioChoice === 'model') {
        setOnboardingStep(6);
      } else if ((onboardingStep === 5 && onboardingData.portfolioChoice === 'custom') || onboardingStep === 6) {
        setOnboardingStep(7);
      } else {
        setOnboardingStep(prev => prev + 1);
      }
    };

    const handleBack = () => setOnboardingStep(prev => prev - 1);

    const calculateProjections = () => {
      const amount = parseFloat(onboardingData.investmentAmount) || 10000;
      const years = parseFloat(onboardingData.horizon) || 10;
      let expectedReturn = 6.0;
      
      if (onboardingData.portfolioChoice === 'model' && onboardingData.modelTheme) {
        const theme = modelPortfolioThemes[onboardingData.modelTheme];
        if (theme?.expectedReturn[onboardingData.riskProfile]) {
          expectedReturn = theme.expectedReturn[onboardingData.riskProfile];
        }
      }

      return [
        { scenario: 'pessimistic', name: 'Pessimistisch', returnRate: expectedReturn - 2, finalValue: amount * Math.pow(1 + (expectedReturn - 2) / 100, years) },
        { scenario: 'expected', name: 'Verwacht', returnRate: expectedReturn, finalValue: amount * Math.pow(1 + expectedReturn / 100, years) },
        { scenario: 'optimistic', name: 'Optimistisch', returnRate: expectedReturn + 2, finalValue: amount * Math.pow(1 + (expectedReturn + 2) / 100, years) }
      ].map(proj => ({ ...proj, totalReturn: proj.finalValue - amount }));
    };

    const renderStep = () => {
      switch (onboardingStep) {
        case 1:
          return (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <User className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Welkom bij ETF Portal Pro, {user?.name}!</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">We gaan samen jouw ideale beleggingsportefeuille samenstellen.</p>
            </div>
          );

        case 2:
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Hoe wil je beleggen?</h2>
                <p className="text-lg text-gray-600">Kies hoe je jouw portefeuille wilt samenstellen</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <button
                  onClick={() => setOnboardingData(prev => ({ ...prev, portfolioChoice: 'model' }))}
                  className={`p-8 rounded-2xl border-2 transition-all text-left ${
                    onboardingData.portfolioChoice === 'model' ? 'border-slate-500 bg-slate-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-slate-600 p-3 rounded-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">Modelportefeuille</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Kies uit professioneel samengestelde portefeuilles.</p>
                  <div className="text-sm text-slate-600 font-medium">Aanbevolen voor beginners</div>
                </button>

                <button
                  onClick={() => setOnboardingData(prev => ({ ...prev, portfolioChoice: 'custom' }))}
                  className={`p-8 rounded-2xl border-2 transition-all text-left ${
                    onboardingData.portfolioChoice === 'custom' ? 'border-slate-500 bg-slate-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-stone-600 p-3 rounded-lg">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">Zelf samenstellen</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Stel zelf je portefeuille samen door ETFs te kiezen.</p>
                  <div className="text-sm text-stone-600 font-medium">Voor ervaren beleggers</div>
                </button>
              </div>
            </div>
          );

        case 3:
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Wat is je risicoprofiel?</h2>
                <p className="text-lg text-gray-600">Hoeveel risico kun en wil je nemen?</p>
              </div>
              
              <div className="space-y-4 max-w-4xl mx-auto">
                {Object.entries(riskProfiles).map(([key, profile]) => (
                  <button
                    key={key}
                    onClick={() => setOnboardingData(prev => ({ ...prev, riskProfile: key }))}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                      onboardingData.riskProfile === key ? 'border-slate-500 bg-slate-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{profile.name}</h3>
                        <p className="text-gray-600 mb-2">{profile.description}</p>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>Max verlies: {profile.maxLoss}</span>
                          <span>Horizon: {profile.timeHorizon}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );

        case 4:
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Wat is je beleggingshorizon?</h2>
                <p className="text-lg text-gray-600">Hoelang wil je je geld beleggen?</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {[
                  { value: '3', label: '3 jaar' },
                  { value: '5', label: '5 jaar' },
                  { value: '10', label: '10 jaar' },
                  { value: '20', label: '20+ jaar' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setOnboardingData(prev => ({ ...prev, horizon: option.value }))}
                    className={`p-6 rounded-xl border-2 transition-all text-center ${
                      onboardingData.horizon === option.value ? 'border-slate-500 bg-slate-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl font-bold text-gray-900 mb-2">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          );

        case 5:
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Hoeveel wil je beleggen?</h2>
                <p className="text-lg text-gray-600">Wat is je initiële beleggingsbedrag?</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {[
                  { value: '5000', label: formatCurrency(5000) },
                  { value: '10000', label: formatCurrency(10000) },
                  { value: '25000', label: formatCurrency(25000) },
                  { value: '50000', label: formatCurrency(50000) }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setOnboardingData(prev => ({ ...prev, investmentAmount: option.value }))}
                    className={`p-6 rounded-xl border-2 transition-all text-center ${
                      onboardingData.investmentAmount === option.value ? 'border-slate-500 bg-slate-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl font-bold text-gray-900">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          );

        case 6:
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Kies je beleggingsthema</h2>
                <p className="text-lg text-gray-600">Welk thema past het beste bij jouw voorkeuren?</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {Object.entries(modelPortfolioThemes).map(([key, theme]) => {
                  const IconComponent = theme.icon;
                  const expectedReturn = theme.expectedReturn[onboardingData.riskProfile] || 6;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setOnboardingData(prev => ({ ...prev, modelTheme: key }))}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${
                        onboardingData.modelTheme === key ? 'border-slate-500 bg-slate-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`${theme.color} p-3 rounded-lg`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold">{theme.name}</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{theme.description}</p>
                      <div className="text-xs">
                        <div className="flex justify-between">
                          <span>Verwacht rendement:</span>
                          <span className="font-semibold text-green-600">{expectedReturn}%</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );

        case 7:
          const projections = calculateProjections();
          const amount = parseFloat(onboardingData.investmentAmount) || 10000;
          const years = parseFloat(onboardingData.horizon) || 10;
          const selectedETFs = Object.entries(modelPortfolios.balanced.allocations).map(([etfName, weight]) => {
            const etf = etfs.find(e => e.name === etfName);
            return etf ? { etf, weight } : null;
          }).filter(Boolean);
          
          return (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Jouw persoonlijke beleggingsvoorstel</h2>
                <p className="text-lg text-gray-600">Op basis van jouw antwoorden hebben we het volgende voorstel voor je samengesteld</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-5xl mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Portfolio Overzicht</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-600">{formatCurrency(amount)}</div>
                    <div className="text-gray-600">Initiële inleg</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-600">{years} jaar</div>
                    <div className="text-gray-600">Beleggingshorizon</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-600">
                      {onboardingData.portfolioChoice === 'model' ? modelPortfolioThemes[onboardingData.modelTheme]?.name : 'Aangepast'}
                    </div>
                    <div className="text-gray-600">Portfolio type</div>
                  </div>
                </div>

                {selectedETFs.length > 0 && (
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 mb-4">Geselecteerde ETFs</h4>
                    <div className="space-y-3">
                      {selectedETFs.map(({ etf, weight }) => (
                        <div key={etf.isin} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{etf.name}</h5>
                            <p className="text-sm text-gray-600">{etf.provider} • TER: {etf.ter}% • {etf.subcategory}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-600">{weight}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {projections.map(projection => (
                    <div key={projection.scenario} className={`border-2 rounded-xl p-6 text-center ${
                      projection.scenario === 'expected' ? 'border-slate-500 bg-slate-50' : 'border-gray-200'
                    }`}>
                      <h4 className="font-semibold text-gray-900 mb-2">{projection.name}</h4>
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {formatCurrency(projection.finalValue)}
                      </div>
                      <div className={`text-sm ${projection.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {projection.totalReturn >= 0 ? '+' : ''}{formatCurrency(projection.totalReturn)} rendement
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {projection.returnRate.toFixed(1)}% per jaar
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">Verwachte waardeontwikkeling (alle scenario's)</h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(() => {
                        const data = [];
                        for (let year = 0; year <= years; year++) {
                          const dataPoint = { year };
                          projections.forEach(proj => {
                            const value = amount * Math.pow(1 + proj.returnRate / 100, year);
                            dataPoint[proj.scenario] = Math.round(value);
                          });
                          data.push(dataPoint);
                        }
                        return data;
                      })()}>
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                        <Line type="monotone" dataKey="pessimistic" stroke="#EF4444" strokeDasharray="5 5" name="Pessimistisch" />
                        <Line type="monotone" dataKey="expected" stroke="#475569" strokeWidth={3} name="Verwacht" />
                        <Line type="monotone" dataKey="optimistic" stroke="#10B981" strokeDasharray="5 5" name="Optimistisch" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-6">Ben je tevreden met dit voorstel? Dan kunnen we starten met beleggen!</p>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-2 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">ETF Portal Pro</h1>
                  <p className="text-xs text-gray-600">Portfolio Wizard</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Stap {onboardingStep} van 7
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="mb-12">
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 h-2 rounded-full transition-all duration-300" style={{ width: `${(onboardingStep / 7) * 100}%` }}></div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">{renderStep()}</div>

          <div className="flex justify-between items-center max-w-6xl mx-auto mt-12">
            <button
              onClick={handleBack}
              disabled={onboardingStep === 1}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Vorige
            </button>
            
            {onboardingStep === 7 ? (
              <button
                onClick={() => setCurrentPage('platform')}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 font-medium"
              >
                Start Beleggen
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={
                  (onboardingStep === 2 && !onboardingData.portfolioChoice) ||
                  (onboardingStep === 3 && !onboardingData.riskProfile) ||
                  (onboardingStep === 4 && !onboardingData.horizon) ||
                  (onboardingStep === 5 && !onboardingData.investmentAmount) ||
                  (onboardingStep === 6 && !onboardingData.modelTheme)
                }
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Volgende
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Login Page
  const LoginPage = () => {
    const [loginForm, setLoginForm] = useState({ email: '', password: '', isRegistering: false, name: '' });

    const handleLogin = () => {
      if (loginForm.isRegistering) {
        if (loginForm.name && loginForm.email && loginForm.password) {
          setUser({ name: loginForm.name, email: loginForm.email });
          setCurrentPage('onboarding');
          setOnboardingStep(1);
        } else {
          alert('Vul alle velden in');
        }
      } else {
        if (loginForm.email && loginForm.password) {
          setUser({ name: loginForm.email.split('@')[0], email: loginForm.email });
          setCurrentPage('onboarding');
          setOnboardingStep(1);
        } else {
          alert('Vul email en wachtwoord in');
        }
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-2 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ETF Portal Pro</h1>
                <p className="text-sm text-gray-600">Professioneel ETF beleggen</p>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {loginForm.isRegistering ? 'Account aanmaken' : 'Inloggen'}
            </h2>
          </div>

          <div className="space-y-4">
            {loginForm.isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                <input
                  type="text"
                  value={loginForm.name}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Je volledige naam"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="je@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="Wachtwoord"
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-2 px-4 rounded-lg font-medium hover:from-slate-700 hover:to-slate-800 transition-all duration-200"
            >
              {loginForm.isRegistering ? 'Registreren' : 'Inloggen'}
            </button>

            <div className="text-center">
              <button
                onClick={() => setLoginForm(prev => ({ ...prev, isRegistering: !prev.isRegistering }))}
                className="text-slate-600 hover:text-slate-700 text-sm"
              >
                {loginForm.isRegistering ? 'Al een account? Inloggen' : 'Geen account? Registreren'}
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setUser({ name: 'Demo Gebruiker', email: 'demo@example.com' });
                  setCurrentPage('platform');
                }}
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                Of probeer de demo
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentPage('homepage')}
                className="text-gray-500 hover:text-gray-600 text-sm"
              >
                ← Terug naar homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Homepage
  const Homepage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-2 rounded-xl">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ETF Portal Pro</h1>
                <p className="text-sm text-gray-600">Professioneel ETF beleggen</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Welkom, {user.name}</span>
                  <button
                    onClick={() => setCurrentPage('platform')}
                    className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-2 rounded-lg font-medium hover:from-slate-700 hover:to-slate-800 transition-all duration-200"
                  >
                    Naar Platform
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentPage('login')}
                    className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
                  >
                    Inloggen
                  </button>
                  <button
                    onClick={() => {
                      setUser({ name: 'Demo Gebruiker', email: 'demo@example.com' });
                      setCurrentPage('platform');
                    }}
                    className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-2 rounded-lg font-medium hover:from-slate-700 hover:to-slate-800 transition-all duration-200"
                  >
                    Start Demo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Professioneel
            <span className="block bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
              ETF Portfolio Beheer
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Bouw diversified portfolios met 100+ ETFs. Kies uit model portfolios of creëer je eigen samenstelling 
            met professionele tools en real-time marktdata.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => user ? setCurrentPage('platform') : setCurrentPage('login')}
              className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {user ? 'Naar Platform' : 'Start nu gratis'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-600">100+</div>
              <div className="text-gray-600">ETFs Beschikbaar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-600">€0</div>
              <div className="text-gray-600">Minimum Investering</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-600">3</div>
              <div className="text-gray-600">Model Portfolios</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-600">24/7</div>
              <div className="text-gray-600">Platform Beschikbaar</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // ETF Browser Component
  const ETFBrowser = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-2 rounded-xl">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ETF Browser</h1>
                <p className="text-xs text-gray-600">Ontdek {etfs.length} ETFs</p>
              </div>
            </div>
            
            <button
              onClick={() => setCurrentPage('platform')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Terug naar Platform
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
              >
                {Object.entries(etfCategories).map(([key, category]) => (
                  <option key={key} value={key}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select
                value={filters.provider}
                onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
              >
                <option value="alle">Alle providers</option>
                <option value="Vanguard">Vanguard</option>
                <option value="iShares">iShares</option>
                <option value="SPDR">SPDR</option>
                <option value="Xtrackers">Xtrackers</option>
                <option value="Amundi">Amundi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valuta</label>
              <select
                value={filters.currency}
                onChange={(e) => setFilters(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
              >
                <option value="alle">Alle valuta's</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zoeken</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Zoek ETF..."
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.esg}
                  onChange={(e) => setFilters(prev => ({ ...prev, esg: e.target.checked }))}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                  <Leaf className="h-4 w-4 text-green-600" />
                  ESG Only
                </span>
              </label>
            </div>
            <span className="text-sm text-gray-600">{filteredETFs.length} ETFs gevonden</span>
          </div>
        </div>

        {/* ETF List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">ETF Overzicht</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">ETF</th>
                  <th className="text-right p-4 font-medium text-gray-700">Koers</th>
                  <th className="text-right p-4 font-medium text-gray-700">1D</th>
                  <th className="text-right p-4 font-medium text-gray-700">1J</th>
                  <th className="text-right p-4 font-medium text-gray-700">TER</th>
                  <th className="text-center p-4 font-medium text-gray-700">ESG</th>
                  <th className="text-center p-4 font-medium text-gray-700">Actie</th>
                </tr>
              </thead>
              <tbody>
                {filteredETFs.slice(0, 20).map(etf => (
                  <tr key={etf.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <button
                          onClick={() => setShowETFDetail(etf)}
                          className="font-medium text-slate-600 hover:text-slate-800 text-left"
                        >
                          {etf.name}
                        </button>
                        <p className="text-sm text-gray-600">{etf.provider} • {etf.subcategory}</p>
                      </div>
                    </td>
                    <td className="p-4 text-right font-semibold">€{etf.price}</td>
                    <td className={`p-4 text-right font-semibold ${parseFloat(etf.change1d) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(etf.change1d) >= 0 ? '+' : ''}{etf.change1d}%
                    </td>
                    <td className={`p-4 text-right font-semibold ${parseFloat(etf.change1y) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(etf.change1y) >= 0 ? '+' : ''}{etf.change1y}%
                    </td>
                    <td className="p-4 text-right">{etf.ter}%</td>
                    <td className="p-4 text-center">
                      {etf.esg && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          <Leaf className="h-3 w-3 mr-1" />
                          ESG
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => addETFToPortfolio(etf)}
                        className="px-3 py-1 bg-slate-600 text-white text-xs rounded hover:bg-slate-700 transition-colors"
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

  // Portfolio Analysis Component
  const PortfolioAnalysis = () => {
    const currentPortfolio = getCurrentPortfolio();
    const metrics = getPortfolioMetrics();

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-2 rounded-xl">
                  <PieChart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Portfolio Analyse</h1>
                  <p className="text-xs text-gray-600">Analyseer je portfolio</p>
                </div>
              </div>
              
              <button
                onClick={() => setCurrentPage('platform')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Terug naar Platform
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {Object.keys(currentPortfolio).length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <PieChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen portfolio ingesteld</h3>
              <p className="text-gray-600 mb-4">Stel eerst je portfolio in via de onboarding</p>
              <button
                onClick={() => setCurrentPage('onboarding')}
                className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Start Onboarding
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Portfolio Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Verwacht Rendement</h3>
                  <div className="text-2xl font-bold text-green-600">{metrics.expectedReturn}%</div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Gemiddelde TER</h3>
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalTER}%</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Risicoscore</h3>
                  <div className="text-2xl font-bold text-orange-600">{metrics.avgRiskScore}/6</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">ESG Score</h3>
                  <div className="text-2xl font-bold text-emerald-600">{metrics.esgScore}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Portfolio Holdings */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Portfolio ETFs</h2>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-3">
                      {Object.values(currentPortfolio).map(({ etf, weight }) => (
                        <div key={etf.isin} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <button
                              onClick={() => setShowETFDetail(etf)}
                              className="font-medium text-slate-600 hover:text-slate-800 text-left"
                            >
                              {etf.name}
                            </button>
                            <p className="text-sm text-gray-600">{etf.provider} • TER: {etf.ter}%</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{weight}%</div>
                            <div className="text-sm text-gray-600">Allocatie</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Geographic Distribution */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Geografische Spreiding</h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {['Verenigde Staten', 'Europa', 'Japan', 'China', 'Overige'].map((region, index) => {
                        const weight = [45, 25, 15, 10, 5][index];
                        return (
                          <div key={region} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <MapPin className="h-4 w-4 text-slate-600" />
                              <span className="text-sm font-medium">{region}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-slate-600 h-2 rounded-full"
                                  style={{ width: `${(weight / 50) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold w-12 text-right">{weight}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Portfolio Simulation Component
  const PortfolioSimulation = () => {
    const [showAlert, setShowAlert] = useState(null);
    const portfolioMetrics = getPortfolioMetrics();
    const currentPortfolio = getCurrentPortfolio();
    const amount = parseFloat(onboardingData.investmentAmount) || 25000;
    const years = parseFloat(onboardingData.horizon) || 10;

    const calculateEnhancedSimulation = () => {
      const expectedReturn = parseFloat(portfolioMetrics.expectedReturn) || 6.0;
      
      const scenarios = [
        { name: 'Pessimistisch', return: expectedReturn - 3, color: '#EF4444' },
        { name: 'Verwacht', return: expectedReturn, color: '#475569' },
        { name: 'Optimistisch', return: expectedReturn + 3, color: '#10B981' }
      ];

      return scenarios.map(scenario => {
        const data = [];
        let value = amount;
        
        for (let year = 0; year <= years; year++) {
          if (year > 0) {
            const randomFactor = 1 + (Math.random() - 0.5) * 0.4;
            const yearlyReturn = (scenario.return / 100) * randomFactor;
            value = value * (1 + yearlyReturn);
          }
          
          data.push({
            year,
            value: Math.round(value)
          });
        }
        
        const finalValue = data[data.length - 1].value;
        const totalReturn = finalValue - amount;
        
        // Check for significant deviations for expected scenario
        if (scenario.name === 'Verwacht') {
          const deviation = (finalValue - (amount * Math.pow(1 + expectedReturn/100, years))) / (amount * Math.pow(1 + expectedReturn/100, years));
          if (Math.abs(deviation) > 0.25) {
            setShowAlert({
              type: deviation > 0 ? 'success' : 'warning',
              message: deviation > 0 ? 
                'Portfolio presteert beter dan verwacht!' : 
                'Portfolio presteert slechter dan verwacht. Overweeg portfolio aanpassing.',
              action: 'Bekijk Portfolio'
            });
          }
        }
        
        return { ...scenario, finalValue, totalReturn, data };
      });
    };

    const simulations = calculateEnhancedSimulation();

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-2 rounded-xl">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Portfolio Simulatie</h1>
                  <p className="text-xs text-gray-600">Projecteer je beleggingen</p>
                </div>
              </div>
              
              <button
                onClick={() => setCurrentPage('platform')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Terug naar Platform
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Alert */}
          {showAlert && (
            <div className={`mb-6 p-4 rounded-lg border-l-4 ${
              showAlert.type === 'success' ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'
            }`}>
              <div className="flex items-center">
                {showAlert.type === 'success' ? 
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" /> :
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
                }
                <p className={`text-sm font-medium ${
                  showAlert.type === 'success' ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {showAlert.message}
                </p>
                <button 
                  onClick={() => setCurrentPage('portfolio-analysis')}
                  className={`ml-auto text-sm underline ${
                    showAlert.type === 'success' ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {showAlert.action}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Portfolio Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Informatie</h2>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-3">Basis Parameters</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Startbedrag:</span>
                      <span className="font-semibold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horizon:</span>
                      <span className="font-semibold">{years} jaar</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-3">Portfolio Kenmerken</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Verwacht rendement:</span>
                      <span className="font-semibold text-green-600">{portfolioMetrics.expectedReturn}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risicoscore:</span>
                      <span className="font-semibold">{portfolioMetrics.avgRiskScore}/6</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Totale kosten:</span>
                      <span className="font-semibold">{portfolioMetrics.totalTER}%</span>
                    </div>
                  </div>
                </div>

                {/* Portfolio ETFs */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-3">Portfolio ETFs</h3>
                  <div className="space-y-2">
                    {Object.values(currentPortfolio).slice(0, 3).map(({ etf, weight }) => (
                      <div key={etf.isin} className="flex justify-between items-center">
                        <button
                          onClick={() => setShowETFDetail(etf)}
                          className="text-xs text-slate-600 hover:text-slate-800 truncate max-w-32"
                        >
                          {etf.name.split(' ').slice(0, 3).join(' ')}
                        </button>
                        <span className="text-xs font-semibold">{weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {simulations.map(sim => (
                  <div key={sim.name} className={`bg-white rounded-xl shadow-sm p-4 text-center ${
                    sim.name === 'Verwacht' ? 'ring-2 ring-slate-500' : ''
                  }`}>
                    <h3 className="font-semibold text-gray-900 mb-2">{sim.name}</h3>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {formatCurrency(sim.finalValue)}
                    </div>
                    <div className={`text-sm ${sim.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sim.totalReturn >= 0 ? '+' : ''}{formatCurrency(sim.totalReturn)} rendement
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {sim.return.toFixed(1)}% per jaar
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Growth Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gesimuleerde Portfolio Groei</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simulations[1].data}>
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                      
                      {simulations.map(sim => (
                        <Line
                          key={sim.name}
                          type="monotone"
                          data={sim.data}
                          dataKey="value"
                          stroke={sim.color}
                          strokeWidth={sim.name === 'Verwacht' ? 3 : 2}
                          strokeDasharray={sim.name !== 'Verwacht' ? "5 5" : "0"}
                          name={sim.name}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main Platform Interface
  const PlatformInterface = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-2 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ETF Portal Pro</h1>
                <p className="text-xs text-gray-600">ETF Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welkom, {user?.name}</span>
              
              <button
                onClick={() => setCurrentPage('homepage')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Split Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Portfolio Dashboard */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mijn Portfolio</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Portfolio Type</p>
                    <p className="text-lg font-bold text-gray-900">
                      {onboardingData.portfolioChoice === 'model' ? 'Model Portfolio' : 'Aangepast'}
                    </p>
                  </div>
                  <Target className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Risicoprofiel</p>
                    <p className="text-lg font-bold text-gray-900">
                      {onboardingData.riskProfile ? riskProfiles[onboardingData.riskProfile]?.name : 'Niet ingesteld'}
                    </p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-slate-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Beleggingsbedrag</p>
                    <p className="text-lg font-bold text-gray-900">
                      {onboardingData.investmentAmount ? formatCurrency(parseInt(onboardingData.investmentAmount)) : 'Niet ingesteld'}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 text-slate-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Horizon</p>
                    <p className="text-lg font-bold text-gray-900">
                      {onboardingData.horizon ? `${onboardingData.horizon} jaar` : 'Niet ingesteld'}
                    </p>
                  </div>
                  <Activity className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </div>

            {/* Portfolio ETFs */}
            <div className="bg-white rounded-xl shadow-sm mb-4">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Mijn ETFs</h3>
              </div>
              <div className="p-4">
                {Object.keys(getCurrentPortfolio()).length === 0 ? (
                  <p className="text-gray-600">Geen ETFs geselecteerd. Start de onboarding om je portfolio in te stellen.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.values(getCurrentPortfolio()).map(({ etf, weight }) => (
                      <div key={etf.isin} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <button
                          onClick={() => setShowETFDetail(etf)}
                          className="font-medium text-slate-600 hover:text-slate-800 text-left text-sm"
                        >
                          {etf.name}
                        </button>
                        <span className="text-sm font-semibold text-gray-900">{weight}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Platform Dashboard */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Tools</h2>
            
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Search className="h-6 w-6 text-slate-600" />
                  <h3 className="text-lg font-semibold text-gray-900">ETF Browser</h3>
                </div>
                <p className="text-gray-600 mb-3 text-sm">
                  Ontdek meer dan {etfs.length} ETFs uit onze uitgebreide database.
                </p>
                <button 
                  onClick={() => setCurrentPage('etf-browser')}
                  className="w-full bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                >
                  Browse ETFs
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <PieChart className="h-6 w-6 text-slate-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Portfolio Analyse</h3>
                </div>
                <p className="text-gray-600 mb-3 text-sm">
                  Analyseer je huidige portfolio allocatie en geografische spreiding.
                </p>
                <button 
                  onClick={() => setCurrentPage('portfolio-analysis')}
                  className="w-full bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                >
                  Analyseer Portfolio
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Calculator className="h-6 w-6 text-slate-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Portfolio Simulatie</h3>
                </div>
                <p className="text-gray-600 mb-3 text-sm">
                  Simuleer verschillende scenario's met realistische volatiliteit.
                </p>
                <button 
                  onClick={() => setCurrentPage('portfolio-simulation')}
                  className="w-full bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                >
                  Start Simulatie
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="font-sans relative">
      {currentPage === 'homepage' && <Homepage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'onboarding' && user && <OnboardingWizard />}
      {currentPage === 'platform' && user && <PlatformInterface />}
      {currentPage === 'etf-browser' && user && <ETFBrowser />}
      {currentPage === 'portfolio-analysis' && user && <PortfolioAnalysis />}
      {currentPage === 'portfolio-simulation' && user && <PortfolioSimulation />}
      
      {/* ETF Detail Modal */}
      {showETFDetail && (
        <ETFDetailModal 
          etf={showETFDetail} 
          onClose={() => setShowETFDetail(null)} 
        />
      )}
    </div>
  );
};

export default ETFInvestmentPlatform;