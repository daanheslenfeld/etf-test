import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import Footer from './Footer';
import Chat from './Chat';
import { generatePortfolioReport } from './utils/pdfGenerator';
import IncomeCalculator from './IncomeCalculator';
import { TradingDashboard } from './components/trading';
import { TradingProvider } from './context/TradingContext';
import { BatchTradingDashboard } from './components/batch-trading';
import BrokerSettings from './components/settings/BrokerSettings';
import LivePortfolioOverview from './components/LivePortfolioOverview';
import FinancialOverviewCards from './components/FinancialOverviewCards';
import MarketIndicesTicker from './components/MarketIndicesTicker';
import PortfolioPositionsCard from './components/PortfolioPositionsCard';
import PremadePortfolioCard from './components/PremadePortfolioCard';
import { enrichWithTradability, isTradable, validatePortfolioTradability, getTradableCount, TRADABLE_ETFS } from './data/tradableETFs';
import BulkBuyFlow from './components/portfolio/BulkBuyFlow';
import { ModelPortfoliosPage } from './components/portfolio';
import TotaleWaardeDetail from './components/portfolio/TotaleWaardeDetail';
import BelegdVermogenDetail from './components/portfolio/BelegdVermogenDetail';
import BeschikbaarDetail from './components/portfolio/BeschikbaarDetail';
import RendementDetail from './components/portfolio/RendementDetail';
import { CommunityPage } from './components/community';
import { AdminCashAllocation } from './components/admin/AdminCashAllocation';
import { TRADABLE_PORTFOLIO_DEFINITIONS, getPortfolioDefinition } from './data/tradablePortfolioDefinitions';

// Helper: Get categories that have tradable ETFs
const getTradableCategories = (etfList) => {
  const tradableETFs = etfList.filter(etf => etf.isTradableViaLynx);
  return [...new Set(tradableETFs.map(etf => etf.categorie))];
};

// Helper: Check if a portfolio profile can be fully traded via LYNX
const isProfileFullyTradable = (allocation, tradableCategories) => {
  if (!allocation || Object.keys(allocation).length === 0) return true; // Free portfolio
  return Object.keys(allocation).every(cat => tradableCategories.includes(cat));
};

// API URL - works with Vercel Dev and production
const API_URL = '/api';

// Trading API URL - FastAPI service for LYNX/IB trading
const TRADING_API_URL = 'http://localhost:8002';

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

// Translations
const translations = {
  nl: {
    nav: {
      home: 'Home',
      features: 'Voordelen',
      howItWorks: 'Hoe het werkt',
      pricing: 'Prijzen',
      login: 'Login',
      startNow: 'Start nu'
    },
    tagline: 'Your digital Piggy Bank for global Investing',
    hero: {
      title: 'Beheer nu je eigen vermogen',
      subtitle: 'Beleg nu in een paar klikken in de hele wereld. Heel simpel en overzichtelijk. Met eventueel onze ondersteuning wanneer je vragen hebt.',
      cta: 'Begin met beleggen →'
    },
    features: {
      title: 'Waarom PIGG?',
      lowCost: { title: 'Lage kosten', desc: 'Geen verborgen kosten of hoge fees' },
      global: { title: 'Wereldwijd beleggen', desc: 'Toegang tot internationale ETFs' },
      simple: { title: 'Simpel', desc: 'Beleggen in een paar klikken' },
      support: { title: 'Ondersteuning', desc: 'Persoonlijke begeleiding wanneer nodig' }
    },
    howItWorks: {
      title: 'Hoe werkt het?',
      step1: { title: 'Account aanmaken', desc: 'Registreer gratis in 2 minuten' },
      step2: { title: 'Portfolio samenstellen', desc: 'Kies zelf je ETFs of gebruik vooraf samengestelde portfolio' },
      step3: { title: 'Beginnen met beleggen', desc: 'Start met beleggen vanaf €50' }
    },
    pricing: {
      title: 'Kies je account type',
      free: {
        title: 'Gratis Account',
        price: '€0',
        period: '/altijd',
        features: ['Simuleer beleggingen', 'Maak modelportefeuilles', 'Gebruik alle tools'],
        cta: 'Start Gratis'
      },
      paid: {
        title: 'Belegger Account',
        price: '€250',
        period: '/jaar',
        badge: 'POPULAIR',
        features: ['Alles van Gratis Account', 'Investeer echt geld', 'Geld storten en opnemen', 'Portfolio tracking'],
        cta: 'Upgrade Naar Belegger'
      }
    },
    etfPreview: {
      title: 'Ontdek onze ETF Database',
      subtitle: 'Krijg toegang tot honderden ETF\'s met realtime prijzen en gedetailleerde informatie',
      name: 'Naam',
      isin: 'ISIN',
      category: 'Categorie',
      ter: 'TER',
      ytd: 'YTD',
      cta: 'Bekijk volledige database →'
    },
    etfDetail: {
      title: 'Gedetailleerde ETF Informatie',
      subtitle: 'Elke ETF bevat uitgebreide details om je te helpen de juiste keuze te maken',
      basicInfo: 'Basis Info',
      details: 'Details',
      fundSize: 'Fund Size',
      vol1y: 'Vol 1Y',
      holdings: 'Holdings',
      distribution: 'Uitkering',
      topHoldings: 'Top 10 Posities',
      holding: 'Holding',
      weight: 'Gewicht',
      historicalReturns: 'Historisch Rendement',
      cta: 'Ontdek meer ETF\'s →'
    },
    cta: {
      title: 'Klaar om te beginnen?',
      subtitle: 'Maak vandaag nog een gratis account aan en ontdek de mogelijkheden',
      button: 'Begin met beleggen →'
    },
    common: {
      welcome: 'Welkom',
      welcomeBack: 'Welkom terug',
      logout: 'Uitloggen',
      save: 'Opslaan',
      cancel: 'Annuleren',
      password: 'Wachtwoord',
      email: 'E-mail',
      name: 'Naam',
      amount: 'Bedrag',
      loading: 'laden...',
      dashboard: 'Dashboard',
      portfolio: 'Portfolio',
      addToPortfolio: '+ Toevoegen aan Portfolio',
      searchPlaceholder: 'Zoek op naam of ISIN...',
      etfDataLoading: 'ETF data laden...',
      dashboardLoading: 'Dashboard laden...'
    },
    portfolio: {
      title: 'Portfolio',
      overview: 'Portfolio Overzicht',
      edit: 'Portfolio Aanpassen',
      build: 'Portfolio Samenstellen',
      balance: 'Portfolio Balanceren',
      purchase: 'Portfolio Aankopen',
      value: 'Portfolio Waarde',
      metrics: 'Portfolio Metrices',
      holdings: 'Portfolio Holdings',
      addToPortfolio: 'Toevoegen aan Portfolio',
      customBuild: 'Zelf Samenstellen',
      customBuildDesc: 'Bouw je eigen portfolio stap voor stap',
      premade: 'Kant-en-klaar',
      premadeDesc: 'Kies uit onze kant-en-klare portfolio\'s',
      yourCurrent: 'Je Huidige Portfolio',
      viewPortfolio: 'Bekijk Portfolio',
      etfsInPortfolio: 'ETF\'s in je portfolio',
      monthlyDeposit: 'Maandelijkse Storting',
      saveChanges: 'Wijzigingen Opslaan',
      emptyPortfolio: 'Je portfolio is leeg. Voeg ETF\'s toe vanaf de ETF Database pagina.'
    },
    auth: {
      login: 'Login',
      register: 'Registreren',
      password: 'Wachtwoord',
      confirmPassword: 'Bevestig Wachtwoord',
      repeatPassword: 'Herhaal Wachtwoord',
      forgotPassword: 'Wachtwoord vergeten?',
      resetPassword: 'Wachtwoord Resetten',
      newPassword: 'Nieuw Wachtwoord',
      confirmEmail: 'Bevestig je Email',
      firstName: 'Voornaam',
      lastName: 'Achternaam',
      street: 'Straatnaam',
      incorrectCredentials: 'Onjuiste email of wachtwoord',
      passwordMismatch: 'Wachtwoorden komen niet overeen',
      passwordMinLength: 'Wachtwoord moet minimaal 6 karakters zijn',
      emailFound: 'Email gevonden! Voer een nieuw wachtwoord in.',
      passwordChanged: 'Wachtwoord succesvol gewijzigd! Je wordt doorgestuurd naar de login pagina...',
      enterEmailReset: 'Voer je email adres in om je wachtwoord te resetten.'
    }
  },
  en: {
    nav: {
      home: 'Home',
      features: 'Features',
      howItWorks: 'How it works',
      pricing: 'Pricing',
      login: 'Login',
      startNow: 'Start now'
    },
    tagline: 'Your digital Piggy Bank for global Investing',
    hero: {
      title: 'Manage your own wealth now',
      subtitle: 'Invest globally in just a few clicks. Simple and clear. With our support when you have questions.',
      cta: 'Start investing →'
    },
    features: {
      title: 'Why PIGG?',
      lowCost: { title: 'Low costs', desc: 'No hidden fees or high costs' },
      global: { title: 'Global investing', desc: 'Access to international ETFs' },
      simple: { title: 'Simple', desc: 'Invest in a few clicks' },
      support: { title: 'Support', desc: 'Personal guidance when needed' }
    },
    howItWorks: {
      title: 'How does it work?',
      step1: { title: 'Create account', desc: 'Register for free in 2 minutes' },
      step2: { title: 'Build portfolio', desc: 'Choose your own ETFs or use pre-made portfolios' },
      step3: { title: 'Start investing', desc: 'Start investing from €50' }
    },
    pricing: {
      title: 'Choose your account type',
      free: {
        title: 'Free Account',
        price: '€0',
        period: '/forever',
        features: ['Simulate investments', 'Create model portfolios', 'Use all tools'],
        cta: 'Start Free'
      },
      paid: {
        title: 'Investor Account',
        price: '€250',
        period: '/year',
        badge: 'POPULAR',
        features: ['Everything from Free Account', 'Invest real money', 'Deposit and withdraw funds', 'Portfolio tracking'],
        cta: 'Upgrade to Investor'
      }
    },
    etfPreview: {
      title: 'Discover our ETF Database',
      subtitle: 'Get access to hundreds of ETFs with real-time prices and detailed information',
      name: 'Name',
      isin: 'ISIN',
      category: 'Category',
      ter: 'TER',
      ytd: 'YTD',
      cta: 'View full database →'
    },
    etfDetail: {
      title: 'Detailed ETF Information',
      subtitle: 'Each ETF contains extensive details to help you make the right choice',
      basicInfo: 'Basic Info',
      details: 'Details',
      fundSize: 'Fund Size',
      vol1y: 'Vol 1Y',
      holdings: 'Holdings',
      distribution: 'Distribution',
      topHoldings: 'Top 10 Holdings',
      holding: 'Holding',
      weight: 'Weight',
      historicalReturns: 'Historical Returns',
      cta: 'Discover more ETFs →'
    },
    cta: {
      title: 'Ready to get started?',
      subtitle: 'Create a free account today and discover the possibilities',
      button: 'Start investing →'
    },
    common: {
      welcome: 'Welcome',
      welcomeBack: 'Welcome back',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      password: 'Password',
      email: 'Email',
      name: 'Name',
      amount: 'Amount',
      loading: 'loading...',
      dashboard: 'Dashboard',
      portfolio: 'Portfolio',
      addToPortfolio: '+ Add to Portfolio',
      searchPlaceholder: 'Search by name or ISIN...',
      etfDataLoading: 'Loading ETF data...',
      dashboardLoading: 'Loading dashboard...'
    },
    portfolio: {
      title: 'Portfolio',
      overview: 'Portfolio Overview',
      edit: 'Edit Portfolio',
      build: 'Build Portfolio',
      balance: 'Rebalance Portfolio',
      purchase: 'Purchase Portfolio',
      value: 'Portfolio Value',
      metrics: 'Portfolio Metrics',
      holdings: 'Portfolio Holdings',
      addToPortfolio: 'Add to Portfolio',
      customBuild: 'Build Your Own',
      customBuildDesc: 'Build your own portfolio step by step',
      premade: 'Ready-made',
      premadeDesc: 'Choose from our ready-made portfolios',
      yourCurrent: 'Your Current Portfolio',
      viewPortfolio: 'View Portfolio',
      etfsInPortfolio: 'ETFs in your portfolio',
      monthlyDeposit: 'Monthly Deposit',
      saveChanges: 'Save Changes',
      emptyPortfolio: 'Your portfolio is empty. Add ETFs from the ETF Database page.'
    },
    auth: {
      login: 'Login',
      register: 'Register',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      repeatPassword: 'Repeat Password',
      forgotPassword: 'Forgot password?',
      resetPassword: 'Reset Password',
      newPassword: 'New Password',
      confirmEmail: 'Confirm your Email',
      firstName: 'First Name',
      lastName: 'Last Name',
      street: 'Street',
      incorrectCredentials: 'Incorrect email or password',
      passwordMismatch: 'Passwords do not match',
      passwordMinLength: 'Password must be at least 6 characters',
      emailFound: 'Email found! Enter a new password.',
      passwordChanged: 'Password successfully changed! You will be redirected to the login page...',
      enterEmailReset: 'Enter your email address to reset your password.'
    }
  },
  de: {
    nav: {
      home: 'Startseite',
      features: 'Vorteile',
      howItWorks: 'Wie es funktioniert',
      pricing: 'Preise',
      login: 'Anmelden',
      startNow: 'Jetzt starten'
    },
    tagline: 'Ihr digitales Sparschwein für globales Investieren',
    hero: {
      title: 'Verwalten Sie jetzt Ihr eigenes Vermögen',
      subtitle: 'Investieren Sie weltweit mit nur wenigen Klicks. Einfach und übersichtlich. Mit unserer Unterstützung bei Fragen.',
      cta: 'Mit Investieren beginnen →'
    },
    features: {
      title: 'Warum PIGG?',
      lowCost: { title: 'Niedrige Kosten', desc: 'Keine versteckten Gebühren oder hohe Kosten' },
      global: { title: 'Global investieren', desc: 'Zugang zu internationalen ETFs' },
      simple: { title: 'Einfach', desc: 'In wenigen Klicks investieren' },
      support: { title: 'Unterstützung', desc: 'Persönliche Begleitung bei Bedarf' }
    },
    howItWorks: {
      title: 'Wie funktioniert es?',
      step1: { title: 'Konto erstellen', desc: 'Kostenlos in 2 Minuten registrieren' },
      step2: { title: 'Portfolio zusammenstellen', desc: 'Wählen Sie Ihre eigenen ETFs oder nutzen Sie vorgefertigte Portfolios' },
      step3: { title: 'Mit Investieren beginnen', desc: 'Investieren Sie ab €50' }
    },
    pricing: {
      title: 'Wählen Sie Ihren Kontotyp',
      free: {
        title: 'Kostenloses Konto',
        price: '€0',
        period: '/für immer',
        features: ['Investitionen simulieren', 'Modellportfolios erstellen', 'Alle Tools nutzen'],
        cta: 'Kostenlos starten'
      },
      paid: {
        title: 'Anleger-Konto',
        price: '€250',
        period: '/Jahr',
        badge: 'BELIEBT',
        features: ['Alles vom kostenlosen Konto', 'Echtes Geld investieren', 'Geld einzahlen und abheben', 'Portfolio-Tracking'],
        cta: 'Auf Anleger upgraden'
      }
    },
    etfPreview: {
      title: 'Entdecken Sie unsere ETF-Datenbank',
      subtitle: 'Erhalten Sie Zugang zu Hunderten von ETFs mit Echtzeitpreisen und detaillierten Informationen',
      name: 'Name',
      isin: 'ISIN',
      category: 'Kategorie',
      ter: 'TER',
      ytd: 'YTD',
      cta: 'Vollständige Datenbank anzeigen →'
    },
    etfDetail: {
      title: 'Detaillierte ETF-Informationen',
      subtitle: 'Jeder ETF enthält umfangreiche Details, um Ihnen bei der richtigen Wahl zu helfen',
      basicInfo: 'Grundlegende Informationen',
      details: 'Details',
      fundSize: 'Fondsgröße',
      vol1y: 'Vol 1J',
      holdings: 'Positionen',
      distribution: 'Ausschüttung',
      topHoldings: 'Top 10 Positionen',
      holding: 'Position',
      weight: 'Gewichtung',
      historicalReturns: 'Historische Renditen',
      cta: 'Mehr ETFs entdecken →'
    },
    cta: {
      title: 'Bereit anzufangen?',
      subtitle: 'Erstellen Sie noch heute ein kostenloses Konto und entdecken Sie die Möglichkeiten',
      button: 'Mit Investieren beginnen →'
    },
    common: {
      welcome: 'Willkommen',
      welcomeBack: 'Willkommen zurück',
      logout: 'Abmelden',
      save: 'Speichern',
      cancel: 'Abbrechen',
      password: 'Passwort',
      email: 'E-Mail',
      name: 'Name',
      amount: 'Betrag',
      loading: 'lädt...',
      dashboard: 'Dashboard',
      portfolio: 'Portfolio',
      addToPortfolio: '+ Zum Portfolio hinzufügen',
      searchPlaceholder: 'Nach Name oder ISIN suchen...',
      etfDataLoading: 'ETF-Daten werden geladen...',
      dashboardLoading: 'Dashboard wird geladen...'
    },
    portfolio: {
      title: 'Portfolio',
      overview: 'Portfolio-Übersicht',
      edit: 'Portfolio bearbeiten',
      build: 'Portfolio erstellen',
      balance: 'Portfolio ausgleichen',
      purchase: 'Portfolio kaufen',
      value: 'Portfolio-Wert',
      metrics: 'Portfolio-Metriken',
      holdings: 'Portfolio-Bestände',
      addToPortfolio: 'Zum Portfolio hinzufügen',
      customBuild: 'Selbst erstellen',
      customBuildDesc: 'Erstellen Sie Ihr eigenes Portfolio Schritt für Schritt',
      premade: 'Fertig',
      premadeDesc: 'Wählen Sie aus unseren fertigen Portfolios',
      yourCurrent: 'Ihr aktuelles Portfolio',
      viewPortfolio: 'Portfolio anzeigen',
      etfsInPortfolio: 'ETFs in Ihrem Portfolio',
      monthlyDeposit: 'Monatliche Einzahlung',
      saveChanges: 'Änderungen speichern',
      emptyPortfolio: 'Ihr Portfolio ist leer. Fügen Sie ETFs von der ETF-Datenbankseite hinzu.'
    },
    auth: {
      login: 'Anmelden',
      register: 'Registrieren',
      password: 'Passwort',
      confirmPassword: 'Passwort bestätigen',
      repeatPassword: 'Passwort wiederholen',
      forgotPassword: 'Passwort vergessen?',
      resetPassword: 'Passwort zurücksetzen',
      newPassword: 'Neues Passwort',
      confirmEmail: 'Bestätigen Sie Ihre E-Mail',
      firstName: 'Vorname',
      lastName: 'Nachname',
      street: 'Straße',
      incorrectCredentials: 'Falsche E-Mail oder Passwort',
      passwordMismatch: 'Passwörter stimmen nicht überein',
      passwordMinLength: 'Passwort muss mindestens 6 Zeichen lang sein',
      emailFound: 'E-Mail gefunden! Geben Sie ein neues Passwort ein.',
      passwordChanged: 'Passwort erfolgreich geändert! Sie werden zur Anmeldeseite weitergeleitet...',
      enterEmailReset: 'Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen.'
    }
  },
  fr: {
    nav: {
      home: 'Accueil',
      features: 'Avantages',
      howItWorks: 'Comment ça marche',
      pricing: 'Tarifs',
      login: 'Connexion',
      startNow: 'Commencer maintenant'
    },
    tagline: 'Votre tirelire numérique pour investir globalement',
    hero: {
      title: 'Gérez maintenant votre propre patrimoine',
      subtitle: 'Investissez dans le monde entier en quelques clics. Simple et clair. Avec notre soutien quand vous avez des questions.',
      cta: 'Commencer à investir →'
    },
    features: {
      title: 'Pourquoi PIGG?',
      lowCost: { title: 'Coûts faibles', desc: 'Pas de frais cachés ou de coûts élevés' },
      global: { title: 'Investissement mondial', desc: 'Accès aux ETF internationaux' },
      simple: { title: 'Simple', desc: 'Investir en quelques clics' },
      support: { title: 'Support', desc: 'Accompagnement personnalisé si nécessaire' }
    },
    howItWorks: {
      title: 'Comment ça marche?',
      step1: { title: 'Créer un compte', desc: 'Inscrivez-vous gratuitement en 2 minutes' },
      step2: { title: 'Construire un portefeuille', desc: 'Choisissez vos propres ETF ou utilisez des portefeuilles prédéfinis' },
      step3: { title: 'Commencer à investir', desc: 'Investissez à partir de €50' }
    },
    pricing: {
      title: 'Choisissez votre type de compte',
      free: {
        title: 'Compte Gratuit',
        price: '€0',
        period: '/toujours',
        features: ['Simuler des investissements', 'Créer des portefeuilles modèles', 'Utiliser tous les outils'],
        cta: 'Commencer Gratuitement'
      },
      paid: {
        title: 'Compte Investisseur',
        price: '€250',
        period: '/an',
        badge: 'POPULAIRE',
        features: ['Tout du Compte Gratuit', 'Investir de l\'argent réel', 'Déposer et retirer des fonds', 'Suivi du portefeuille'],
        cta: 'Passer à Investisseur'
      }
    },
    etfPreview: {
      title: 'Découvrez notre base de données ETF',
      subtitle: 'Accédez à des centaines d\'ETF avec des prix en temps réel et des informations détaillées',
      name: 'Nom',
      isin: 'ISIN',
      category: 'Catégorie',
      ter: 'TER',
      ytd: 'YTD',
      cta: 'Voir la base de données complète →'
    },
    etfDetail: {
      title: 'Informations détaillées sur les ETF',
      subtitle: 'Chaque ETF contient des détails complets pour vous aider à faire le bon choix',
      basicInfo: 'Informations de base',
      details: 'Détails',
      fundSize: 'Taille du fonds',
      vol1y: 'Vol 1A',
      holdings: 'Positions',
      distribution: 'Distribution',
      topHoldings: 'Top 10 Positions',
      holding: 'Position',
      weight: 'Poids',
      historicalReturns: 'Rendements historiques',
      cta: 'Découvrir plus d\'ETF →'
    },
    cta: {
      title: 'Prêt à commencer?',
      subtitle: 'Créez un compte gratuit aujourd\'hui et découvrez les possibilités',
      button: 'Commencer à investir →'
    },
    common: {
      welcome: 'Bienvenue',
      welcomeBack: 'Bienvenue de retour',
      logout: 'Déconnexion',
      save: 'Enregistrer',
      cancel: 'Annuler',
      password: 'Mot de passe',
      email: 'Email',
      name: 'Nom',
      amount: 'Montant',
      loading: 'chargement...',
      dashboard: 'Tableau de bord',
      portfolio: 'Portefeuille',
      addToPortfolio: '+ Ajouter au portefeuille',
      searchPlaceholder: 'Rechercher par nom ou ISIN...',
      etfDataLoading: 'Chargement des données ETF...',
      dashboardLoading: 'Chargement du tableau de bord...'
    },
    portfolio: {
      title: 'Portefeuille',
      overview: 'Aperçu du portefeuille',
      edit: 'Modifier le portefeuille',
      build: 'Construire un portefeuille',
      balance: 'Rééquilibrer le portefeuille',
      purchase: 'Acheter le portefeuille',
      value: 'Valeur du portefeuille',
      metrics: 'Métriques du portefeuille',
      holdings: 'Avoirs du portefeuille',
      addToPortfolio: 'Ajouter au portefeuille',
      customBuild: 'Créer le vôtre',
      customBuildDesc: 'Construisez votre propre portefeuille étape par étape',
      premade: 'Prêt à l\'emploi',
      premadeDesc: 'Choisissez parmi nos portefeuilles prêts à l\'emploi',
      yourCurrent: 'Votre portefeuille actuel',
      viewPortfolio: 'Voir le portefeuille',
      etfsInPortfolio: 'ETF dans votre portefeuille',
      monthlyDeposit: 'Dépôt mensuel',
      saveChanges: 'Enregistrer les modifications',
      emptyPortfolio: 'Votre portefeuille est vide. Ajoutez des ETF depuis la page de base de données ETF.'
    },
    auth: {
      login: 'Connexion',
      register: 'S\'inscrire',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      repeatPassword: 'Répéter le mot de passe',
      forgotPassword: 'Mot de passe oublié?',
      resetPassword: 'Réinitialiser le mot de passe',
      newPassword: 'Nouveau mot de passe',
      confirmEmail: 'Confirmez votre email',
      firstName: 'Prénom',
      lastName: 'Nom de famille',
      street: 'Rue',
      incorrectCredentials: 'Email ou mot de passe incorrect',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
      passwordMinLength: 'Le mot de passe doit contenir au moins 6 caractères',
      emailFound: 'Email trouvé! Entrez un nouveau mot de passe.',
      passwordChanged: 'Mot de passe modifié avec succès! Vous allez être redirigé vers la page de connexion...',
      enterEmailReset: 'Entrez votre adresse email pour réinitialiser votre mot de passe.'
    }
  },
  es: {
    nav: {
      home: 'Inicio',
      features: 'Ventajas',
      howItWorks: 'Cómo funciona',
      pricing: 'Precios',
      login: 'Iniciar sesión',
      startNow: 'Empezar ahora'
    },
    tagline: 'Tu hucha digital para invertir globalmente',
    hero: {
      title: 'Gestiona ahora tu propio patrimonio',
      subtitle: 'Invierte en todo el mundo con solo unos clics. Simple y claro. Con nuestro apoyo cuando tengas preguntas.',
      cta: 'Empezar a invertir →'
    },
    features: {
      title: '¿Por qué PIGG?',
      lowCost: { title: 'Costos bajos', desc: 'Sin tarifas ocultas o costos altos' },
      global: { title: 'Inversión global', desc: 'Acceso a ETFs internacionales' },
      simple: { title: 'Simple', desc: 'Invertir en pocos clics' },
      support: { title: 'Soporte', desc: 'Orientación personalizada cuando sea necesario' }
    },
    howItWorks: {
      title: '¿Cómo funciona?',
      step1: { title: 'Crear cuenta', desc: 'Regístrate gratis en 2 minutos' },
      step2: { title: 'Construir cartera', desc: 'Elige tus propios ETFs o usa carteras prediseñadas' },
      step3: { title: 'Empezar a invertir', desc: 'Comienza a invertir desde €50' }
    },
    pricing: {
      title: 'Elige tu tipo de cuenta',
      free: {
        title: 'Cuenta Gratuita',
        price: '€0',
        period: '/siempre',
        features: ['Simular inversiones', 'Crear carteras modelo', 'Usar todas las herramientas'],
        cta: 'Empezar Gratis'
      },
      paid: {
        title: 'Cuenta Inversor',
        price: '€250',
        period: '/año',
        badge: 'POPULAR',
        features: ['Todo de Cuenta Gratuita', 'Invertir dinero real', 'Depositar y retirar fondos', 'Seguimiento de cartera'],
        cta: 'Actualizar a Inversor'
      }
    },
    etfPreview: {
      title: 'Descubre nuestra base de datos de ETF',
      subtitle: 'Accede a cientos de ETFs con precios en tiempo real e información detallada',
      name: 'Nombre',
      isin: 'ISIN',
      category: 'Categoría',
      ter: 'TER',
      ytd: 'YTD',
      cta: 'Ver base de datos completa →'
    },
    etfDetail: {
      title: 'Información detallada de ETF',
      subtitle: 'Cada ETF contiene detalles extensos para ayudarte a tomar la decisión correcta',
      basicInfo: 'Información básica',
      details: 'Detalles',
      fundSize: 'Tamaño del fondo',
      vol1y: 'Vol 1A',
      holdings: 'Posiciones',
      distribution: 'Distribución',
      topHoldings: 'Top 10 Posiciones',
      holding: 'Posición',
      weight: 'Peso',
      historicalReturns: 'Rendimientos históricos',
      cta: 'Descubrir más ETFs →'
    },
    cta: {
      title: '¿Listo para empezar?',
      subtitle: 'Crea una cuenta gratuita hoy y descubre las posibilidades',
      button: 'Empezar a invertir →'
    },
    common: {
      welcome: 'Bienvenido',
      welcomeBack: 'Bienvenido de nuevo',
      logout: 'Cerrar sesión',
      save: 'Guardar',
      cancel: 'Cancelar',
      password: 'Contraseña',
      email: 'Email',
      name: 'Nombre',
      amount: 'Cantidad',
      loading: 'cargando...',
      dashboard: 'Panel',
      portfolio: 'Cartera',
      addToPortfolio: '+ Agregar a la cartera',
      searchPlaceholder: 'Buscar por nombre o ISIN...',
      etfDataLoading: 'Cargando datos de ETF...',
      dashboardLoading: 'Cargando panel...'
    },
    portfolio: {
      title: 'Cartera',
      overview: 'Resumen de la cartera',
      edit: 'Editar cartera',
      build: 'Construir cartera',
      balance: 'Reequilibrar cartera',
      purchase: 'Comprar cartera',
      value: 'Valor de la cartera',
      metrics: 'Métricas de la cartera',
      holdings: 'Tenencias de la cartera',
      addToPortfolio: 'Agregar a la cartera',
      customBuild: 'Crear la tuya',
      customBuildDesc: 'Construye tu propia cartera paso a paso',
      premade: 'Prediseñada',
      premadeDesc: 'Elige entre nuestras carteras prediseñadas',
      yourCurrent: 'Tu cartera actual',
      viewPortfolio: 'Ver cartera',
      etfsInPortfolio: 'ETFs en tu cartera',
      monthlyDeposit: 'Depósito mensual',
      saveChanges: 'Guardar cambios',
      emptyPortfolio: 'Tu cartera está vacía. Agrega ETFs desde la página de base de datos de ETF.'
    },
    auth: {
      login: 'Iniciar sesión',
      register: 'Registrarse',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      repeatPassword: 'Repetir contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      resetPassword: 'Restablecer contraseña',
      newPassword: 'Nueva contraseña',
      confirmEmail: 'Confirma tu email',
      firstName: 'Nombre',
      lastName: 'Apellido',
      street: 'Calle',
      incorrectCredentials: 'Email o contraseña incorrectos',
      passwordMismatch: 'Las contraseñas no coinciden',
      passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
      emailFound: '¡Email encontrado! Ingresa una nueva contraseña.',
      passwordChanged: '¡Contraseña cambiada con éxito! Serás redirigido a la página de inicio de sesión...',
      enterEmailReset: 'Ingresa tu dirección de email para restablecer tu contraseña.'
    }
  }
};

const ETFPortal = () => {
  // Check for token BEFORE any state initialization
  const urlParams = new URLSearchParams(window.location.search);
  const hasToken = !!(urlParams.get('token') || urlParams.get('Token'));

  // Routes that should NEVER be auto-restored from localStorage
  // These are wizard flows that users can get stuck in
  const BLOCKED_RESTORE_ROUTES = [
    'incomeCalculator',
    'portfolioBuilder',
    'customPortfolioBuilder',
    'purchase',
    'firstTimeWelcome',
    'postRegisterWelcome',
    'verify-code',
    'verify-email',
    'emailVerificationPending',
    'resetPassword',
  ];

  // Routes that are safe to restore (explicit allowlist)
  const ALLOWED_RESTORE_ROUTES = [
    'mainDashboard',
    'welcome',
    'dashboard',
    'portfolioOverview',
    'financialNews',
    'customerDatabase',
    'customerDetail',
    'trading',
    'community',
    'totaleWaardeDetail',
    'belegdVermogenDetail',
    'beschikbaarDetail',
    'rendementDetail',
  ];

  // Initialize state from localStorage or URL
  const [currentPage, setCurrentPage] = useState(() => {
    if (hasToken) {
      console.log('Token detected in URL, going to verify-email');
      localStorage.removeItem('currentPage');
      return 'verify-email';
    }

    // Check URL path for direct navigation (e.g., /login)
    const path = window.location.pathname;
    if (path === '/login') {
      return 'login';
    }
    if (path === '/register') {
      return 'register';
    }

    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    const saved = localStorage.getItem('currentPage');

    console.log('Initializing app - path:', path, 'saved page:', saved, 'has user:', !!savedUser);

    // Block wizard routes from being restored - redirect to safe default
    if (saved && BLOCKED_RESTORE_ROUTES.includes(saved)) {
      console.log('Blocked wizard route restore:', saved, '-> redirecting to safe default');
      localStorage.removeItem('currentPage');
      return savedUser ? 'welcome' : 'landing';
    }

    // Only restore if route is in allowlist
    if (saved && !ALLOWED_RESTORE_ROUTES.includes(saved)) {
      console.log('Unknown route not in allowlist:', saved, '-> redirecting to safe default');
      localStorage.removeItem('currentPage');
      return savedUser ? 'welcome' : 'landing';
    }

    // If user is logged in and no saved page, go to welcome instead of landing
    if (savedUser && !saved) {
      return 'welcome';
    }

    return saved || 'landing';
  });

  const [user, setUser] = useState(() => {
    // Use localStorage for persistent login (stays logged in after closing app)
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);

  const [isChatOpen, setIsChatOpen] = useState(false);

  const [customerPortalTab, setCustomerPortalTab] = useState('customers');
  const [chatInquiries, setChatInquiries] = useState([]);

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : [
    {
      id: 0,
      name: 'Demo Investor',
      firstName: 'Demo',
      email: 'demo@pigg.nl',
      password: 'demo123',
      address: 'Damrak 1',
      street: 'Damrak',
      houseNumber: '1',
      postalCode: '1012 LG',
      city: 'Amsterdam',
      phone: '+31 20 123 4567',
      birthDate: '1990-01-01',
      registeredAt: '2024-01-01T10:00:00.000Z',
      account_type: 'betaald',
      investmentDetails: {
        goal: 'Vermogensopbouw',
        horizon: '15',
        amount: '75000',
        monthlyContribution: '750',
        riskProfile: 'Offensief'
      },
      portfolio: [
        { naam: 'iShares Core MSCI World UCITS ETF', isin: 'IE00B4L5Y983', categorie: 'Aandelen', weight: 60, 'ter p.a.': '0.20%' },
        { naam: 'Xtrackers MSCI Emerging Markets UCITS ETF', isin: 'IE00BTJRMP35', categorie: 'Aandelen', weight: 20, 'ter p.a.': '0.18%' },
        { naam: 'iShares Physical Gold ETC', isin: 'IE00B579F325', categorie: 'Commodities', weight: 10, 'ter p.a.': '0.25%' },
        { naam: 'iShares Developed Markets Property Yield UCITS ETF', isin: 'IE00B1FZS350', categorie: 'Vastgoed', weight: 10, 'ter p.a.': '0.59%' }
      ],
      transactions: [
        { date: '2024-01-01', type: 'Storting', amount: 75000, description: 'Initiële storting' },
        { date: '2024-02-01', type: 'Storting', amount: 750, description: 'Maandelijkse storting' },
        { date: '2024-03-01', type: 'Storting', amount: 750, description: 'Maandelijkse storting' },
        { date: '2024-04-01', type: 'Storting', amount: 750, description: 'Maandelijkse storting' }
      ],
      portfolioValue: 78500,
      totalReturn: 5.85
    },
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
  const [showOnlyTradable, setShowOnlyTradable] = useState(true); // Default: show only LYNX-tradable ETFs
  const [etfPrices, setEtfPrices] = useState({});
  const [etfPricesLastUpdated, setEtfPricesLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    currency: '',
    distribution: '',
    search: '',
    // New filter fields
    region: '',
    provider: '',
    sustainability: '',
    dividend: '',
    replication: '',
    securitiesLending: ''
  });
  const [selectedMainCategory, setSelectedMainCategory] = useState(''); // For step-by-step filtering
  const [filterStep, setFilterStep] = useState('category'); // 'category' | 'filterSelect' | 'filterOptions'
  const [currentFilter, setCurrentFilter] = useState(''); // Which filter is currently being selected
  const [activeFilters, setActiveFilters] = useState({}); // Store selected filter values
  const [customBuilderFilters, setCustomBuilderFilters] = useState({
    subcategorie: '',
    currency: '',
    distribution: ''
  });
  const [categoryFilters, setCategoryFilters] = useState({
    subcategorie: '',
    currency: '',
    distribution: ''
  });
  const [selectedETF, setSelectedETF] = useState(null);
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('portfolio');
    return saved ? JSON.parse(saved) : [];
  });

  // Performance optimization: Create a Set of portfolio ISINs for O(1) lookup
  // This prevents O(n*m) complexity when checking if ETFs are in portfolio
  const portfolioIsinSet = useMemo(() => {
    return new Set(portfolio.map(p => p.isin));
  }, [portfolio]);

  const [financialNews] = useState([
    {
      id: 1,
      title: 'Federal Reserve Maintains Interest Rates Amid Economic Uncertainty',
      source: 'Financial Times',
      time: '2 hours ago',
      category: 'Central Banking',
      summary: 'The Federal Reserve has decided to keep interest rates steady as policymakers assess the impact of previous hikes on inflation and employment.'
    },
    {
      id: 2,
      title: 'European Markets Rally on Strong Corporate Earnings',
      source: 'Bloomberg',
      time: '4 hours ago',
      category: 'Markets',
      summary: 'Major European indices posted significant gains as companies across sectors reported better-than-expected quarterly results.'
    },
    {
      id: 3,
      title: 'Bitcoin Surges Past $98,000 on Institutional Adoption',
      source: 'Reuters',
      time: '5 hours ago',
      category: 'Cryptocurrency',
      summary: 'Bitcoin reached new highs following announcements from major financial institutions expanding their digital asset offerings.'
    },
    {
      id: 4,
      title: 'Oil Prices Stabilize After OPEC+ Production Decision',
      source: 'Wall Street Journal',
      time: '6 hours ago',
      category: 'Commodities',
      summary: 'Crude oil prices found support as OPEC+ members agreed to maintain current production levels through the next quarter.'
    },
    {
      id: 5,
      title: 'Tech Sector Leads Global Stock Market Recovery',
      source: 'CNBC',
      time: '8 hours ago',
      category: 'Technology',
      summary: 'Technology stocks drove global markets higher with AI-related companies showing particularly strong performance.'
    },
    {
      id: 6,
      title: 'Gold Reaches Record High Amid Geopolitical Tensions',
      source: 'MarketWatch',
      time: '1 day ago',
      category: 'Commodities',
      summary: 'Safe-haven assets like gold attracted investor interest as global geopolitical uncertainties continue to mount.'
    }
  ]);
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
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'nl';
  });
  const [languageDetected, setLanguageDetected] = useState(false);

  // Helper function to get flag country code from language code
  const getFlagCode = (lang) => {
    const flagMap = {
      'en': 'gb',
      'nl': 'nl',
      'de': 'de',
      'fr': 'fr',
      'es': 'es'
    };
    return flagMap[lang] || lang;
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState(() => {
    const saved = localStorage.getItem('selectedProfile');
    return saved || null;
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoriesCompleted, setCategoriesCompleted] = useState(() => {
    const saved = localStorage.getItem('categoriesCompleted');
    return saved ? JSON.parse(saved) : {};
  });

  // Bulk buy modal state
  const [bulkBuyModalOpen, setBulkBuyModalOpen] = useState(false);
  const [selectedBulkPortfolioKey, setSelectedBulkPortfolioKey] = useState(null);

  // Handler for opening bulk buy modal
  const handleBulkBuyNow = (portfolioKey) => {
    setSelectedBulkPortfolioKey(portfolioKey);
    setBulkBuyModalOpen(true);
  };

  // Handler for when orders are added to basket
  const handleBulkBuyAddedToBasket = () => {
    // Navigate to trading page to see the basket
    setCurrentPage('trading');
    setBulkBuyModalOpen(false);
    setSelectedBulkPortfolioKey(null);
  };

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

  // Persist language to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Auto-detect language based on IP address (only if no saved preference)
  useEffect(() => {
    const detectLanguage = async () => {
      // Skip if user already has a saved language preference
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage || languageDetected) return;

      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        // Map country codes to supported languages
        const countryToLanguage = {
          'NL': 'nl', // Netherlands
          'BE': 'nl', // Belgium (Dutch speaking)
          'SR': 'nl', // Suriname
          'GB': 'en', // United Kingdom
          'US': 'en', // United States
          'AU': 'en', // Australia
          'CA': 'en', // Canada
          'IE': 'en', // Ireland
          'NZ': 'en', // New Zealand
          'DE': 'de', // Germany
          'AT': 'de', // Austria
          'CH': 'de', // Switzerland (German)
          'FR': 'fr', // France
          'ES': 'es', // Spain
          'MX': 'es', // Mexico
          'AR': 'es', // Argentina
          'CO': 'es', // Colombia
        };

        const detectedLang = countryToLanguage[data.country_code];
        if (detectedLang && detectedLang !== language) {
          setLanguage(detectedLang);
        }
        setLanguageDetected(true);
      } catch (error) {
        console.log('Could not detect language from IP:', error);
        setLanguageDetected(true);
      }
    };

    detectLanguage();
  }, [languageDetected]);

  // iOS Capacitor INPUT FIX - Force all inputs to be focusable
  useEffect(() => {
    const handleTouchStart = function(e) {
      // Don't prevent default, just ensure this input can receive focus
      if (this.disabled) return;

      // Small delay to ensure iOS processes the touch
      setTimeout(() => {
        this.focus();
        this.click();
      }, 10);
    };

    const fixIOSInputs = () => {
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        // Remove old listener to prevent duplicates
        input.removeEventListener('touchstart', handleTouchStart);
        // Add touch event handler to force focus
        input.addEventListener('touchstart', handleTouchStart, { passive: false });
      });
    };

    // Run on mount
    fixIOSInputs();

    // Re-run whenever page changes (inputs get re-rendered)
    const timer = setInterval(fixIOSInputs, 1000);

    return () => clearInterval(timer);
  }, [currentPage]);

  // Get current translations
  const t = translations[language] || translations.nl;

  // Handle logout - save any state and log out
  const handleLogout = async () => {
    // Clear user and redirect to landing
    setUser(null);
    setCurrentPage('landing');
  };

useEffect(() => {
  const loadETFs = async () => {
    console.log('📥 LOADING ETFs FROM EXCEL FILE...');
    setLoading(true);
    try {
      const response = await fetch('/ETF_overzicht_met_subcategorie.xlsx');
      console.log('Excel file fetch response:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      console.log('Excel file loaded, size:', data.length, 'bytes');

      // Dynamically import xlsx
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log('Excel parsed, total rows:', jsonData.length);

      if (jsonData && jsonData.length > 0) {
        // Filter out empty rows (rows without naam or isin)
        const validETFs = jsonData.filter(etf =>
          etf.naam && etf.naam.trim() !== '' &&
          etf.isin && etf.isin.trim() !== ''
        );
        // Enrich ETFs with tradability information
        const enrichedETFs = validETFs.map(etf => enrichWithTradability(etf));
        const tradableCount = enrichedETFs.filter(e => e.isTradableViaLynx).length;
        console.log(`✅ Loaded ${enrichedETFs.length} valid ETFs from Excel (${tradableCount} tradable via LYNX)`);
        setEtfs(enrichedETFs);
        setFilteredEtfs(enrichedETFs);
      } else {
        console.warn('⚠️ Excel file is empty, using sample data');
        const enrichedSample = SAMPLE_ETFS.map(etf => enrichWithTradability(etf));
        setEtfs(enrichedSample);
        setFilteredEtfs(enrichedSample);
      }
    } catch (error) {
      console.error('❌ Error loading Excel file:', error);
      console.log('Using sample ETF data as fallback (' + SAMPLE_ETFS.length + ' items)');
      const enrichedSample = SAMPLE_ETFS.map(etf => enrichWithTradability(etf));
      setEtfs(enrichedSample);
      setFilteredEtfs(enrichedSample);
    }
    setLoading(false);
    console.log('ETF loading complete');
  };

  loadETFs();
}, []);

   useEffect(() => {
    let filtered = [...etfs];

    // Apply main category filter
    if (selectedMainCategory) {
      filtered = filtered.filter(etf => etf.categorie === selectedMainCategory);
    }

    // Apply activeFilters from step-by-step filtering
    if (activeFilters.region) {
      filtered = filtered.filter(etf => etf.subcategorie === activeFilters.region);
    }
    if (activeFilters.soort) {
      filtered = filtered.filter(etf => etf.subcategorie === activeFilters.soort);
    }
    if (activeFilters.valuta) {
      filtered = filtered.filter(etf => etf['fund ccy'] === activeFilters.valuta);
    }
    if (activeFilters.sustainability) {
      filtered = filtered.filter(etf => etf.sustainability === activeFilters.sustainability);
    }
    if (activeFilters.dividend) {
      filtered = filtered.filter(etf => etf.distribution === activeFilters.dividend);
    }
    if (activeFilters.replication) {
      filtered = filtered.filter(etf => etf.replication === activeFilters.replication);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(etf =>
        etf.naam?.toLowerCase().includes(searchLower) ||
        etf.isin?.toLowerCase().includes(searchLower)
      );
    }

    // Apply issuer filter
    if (activeFilters.issuer) {
      const issuerLower = activeFilters.issuer.toLowerCase();
      filtered = filtered.filter(etf => etf.naam?.toLowerCase().includes(issuerLower));
    }

    // Apply tradable filter from activeFilters
    if (activeFilters.tradable) {
      if (activeFilters.tradable === 'Ja (LYNX)') {
        filtered = filtered.filter(etf => etf.isTradableViaLynx === true);
      } else {
        filtered = filtered.filter(etf => !etf.isTradableViaLynx);
      }
    }

    // Apply showOnlyTradable toggle (overrides tradable filter if enabled)
    if (showOnlyTradable && !activeFilters.tradable) {
      filtered = filtered.filter(etf => etf.isTradableViaLynx === true);
    }

    setFilteredEtfs(filtered);
  }, [filters.search, activeFilters, selectedMainCategory, etfs, showOnlyTradable, currentPage]);

  // Save user to localStorage for persistent login (stays logged in after closing app)
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    // Don't save wizard/temporary routes to localStorage - they can trap users
    if (!BLOCKED_RESTORE_ROUTES.includes(currentPage)) {
      localStorage.setItem('currentPage', currentPage);
    }
  }, [currentPage]);

  // Prevent navigation away from verify-email page when token is present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasToken = !!(urlParams.get('token') || urlParams.get('Token'));

    if (hasToken && currentPage !== 'verify-email') {
      console.log('Token present but not on verify-email page, forcing navigation');
      setCurrentPage('verify-email');
    }
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

  // Helper function to calculate current portfolio value
  const calculateCurrentPortfolioValue = (details) => {
    if (!details || !details.amount || !details.riskProfile) return 0;

    const initialValue = parseFloat(details.amount) || 0;
    const monthlyContribution = parseFloat(details.monthlyContribution) || 0;
    const horizon = parseInt(details.horizon) || 10;

    // Get portfolio configuration
    const selectedPortfolioKey = Object.keys(premadePortfolios).find(
      key => premadePortfolios[key].name === details.riskProfile
    );
    const portfolioConfig = premadePortfolios[selectedPortfolioKey] || premadePortfolios['neutral'];
    const avgReturn = portfolioConfig.expectedReturn / 12; // Monthly return

    // Simple calculation: assume we're at current month (0 for now since just invested)
    // In real scenario, you'd track time since investment
    const monthsSinceInvestment = 0;
    let value = initialValue;

    for (let month = 1; month <= monthsSinceInvestment; month++) {
      value += monthlyContribution;
      value = value * (1 + avgReturn);
    }

    return value;
  };

  // Sync user's portfolio and investment data back to customers array
  useEffect(() => {
    if (user && user.role === 'customer') {
      const currentValue = calculateCurrentPortfolioValue(investmentDetails);
      setCustomers(prev => prev.map(customer =>
        customer.email === user.email
          ? {
              ...customer,
              portfolio: portfolio,
              investmentDetails: investmentDetails,
              selectedProfile: selectedProfile,
              currentPortfolioValue: currentValue
            }
          : customer
      ));
    }
  }, [portfolio, investmentDetails, selectedProfile, user]);

  // Redirect to correct page on mount if user is logged in
  useEffect(() => {
    if (user && user.role) {
      if (user.role === 'accountmanager') {
        if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'register') {
          setCurrentPage('customerDatabase');
        }
      } else if (user.role === 'customer') {
        if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'register') {
          // Redirect to Main Dashboard (Portfolio, LYNX Trading, Vooraf Samengesteld)
          setCurrentPage('mainDashboard');
        }
      }
    } else if (!user && (currentPage !== 'landing' && currentPage !== 'login' && currentPage !== 'register' && currentPage !== 'verify-email' && currentPage !== 'emailVerificationPending' && currentPage !== 'resetPassword' && currentPage !== 'verify-code')) {
      // Only redirect to landing if no user AND on a protected page
      // Don't redirect if we're already on a public page
      console.log('No user detected, redirecting to landing from:', currentPage);
      setCurrentPage('landing');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogin = async (email, password) => {
    // Check if accountmanager login
    if (email === 'admin@etfportal.nl' && password === 'admin123') {
      setUser({ email, name: 'Account Manager', role: 'accountmanager' });
      setCurrentPage('customerDatabase');
      return { success: true };
    }

    // Check if demo account login
    if (email === 'demo@pigg.nl' && password === 'demo123') {
      let demoUser = customers.find(c => c.email === 'demo@pigg.nl');

      // If demo user not found in state, create it
      if (!demoUser) {
        demoUser = {
          id: 0,
          name: 'Demo Investor',
          firstName: 'Demo',
          email: 'demo@pigg.nl',
          password: 'demo123',
          address: 'Damrak 1',
          street: 'Damrak',
          houseNumber: '1',
          postalCode: '1012 LG',
          city: 'Amsterdam',
          phone: '+31 20 123 4567',
          birthDate: '1990-01-01',
          registeredAt: '2024-01-01T10:00:00.000Z',
          account_type: 'betaald',
          email_verified: true,
          investmentDetails: {
            goal: 'Vermogensopbouw',
            horizon: '15',
            amount: '75000',
            monthlyContribution: '750',
            riskProfile: 'Offensief'
          },
          portfolio: [
            { naam: 'iShares Core MSCI World UCITS ETF', isin: 'IE00B4L5Y983', categorie: 'Aandelen', weight: 60, 'ter p.a.': '0.20%' },
            { naam: 'Xtrackers MSCI Emerging Markets UCITS ETF', isin: 'IE00BTJRMP35', categorie: 'Aandelen', weight: 20, 'ter p.a.': '0.18%' },
            { naam: 'iShares Physical Gold ETC', isin: 'IE00B579F325', categorie: 'Commodities', weight: 10, 'ter p.a.': '0.25%' },
            { naam: 'iShares Developed Markets Property Yield UCITS ETF', isin: 'IE00B1FZS350', categorie: 'Vastgoed', weight: 10, 'ter p.a.': '0.59%' }
          ],
          portfolioValue: 78500,
          totalReturn: 5.85
        };
      }

      setUser({
        ...demoUser,
        email_verified: true,
        role: 'customer'
      });
      // Redirect to Main Dashboard (Portfolio, LYNX Trading, Vooraf Samengesteld)
      setCurrentPage('mainDashboard');
      return { success: true };
    }

    // Regular user login via API
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        const customer = data.customer;

        console.log('🟢 LOGIN SUCCESS - Customer data from API:', {
          customer_id: customer.id,
          account_type: customer.account_type,
          email_verified: customer.email_verified,
          portfolio_count: customer.portfolio?.length || 0,
          portfolio: customer.portfolio,
          investmentDetails: customer.investmentDetails
        });

        // Check if email is verified
        if (!customer.email_verified) {
          console.log('❌ Email not verified - redirecting to verification page');
          setPendingVerificationEmail(email);
          setCurrentPage('verify-code');
          return {
            success: false,
            message: 'Je moet eerst je email verifiëren. Check je inbox voor de verificatiecode.',
            requiresVerification: true
          };
        }

        // Clear localStorage first to remove old data
        localStorage.removeItem('portfolio');
        localStorage.removeItem('investmentDetails');
        localStorage.removeItem('portfolioType');
        localStorage.removeItem('selectedProfile');

        // Load portfolio and investment details from database
        if (customer.portfolio && customer.portfolio.length > 0) {
          console.log('✅ Loading portfolio from database:', customer.portfolio.length, 'items');
          setPortfolio(customer.portfolio);
          localStorage.setItem('portfolio', JSON.stringify(customer.portfolio));
        } else {
          console.log('❌ No portfolio found in database');
          setPortfolio([]);
        }

        if (customer.investmentDetails && Object.keys(customer.investmentDetails).length > 0) {
          console.log('✅ Loading investment details from database');
          setInvestmentDetails(customer.investmentDetails);
          localStorage.setItem('investmentDetails', JSON.stringify(customer.investmentDetails));
        } else {
          console.log('❌ No investment details found in database');
          setInvestmentDetails({});
        }

        setUser({
          ...customer,
          firstName: customer.first_name,
          lastName: customer.last_name,
          name: `${customer.first_name} ${customer.last_name}`,
          houseNumber: customer.house_number,
          postalCode: customer.postal_code,
          birthDate: customer.birth_date,
          address: `${customer.street} ${customer.house_number}, ${customer.postal_code} ${customer.city}`,
          role: 'customer'
        });

        // Redirect new users to welcome page, returning users to main dashboard
        if (localStorage.getItem('justRegistered')) {
          localStorage.removeItem('justRegistered');
          console.log('➡️ New user - redirecting to post-register welcome');
          setCurrentPage('postRegisterWelcome');
        } else {
          console.log('➡️ Redirecting to Main Dashboard');
          setCurrentPage('mainDashboard');
        }
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Er is een fout opgetreden. Probeer opnieuw.' };
    }
  };

  const handleRegister = async (firstName, lastName, email, password, street, houseNumber, postalCode, city, phone, birthDate) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          street,
          houseNumber,
          postalCode,
          city,
          phone,
          birthDate
        })
      });

      // Handle non-JSON responses (e.g. HTML error pages)
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', response.status, text.substring(0, 200));
        alert(`Registratie mislukt (server fout ${response.status}). Probeer opnieuw.`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('justRegistered', 'true');
        if (data.requiresVerification) {
          setPendingVerificationEmail(email);
          setCurrentPage('verify-code');
        } else {
          alert(data.message || 'Registratie succesvol! Je kunt nu inloggen.');
          setCurrentPage('login');
        }
      } else {
        alert(data.message || 'Registratie mislukt.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Kan geen verbinding maken met de server. Controleer je internetverbinding en probeer opnieuw.');
    }
  };

  // Fetch ETF prices for ETF Database
  const fetchAllETFPrices = async () => {
    try {
      console.log('📊 Fetching ETF prices for database...');

      // Get all unique ISINs from the ETF list
      const isins = etfs
        .map(etf => etf.isin)
        .filter(Boolean)
        .filter((isin, index, self) => self.indexOf(isin) === index); // unique ISINs

      if (isins.length === 0) {
        console.log('No ISINs to fetch prices for');
        return;
      }

      const response = await fetch(`${API_URL}/fetch-etf-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isins })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ ETF prices fetched:', data.prices);
        setEtfPrices(data.prices);
        setEtfPricesLastUpdated(data.timestamp);
      } else {
        console.error('Failed to fetch ETF prices:', data.message);
      }
    } catch (error) {
      console.error('Error fetching ETF prices:', error);
    }
  };

  const savePortfolioToDatabase = async (accountType = 'fictief') => {
    if (!user || !user.id) {
      console.error('❌ No user logged in');
      return false;
    }

    if (!portfolio || portfolio.length === 0) {
      console.error('❌ Cannot save: Portfolio is empty!');
      alert('Fout: Geen portfolio geselecteerd. Kies eerst een portfolio voordat je verder gaat.');
      return false;
    }

    console.log('🔵 SAVING PORTFOLIO TO DATABASE', {
      customer_id: user.id,
      portfolio_count: portfolio.length,
      portfolio_items: portfolio,
      investmentDetails,
      accountType
    });

    try {
      const response = await fetch(`${API_URL}/save-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: user.id,
          portfolio: portfolio,
          investmentDetails: investmentDetails,
          account_type: accountType
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update user object with account type
        setUser({...user, account_type: accountType, portfolio: portfolio});
        console.log('Portfolio saved successfully!');
        return true;
      } else {
        console.error('❌ FAILED TO SAVE PORTFOLIO - Full error:', data);
        console.error('Error message:', data.error);
        console.error('Error code:', data.errorCode);
        console.error('Error details:', data.errorDetails);
        console.error('Error hint:', data.errorHint);
        const errorMsg = data.error || data.errorDetails || data.message || 'Onbekende fout';
        alert('Fout bij opslaan portfolio: ' + errorMsg);
        return false;
      }
    } catch (error) {
      console.error('Error saving portfolio:', error);
      alert('Fout bij opslaan portfolio: ' + error.message);
      return false;
    }
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
    console.log('📊 CREATE PREMADE PORTFOLIO:', type);
    const config = premadePortfolios[type];
    const selectedETFs = [];

    Object.entries(config.allocation).forEach(([category, percentage]) => {
      let categoryETFs = etfs.filter(e => e.categorie === category);
      console.log(`  Category ${category}: Found ${categoryETFs.length} ETFs`);

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

    console.log('✅ PORTFOLIO CREATED:', selectedETFs.length, 'ETFs');
    console.log('Portfolio items:', selectedETFs);

    if (selectedETFs.length > 0) {
      setPortfolio(selectedETFs);
      setSelectedProfile(type); // Store the selected profile type
      setCurrentPage('portfolioOverview');
    } else {
      console.error('❌ NO ETFs SELECTED - etfs array might be empty!');
      alert('Fout: Geen ETFs beschikbaar. Probeer de pagina te verversen.');
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
        <div className="bg-[#FEFEFE] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-[#FEFEFE] border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Portfolio Aanpassen</h2>
              <p className="text-sm text-gray-600 mt-1">Wijzig de wegingen van je ETF's</p>
            </div>
            <button onClick={onClose} className="text-2xl text-[#636E72] hover:text-gray-700">×</button>
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
                  className="px-4 py-2 bg-blue-600 text-[#2D3436] rounded-lg hover:bg-blue-700 text-sm"
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
              <div className="text-center py-12 text-[#636E72]">
                Je portfolio is leeg. Voeg ETF's toe vanaf de ETF Database pagina.
              </div>
            )}
            
            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={() => setCurrentPage('portfolioBuilder')}
                className="flex-1 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
              >
                + ETF Toevoegen
              </button>
              <button
                onClick={saveChanges}
                className="flex-1 py-3 bg-blue-600 text-[#2D3436] rounded-lg hover:bg-blue-700 font-medium"
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
    <div className="min-h-screen bg-[#F5F6F4]">
      {/* Market Indices Ticker - Beurskoersen balk */}
      <MarketIndicesTicker />

      {/* Navigation */}
      <nav className="bg-[#FEFEFE] border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex justify-between items-center">
            <button onClick={() => setCurrentPage('mainDashboard')} className="flex items-center gap-3">
              <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 sm:w-12 sm:h-12">
                {/* Original piggy bank body */}
                <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                {/* Coin slot on top */}
                <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                {/* Gold coin */}
                <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                {/* Pig face - Eyes */}
                <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                {/* Pig snout */}
                <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                {/* Pig ears */}
                <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                {/* Smile */}
                <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                {/* Legs/feet */}
                <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
              </svg>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2D3436]">PIGG</div>
            </button>
            <div className="flex items-center gap-4 sm:gap-6">
              <button onClick={() => setCurrentPage('mainDashboard')} className="text-[#7C9885] font-medium text-sm sm:text-base">Home</button>
              <button onClick={() => setCurrentPage('brokerSettings')} className="text-[#636E72] hover:text-[#7C9885] transition-colors font-medium text-sm sm:text-base">Broker</button>
              <div className="text-sm text-[#636E72] hidden sm:block">
                {user?.name?.split(' ')[0]}
              </div>
              <button
                onClick={handleLogout}
                className="text-[#636E72] hover:text-[#2D3436] transition-colors font-medium text-sm sm:text-base"
              >
                {t.common.logout}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light italic mb-3 sm:mb-4 text-[#636E72]">
            Welkom, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-base sm:text-lg text-[#B2BEC3]">
            Wat wil je vandaag doen?
          </p>
        </div>

        {/* Financial Overview + Positions */}
          <FinancialOverviewCards onNavigate={(page) => setCurrentPage(page)} />
          {/* Je Huidige Portfolio - Live posities van broker */}
          <PortfolioPositionsCard />

        {/* Portfolio Beheer Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D5D5D3] to-transparent"></div>
            <h2 className="text-xl font-bold text-[#2D3436]">Portfolio Beheer</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D5D5D3] to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {(() => {
              const tradableInPortfolio = portfolio.filter(p => p.isTradableViaLynx).length;
              const totalInPortfolio = portfolio.length;
              const isFullyTradable = tradableInPortfolio === totalInPortfolio;

              return (
                <button
                  onClick={() => setCurrentPage('trading')}
                  className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 sm:p-5 hover:border-[#7C9885] transition-all group text-left"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-3xl sm:text-4xl">📈</div>
                    {totalInPortfolio > 0 && (
                      isFullyTradable ? (
                        <span className="text-xs px-2 py-1 bg-[#7C9885]/20 text-[#7C9885] rounded-full">
                          {tradableInPortfolio} ETFs klaar
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                          {tradableInPortfolio}/{totalInPortfolio} handelbaar
                        </span>
                      )
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1 text-[#2D3436] group-hover:text-[#7C9885] transition-colors">LYNX Trading</h3>
                  <p className="text-xs sm:text-sm text-[#636E72]">
                    Handel ETFs via je LYNX broker account
                  </p>
                  {totalInPortfolio > 0 && !isFullyTradable && (
                    <p className="text-xs text-yellow-500/70 mt-2">
                      {totalInPortfolio - tradableInPortfolio} ETF(s) in je portfolio zijn niet handelbaar via LYNX
                    </p>
                  )}
                </button>
              );
            })()}

            <button
              onClick={() => setCurrentPage('batchTrading')}
              className="bg-[#FEFEFE] border border-[#7C9885]/30 rounded-xl p-4 sm:p-5 hover:border-[#7C9885] transition-all group text-left"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="text-3xl sm:text-4xl">⏰</div>
                <span className="text-xs px-2 py-1 bg-[#7C9885]/20 text-[#7C9885] rounded-full">
                  14:00 CET
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 text-[#2D3436] group-hover:text-[#7C9885] transition-colors">Batch Trading</h3>
              <p className="text-xs sm:text-sm text-[#636E72]">
                Submit orders for the next daily batch execution
              </p>
              <p className="text-xs text-[#7C9885] mt-2">
                Virtual portfolio with user isolation
              </p>
            </button>

            <button
              onClick={() => setCurrentPage('modelPortfolios')}
              className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 sm:p-5 hover:border-[#7C9885] transition-all group text-left"
            >
              <div className="text-3xl sm:text-4xl mb-3">✨</div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 text-[#2D3436] group-hover:text-[#7C9885] transition-colors">Model Portfolios</h3>
              <p className="text-xs sm:text-sm text-[#636E72]">
                Kies uit 20+ kant-en-klare portfolio's
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">Risico</span>
                <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">Thema</span>
                <span className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded">Strategie</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentPage('community')}
              className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 sm:p-5 hover:border-[#7C9885] transition-all group text-left"
            >
              <div className="text-3xl sm:text-4xl mb-3">👥</div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 text-[#2D3436] group-hover:text-[#7C9885] transition-colors">Community</h3>
              <p className="text-xs sm:text-sm text-[#636E72]">
                Ontdek en volg de beste beleggers
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 bg-[#C9A962]/20 text-[#C9A962] rounded">Leaderboard</span>
                <span className="text-xs px-2 py-0.5 bg-[#C0736D]/20 text-[#C0736D] rounded">Volgen</span>
                <span className="text-xs px-2 py-0.5 bg-[#7C9885]/20 text-[#7C9885] rounded">Kopieren</span>
              </div>
            </button>

          </div>
        </div>

        {/* Financiële Planning Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D5D5D3] to-transparent"></div>
            <h2 className="text-xl font-bold text-[#2D3436]">Financiële Planning</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D5D5D3] to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <button
              onClick={() => setCurrentPage('incomeCalculator')}
              className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 sm:p-5 hover:border-[#7C9885] transition-all group text-left"
            >
              <div className="text-3xl sm:text-4xl mb-3">💰</div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 text-[#2D3436] group-hover:text-[#7C9885] transition-colors">Inkomen Calculator</h3>
              <p className="text-xs sm:text-sm text-[#636E72]">
                Bereken je toekomstige inkomen en vermogensopbouw
              </p>
            </button>
          </div>
        </div>

        {/* Link naar Monte Carlo simulatie (losgekoppeld) */}
        {portfolio.length > 0 && investmentDetails.amount && investmentDetails.riskProfile && (
          <div className="mt-6 sm:mt-8 bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 sm:p-5">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#2D3436]">Portfolio Simulatie</h2>
              {investmentDetails.pricesLastUpdated && (
                <div className="text-xs text-[#636E72]">
                  Prijzen bijgewerkt: {new Date(investmentDetails.pricesLastUpdated).toLocaleString('nl-NL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#636E72] mb-4">
              Bekijk de Monte Carlo simulatie van je portfolio met {portfolio.length} ETF's
            </p>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="px-5 py-2.5 bg-[#7C9885] text-white rounded-lg hover:bg-[#6B8A74] transition-all font-semibold text-sm"
            >
              Bekijk Simulatie
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const CostComparisonCalculator = () => {
    const [periodicDeposit, setPeriodicDeposit] = useState(2000);
    const [initialInvestment, setInitialInvestment] = useState(200000);
    const [expectedReturn, setExpectedReturn] = useState(5);
    const [period, setPeriod] = useState(20);
    const [wealthManagerFee, setWealthManagerFee] = useState(1.0);
    const huchaCost = 200; // Fixed annual cost

    // Calculate final wealth and costs
    const calculateResults = () => {
      // Calculate final wealth for PIGG (with full expected return)
      let huchaWealth = initialInvestment;
      for (let year = 1; year <= period; year++) {
        huchaWealth = huchaWealth * (1 + expectedReturn / 100) + periodicDeposit * 12;
      }

      // Calculate final wealth for wealth manager (with return minus percentage fee)
      let managerWealth = initialInvestment;
      const netReturn = expectedReturn - wealthManagerFee;
      for (let year = 1; year <= period; year++) {
        managerWealth = managerWealth * (1 + netReturn / 100) + periodicDeposit * 12;
      }

      // Simple costs calculation
      const huchaTotalCost = huchaCost * period; // Just the fixed annual fees
      const managerTotalCost = huchaWealth - managerWealth; // Difference due to percentage fee
      const savings = managerTotalCost - huchaTotalCost;

      return {
        huchaWealth,
        managerWealth,
        huchaTotalCost,
        managerTotalCost,
        savings
      };
    };

    const results = calculateResults();

    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#ECEEED]/50 border border-[#E8E8E6] rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-[#2D3436] mb-6">Jouw situatie</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-[#636E72] mb-2 font-medium">
                  Inleg (eenmalig)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636E72]">€</span>
                  <input
                    type="text"
                    value={initialInvestment.toLocaleString('nl-NL')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '').replace(',', '.');
                      const num = parseFloat(value);
                      if (!isNaN(num)) setInitialInvestment(num);
                      else if (e.target.value === '') setInitialInvestment(0);
                    }}
                    className="w-full bg-[#ECEEED] border border-[#D5D5D3] rounded-lg px-4 py-3 pl-8 text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#636E72] mb-2 font-medium">
                  Periodieke inleg (per maand)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636E72]">€</span>
                  <input
                    type="text"
                    value={periodicDeposit.toLocaleString('nl-NL')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '').replace(',', '.');
                      const num = parseFloat(value);
                      if (!isNaN(num)) setPeriodicDeposit(num);
                      else if (e.target.value === '') setPeriodicDeposit(0);
                    }}
                    className="w-full bg-[#ECEEED] border border-[#D5D5D3] rounded-lg px-4 py-3 pl-8 text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#636E72] mb-2 font-medium">
                  Verwacht rendement (per jaar)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={expectedReturn.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '').replace(',', '.');
                      const num = parseFloat(value);
                      if (!isNaN(num)) setExpectedReturn(num);
                      else if (e.target.value === '') setExpectedReturn(0);
                    }}
                    className="w-full bg-[#ECEEED] border border-[#D5D5D3] rounded-lg px-4 py-3 pr-8 text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636E72]">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[#636E72] mb-2 font-medium">
                  Periode (jaren)
                </label>
                <input
                  type="number"
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                  className="w-full bg-[#ECEEED] border border-[#D5D5D3] rounded-lg px-4 py-3 text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#636E72] mb-2 font-medium">
                  Kosten vermogensbeheerder (per jaar)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={wealthManagerFee.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '').replace(',', '.');
                      const num = parseFloat(value);
                      if (!isNaN(num)) setWealthManagerFee(num);
                      else if (e.target.value === '') setWealthManagerFee(0);
                    }}
                    className="w-full bg-[#ECEEED] border border-[#D5D5D3] rounded-lg px-4 py-3 pr-8 text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636E72]">%</span>
                </div>
              </div>

              <div className="bg-[#7C9885]/10 border border-[#7C9885]/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#636E72] font-medium">Betaald account PIGG (per jaar)</span>
                  <span className="text-xl font-bold text-[#7C9885]">€ 200</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Final Wealth Comparison */}
            <div className="bg-[#ECEEED]/50 border border-[#E8E8E6] rounded-2xl p-8">
              <h3 className="text-xl font-bold text-[#2D3436] mb-6">Eindvermogen na {period} jaar</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-[#E8E8E6]">
                  <span className="text-[#636E72]">Vermogensbeheerder</span>
                  <span className="text-xl font-bold text-[#2D3436]">
                    € {results.managerWealth.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-[#E8E8E6]">
                  <span className="text-[#7C9885] font-medium">PIGG</span>
                  <span className="text-xl font-bold text-[#7C9885]">
                    € {results.huchaWealth.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[#636E72] text-sm">Verschil</span>
                  <span className="text-lg font-bold text-[#7C9885]">
                    + € {(results.huchaWealth - results.managerWealth).toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-gradient-to-br from-[#7C9885]/10 to-[#20D4BA]/5 border-2 border-[#7C9885] rounded-2xl p-8">
              <h3 className="text-xl font-bold text-[#2D3436] mb-6">Totale kosten (incl. misgelopen rendement)</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-[#E8E8E6]/50">
                  <span className="text-[#636E72]">Vermogensbeheerder</span>
                  <span className="text-xl font-bold text-[#C0736D]">
                    € {results.managerTotalCost.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-[#E8E8E6]/50">
                  <span className="text-[#7C9885] font-medium">PIGG</span>
                  <span className="text-xl font-bold text-[#7C9885]">
                    € {results.huchaTotalCost.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="bg-[#7C9885]/20 rounded-lg p-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#2D3436] font-semibold">Jouw besparing</span>
                    <span className="text-2xl font-bold text-[#7C9885]">
                      € {results.savings.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LandingPage = () => {
    const scrollToSection = (id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
    <div className="min-h-screen bg-[#F5F6F4]">
      {/* Sticky Navigation */}
      <nav
        className="sticky top-0 z-50 border-b border-[#E8E8E6]"
        style={{
          background: 'rgba(254, 254, 254, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
                <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>
                <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>
                <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>
                <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>
                <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>
                <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>
                <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
              </svg>
              <div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2D3436]">PIGG</div>
                <div className="text-xs sm:text-sm md:text-base text-[#636E72] hidden sm:block">{t.tagline}</div>
              </div>
            </div>

            {/* Desktop Menu Items */}
            <div className="hidden lg:flex gap-6">
              <button onClick={() => scrollToSection('hero')} className="text-[#636E72] hover:text-[#7C9885] transition-colors font-medium">
                {t.nav.home}
              </button>
              <button onClick={() => scrollToSection('features')} className="text-[#636E72] hover:text-[#7C9885] transition-colors font-medium">
                {t.nav.features}
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-[#636E72] hover:text-[#7C9885] transition-colors font-medium">
                {t.nav.howItWorks}
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-[#636E72] hover:text-[#7C9885] transition-colors font-medium">
                {t.nav.pricing}
              </button>
            </div>

            {/* Right side */}
            <div className="flex gap-2 items-center">
              {/* Language Selector - Mobile */}
              <select
                key={`mobile-lang-${language}`}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="lg:hidden pl-8 pr-2 py-2 bg-[#ECEEED] border border-[#E8E8E6] rounded text-[#2D3436] text-xs hover:border-[#7C9885] focus:outline-none focus:border-[#7C9885] transition-colors appearance-none cursor-pointer w-[70px]"
                style={{
                  backgroundImage: `url(https://flagcdn.com/24x18/${getFlagCode(language)}.png)`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '6px center',
                  backgroundSize: '18px 13px'
                }}
              >
                <option value="nl">NL</option>
                <option value="en">EN</option>
                <option value="de">DE</option>
                <option value="fr">FR</option>
                <option value="es">ES</option>
              </select>

              {/* Language Selector - Desktop */}
              <select
                key={`desktop-lang-${language}`}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="hidden lg:block pl-10 pr-4 py-2 bg-[#ECEEED] border border-[#E8E8E6] rounded text-[#2D3436] text-sm hover:border-[#7C9885] focus:outline-none focus:border-[#7C9885] transition-colors appearance-none cursor-pointer w-[140px]"
                style={{
                  backgroundImage: `url(https://flagcdn.com/24x18/${getFlagCode(language)}.png)`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '8px center',
                  backgroundSize: '24px 18px'
                }}
              >
                <option value="nl">Nederlands</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>

              {/* Login and Start Now buttons */}
              <button
                onClick={() => setCurrentPage('login')}
                className="px-3 py-2 text-[#2D3436] hover:text-[#7C9885] transition-colors font-medium text-sm lg:text-base lg:px-4"
              >
                {t.nav.login}
              </button>
              <button
                onClick={() => setCurrentPage('register')}
                className="px-3 py-2 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] transition-all font-semibold whitespace-nowrap text-sm lg:text-base lg:px-4"
              >
                {t.nav.startNow}
              </button>

              {/* Hamburger Menu Button - Mobile only */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#2D3436] hover:text-[#7C9885] transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-[#E8E8E6] pt-4 animate-fadeIn">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {scrollToSection('hero'); setMobileMenuOpen(false);}}
                  className="text-left text-[#636E72] hover:text-[#7C9885] transition-colors font-medium py-2 px-2 rounded hover:bg-[#ECEEED]/50"
                >
                  {t.nav.home}
                </button>
                <button
                  onClick={() => {scrollToSection('features'); setMobileMenuOpen(false);}}
                  className="text-left text-[#636E72] hover:text-[#7C9885] transition-colors font-medium py-2 px-2 rounded hover:bg-[#ECEEED]/50"
                >
                  {t.nav.features}
                </button>
                <button
                  onClick={() => {scrollToSection('how-it-works'); setMobileMenuOpen(false);}}
                  className="text-left text-[#636E72] hover:text-[#7C9885] transition-colors font-medium py-2 px-2 rounded hover:bg-[#ECEEED]/50"
                >
                  {t.nav.howItWorks}
                </button>
                <button
                  onClick={() => {scrollToSection('pricing'); setMobileMenuOpen(false);}}
                  className="text-left text-[#636E72] hover:text-[#7C9885] transition-colors font-medium py-2 px-2 rounded hover:bg-[#ECEEED]/50"
                >
                  {t.nav.pricing}
                </button>
                <div className="border-t border-[#E8E8E6] pt-3 mt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {setCurrentPage('login'); setMobileMenuOpen(false);}}
                    className="text-left text-[#2D3436] hover:text-[#7C9885] transition-colors font-medium py-2 px-2 rounded hover:bg-[#ECEEED]/50"
                  >
                    {t.nav.login}
                  </button>
                  <button
                    onClick={() => {setCurrentPage('register'); setMobileMenuOpen(false);}}
                    className="w-full py-3 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] transition-all font-semibold text-center"
                  >
                    {t.nav.startNow}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex items-center pt-8 sm:pt-0">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 sm:pb-16 overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start overflow-visible">
          <div className="text-[#2D3436]">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
              {t.hero.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 text-[#636E72] leading-relaxed">
              {t.hero.subtitle}
            </p>
            <button
              onClick={() => setCurrentPage('register')}
              className="px-8 sm:px-10 py-3.5 sm:py-4 bg-[#7C9885] text-gray-900 rounded-lg text-base sm:text-lg hover:bg-[#20D4BA] transition-all font-bold"
            >
              {t.hero.cta}
            </button>
          </div>

          <div className="relative flex justify-center items-center overflow-visible" style={{ perspective: '1000px' }}>
            {/* Soft glow background - extends beyond container and fades smoothly */}
            <div
              className="absolute pointer-events-none hidden sm:block"
              style={{
                width: '280%',
                height: '280%',
                top: '-90%',
                left: '-90%',
                zIndex: -1,
                background: 'radial-gradient(ellipse 45% 50% at 50% 50%, rgba(124, 152, 133, 0.55) 0%, rgba(124, 152, 133, 0.4) 15%, rgba(124, 152, 133, 0.25) 30%, rgba(124, 152, 133, 0.12) 45%, rgba(124, 152, 133, 0.04) 60%, transparent 80%)',
              }}
            ></div>
            {/* Mobile glow - contained */}
            <div
              className="absolute pointer-events-none sm:hidden"
              style={{
                width: '150%',
                height: '150%',
                top: '-25%',
                left: '-25%',
                zIndex: -1,
                background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(124, 152, 133, 0.4) 0%, rgba(124, 152, 133, 0.2) 30%, transparent 70%)',
              }}
            ></div>
            {/* iPhone Mockup - 3D */}
            <div
              className="relative w-[220px] sm:w-[250px] md:w-[280px]"
              style={{
                transform: 'rotateY(-18deg) rotateX(8deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* iPhone Frame - Space Gray style */}
              <div
                className="relative rounded-[3rem] p-[3px]"
                style={{
                  background: 'linear-gradient(145deg, #3a3a3c 0%, #1c1c1e 50%, #0a0a0a 100%)',
                  boxShadow: `
                    inset 1px 1px 2px rgba(255,255,255,0.1),
                    inset -1px -1px 2px rgba(0,0,0,0.3),
                    -20px 25px 50px rgba(0,0,0,0.4),
                    -10px 15px 30px rgba(0,0,0,0.3),
                    0 5px 20px rgba(0,0,0,0.2)
                  `,
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Side buttons - Volume */}
                <div className="absolute -left-[2px] top-[25%] w-[3px] h-6 bg-[#2a2a2c] rounded-l-sm"></div>
                <div className="absolute -left-[2px] top-[35%] w-[3px] h-6 bg-[#2a2a2c] rounded-l-sm"></div>
                {/* Side button - Power */}
                <div className="absolute -right-[2px] top-[30%] w-[3px] h-10 bg-[#2a2a2c] rounded-r-sm"></div>

                {/* Glossy shine overlay */}
                <div
                  className="absolute inset-0 rounded-[3rem] pointer-events-none z-10"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 30%, transparent 50%)'
                  }}
                ></div>
                {/* Screen Content */}
                <div className="bg-[#F5F6F4] rounded-[2.8rem] overflow-hidden aspect-[9/19.5] relative">
                  {/* Glass reflection overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none z-30 rounded-[2.8rem]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)'
                    }}
                  ></div>

                  {/* iOS Status Bar */}
                  <div className="px-5 pt-3 pb-1">
                    <div className="flex justify-between items-center">
                      {/* Time - left */}
                      <div className="text-[#2D3436] text-[10px] font-semibold w-12">9:41</div>

                      {/* Dynamic Island - center (black pill) */}
                      <div
                        className="w-20 h-[22px] rounded-full bg-black flex items-center justify-center"
                        style={{
                          boxShadow: '0 0 0 1px rgba(255,255,255,0.1)'
                        }}
                      >
                        {/* Camera dot */}
                        <div className="w-2 h-2 rounded-full bg-[#1a1a1a] mr-4 relative">
                          <div className="absolute inset-[2px] rounded-full bg-[#0d47a1] opacity-60"></div>
                        </div>
                      </div>

                      {/* Status icons - right */}
                      <div className="flex items-center gap-0.5 w-12 justify-end">
                        <svg className="w-2.5 h-2.5" fill="#2D3436" viewBox="0 0 24 24">
                          <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/>
                        </svg>
                        <svg className="w-2.5 h-2.5" fill="#2D3436" viewBox="0 0 16 16">
                          <rect x="1" y="4" width="3" height="8" rx="1"/>
                          <rect x="5" y="2" width="3" height="10" rx="1"/>
                          <rect x="9" y="1" width="3" height="11" rx="1"/>
                          <rect x="13" y="3" width="3" height="9" rx="1" opacity="0.4"/>
                        </svg>
                        <svg className="w-3.5 h-3.5" fill="#2D3436" viewBox="0 0 24 24">
                          <rect x="2" y="7" width="18" height="10" rx="2" stroke="#2D3436" strokeWidth="1.5" fill="none"/>
                          <rect x="4" y="9" width="12" height="6" fill="#7C9885"/>
                          <rect x="20" y="10" width="2" height="4" rx="0.5"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="px-3 pb-3">
                    {/* App Header with Logo */}
                    <div className="flex justify-between items-center mb-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <svg viewBox="0 0 48 48" fill="none" className="w-5 h-5">
                          <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>
                          <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>
                          <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                          <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                          <circle cx="18" cy="34" r="2" fill="#7C9885"/>
                          <circle cx="30" cy="34" r="2" fill="#7C9885"/>
                        </svg>
                        <div className="text-[#2D3436] font-bold text-sm">PIGG</div>
                      </div>
                      <div className="text-[#636E72] text-[10px]">Hoi, Jan</div>
                    </div>

                    {/* Portfolio Value Card */}
                    <div className="bg-[#7C9885] rounded-xl p-3 mb-3">
                      <div className="text-[#2D3436] text-xs font-medium mb-1">Totale Waarde</div>
                      <div className="text-[#2D3436] text-2xl font-bold mb-1">€52,450</div>
                      <div className="text-[#2D3436]/80 text-xs">+€2,450 (+4.9%)</div>
                    </div>

                    {/* Performance Chart */}
                    <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-3 mb-3 shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-[#2D3436] text-xs font-semibold">Portfolio</div>
                        <div className="text-[#7C9885] text-[10px] font-semibold">+12.4%</div>
                      </div>
                      {/* Single Bullish Line Chart */}
                      <div className="relative h-16">
                        <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#7C9885" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#7C9885" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {/* Gradient fill */}
                          <path
                            d="M 0,28 C 10,30 18,26 28,24 C 38,22 42,27 52,22 C 62,17 68,19 78,12 C 88,5 95,7 100,5 L 100,40 L 0,40 Z"
                            fill="url(#chartGradient)"
                          />
                          {/* Natural flowing stock line */}
                          <path
                            d="M 0,28 C 10,30 18,26 28,24 C 38,22 42,27 52,22 C 62,17 68,19 78,12 C 88,5 95,7 100,5"
                            fill="none"
                            stroke="#7C9885"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          {/* End dot */}
                          <circle cx="100" cy="5" r="2.5" fill="#7C9885" />
                          <circle cx="100" cy="5" r="1.2" fill="#FEFEFE" />
                        </svg>
                      </div>
                    </div>

                    {/* Portfolio Holdings - ETF Names */}
                    <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-3 mb-3 shadow-sm">
                      <div className="text-[#2D3436] text-xs font-semibold mb-2">Mijn ETF's</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-[#2D3436] text-[10px] font-medium truncate">iShares Core MSCI World</div>
                            <div className="text-[#636E72] text-[9px]">IE00B4L5Y983</div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-[#2D3436] text-[10px] font-medium">50%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-[#2D3436] text-[10px] font-medium truncate">Xtrackers MSCI EM</div>
                            <div className="text-[#636E72] text-[9px]">IE00BTJRMP35</div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-[#2D3436] text-[10px] font-medium">15%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-[#2D3436] text-[10px] font-medium truncate">iShares Euro Bond</div>
                            <div className="text-[#636E72] text-[9px]">IE00B3F81R35</div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-[#2D3436] text-[10px] font-medium">20%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-3">
                      <button className="flex-1 bg-[#7C9885] text-gray-900 rounded-lg py-2 text-[10px] font-semibold">
                        Geld Storten
                      </button>
                      <button className="flex-1 border border-[#E8E8E6] text-[#2D3436] rounded-lg py-2 text-[10px] font-semibold">
                        Geld Opnemen
                      </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg p-2 text-center shadow-sm">
                        <div className="text-[#7C9885] text-xs font-bold">+12.5%</div>
                        <div className="text-[#636E72] text-[8px]">Dit jaar</div>
                      </div>
                      <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg p-2 text-center shadow-sm">
                        <div className="text-[#7C9885] text-xs font-bold">€450</div>
                        <div className="text-[#636E72] text-[8px]">Dividend</div>
                      </div>
                      <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg p-2 text-center shadow-sm">
                        <div className="text-[#7C9885] text-xs font-bold">5</div>
                        <div className="text-[#636E72] text-[8px]">ETF's</div>
                      </div>
                    </div>

                    {/* Bottom branding */}
                    <div className="flex items-center justify-center gap-1 pt-2 border-t border-[#E8E8E6]">
                      <div className="text-[#636E72] text-[8px]">Powered by</div>
                      <div className="text-[#7C9885] text-[9px] font-bold">PIGG</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3D Shadow under phone - offset to match perspective */}
              <div
                className="absolute -bottom-8 w-[85%] h-8"
                style={{
                  left: '15%',
                  background: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)',
                  filter: 'blur(15px)',
                  transform: 'rotateX(60deg)'
                }}
              ></div>
            </div>

          </div>
        </div>
      </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#ECEEED]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-[#2D3436] mb-6">Bij PIGG wordt beleggen leuk!</h2>
            <p className="text-xl text-[#636E72]">Je hebt toegang tot ruim 3000 ETF's wereldwijd.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#FEFEFE]/95 backdrop-blur-sm border border-[#7C9885]/30 rounded-2xl p-8 text-center hover:border-[#7C9885] hover:shadow-lg hover:shadow-[#7C9885]/20 transition-all">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#7C9885]/20 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="#7C9885" viewBox="0 0 24 24" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#2D3436] mb-4">Overzichtelijk</h3>
              <p className="text-[#636E72]">Alle ETF's overzichtelijk op één plek. Filter en vergelijk eenvoudig.</p>
            </div>

            <div className="bg-[#FEFEFE]/95 backdrop-blur-sm border border-[#7C9885]/30 rounded-2xl p-8 text-center hover:border-[#7C9885] hover:shadow-lg hover:shadow-[#7C9885]/20 transition-all">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#7C9885]/20 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="#7C9885" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#2D3436] mb-4">Makkelijk</h3>
              <p className="text-[#636E72]">Stel in een paar klikken je eigen portfolio samen. Simpel en intuïtief.</p>
            </div>

            <div className="bg-[#FEFEFE]/95 backdrop-blur-sm border border-[#7C9885]/30 rounded-2xl p-8 text-center hover:border-[#7C9885] hover:shadow-lg hover:shadow-[#7C9885]/20 transition-all">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#7C9885]/20 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="#7C9885" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#2D3436] mb-4">Geen overbodige kosten</h3>
              <p className="text-[#636E72]">Transparante prijzen zonder verborgen beheerkosten.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Comparison Calculator */}
      <section className="py-20 bg-[#FEFEFE]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-[#2D3436] mb-6">Kostenvergelijking</h2>
            <p className="text-xl text-[#636E72]">Zie hoeveel je bespaart met PIGG</p>
          </div>

          <CostComparisonCalculator />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-[#2D3436] mb-6">Hoe het werkt</h2>
            <p className="text-xl text-[#636E72]">Bij PIGG hoef je geen professional te zijn om je eigen vermogen te beheren</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="bg-gradient-to-br from-[#7C9885]/20 to-[#20D4BA]/10 rounded-3xl p-12 border border-[#7C9885]/30 flex items-center justify-center">
              <svg className="w-32 h-32" fill="none" stroke="#7C9885" viewBox="0 0 24 24" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="18" rx="2"/>
                <path d="M8 3v18M16 3v18M2 9h20M2 15h20"/>
              </svg>
            </div>
            <div className="text-[#2D3436]">
              <h3 className="text-3xl font-bold mb-6">Stel je eigen portefeuille samen</h3>
              <p className="text-lg text-[#636E72] leading-relaxed">
                Stel heel eenvoudig je eigen portefeuille samen met hulp van onze tools.
                Je kunt ook kiezen voor van te voren samengestelde portefeuilles.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-[#2D3436] md:order-2">
              <h3 className="text-3xl font-bold mb-6">Maak een account en begin</h3>
              <p className="text-lg text-[#636E72] leading-relaxed">
                Maak een account aan en begin met beleggen.
                Toegang tot de hele database aan ETF's en alle tools om je eigen modelportefeuille te maken.
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#7C9885]/20 to-[#20D4BA]/10 rounded-3xl p-12 border border-[#7C9885]/30 md:order-1 flex items-center justify-center">
              <svg className="w-32 h-32" fill="none" stroke="#7C9885" viewBox="0 0 24 24" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-[#ECEEED]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-[#2D3436] mb-6">{t.pricing.title}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="bg-[#FEFEFE]/95 backdrop-blur-sm border-2 border-[#E8E8E6] rounded-2xl p-8 flex flex-col h-full">
              <h3 className="text-2xl font-bold text-[#2D3436] mb-4">{t.pricing.free.title}</h3>
              <div className="text-5xl font-bold text-[#2D3436] mb-6">{t.pricing.free.price}<span className="text-xl text-[#636E72]">{t.pricing.free.period}</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {t.pricing.free.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-[#7C9885] text-xl">✓</span>
                    <span className="text-[#636E72]">{feature}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setCurrentPage('register')} className="w-full py-3 border-2 border-[#D5D5D3] text-[#2D3436] rounded-lg hover:border-[#7C9885] transition-all font-semibold mt-auto">
                {t.pricing.free.cta}
              </button>
            </div>

            {/* Paid Plan */}
            <div className="bg-gradient-to-br from-[#7C9885]/10 to-[#20D4BA]/5 border-2 border-[#7C9885] rounded-2xl p-8 relative flex flex-col h-full">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#7C9885] text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                {t.pricing.paid.badge}
              </div>
              <h3 className="text-2xl font-bold text-[#2D3436] mb-4">{t.pricing.paid.title}</h3>
              <div className="text-5xl font-bold text-[#2D3436] mb-6">{t.pricing.paid.price}<span className="text-xl text-[#636E72]">{t.pricing.paid.period}</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {t.pricing.paid.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-[#7C9885] text-xl">✓</span>
                    <span className="text-[#636E72]">{feature}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setCurrentPage('register')} className="w-full py-3 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] transition-all font-bold mt-auto">
                {t.pricing.paid.cta}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ETF Database Preview Section */}
      <section id="etf-preview" className="py-20 bg-[#FEFEFE]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2D3436] mb-4 text-center">{t.etfPreview.title}</h2>
          <p className="text-lg text-[#636E72] mb-10 text-center">{t.etfPreview.subtitle}</p>

          <div className="bg-[#FEFEFE] rounded-2xl shadow-xl p-6 border border-[#E8E8E6] mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E8E6]">
                    <th className="text-left py-3 px-4 text-[#636E72] font-semibold text-sm">{t.etfPreview.name}</th>
                    <th className="text-left py-3 px-4 text-[#636E72] font-semibold text-sm hidden md:table-cell">{t.etfPreview.isin}</th>
                    <th className="text-left py-3 px-4 text-[#636E72] font-semibold text-sm hidden lg:table-cell">{t.etfPreview.category}</th>
                    <th className="text-right py-3 px-4 text-[#636E72] font-semibold text-sm">{t.etfPreview.ter}</th>
                    <th className="text-right py-3 px-4 text-[#636E72] font-semibold text-sm">{t.etfPreview.ytd}</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ETFS.slice(0, 5).map((etf, idx) => (
                    <tr key={idx} className="border-b border-[#E8E8E6] hover:bg-[#ECEEED]/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-[#2D3436] font-medium text-sm">{etf.naam}</div>
                        <div className="text-[#636E72] text-xs md:hidden">{etf.isin}</div>
                      </td>
                      <td className="py-3 px-4 text-[#636E72] text-sm hidden md:table-cell">{etf.isin}</td>
                      <td className="py-3 px-4 text-[#636E72] text-sm hidden lg:table-cell">{etf.categorie}</td>
                      <td className="py-3 px-4 text-right text-[#7C9885] font-medium text-sm">{etf['ter p.a.']}</td>
                      <td className={`py-3 px-4 text-right font-medium text-sm ${safeParseFloat(etf.ytd) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {etf.ytd}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-6">
              <button
                onClick={() => setCurrentPage('register')}
                className="px-8 py-3 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] transition-all font-bold"
              >
                {t.etfPreview.cta}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ETF Detail Preview Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2D3436] mb-4 text-center">{t.etfDetail.title}</h2>
          <p className="text-lg text-[#636E72] mb-10 text-center">{t.etfDetail.subtitle}</p>

          <div className="max-w-3xl mx-auto bg-[#FEFEFE] rounded-xl shadow-2xl border border-[#E8E8E6]">
            <div className="bg-[#FEFEFE] border-b border-[#E8E8E6] px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#2D3436]">{SAMPLE_ETFS[0].naam}</h3>
              <div className="text-2xl text-[#636E72]">×</div>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold mb-2 text-[#2D3436]">{t.etfDetail.basicInfo}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span className="text-[#636E72]">{t.etfPreview.isin}:</span><span className="text-[#636E72]">{SAMPLE_ETFS[0].isin}</span></div>
                    <div className="flex justify-between"><span className="text-[#636E72]">{t.etfPreview.category}:</span><span className="text-[#636E72]">{SAMPLE_ETFS[0].categorie}</span></div>
                    <div className="flex justify-between"><span className="text-[#636E72]">{t.etfPreview.ter}:</span><span className="text-[#7C9885] font-medium">{SAMPLE_ETFS[0]['ter p.a.']}</span></div>
                    <div className="flex justify-between"><span className="text-[#636E72]">{t.etfPreview.ytd}:</span><span className="text-green-500">{SAMPLE_ETFS[0].ytd}</span></div>
                  </div>
                </div>

                <div>
                  <div className="font-semibold mb-2 text-[#2D3436]">{t.etfDetail.details}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span className="text-[#636E72]">{t.etfDetail.fundSize}:</span><span className="text-[#636E72]">€{SAMPLE_ETFS[0]['fund size (in m €)']}M</span></div>
                    <div className="flex justify-between"><span className="text-[#636E72]">{t.etfDetail.vol1y}:</span><span className="text-[#636E72]">{SAMPLE_ETFS[0]['volatility 1y']}</span></div>
                    <div className="flex justify-between"><span className="text-[#636E72]">{t.etfDetail.holdings}:</span><span className="text-[#636E72]">{SAMPLE_ETFS[0].holdings}</span></div>
                    <div className="flex justify-between"><span className="text-[#636E72]">{t.etfDetail.distribution}:</span><span className="text-[#636E72]">{SAMPLE_ETFS[0].distribution}</span></div>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2 text-sm text-[#2D3436]">{t.etfDetail.historicalReturns}</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={[
                    { year: '2021', return: safeParseFloat(SAMPLE_ETFS[0]['2021']) },
                    { year: '2022', return: safeParseFloat(SAMPLE_ETFS[0]['2022']) },
                    { year: '2023', return: safeParseFloat(SAMPLE_ETFS[0]['2023']) },
                    { year: '2024', return: safeParseFloat(SAMPLE_ETFS[0]['2024']) }
                  ]}>
                    <XAxis dataKey="year" tick={{fontSize: 12, fill: '#9CA3AF'}} />
                    <YAxis tick={{fontSize: 12, fill: '#9CA3AF'}} />
                    <Tooltip contentStyle={{backgroundColor: '#1A1B1F', border: '1px solid #374151', color: '#fff'}} />
                    <Bar dataKey="return" fill="#7C9885" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <div className="font-semibold mb-3 text-sm text-[#2D3436]">{t.etfDetail.topHoldings}</div>
                <div className="space-y-2">
                  {[
                    { name: 'Apple Inc.', weight: '7.2%' },
                    { name: 'Microsoft Corp.', weight: '6.8%' },
                    { name: 'NVIDIA Corp.', weight: '5.9%' },
                    { name: 'Amazon.com Inc.', weight: '3.8%' },
                    { name: 'Meta Platforms Inc.', weight: '2.6%' },
                    { name: 'Alphabet Inc. Class A', weight: '2.1%' },
                    { name: 'Alphabet Inc. Class C', weight: '1.8%' },
                    { name: 'Berkshire Hathaway Inc.', weight: '1.7%' },
                    { name: 'Tesla Inc.', weight: '1.5%' },
                    { name: 'Eli Lilly and Co.', weight: '1.4%' }
                  ].map((holding, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 px-2 bg-[#ECEEED]/30 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-[#636E72] text-xs font-mono">{idx + 1}.</span>
                        <span className="text-[#636E72] text-xs">{holding.name}</span>
                      </div>
                      <span className="text-[#7C9885] text-xs font-semibold">{holding.weight}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => setCurrentPage('register')}
                  className="px-8 py-3 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] transition-all font-bold"
                >
                  {t.etfDetail.cta}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-[#2D3436] mb-6">{t.cta.title}</h2>
          <p className="text-xl text-[#636E72] mb-10">{t.cta.subtitle}</p>
          <button
            onClick={() => setCurrentPage('register')}
            className="px-12 py-4 bg-[#7C9885] text-gray-900 rounded-lg text-xl hover:bg-[#20D4BA] transition-all font-bold"
          >
            {t.cta.button}
          </button>
        </div>
      </section>
    </div>
    );
  };

  const LoginPage = () => {
    const [email, setEmail] = useState('demo@pigg.nl');
    const [password, setPassword] = useState('demo123');
    const [error, setError] = useState('');

    const handleLoginClick = async () => {
      const result = await handleLogin(email, password);
      if (!result.success) {
        setError(result.message || t.auth.incorrectCredentials);
      }
    };

    const handleDemoLogin = async () => {
      setEmail('demo@pigg.nl');
      setPassword('demo123');
      const result = await handleLogin('demo@pigg.nl', 'demo123');
      if (!result.success) {
        setError(result.message || t.auth.incorrectCredentials);
      }
    };

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <button onClick={() => setCurrentPage('landing')} className="flex items-center gap-4">
              <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
                {/* Original piggy bank body */}
                <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                {/* Coin slot on top */}
                <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                {/* Gold coin */}
                <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                {/* Pig face - Eyes */}
                <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                {/* Pig snout */}
                <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                {/* Pig ears */}
                <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                {/* Smile */}
                <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                {/* Legs/feet */}
                <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
              </svg>
              <div className="flex flex-col">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D3436]">PIGG</div>
                <div className="text-sm sm:text-base md:text-lg text-[#636E72]">Your digital Piggy Bank for global Investing</div>
              </div>
            </button>
          </div>
        </nav>

        <div className="max-w-md mx-auto mt-8 sm:mt-12 md:mt-20 px-4">
          <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-[#7C9885]">{t.common.welcomeBack}</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 text-[#C0736D] rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#636E72]">{t.common.email}</label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onTouchStart={(e) => e.target.focus()}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                  placeholder={t.common.email}
                  style={{ fontSize: '16px', touchAction: 'manipulation' }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#636E72]">{t.auth.password}</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onTouchStart={(e) => e.target.focus()}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                  placeholder={t.auth.password}
                  style={{ fontSize: '16px', touchAction: 'manipulation' }}
                />
              </div>

              <button
                onClick={handleLoginClick}
                className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-[#7C9885] text-gray-900 rounded-lg sm:rounded-xl hover:bg-[#20D4BA] transition-all font-semibold mt-4 sm:mt-6"
              >
                Inloggen
              </button>

              <button
                onClick={handleDemoLogin}
                className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-gray-700 text-[#2D3436] border-2 border-[#7C9885] rounded-lg sm:rounded-xl hover:bg-gray-600 transition-all font-semibold mt-3"
              >
                🚀 Probeer Demo Account
              </button>
            </div>

            <div className="text-center mt-5 sm:mt-6 text-xs sm:text-sm text-[#636E72]">
              <button onClick={() => setCurrentPage('resetPassword')} className="text-[#7C9885] hover:text-[#20D4BA] hover:underline font-semibold">
                {t.auth.forgotPassword}
              </button>
            </div>

            <p className="text-center mt-3 text-xs sm:text-sm text-[#636E72]">
              Geen account?{' '}
              <button onClick={() => setCurrentPage('register')} className="text-[#7C9885] hover:text-[#20D4BA] hover:underline font-semibold">
                Registreer hier
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ResetPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1: enter email, 2: reset password
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleEmailSubmit = () => {
      if (!email) {
        setError('Vul een email adres in');
        return;
      }

      const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
      if (!customer) {
        setError('Geen account gevonden met dit email adres');
        return;
      }

      setError('');
      setSuccess(t.auth.emailFound);
      setStep(2);
    };

    const handlePasswordReset = () => {
      if (!newPassword || !confirmPassword) {
        setError('Vul alle velden in');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError(t.auth.passwordMismatch);
        return;
      }

      if (newPassword.length < 6) {
        setError(t.auth.passwordMinLength);
        return;
      }

      // Update customer password
      setCustomers(prev => prev.map(customer =>
        customer.email.toLowerCase() === email.toLowerCase()
          ? { ...customer, password: newPassword }
          : customer
      ));

      setError('');
      setSuccess(t.auth.passwordChanged);

      setTimeout(() => {
        setCurrentPage('login');
      }, 2000);
    };

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <button onClick={() => setCurrentPage('landing')} className="flex items-center gap-4">
              <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
                {/* Original piggy bank body */}
                <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                {/* Coin slot on top */}
                <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                {/* Gold coin */}
                <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                {/* Pig face - Eyes */}
                <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                {/* Pig snout */}
                <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                {/* Pig ears */}
                <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                {/* Smile */}
                <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                {/* Legs/feet */}
                <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
              </svg>
              <div className="flex flex-col">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D3436]">PIGG</div>
                <div className="text-sm sm:text-base md:text-lg text-[#636E72]">Your digital Piggy Bank for global Investing</div>
              </div>
            </button>
          </div>
        </nav>

        <div className="max-w-md mx-auto mt-8 sm:mt-12 md:mt-20 px-4">
          <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-[#7C9885]">
              {t.auth.resetPassword}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 text-[#C0736D] rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-600/20 border border-green-600/50 text-[#7C9885] rounded-lg text-sm">
                {success}
              </div>
            )}

            {step === 1 ? (
              <div className="space-y-3 sm:space-y-4">
                <p className="text-sm text-[#636E72] mb-4">
                  {t.auth.enterEmailReset}
                </p>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#636E72]">{t.common.email}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                    placeholder={t.common.email}
                  />
                </div>

                <button
                  onClick={handleEmailSubmit}
                  className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-[#7C9885] text-gray-900 rounded-lg sm:rounded-xl hover:bg-[#20D4BA] transition-all font-semibold mt-4 sm:mt-6"
                >
                  Volgende
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#636E72]">{t.auth.newPassword}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                    placeholder={t.auth.newPassword}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#636E72]">{t.auth.confirmPassword}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                    placeholder={t.auth.confirmPassword}
                  />
                </div>

                <button
                  onClick={handlePasswordReset}
                  className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-[#7C9885] text-gray-900 rounded-lg sm:rounded-xl hover:bg-[#20D4BA] transition-all font-semibold mt-4 sm:mt-6"
                >
                  {t.auth.resetPassword}
                </button>
              </div>
            )}

            <p className="text-center mt-5 sm:mt-6 text-xs sm:text-sm text-[#636E72]">
              <button onClick={() => setCurrentPage('login')} className="text-[#7C9885] hover:text-[#20D4BA] hover:underline font-semibold">
                Terug naar inloggen
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const EmailVerificationPendingPage = () => {
    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <button onClick={() => setCurrentPage('landing')} className="flex items-center gap-4">
              <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
                {/* Original piggy bank body */}
                <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                {/* Coin slot on top */}
                <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                {/* Gold coin */}
                <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                {/* Pig face - Eyes */}
                <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                {/* Pig snout */}
                <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                {/* Pig ears */}
                <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                {/* Smile */}
                <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                {/* Legs/feet */}
                <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
              </svg>
              <div className="flex flex-col">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D3436]">PIGG</div>
                <div className="text-sm sm:text-base md:text-lg text-[#636E72]">Your digital Piggy Bank for global Investing</div>
              </div>
            </button>
          </div>
        </nav>

        <div className="max-w-md mx-auto mt-8 sm:mt-12 md:mt-20 px-4">
          <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 text-center">
            <div className="text-6xl mb-6">📧</div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#7C9885]">Bevestig je Email</h2>
            <p className="text-[#636E72] mb-6">
              We hebben een verificatie link naar je emailadres gestuurd.
              Klik op de link in de email om je account te activeren.
            </p>
            <div className="bg-[#ECEEED]/50 border border-[#E8E8E6] rounded-lg p-4 mb-6">
              <p className="text-sm text-[#636E72]">
                Geen email ontvangen? Controleer je spam folder of probeer het opnieuw te registreren.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('login')}
              className="w-full py-3 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] transition-all font-semibold"
            >
              Ga naar Login
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EmailVerifyPage = () => {
    const [verifying, setVerifying] = useState(true);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
      const verifyEmail = async () => {
        // Get token from URL (handle both lowercase and uppercase)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token') || urlParams.get('Token');

        if (!token) {
          setMessage('Ongeldige verificatie link');
          setVerifying(false);
          return;
        }

        try {
          const response = await fetch(`${API_URL}/verify?token=${token}`);
          const data = await response.json();

          if (data.success) {
            setSuccess(true);
            setMessage(data.message);
          } else {
            setSuccess(false);
            setMessage(data.message);
          }
        } catch (error) {
          console.error('Verification error:', error);
          setSuccess(false);
          setMessage('Er is een fout opgetreden. Probeer het later opnieuw.');
        } finally {
          setVerifying(false);
        }
      };

      verifyEmail();
    }, []);

    // Auto redirect to login after successful verification
    useEffect(() => {
      if (success && countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else if (success && countdown === 0) {
        // Use replace instead of pushState to prevent going back
        window.location.replace('/?page=login');
      }
    }, [success, countdown]);

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <button onClick={() => setCurrentPage('landing')} className="flex items-center gap-4">
              <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
                {/* Original piggy bank body */}
                <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                {/* Coin slot on top */}
                <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                {/* Gold coin */}
                <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                {/* Pig face - Eyes */}
                <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                {/* Pig snout */}
                <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                {/* Pig ears */}
                <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                {/* Smile */}
                <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                {/* Legs/feet */}
                <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
              </svg>
              <div className="flex flex-col">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D3436]">PIGG</div>
                <div className="text-sm sm:text-base md:text-lg text-[#636E72]">Your digital Piggy Bank for global Investing</div>
              </div>
            </button>
          </div>
        </nav>

        <div className="max-w-md mx-auto mt-8 sm:mt-12 md:mt-20 px-4">
          <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 text-center">
            {verifying ? (
              <>
                <div className="text-6xl mb-6">⏳</div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#2D3436]">Email Verifiëren...</h2>
                <p className="text-[#636E72]">Even geduld terwijl we je email verifiëren.</p>
              </>
            ) : success ? (
              <>
                <div className="text-6xl mb-6">✅</div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#7C9885]">Verificatie Gelukt!</h2>
                <p className="text-[#636E72] mb-4">{message}</p>
                <p className="text-[#636E72] mb-6 text-sm">Je wordt automatisch doorgestuurd naar de login pagina in {countdown} seconden...</p>
                <button
                  onClick={() => {
                    window.location.replace('/?page=login');
                  }}
                  className="w-full py-3 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] transition-all font-semibold"
                >
                  Direct naar Login
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-6">❌</div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#C0736D]">Verificatie Mislukt</h2>
                <p className="text-[#636E72] mb-6">{message}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentPage('register')}
                    className="flex-1 py-3 border-2 border-[#E8E8E6] text-[#2D3436] rounded-lg hover:border-[#7C9885] transition-all font-semibold"
                  >
                    Opnieuw Registreren
                  </button>
                  <button
                    onClick={() => setCurrentPage('login')}
                    className="flex-1 py-3 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] transition-all font-semibold"
                  >
                    Naar Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const RegisterPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [street, setStreet] = useState('');
    const [houseNumber, setHouseNumber] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = () => {
      if (!firstName || !lastName || !street || !houseNumber || !postalCode || !city || !phone || !birthDate || !email || !password || !confirmPassword) {
        alert('Vul alstublieft alle velden in');
        return;
      }
      if (password !== confirmPassword) {
        alert('Wachtwoorden komen niet overeen');
        return;
      }
      handleRegister(firstName, lastName, email, password, street, houseNumber, postalCode, city, phone, birthDate);
    };

    return (
      <div className="min-h-screen bg-[#F5F6F4] pb-8">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <button onClick={() => setCurrentPage('landing')} className="flex items-center gap-4">
              <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
                {/* Original piggy bank body */}
                <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                {/* Coin slot on top */}
                <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                {/* Gold coin */}
                <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                {/* Pig face - Eyes */}
                <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                {/* Pig snout */}
                <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                {/* Pig ears */}
                <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                {/* Smile */}
                <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                {/* Legs/feet */}
                <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
              </svg>
              <div className="flex flex-col">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D3436]">PIGG</div>
                <div className="text-sm sm:text-base md:text-lg text-[#636E72]">Your digital Piggy Bank for global Investing</div>
              </div>
            </button>
          </div>
        </nav>

        <div className="max-w-md mx-auto mt-6 sm:mt-8 md:mt-12 mb-8 px-4">
          <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-[#7C9885]">Maak een gratis account</h2>
            <p className="text-xs sm:text-sm text-[#636E72] mb-4 sm:mb-6">Vul uw gegevens in om te registreren</p>

            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[#636E72]">Voornaam *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jan"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[#636E72]">Achternaam *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Jansen"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[#636E72]">Adres *</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Straatnaam"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[#636E72]">Huisnummer *</label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="12"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[#636E72]">Postcode *</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="1234AB"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[#636E72]">Woonplaats *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Amsterdam"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[#636E72]">Telefoonnummer *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 12345678"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[#636E72]">Geboortedatum *</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[#636E72]">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jan@voorbeeld.nl"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[#636E72]">Wachtwoord *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimaal 8 tekens"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[#636E72]">Herhaal Wachtwoord *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Herhaal wachtwoord"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-lg sm:rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
                  required
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-[#7C9885] text-gray-900 rounded-lg sm:rounded-xl hover:bg-[#20D4BA] transition-all font-semibold mt-4 sm:mt-6"
              >
                Account aanmaken
              </button>

              <p className="text-center text-xs sm:text-sm text-[#636E72] mt-3 sm:mt-4">
                Heeft u al een account?{' '}
                <button onClick={() => setCurrentPage('login')} className="text-[#7C9885] font-semibold hover:text-[#20D4BA] hover:underline">
                  Log in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const VerifyCodePage = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleVerifyCode = async () => {
      if (!code || code.length !== 6) {
        setError('Voer een geldige 6-cijferige code in');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_URL}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: pendingVerificationEmail,
            code: code
          })
        });

        const data = await response.json();

        if (data.success) {
          setSuccess(true);
          setTimeout(() => {
            setPendingVerificationEmail(null);
            setCurrentPage('login');
          }, 2000);
        } else {
          setError(data.message || 'Ongeldige verificatiecode');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setError('Er is een fout opgetreden. Probeer het opnieuw.');
      } finally {
        setLoading(false);
      }
    };

    const handleResendCode = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_URL}/resend-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: pendingVerificationEmail
          })
        });

        const data = await response.json();

        if (data.success) {
          alert('Nieuwe verificatiecode is verzonden naar je email');
          setCode('');
        } else {
          setError(data.message || 'Kon geen nieuwe code verzenden');
        }
      } catch (error) {
        console.error('Resend error:', error);
        setError('Er is een fout opgetreden. Probeer het opnieuw.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <button onClick={() => setCurrentPage('landing')} className="flex items-center gap-4">
              <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
                {/* Original piggy bank body */}
                <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                {/* Coin slot on top */}
                <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                {/* Gold coin */}
                <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                {/* Pig face - Eyes */}
                <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                {/* Pig snout */}
                <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                {/* Pig ears */}
                <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                {/* Smile */}
                <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                {/* Legs/feet */}
                <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
              </svg>
              <div className="flex flex-col">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D3436]">PIGG</div>
                <div className="text-sm sm:text-base md:text-lg text-[#636E72]">Your digital Piggy Bank for global Investing</div>
              </div>
            </button>
          </div>
        </nav>

        <div className="max-w-md mx-auto mt-12 px-4">
          <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl shadow-xl p-8">
            {success ? (
              <div className="text-center">
                <div className="mb-4 text-green-500">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#2D3436] mb-2">Email Geverifieerd!</h2>
                <p className="text-[#636E72]">Je wordt doorgestuurd naar de login pagina...</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="mb-4 text-[#7C9885]">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#7C9885] mb-2">Verifieer je Email</h2>
                  <p className="text-[#636E72] text-sm">
                    We hebben een 6-cijferige code verzonden naar<br />
                    <span className="font-semibold text-[#2D3436]">{pendingVerificationEmail}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-[#636E72]">Verificatiecode</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setCode(value);
                        setError('');
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-gray-600"
                      autoFocus
                    />
                    {error && (
                      <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}
                  </div>

                  <button
                    onClick={handleVerifyCode}
                    disabled={loading || code.length !== 6}
                    className="w-full py-3 bg-[#7C9885] text-gray-900 rounded-xl hover:bg-[#20D4BA] transition-all font-bold disabled:bg-gray-700 disabled:text-[#636E72] disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifiëren...' : 'Verifieer Email'}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={handleResendCode}
                      disabled={loading}
                      className="text-[#7C9885] hover:text-[#20D4BA] font-semibold text-sm disabled:text-gray-600 disabled:cursor-not-allowed"
                    >
                      Nieuwe code versturen
                    </button>
                  </div>

                  <p className="text-center text-xs text-[#636E72] mt-4">
                    Code niet ontvangen? Check je spam folder of vraag een nieuwe code aan.
                  </p>

                  <div className="border-t border-[#E8E8E6] mt-6 pt-4">
                    <button
                      onClick={() => {
                        setPendingVerificationEmail(null);
                        setCurrentPage('login');
                      }}
                      className="w-full text-[#636E72] hover:text-[#2D3436] transition-colors text-sm"
                    >
                      ← Terug naar login
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Define filters per category (moved outside component for performance)
  const categoryFiltersMap = useMemo(() => ({
    'Aandelen': ['region', 'valuta', 'issuer', 'sustainability', 'dividend', 'replication', 'tradable'],
    'Obligaties': ['soort', 'valuta', 'issuer', 'sustainability', 'dividend', 'replication', 'tradable'],
    'Commodities': ['soort', 'valuta', 'issuer', 'sustainability', 'dividend', 'replication', 'tradable'],
    'Vastgoed': ['region', 'valuta', 'issuer', 'sustainability', 'dividend', 'replication', 'tradable'],
    'Money market': ['region', 'valuta', 'issuer', 'sustainability', 'dividend', 'replication', 'tradable'],
    'Crypto': ['soort', 'valuta', 'issuer', 'sustainability', 'dividend', 'replication', 'tradable']
  }), []);

  const filterLabels = useMemo(() => ({
    'region': 'Regio',
    'soort': 'Soort',
    'valuta': 'Valuta',
    'issuer': 'Uitgevende instelling',
    'sustainability': 'Sustainability',
    'dividend': 'Dividend',
    'replication': 'Replication',
    'tradable': 'LYNX Handelbaar'
  }), []);

  // Memoize filter options calculation for performance
  const getFilterOptions = useCallback((filterType) => {
    let currentEtfs = etfs.filter(e => e.categorie === selectedMainCategory);

    // Apply existing active filters
    Object.keys(activeFilters).forEach(key => {
      if (activeFilters[key] && key !== filterType) {
        if (key === 'region') {
          currentEtfs = currentEtfs.filter(e => e.subcategorie === activeFilters[key]);
        } else if (key === 'soort') {
          currentEtfs = currentEtfs.filter(e => e.subcategorie === activeFilters[key]);
        } else if (key === 'valuta') {
          currentEtfs = currentEtfs.filter(e => e['fund ccy'] === activeFilters[key]);
        } else if (key === 'sustainability') {
          currentEtfs = currentEtfs.filter(e => e.sustainability === activeFilters[key]);
        } else if (key === 'dividend') {
          currentEtfs = currentEtfs.filter(e => e.distribution === activeFilters[key]);
        } else if (key === 'replication') {
          currentEtfs = currentEtfs.filter(e => e.replication === activeFilters[key]);
        } else if (key === 'issuer') {
          currentEtfs = currentEtfs.filter(e => e.naam && e.naam.toLowerCase().includes(activeFilters[key].toLowerCase()));
        } else if (key === 'tradable') {
          if (activeFilters[key] === 'Ja (LYNX)') {
            currentEtfs = currentEtfs.filter(e => e.isTradableViaLynx === true);
          } else {
            currentEtfs = currentEtfs.filter(e => !e.isTradableViaLynx);
          }
        }
      }
    });

    if (filterType === 'region' || filterType === 'soort') {
      return [...new Set(currentEtfs.map(e => e.subcategorie).filter(Boolean))];
    } else if (filterType === 'valuta') {
      return [...new Set(currentEtfs.map(e => e['fund ccy']).filter(Boolean))];
    } else if (filterType === 'sustainability') {
      return ['Yes', 'No'];
    } else if (filterType === 'dividend') {
      return [...new Set(currentEtfs.map(e => e.distribution).filter(Boolean))];
    } else if (filterType === 'replication') {
      return [...new Set(currentEtfs.map(e => e.replication).filter(Boolean))];
    } else if (filterType === 'issuer') {
      // Extract issuer from ETF name
      const knownIssuers = ['iShares', 'Vanguard', 'Amundi', 'Xtrackers', 'SPDR', 'Lyxor', 'WisdomTree', 'VanEck', 'Invesco', 'UBS', 'HSBC'];
      const issuers = currentEtfs.map(e => {
        const name = e.naam || '';
        for (const issuer of knownIssuers) {
          if (name.toLowerCase().includes(issuer.toLowerCase())) {
            return issuer;
          }
        }
        return null;
      }).filter(Boolean);
      return [...new Set(issuers)].sort();
    } else if (filterType === 'tradable') {
      return ['Ja (LYNX)', 'Nee'];
    }
    return [];
  }, [etfs, selectedMainCategory, activeFilters]);

  const ETFDatabasePage = () => {

    if (loading) {
      return (
        <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-[#2D3436]">ETF data laden...</div>
            <div className="text-[#636E72]">Even geduld aub</div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <button onClick={() => setCurrentPage('mainDashboard')} className="flex items-center gap-2">
                <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                  {/* Original piggy bank body */}
                  <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                  {/* Coin slot on top */}
                  <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                  {/* Gold coin */}
                  <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                  <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                  <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                  {/* Pig face - Eyes */}
                  <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                  <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                  {/* Pig snout */}
                  <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                  <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                  <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                  {/* Pig ears */}
                  <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                  {/* Smile */}
                  <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                  {/* Legs/feet */}
                  <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                  <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
                </svg>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#7C9885]">PIGG</div>
              </button>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
                <button onClick={() => setCurrentPage('welcome')} className="text-[#636E72] hover:text-[#7C9885] font-medium transition-colors text-xs sm:text-sm md:text-base">
                  Home
                </button>
                {portfolio.length > 0 && (
                  <button onClick={() => setCurrentPage('dashboard')} className="text-[#636E72] hover:text-[#7C9885] font-medium transition-colors text-xs sm:text-sm md:text-base">
                    Portfolio ({portfolio.length})
                  </button>
                )}
                <div className="hidden sm:block text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 bg-[#7C9885]/20 rounded-full text-[#7C9885] font-semibold truncate max-w-[100px]">
                  {user?.name?.split(' ')[0]}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[#636E72] hover:text-[#2D3436] font-medium text-xs sm:text-sm md:text-base"
                >
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-[#2D3436]">ETF Database</h1>

          <div className="bg-[#FEFEFE] rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-[#E8E8E6]">
            {/* Search bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Zoek op naam of ISIN..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full px-4 py-3 bg-[#ECEEED] border-2 border-[#E8E8E6] rounded-xl focus:outline-none focus:border-[#7C9885] transition-colors text-[#2D3436] placeholder-[#B2BEC3]"
              />
            </div>

            {/* Tradability toggle */}
            <div className="mb-4 flex items-center justify-between p-3 bg-[#ECEEED]/50 rounded-lg border border-[#E8E8E6]">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyTradable}
                    onChange={(e) => setShowOnlyTradable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FEFEFE] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C9885]"></div>
                </label>
                <span className="text-sm text-[#636E72]">
                  {showOnlyTradable ? 'Alleen LYNX-handelbare ETFs' : 'Alle ETFs (incl. niet-handelbaar)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {showOnlyTradable ? (
                  <span className="text-xs px-2 py-1 bg-[#7C9885]/20 text-[#7C9885] rounded-full">
                    {filteredEtfs.length} handelbaar
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-gray-700 text-[#636E72] rounded-full">
                    {filteredEtfs.filter(e => e.isTradableViaLynx).length} van {filteredEtfs.length} handelbaar
                  </span>
                )}
              </div>
            </div>

            {/* Step 1: Category Selection - Only show if no category selected or in filterSelect step */}
            {(filterStep === 'category' || !selectedMainCategory) && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#636E72] mb-2">Selecteer Categorie</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {['Aandelen', 'Obligaties', 'Commodities', 'Vastgoed', 'Money market', 'Crypto'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedMainCategory(cat);
                        setFilterStep('filterSelect');
                        setActiveFilters({});
                      }}
                      className="px-4 py-3 rounded-lg font-medium transition-all bg-[#ECEEED] text-[#636E72] hover:bg-gray-700 hover:text-[#2D3436]"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Filter Selection - Show available filters for selected category */}
            {selectedMainCategory && filterStep === 'filterSelect' && (
              <div className="mb-4 p-4 bg-[#ECEEED]/50 rounded-lg border border-[#E8E8E6]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-[#7C9885]">
                    Filters voor {selectedMainCategory}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedMainCategory('');
                      setFilterStep('category');
                      setActiveFilters({});
                      setCurrentFilter('');
                    }}
                    className="text-xs text-[#636E72] hover:text-[#2D3436] transition-colors"
                  >
                    ← Terug naar categorieën
                  </button>
                </div>

                {/* Show selected category */}
                <div className="mb-3 p-3 bg-[#FEFEFE]/50 rounded-lg">
                  <p className="text-xs text-[#636E72] mb-2">Geselecteerde categorie:</p>
                  <span className="px-3 py-1 bg-[#7C9885] text-gray-900 rounded-full text-xs font-medium">
                    {selectedMainCategory}
                  </span>
                </div>

                {/* Show active filters */}
                {Object.keys(activeFilters).length > 0 && (
                  <div className="mb-3 p-3 bg-[#FEFEFE]/50 rounded-lg">
                    <p className="text-xs text-[#636E72] mb-2">Actieve filters (klik om te verwijderen):</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(activeFilters).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => {
                            const newFilters = {...activeFilters};
                            delete newFilters[key];
                            setActiveFilters(newFilters);
                          }}
                          className="px-3 py-1 bg-[#7C9885] text-gray-900 rounded-full text-xs font-medium hover:bg-[#20D4BA] transition-colors"
                        >
                          {filterLabels[key]}: {value} ✕
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show available filters as buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {categoryFiltersMap[selectedMainCategory]
                    .filter(f => !activeFilters[f]) // Only show filters that haven't been selected
                    .map(filterType => (
                      <button
                        key={filterType}
                        onClick={() => {
                          setCurrentFilter(filterType);
                          setFilterStep('filterOptions');
                        }}
                        className="px-4 py-3 rounded-lg font-medium transition-all bg-gray-700 text-[#636E72] hover:bg-gray-600 hover:text-[#2D3436]"
                      >
                        {filterLabels[filterType]}
                      </button>
                    ))}
                </div>

                <button
                  onClick={() => {
                    setSelectedMainCategory('');
                    setFilterStep('category');
                    setActiveFilters({});
                    setCurrentFilter('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-[#2D3436] rounded-lg text-sm font-medium transition-colors"
                >
                  Klaar
                </button>
              </div>
            )}

            {/* Step 3: Filter Options - Show options for selected filter */}
            {selectedMainCategory && filterStep === 'filterOptions' && currentFilter && (
              <div className="mb-4 p-4 bg-[#ECEEED]/50 rounded-lg border border-[#E8E8E6]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-[#7C9885]">
                    Selecteer {filterLabels[currentFilter]}
                  </h3>
                  <button
                    onClick={() => {
                      setFilterStep('filterSelect');
                      setCurrentFilter('');
                    }}
                    className="text-xs text-[#636E72] hover:text-[#2D3436] transition-colors"
                  >
                    ← Terug
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {getFilterOptions(currentFilter).map(option => (
                    <button
                      key={option}
                      onClick={() => {
                        setActiveFilters({...activeFilters, [currentFilter]: option});
                        setFilterStep('filterSelect');
                        setCurrentFilter('');
                      }}
                      className="px-4 py-3 rounded-lg font-medium transition-all bg-gray-700 text-[#636E72] hover:bg-gray-600 hover:text-[#2D3436] text-sm"
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setFilterStep('filterSelect');
                    setCurrentFilter('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-[#2D3436] rounded-lg text-sm font-medium transition-colors"
                >
                  Klaar
                </button>
              </div>
            )}

            <div className="text-sm text-[#636E72]">
              Aantal ETFs: {filteredEtfs.length} {etfs.length === SAMPLE_ETFS.length && <span className="text-[#7C9885]">(Sample data - upload Excel voor volledige database)</span>}
            </div>
          </div>

          {/* Mobile view - Cards */}
          <div className="block md:hidden space-y-3">
            {etfPricesLastUpdated && (
              <div className="text-xs text-[#636E72] mb-2">
                Prijzen bijgewerkt: {new Date(etfPricesLastUpdated).toLocaleString('nl-NL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
            {filteredEtfs.map((etf, idx) => {
              const priceData = etfPrices[etf.isin];
              const isAdded = portfolioIsinSet.has(etf.isin);
              return (
              <div key={idx} className={`bg-[#FEFEFE] rounded-lg shadow p-3 border ${etf.isTradableViaLynx ? 'border-[#E8E8E6]' : 'border-[#E8E8E6] opacity-75'}`}>
                <div className="flex items-start justify-between mb-2">
                  <button
                    onClick={() => setSelectedETF(etf)}
                    className={`${etf.isTradableViaLynx ? 'text-[#7C9885] hover:text-[#20D4BA]' : 'text-[#636E72]'} font-medium text-left hover:underline text-sm`}
                  >
                    {etf.naam}
                  </button>
                  {etf.isTradableViaLynx ? (
                    <span className="text-xs px-2 py-0.5 bg-[#7C9885]/20 text-[#7C9885] rounded-full whitespace-nowrap ml-2">LYNX</span>
                  ) : !showOnlyTradable && (
                    <span className="text-xs px-2 py-0.5 bg-gray-700 text-[#636E72] rounded-full whitespace-nowrap ml-2">Niet handelbaar</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div><span className="text-[#636E72]">ISIN:</span> <span className="font-medium text-[#636E72]">{etf.isin}</span></div>
                  <div><span className="text-[#636E72]">Cat:</span> <span className="font-medium text-[#636E72]">{etf.categorie}</span></div>
                  {priceData && (
                    <>
                      <div><span className="text-[#636E72]">Price:</span> <span className="font-medium text-[#2D3436]">{priceData.currency} {priceData.price.toFixed(2)}</span></div>
                      <div><span className="text-[#636E72]">Change:</span> <span className={`font-medium ${priceData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>{priceData.changePercent >= 0 ? '+' : ''}{priceData.changePercent.toFixed(2)}%</span></div>
                    </>
                  )}
                  <div><span className="text-[#636E72]">TER:</span> <span className="font-medium text-[#636E72]">{etf['ter p.a.']}</span></div>
                  <div><span className="text-[#636E72]">YTD:</span> <span className={`font-medium ${safeParseFloat(etf.ytd) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{etf.ytd}</span></div>
                </div>
                {isAdded ? (
                  <button
                    disabled
                    className="w-full px-3 py-2 bg-green-600 text-[#2D3436] text-sm rounded-lg font-medium cursor-default flex items-center justify-center gap-2"
                  >
                    <span>✓</span> Toegevoegd
                  </button>
                ) : (
                  <button
                    onClick={() => addToPortfolio(etf)}
                    className="w-full px-3 py-2 bg-[#7C9885] text-gray-900 text-sm rounded-lg hover:bg-[#20D4BA] transition-all font-medium"
                  >
                    + Toevoegen aan Portfolio
                  </button>
                )}
              </div>
              );
            })}
          </div>

          {/* Desktop view - Table */}
          <div className="hidden md:block bg-[#FEFEFE] rounded-2xl shadow-lg overflow-hidden border border-[#E8E8E6]">
            {etfPricesLastUpdated && (
              <div className="px-4 py-2 bg-[#ECEEED]/30 border-b border-[#E8E8E6]">
                <span className="text-xs text-[#636E72]">
                  Prijzen bijgewerkt: {new Date(etfPricesLastUpdated).toLocaleString('nl-NL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-[#ECEEED]/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#636E72]">Naam</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#636E72]">ISIN</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#636E72]">Categorie</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#636E72]">Current Price</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#636E72]">Change</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#636E72]">Change %</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#636E72]">TER</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#636E72]">YTD</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[#636E72]">Actie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredEtfs.map((etf, idx) => {
                    const priceData = etfPrices[etf.isin];
                    const isAdded = portfolioIsinSet.has(etf.isin);
                    return (
                    <tr key={idx} className={`hover:bg-[#ECEEED]/30 transition-colors ${!etf.isTradableViaLynx ? 'opacity-75' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedETF(etf)}
                            className={`${etf.isTradableViaLynx ? 'text-[#7C9885] hover:text-[#20D4BA]' : 'text-[#636E72]'} font-medium text-left hover:underline`}
                          >
                            {etf.naam}
                          </button>
                          {etf.isTradableViaLynx ? (
                            <span className="text-xs px-2 py-0.5 bg-[#7C9885]/20 text-[#7C9885] rounded-full whitespace-nowrap">LYNX</span>
                          ) : !showOnlyTradable && (
                            <span className="text-xs px-2 py-0.5 bg-gray-700 text-[#636E72] rounded-full whitespace-nowrap">Niet handelbaar</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#636E72]">{etf.isin}</td>
                      <td className="px-4 py-3 text-sm text-[#636E72]">{etf.categorie}</td>
                      <td className="px-4 py-3 text-sm text-right text-[#2D3436] font-medium">
                        {priceData ? `${priceData.currency} ${priceData.price.toFixed(2)}` : '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${priceData && priceData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {priceData ? `${priceData.change >= 0 ? '+' : ''}${priceData.change.toFixed(2)}` : '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${priceData && priceData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {priceData ? `${priceData.changePercent >= 0 ? '+' : ''}${priceData.changePercent.toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-[#636E72]">{etf['ter p.a.']}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${safeParseFloat(etf.ytd) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {etf.ytd}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isAdded ? (
                          <button
                            disabled
                            className="px-4 py-1.5 bg-green-600 text-[#2D3436] text-sm rounded-lg font-medium cursor-default inline-flex items-center gap-1.5"
                          >
                            <span>✓</span> Added
                          </button>
                        ) : (
                          <button
                            onClick={() => addToPortfolio(etf)}
                            className="px-4 py-1.5 bg-[#7C9885] text-gray-900 text-sm rounded-lg hover:bg-[#20D4BA] transition-all font-medium"
                          >
                            + Portfolio
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
      </div>
    );
  };

  const getHistoricalReturns = (etf) => {
    // First try to find by ISIN in SAMPLE_ETFS
    if (etf.isin) {
      const sampleETF = SAMPLE_ETFS.find(e => e.isin === etf.isin);
      if (sampleETF && sampleETF['2021']) {
        return {
          '2021': sampleETF['2021'],
          '2022': sampleETF['2022'],
          '2023': sampleETF['2023'],
          '2024': sampleETF['2024']
        };
      }
    }

    // If ETF already has the data, return it
    if (etf['2021']) {
      return {
        '2021': etf['2021'],
        '2022': etf['2022'],
        '2023': etf['2023'],
        '2024': etf['2024']
      };
    }

    // Fallback: return zeros
    return {
      '2021': '0%',
      '2022': '0%',
      '2023': '0%',
      '2024': '0%'
    };
  };

  const getHoldingsCount = (etf) => {
    const name = (etf.naam || '').toLowerCase();
    const isin = etf.isin || '';
    const category = etf.categorie || '';

    // Return realistic holdings count based on ETF type
    if (name.includes('s&p 500') || isin === 'IE00B5BMR087' || isin === 'IE00B3XXRP09') {
      return 503;
    }
    if (name.includes('msci world') || isin === 'IE00B4L5Y983') {
      return 1463;
    }
    if (name.includes('corporate bond') || name.includes('corporate esg') || isin === 'IE00B3F81R35' || isin === 'IE00BLF7VX27') {
      return 1826;
    }
    if (name.includes('treasury') || isin === 'IE00B3VWN393') {
      return 45;
    }
    if (name.includes('gold') || name.includes('xetra-gold') || isin === 'IE00B4ND3602' || isin === 'IE00B579F325' || isin === 'DE000A0S9GB0') {
      return 1;
    }
    if (name.includes('real estate') || name.includes('epra') || isin === 'LU1812091194' || isin === 'LU1681039480' || isin === 'LU1832418773') {
      return 342;
    }
    if (name.includes('overnight') || name.includes('money market') || isin === 'FR0010510800' || isin === 'LU1190417599' || isin === 'LU2082999306') {
      return 78;
    }

    // Fallback based on category
    if (category === 'Aandelen') return 1200;
    if (category === 'Obligaties') return 800;
    if (category === 'Commodities') return 1;
    if (category === 'Vastgoed') return 300;
    if (category === 'Money market') return 50;

    return 500; // Default
  };

  const getTopHoldingsForETF = (etf) => {
    const subcategory = etf.subcategorie || '';
    const category = etf.categorie || '';
    const name = (etf.naam || '').toLowerCase();
    const isin = etf.isin || '';

    // Generate appropriate holdings based on ETF type
    // First check by name/ISIN for more accurate matching
    if (name.includes('s&p 500') || isin === 'IE00B5BMR087' || isin === 'IE00B3XXRP09') {
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
    }

    if (name.includes('msci world') || isin === 'IE00B4L5Y983') {
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
    }

    if (name.includes('corporate bond') || name.includes('corporate esg') || isin === 'IE00B3F81R35' || isin === 'IE00BLF7VX27') {
      return [
        { name: 'Apple Inc. 3.25%', weight: 2.8, maturity: '2029', rating: 'AA+' },
        { name: 'Microsoft Corp 2.4%', weight: 2.5, maturity: '2030', rating: 'AAA' },
        { name: 'JPMorgan 3.5%', weight: 2.3, maturity: '2028', rating: 'A+' },
        { name: 'Johnson & Johnson 2.95%', weight: 2.1, maturity: '2027', rating: 'AAA' },
        { name: 'Alphabet Inc. 2.05%', weight: 1.9, maturity: '2029', rating: 'AA+' },
        { name: 'Coca-Cola 2.75%', weight: 1.8, maturity: '2030', rating: 'A+' },
        { name: 'Visa Inc. 3.15%', weight: 1.7, maturity: '2028', rating: 'AA-' },
        { name: 'Procter & Gamble 2.8%', weight: 1.6, maturity: '2029', rating: 'AA-' },
        { name: 'Toyota Motor 2.35%', weight: 1.5, maturity: '2027', rating: 'A+' },
        { name: 'Nestlé SA 1.85%', weight: 1.4, maturity: '2028', rating: 'AA' }
      ];
    }

    if (name.includes('treasury') || isin === 'IE00B3VWN393') {
      return [
        { name: 'US Treasury 3Y', weight: 18.5, maturity: '3 jaar', rating: 'AAA' },
        { name: 'US Treasury 5Y', weight: 16.2, maturity: '5 jaar', rating: 'AAA' },
        { name: 'US Treasury 7Y', weight: 15.8, maturity: '7 jaar', rating: 'AAA' },
        { name: 'US Treasury 4Y', weight: 12.3, maturity: '4 jaar', rating: 'AAA' },
        { name: 'US Treasury 6Y', weight: 11.7, maturity: '6 jaar', rating: 'AAA' },
        { name: 'US Treasury 3.5Y', weight: 9.2, maturity: '3.5 jaar', rating: 'AAA' },
        { name: 'US Treasury 4.5Y', weight: 8.1, maturity: '4.5 jaar', rating: 'AAA' },
        { name: 'US Treasury 5.5Y', weight: 4.6, maturity: '5.5 jaar', rating: 'AAA' },
        { name: 'US Treasury 6.5Y', weight: 2.3, maturity: '6.5 jaar', rating: 'AAA' },
        { name: 'US Treasury 3.25Y', weight: 1.3, maturity: '3.25 jaar', rating: 'AAA' }
      ];
    }

    if (name.includes('gold') || name.includes('xetra-gold') || isin === 'IE00B4ND3602' || isin === 'IE00B579F325' || isin === 'DE000A0S9GB0') {
      return [
        { name: 'Physical Gold Holdings', weight: 100, type: 'Precious Metal' }
      ];
    }

    if (name.includes('real estate') || name.includes('epra') || isin === 'LU1812091194' || isin === 'LU1681039480' || isin === 'LU1832418773') {
      return [
        { name: 'Prologis Inc.', weight: 8.5, sector: 'Industrial REITs', country: 'US' },
        { name: 'American Tower Corp.', weight: 6.2, sector: 'Telecom REITs', country: 'US' },
        { name: 'Equinix Inc.', weight: 5.8, sector: 'Data Center REITs', country: 'US' },
        { name: 'Public Storage', weight: 4.9, sector: 'Storage REITs', country: 'US' },
        { name: 'Welltower Inc.', weight: 4.3, sector: 'Healthcare REITs', country: 'US' },
        { name: 'Simon Property Group', weight: 4.1, sector: 'Retail REITs', country: 'US' },
        { name: 'Vonovia SE', weight: 3.8, sector: 'Residential', country: 'DE' },
        { name: 'Segro PLC', weight: 3.6, sector: 'Industrial REITs', country: 'UK' },
        { name: 'Unibail-Rodamco', weight: 3.4, sector: 'Retail REITs', country: 'FR' },
        { name: 'Land Securities', weight: 3.2, sector: 'Diversified REITs', country: 'UK' }
      ];
    }

    if (name.includes('overnight') || name.includes('money market') || isin === 'FR0010510800' || isin === 'LU1190417599' || isin === 'LU2082999306') {
      return [
        { name: 'EUR Overnight Deposits', weight: 45.2, type: 'Cash', rating: 'AAA' },
        { name: 'Short-term Govt Bonds', weight: 25.8, type: 'Government', rating: 'AAA' },
        { name: 'Commercial Paper', weight: 15.3, type: 'Corporate', rating: 'A-1' },
        { name: 'Certificates of Deposit', weight: 8.9, type: 'Bank', rating: 'A-1+' },
        { name: 'Repo Agreements', weight: 4.8, type: 'Collateralized', rating: 'AAA' }
      ];
    }

    // Fallback to category-based logic
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

    const historicalReturns = getHistoricalReturns(etf);
    const historicalData = [
      { year: '2021', return: safeParseFloat(historicalReturns['2021']) },
      { year: '2022', return: safeParseFloat(historicalReturns['2022']) },
      { year: '2023', return: safeParseFloat(historicalReturns['2023']) },
      { year: '2024', return: safeParseFloat(historicalReturns['2024']) }
    ];

    const topHoldings = getTopHoldingsForETF(etf);
    const holdingsCount = etf.holdings || getHoldingsCount(etf);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-[#FEFEFE] rounded-lg max-w-2xl w-full max-h-[70vh] overflow-y-auto border border-[#E8E8E6]" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-[#FEFEFE] border-b border-[#E8E8E6] px-3 py-2 flex justify-between items-center z-10 gap-2">
            <h2 className="text-base font-bold truncate text-[#2D3436]">{etf.naam}</h2>
            <button onClick={onClose} className="text-4xl text-[#636E72] hover:text-[#2D3436] flex-shrink-0 leading-none -mt-2">×</button>
          </div>

          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="font-semibold mb-1 text-[#2D3436]">Basis Info</div>
                <div className="space-y-0.5">
                  <div className="flex justify-between"><span className="text-[#636E72]">ISIN:</span><span className="text-[#636E72]">{etf.isin}</span></div>
                  <div className="flex justify-between"><span className="text-[#636E72]">Categorie:</span><span className="text-[#636E72]">{etf.categorie}</span></div>
                  <div className="flex justify-between"><span className="text-[#636E72]">TER:</span><span className="text-[#7C9885] font-medium">{etf['ter p.a.']}</span></div>
                  <div className="flex justify-between"><span className="text-[#636E72]">YTD:</span><span className={safeParseFloat(etf.ytd) >= 0 ? 'text-green-500' : 'text-red-500'}>{etf.ytd}</span></div>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-1 text-[#2D3436]">Details</div>
                <div className="space-y-0.5">
                  <div className="flex justify-between"><span className="text-[#636E72]">Fund Size:</span><span className="text-[#636E72]">€{etf['fund size (in m €)']}M</span></div>
                  <div className="flex justify-between"><span className="text-[#636E72]">Vol 1Y:</span><span className="text-[#636E72]">{etf['volatility 1y']}</span></div>
                  <div className="flex justify-between"><span className="text-[#636E72]">Holdings:</span><span className="text-[#636E72]">{holdingsCount.toLocaleString('nl-NL')}</span></div>
                  <div className="flex justify-between"><span className="text-[#636E72]">Uitkering:</span><span className="text-[#636E72]">{etf.distribution}</span></div>
                </div>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-1 text-xs text-[#2D3436]">Historisch Rendement</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={historicalData}>
                  <XAxis dataKey="year" tick={{fontSize: 10, fill: '#9CA3AF'}} />
                  <YAxis tick={{fontSize: 10, fill: '#9CA3AF'}} />
                  <Tooltip contentStyle={{backgroundColor: '#1A1B1F', border: '1px solid #374151', color: '#fff'}} />
                  <Bar dataKey="return" fill="#7C9885" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {topHoldings.length > 0 && (
              <div>
                <div className="font-semibold mb-1 text-xs text-[#2D3436]">Top 10 Holdings</div>
                <div className="text-xs space-y-0.5 max-h-32 overflow-y-auto border border-[#E8E8E6] rounded p-2 bg-[#FEFEFE]/30">
                  {topHoldings.map((holding, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-[#E8E8E6] last:border-0">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="text-[#636E72] flex-shrink-0">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-[#636E72]">{holding.name}</div>
                          <div className="text-[#636E72] text-[10px]">
                            {holding.sector || holding.rating || holding.type || '-'}
                          </div>
                        </div>
                      </div>
                      <span className="font-medium ml-2 flex-shrink-0 text-[#636E72]">{holding.weight.toFixed(1)}%</span>
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
                className="flex-1 py-2 bg-[#7C9885] text-gray-900 rounded hover:bg-[#20D4BA] text-xs font-medium"
              >
                + Portfolio
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 border-2 border-[#E8E8E6] rounded hover:bg-[#ECEEED] text-xs font-medium text-[#636E72]"
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
    // categoryFilters state moved to App level to prevent reset on re-renders
    // const [categoryFilters, setCategoryFilters] = React.useState({
    //   subcategorie: '',
    //   currency: '',
    //   distribution: ''
    // });

    // Get required categories based on selected profile
    const getRequiredCategories = () => {
      if (!selectedProfile) return [];
      const config = premadePortfolios[selectedProfile];
      return Object.keys(config.allocation);
    };
    
    const requiredCategories = getRequiredCategories();
    const allCategoriesCompleted = requiredCategories.every(cat => categoriesCompleted[cat]);

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <button onClick={() => setCurrentPage('mainDashboard')} className="flex items-center gap-2">
                <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                  {/* Original piggy bank body */}
                  <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                  {/* Coin slot on top */}
                  <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                  {/* Gold coin */}
                  <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                  <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                  <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                  {/* Pig face - Eyes */}
                  <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                  <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                  {/* Pig snout */}
                  <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                  <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                  <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                  {/* Pig ears */}
                  <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                  {/* Smile */}
                  <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                  {/* Legs/feet */}
                  <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                  <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
                </svg>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#7C9885]">PIGG</div>
              </button>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
                <button onClick={() => setCurrentPage('mainDashboard')} className="text-[#636E72] hover:text-[#7C9885] font-medium transition-colors text-xs sm:text-sm md:text-base">Home</button>
                {portfolio.length > 0 && <button onClick={() => setCurrentPage('dashboard')} className="text-[#636E72] hover:text-[#7C9885] font-medium transition-colors text-xs sm:text-sm md:text-base">Portfolio ({portfolio.length})</button>}
                <div className="hidden sm:block text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 bg-[#7C9885]/20 rounded-full text-[#7C9885] font-semibold truncate max-w-[100px]">{user?.name?.split(' ')[0]}</div>
                <button
                  onClick={handleLogout}
                  className="text-[#636E72] hover:text-[#2D3436] font-medium text-xs sm:text-sm md:text-base"
                >
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 text-center text-[#2D3436]">Kies je beleggingsstrategie</h1>
          <p className="text-center text-sm sm:text-base text-[#636E72] mb-6 sm:mb-8 md:mb-12 px-4">Stel zelf een portfolio samen of kies een vooraf samengestelde portfolio</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-12">
            <button
              onClick={() => {
                if (portfolioType === 'custom') return;
                setPortfolioType('custom');
                setCustomBuildStep('profile');
                setSelectedProfile(null);
                setSelectedCategory(null);
                setCategoriesCompleted({});
                setPortfolio([]);
              }}
              className={`bg-[#FEFEFE] rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 transition-all border text-left ${
                portfolioType === 'custom'
                  ? 'border-[#7C9885] ring-2 ring-[#7C9885]/30 cursor-default'
                  : 'border-[#E8E8E6] hover:shadow-xl hover:border-[#E8E8E6]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎯</div>
                {portfolioType === 'custom' && (
                  <span className="px-2 py-1 bg-[#7C9885]/20 text-[#7C9885] text-xs font-medium rounded-full">Actief</span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-[#2D3436]">Zelf Samenstellen</h3>
              <p className="text-sm sm:text-base text-[#636E72]">Kies een profiel en selecteer je eigen ETF's per categorie</p>
            </button>

            <button
              onClick={() => {
                if (portfolioType === 'premade') return;
                setPortfolioType('premade');
              }}
              className={`bg-[#FEFEFE] rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 transition-all border text-left ${
                portfolioType === 'premade'
                  ? 'border-[#7C9885] ring-2 ring-[#7C9885]/30 cursor-default'
                  : 'border-[#E8E8E6] hover:shadow-xl hover:border-[#E8E8E6]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📊</div>
                {portfolioType === 'premade' && (
                  <span className="px-2 py-1 bg-[#7C9885]/20 text-[#7C9885] text-xs font-medium rounded-full">Actief</span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-[#2D3436]">Vooraf Samengesteld</h3>
              <p className="text-sm sm:text-base text-[#636E72]">Kies een portfolio op basis van risicoprofiel</p>
            </button>
          </div>
          
          {portfolioType === 'custom' && customBuildStep === 'profile' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#2D3436]">Stap 1: Kies je risicoprofiel</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Object.entries(premadePortfolios).map(([key, config]) => {
                  const tradableCategories = getTradableCategories(etfs);
                  const fullyTradable = isProfileFullyTradable(config.allocation, tradableCategories);
                  const tradableCats = Object.keys(config.allocation).filter(cat => tradableCategories.includes(cat));
                  const totalCats = Object.keys(config.allocation).length;

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedProfile(key);
                        setCustomBuildStep('categories');
                      }}
                      className={`bg-[#FEFEFE] rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all text-left border ${fullyTradable ? 'border-[#E8E8E6] hover:border-[#7C9885]' : 'border-[#E8E8E6] hover:border-yellow-500/50'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-base sm:text-lg text-[#2D3436]">{config.name}</h4>
                        {fullyTradable ? (
                          <span className="text-xs px-2 py-0.5 bg-[#7C9885]/20 text-[#7C9885] rounded-full">LYNX</span>
                        ) : totalCats > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full" title="Niet alle categorieën zijn handelbaar via LYNX">
                            {tradableCats.length}/{totalCats}
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-[#636E72] mb-3">
                        {Object.entries(config.allocation).map(([cat, pct]) => {
                          const isCatTradable = tradableCategories.includes(cat);
                          return (
                            <div key={cat} className={isCatTradable ? 'text-[#636E72]' : 'text-[#636E72]'}>
                              {cat}: {pct}%
                              {!isCatTradable && <span className="text-yellow-500/70 ml-1">*</span>}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-xs sm:text-sm text-[#7C9885] font-medium">Verwacht rendement: {(config.expectedReturn * 100).toFixed(1)}%</div>
                      <div className="text-xs sm:text-sm text-[#636E72]">Risico (std dev): {(config.stdDev * 100).toFixed(1)}%</div>
                      {!fullyTradable && totalCats > 0 && (
                        <div className="text-xs text-yellow-500/70 mt-2">* Geen handelbare ETF's beschikbaar</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {portfolioType === 'custom' && customBuildStep === 'categories' && selectedProfile && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#2D3436]">Stap 2: Vul categorieën</h2>
                  <p className="text-[#636E72]">Geselecteerd profiel: {premadePortfolios[selectedProfile].name}</p>
                </div>
                <button
                  onClick={() => {
                    setCustomBuildStep('profile');
                    setSelectedProfile(null);
                    setCategoriesCompleted({});
                    setPortfolio([]);
                  }}
                  className="px-4 py-2 text-[#636E72] hover:text-[#2D3436]"
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
                          ? 'bg-[#7C9885]/10 border-[#7C9885]'
                          : 'bg-[#FEFEFE] border-[#E8E8E6] hover:border-[#7C9885]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg text-[#2D3436]">{category}</h3>
                        {isCompleted && <span className="text-2xl">✓</span>}
                      </div>
                      <p className="text-sm text-[#636E72]">Allocatie: {allocation}%</p>
                      <p className="text-xs text-[#636E72] mt-2">
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
                    className="px-8 py-4 bg-[#7C9885] text-gray-900 rounded-xl hover:bg-[#20D4BA] transition-all font-bold text-lg"
                  >
                    Bekijk Portfolio Voorstel →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {portfolioType === 'custom' && customBuildStep === 'selectETFs' && selectedCategory && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#2D3436]">Stap 3: Selecteer ETF's voor {selectedCategory}</h2>
                  <p className="text-[#636E72]">Vereiste allocatie: {premadePortfolios[selectedProfile].allocation[selectedCategory]}%</p>
                </div>
                <button
                  onClick={() => {
                    setCustomBuildStep('categories');
                    setSelectedCategory(null);
                    setCategoryFilters({ subcategorie: '', currency: '', distribution: '' });
                  }}
                  className="px-4 py-2 text-[#636E72] hover:text-[#2D3436]"
                >
                  ← Terug naar categorieën
                </button>
              </div>

              <div className="bg-[#FEFEFE] rounded-2xl shadow-lg p-6 mb-6 border border-[#E8E8E6]">
                <h3 className="font-semibold mb-4 text-[#2D3436]">Huidige selectie voor {selectedCategory}</h3>
                {portfolio.filter(etf => etf.categorie === selectedCategory).length === 0 ? (
                  <p className="text-[#636E72] text-sm">Nog geen ETF's geselecteerd</p>
                ) : (
                  <div className="space-y-2">
                    {portfolio.filter(etf => etf.categorie === selectedCategory).map((etf, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-[#ECEEED]/50 rounded-lg">
                        <span className="text-sm font-medium text-[#636E72]">{etf.naam}</span>
                        <button
                          onClick={() => {
                            setPortfolio(prev => prev.filter(p => p.isin !== etf.isin));
                          }}
                          className="text-red-500 hover:text-[#C0736D] text-sm"
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
                  className="mt-4 w-full py-3 bg-[#7C9885] text-gray-900 rounded-xl hover:bg-[#20D4BA] transition-all font-semibold"
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
                  <div className="bg-[#FEFEFE] rounded-2xl shadow-lg p-6 mb-6 border border-[#E8E8E6]">
                    <h3 className="font-bold mb-4 text-[#2D3436]">Filters</h3>

                    {/* Subcategorie Filter */}
                    {subcategories.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm mb-2 text-[#636E72]">Subcategorie</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setCategoryFilters({...categoryFilters, subcategorie: ''})}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              !categoryFilters.subcategorie
                                ? 'bg-[#7C9885] text-gray-900'
                                : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
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
                                  ? 'bg-[#7C9885] text-gray-900'
                                  : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
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
                        <h4 className="font-semibold text-sm mb-2 text-[#636E72]">Valuta</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setCategoryFilters({...categoryFilters, currency: ''})}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              !categoryFilters.currency
                                ? 'bg-[#7C9885] text-gray-900'
                                : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
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
                                  ? 'bg-[#7C9885] text-gray-900'
                                  : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
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
                        <h4 className="font-semibold text-sm mb-2 text-[#636E72]">Distributie</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setCategoryFilters({...categoryFilters, distribution: ''})}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              !categoryFilters.distribution
                                ? 'bg-[#7C9885] text-gray-900'
                                : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
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
                                  ? 'bg-[#7C9885] text-gray-900'
                                  : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
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

              <div className="bg-[#FEFEFE] rounded-2xl shadow-lg overflow-hidden border border-[#E8E8E6]">
                <div className="p-4 bg-[#ECEEED]/50">
                  <h3 className="font-bold text-[#2D3436]">Beschikbare {selectedCategory} ETF's</h3>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full">
                    <thead className="bg-[#ECEEED]/30 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#636E72]">Naam</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#636E72]">ISIN</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-[#636E72]">TER</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-[#636E72]">YTD</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-[#636E72]">Actie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {etfs.filter(etf => {
                        if (etf.categorie !== selectedCategory) return false;
                        if (categoryFilters.subcategorie && etf.subcategorie !== categoryFilters.subcategorie) return false;
                        if (categoryFilters.currency && etf['fund ccy'] !== categoryFilters.currency) return false;
                        if (categoryFilters.distribution && etf.distribution !== categoryFilters.distribution) return false;
                        return true;
                      }).map((etf, idx) => {
                        const isAdded = portfolioIsinSet.has(etf.isin);
                        return (
                          <tr key={idx} className="hover:bg-[#ECEEED]/30 transition-colors">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setSelectedETF(etf)}
                                className="text-[#7C9885] hover:text-[#20D4BA] font-medium text-left hover:underline"
                              >
                                {etf.naam}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#636E72]">{etf.isin}</td>
                            <td className="px-4 py-3 text-sm text-right text-[#636E72]">{etf['ter p.a.']}</td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${safeParseFloat(etf.ytd) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {etf.ytd}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isAdded ? (
                                <button
                                  disabled
                                  className="px-4 py-1.5 bg-green-600 text-[#2D3436] text-sm rounded-lg font-medium cursor-default inline-flex items-center gap-1.5"
                                >
                                  <span>✓</span> Toegevoegd
                                </button>
                              ) : (
                                <button
                                  onClick={() => addToPortfolio(etf, 10)}
                                  className="px-4 py-1.5 bg-[#7C9885] text-gray-900 text-sm rounded-lg hover:bg-[#20D4BA] transition-all font-medium"
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
              <h2 className="text-2xl font-bold mb-2 text-[#2D3436]">Kies je Risicoprofiel</h2>
              <p className="text-[#636E72] mb-6">Selecteer een vooraf samengestelde portfolio die past bij jouw beleggingsdoelen</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(premadePortfolios).map(([key, config]) => {
                  const tradableCategories = getTradableCategories(etfs);
                  const fullyTradable = isProfileFullyTradable(config.allocation, tradableCategories);
                  return (
                    <PremadePortfolioCard
                      key={key}
                      portfolioKey={key}
                      config={config}
                      onSelect={createPremadePortfolio}
                      onBuyNow={handleBulkBuyNow}
                      isTradable={fullyTradable}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PortfolioOverviewPage = () => {
    const metrics = calculatePortfolioMetrics();
    const categoryData = Object.entries(metrics.categories)
      .filter(([name, value]) => value > 0) // Filter out 0% categories
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value); // Sort by value descending (highest first)

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <button onClick={() => setCurrentPage('mainDashboard')} className="flex items-center gap-3">
              <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 sm:w-12 sm:h-12">
                {/* Original piggy bank body */}
                <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                {/* Coin slot on top */}
                <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                {/* Gold coin */}
                <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                {/* Pig face - Eyes */}
                <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                {/* Pig snout */}
                <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                {/* Pig ears */}
                <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                {/* Smile */}
                <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                {/* Legs/feet */}
                <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
              </svg>
              <div className="text-2xl sm:text-3xl font-bold text-[#7C9885]">PIGG</div>
            </button>
            <div className="flex items-center gap-6">
              <button onClick={() => setCurrentPage('portfolioBuilder')} className="text-[#636E72] hover:text-[#7C9885]">Portfolio Samenstellen</button>
              <button onClick={() => setCurrentPage('portfolioOverview')} className="text-[#7C9885] font-medium">Portfolio Overzicht</button>
              <div className="text-sm text-[#636E72]">{user?.name}</div>
              <button
                onClick={handleLogout}
                className="text-[#636E72] hover:text-[#2D3436] font-medium"
              >
                {t.common.logout}
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#2D3436]">Portfolio Overzicht</h1>
            <div className="flex gap-3">
              <button onClick={() => setShowEditPortfolio(true)} className="px-6 py-3 border-2 border-[#7C9885] text-[#7C9885] rounded-lg hover:bg-[#7C9885]/10 font-medium">Portfolio Aanpassen</button>
              <button
                onClick={async () => {
                  // Set demo investment details for fictive portfolio
                  const newInvestmentDetails = {
                    goal: 'Demo',
                    horizon: '10',
                    amount: '10000',
                    monthlyContribution: '0',
                    riskProfile: selectedProfile ? premadePortfolios[selectedProfile]?.name || 'Neutraal' : 'Neutraal'
                  };
                  setInvestmentDetails(newInvestmentDetails);
                  setPortfolioValue(10000);

                  // Save to database
                  await savePortfolioToDatabase('fictief');

                  setCurrentPage('dashboard');
                }}
                className="px-6 py-3 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] font-medium"
              >
                Fictieve Portfolio Behouden
              </button>
              <button onClick={() => setCurrentPage('trading')} className="px-6 py-3 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] font-medium">Portfolio Aankopen →</button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-[#FEFEFE] rounded-lg shadow p-6 border border-[#E8E8E6]"><div className="text-sm text-[#636E72] mb-1">Totale TER</div><div className="text-2xl font-bold text-[#7C9885]">{metrics.avgTER.toFixed(2)}%</div></div>
            <div className="bg-[#FEFEFE] rounded-lg shadow p-6 border border-[#E8E8E6]"><div className="text-sm text-[#636E72] mb-1">Aantal ETF's</div><div className="text-2xl font-bold text-[#2D3436]">{portfolio.length}</div></div>
            <div className="bg-[#FEFEFE] rounded-lg shadow p-6 border border-[#E8E8E6]"><div className="text-sm text-[#636E72] mb-1">Backtested Return 2024</div><div className={`text-2xl font-bold ${metrics.backtestReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>{metrics.backtestReturn.toFixed(2)}%</div></div>
            <div className="bg-[#FEFEFE] rounded-lg shadow p-6 border border-[#E8E8E6]"><div className="text-sm text-[#636E72] mb-1">Risico Profiel</div><div className="text-2xl font-bold text-[#2D3436]">Neutraal</div></div>
          </div>

          <div className="bg-[#FEFEFE] rounded-lg shadow p-6 mb-8 border border-[#E8E8E6]">
            <h3 className="font-bold text-lg mb-4 text-[#2D3436]">Asset Allocatie</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#1A1B1F', border: '1px solid #374151', color: '#fff'}} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#FEFEFE] rounded-lg shadow p-6 border border-[#E8E8E6]">
            <h3 className="font-bold text-lg mb-4 text-[#2D3436]">Alle Holdings</h3>
            <div className="space-y-6">
              {Object.entries(
                portfolio.reduce((acc, etf) => {
                  const category = etf.categorie || 'Overig';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(etf);
                  return acc;
                }, {})
              )
              .map(([category, etfs]) => ({
                category,
                etfs,
                weight: etfs.reduce((sum, e) => sum + (e.weight || 0), 0)
              }))
              .filter(item => item.weight > 0) // Filter out 0% categories
              .sort((a, b) => b.weight - a.weight) // Sort by weight descending
              .map(({ category, etfs }) => (
                <div key={category} className="border border-[#E8E8E6] rounded-lg overflow-hidden">
                  <div className="bg-[#ECEEED]/50 px-4 py-3 border-b border-[#E8E8E6]">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-lg text-[#2D3436]">{category}</h4>
                      <span className="text-sm font-medium text-[#636E72]">
                        {etfs.reduce((sum, e) => sum + (e.weight || 0), 0).toFixed(1)}% van portfolio
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#ECEEED]/30">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-[#636E72]">ETF</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-[#636E72]">Weging</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-[#636E72]">TER</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-[#636E72]">Return 2024</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {etfs.map((etf, idx) => (
                          <tr key={idx} className="hover:bg-[#ECEEED]/30">
                            <td className="px-4 py-3 text-sm text-[#636E72]">{etf.naam}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-[#636E72]">{(etf.weight || 0).toFixed(1)}%</td>
                            <td className="px-4 py-3 text-sm text-right text-[#636E72]">{etf['ter p.a.']}</td>
                            <td className={`px-4 py-3 text-sm text-right ${safeParseFloat(etf['2024']) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{etf['2024']}</td>
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
    // Use App-level state instead of local state to prevent reset on re-renders
    // const [localFilters, setLocalFilters] = React.useState({
    //   subcategorie: '',
    //   currency: '',
    //   distribution: ''
    // });

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
        <div className="min-h-screen bg-[#F5F6F4]">
          <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <div className="text-2xl font-bold text-[#7C9885]">PIGG</div>
              <button onClick={() => setCurrentPage('mainDashboard')} className="text-[#636E72] hover:text-[#7C9885]">
                ← Terug naar Dashboard
              </button>
            </div>
          </nav>

          <div className="max-w-6xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-center mb-4 text-[#2D3436]">Kies je Risicoprofiel</h1>
            <p className="text-center text-[#636E72] mb-12">Selecteer het profiel dat het beste bij jouw beleggingsdoelen past</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map(profile => {
                const tradableCategories = getTradableCategories(etfs);
                const config = premadePortfolios[profile.key];
                const fullyTradable = isProfileFullyTradable(config.allocation, tradableCategories);
                const tradableCats = Object.keys(config.allocation).filter(cat => tradableCategories.includes(cat));
                const totalCats = Object.keys(config.allocation).length;

                return (
                  <button
                    key={profile.key}
                    onClick={() => {
                      setSelectedProfile(profile.key);
                      setCategoriesCompleted({});
                      setPortfolio([]);
                      setCustomBuildStep('categories');
                    }}
                    className={`bg-[#FEFEFE] rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all transform hover:scale-105 border-2 text-left ${fullyTradable ? 'border-[#E8E8E6] hover:border-[#7C9885]' : 'border-[#E8E8E6] hover:border-yellow-500/50'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-5xl">{profile.icon}</div>
                      {fullyTradable ? (
                        <span className="text-xs px-2 py-1 bg-[#7C9885]/20 text-[#7C9885] rounded-full font-medium">LYNX</span>
                      ) : totalCats > 0 && (
                        <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full font-medium" title="Niet alle categorieën zijn handelbaar via LYNX">
                          {tradableCats.length}/{totalCats} handelbaar
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-[#2D3436]">{profile.name}</h3>
                    <p className="text-[#636E72] text-sm">{profile.desc}</p>
                    {!fullyTradable && totalCats > 0 && (
                      <p className="text-xs text-yellow-500/70 mt-3">Sommige categorieën zijn niet handelbaar via LYNX</p>
                    )}
                  </button>
                );
              })}
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
        <div className="min-h-screen bg-[#F5F6F4]">
          <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <div className="text-2xl font-bold text-[#7C9885]">PIGG</div>
              <button onClick={() => setCustomBuildStep('profile')} className="text-[#636E72] hover:text-[#7C9885]">
                ← Terug naar Profiel Selectie
              </button>
            </div>
          </nav>

          <div className="max-w-6xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-center mb-4 text-[#2D3436]">Selecteer Beleggingscategorieën</h1>
            <p className="text-center text-[#636E72] mb-4">Profiel: <span className="font-bold text-[#7C9885]">{profileConfig.name}</span></p>
            <p className="text-center text-[#636E72] mb-12">
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
                      setCustomBuilderFilters({ subcategorie: '', currency: '', distribution: '' });
                    }}
                    className={`rounded-2xl shadow-lg p-8 transition-all transform hover:scale-105 border-2 text-left ${
                      isCompleted
                        ? 'bg-[#7C9885]/10 border-[#7C9885]'
                        : 'bg-[#FEFEFE] border-[#E8E8E6] hover:border-[#7C9885]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-5xl">{categoryIcons[category] || '📦'}</div>
                      {isCompleted && <div className="text-3xl">✅</div>}
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-[#2D3436]">{category}</h3>
                    {allocation > 0 && <p className="text-[#636E72]">Weging: {allocation}%</p>}
                    {isCompleted && (
                      <p className="text-[#7C9885] text-sm mt-2">
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
                  onClick={async () => {
                    // Check if user is existing customer (has portfolio value and investment details)
                    const isExistingCustomer = portfolioValue > 0 && investmentDetails.amount;
                    if (isExistingCustomer) {
                      // Save portfolio before going to dashboard
                      await savePortfolioToDatabase(user?.account_type || 'fictief');
                      // Existing customer: go directly to dashboard, keep current portfolio value
                      setCurrentPage('dashboard');
                    } else {
                      // New customer: show account type selection
                      setCustomBuildStep('accountType');
                    }
                  }}
                  className="px-8 py-4 bg-[#7C9885] text-gray-900 rounded-xl text-lg font-bold hover:bg-[#20D4BA] transition-all"
                >
                  Volgende Stap →
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

      // Get all ETFs in this category - ONLY tradable via LYNX
      const allCategoryETFs = etfs.filter(etf =>
        etf.categorie === selectedCategory && etf.isTradableViaLynx
      );
      const subcategories = [...new Set(allCategoryETFs.map(e => e.subcategorie))].filter(Boolean).sort();
      const currencies = [...new Set(allCategoryETFs.map(e => e['fund ccy']))].filter(Boolean).sort();
      const distributions = [...new Set(allCategoryETFs.map(e => e.distribution))].filter(Boolean).sort();

      // Apply filters
      const categoryETFs = allCategoryETFs.filter(etf => {
        if (customBuilderFilters.subcategorie && etf.subcategorie !== customBuilderFilters.subcategorie) return false;
        if (customBuilderFilters.currency && etf['fund ccy'] !== customBuilderFilters.currency) return false;
        if (customBuilderFilters.distribution && etf.distribution !== customBuilderFilters.distribution) return false;
        return true;
      });

      const selectedInCategory = portfolio.filter(p => p.categorie === selectedCategory);

      const handleETFToggle = (etf, e) => {
        if (e) e.stopPropagation();
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
        <div className="min-h-screen bg-[#F5F6F4]">
          <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage('mainDashboard')} className="flex items-center gap-3">
                  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 sm:w-12 sm:h-12">
                    <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>
                    <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>
                    <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                    <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                    <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>
                    <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                    <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
                  </svg>
                  <div className="text-2xl sm:text-3xl font-bold text-[#7C9885]">PIGG</div>
                </button>
                <button onClick={() => {
                  setSelectedCategory(null);
                  setCustomBuildStep('categories');
                  setCustomBuilderFilters({ subcategorie: '', currency: '', distribution: '' });
                }} className="text-[#636E72] hover:text-[#7C9885]">
                  ← Terug naar Categorieën
                </button>
              </div>
              {selectedInCategory.length > 0 && (
                <button
                  onClick={handleContinue}
                  className="px-6 py-2 bg-[#7C9885] text-gray-900 rounded-lg text-sm font-bold hover:bg-[#20D4BA] transition-all"
                >
                  Bevestig Selectie ({selectedInCategory.length}) →
                </button>
              )}
            </div>
          </nav>

          <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-center mb-4 text-[#2D3436]">Selecteer ETF's voor {selectedCategory}</h1>
            <p className="text-center text-[#636E72] mb-2">
              {selectedInCategory.length} ETF(s) geselecteerd (minimaal 1 vereist) • {categoryETFs.length} ETF(s) gevonden
            </p>
            <p className="text-center text-sm text-[#7C9885]/70 mb-8">
              Alleen ETF's die handelbaar zijn via LYNX worden getoond
            </p>

            {/* Filter Buttons */}
            <div className="bg-[#FEFEFE] rounded-xl shadow-lg p-6 mb-8 border border-[#E8E8E6]">
              {/* Subcategorie Filter */}
              {subcategories.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3 text-[#2D3436]">Subcategorie</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCustomBuilderFilters({...customBuilderFilters, subcategorie: ''})}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        !customBuilderFilters.subcategorie
                          ? 'bg-[#7C9885] text-gray-900 shadow-md'
                          : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
                      }`}
                    >
                      Alle
                    </button>
                    {subcategories.map(sub => (
                      <button
                        key={sub}
                        onClick={() => setCustomBuilderFilters({...customBuilderFilters, subcategorie: sub})}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          customBuilderFilters.subcategorie === sub
                            ? 'bg-[#7C9885] text-gray-900 shadow-md'
                            : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
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
                  <h3 className="font-semibold text-lg mb-3 text-[#2D3436]">Valuta</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCustomBuilderFilters({...customBuilderFilters, currency: ''})}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        !customBuilderFilters.currency
                          ? 'bg-[#7C9885] text-gray-900 shadow-md'
                          : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
                      }`}
                    >
                      Alle
                    </button>
                    {currencies.map(curr => (
                      <button
                        key={curr}
                        onClick={() => setCustomBuilderFilters({...customBuilderFilters, currency: curr})}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          customBuilderFilters.currency === curr
                            ? 'bg-[#7C9885] text-gray-900 shadow-md'
                            : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
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
                  <h3 className="font-semibold text-lg mb-3 text-[#2D3436]">Distributie</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCustomBuilderFilters({...customBuilderFilters, distribution: ''})}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        !customBuilderFilters.distribution
                          ? 'bg-[#7C9885] text-gray-900 shadow-md'
                          : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
                      }`}
                    >
                      Alle
                    </button>
                    {distributions.map(dist => (
                      <button
                        key={dist}
                        onClick={() => setCustomBuilderFilters({...customBuilderFilters, distribution: dist})}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          customBuilderFilters.distribution === dist
                            ? 'bg-[#7C9885] text-gray-900 shadow-md'
                            : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
                        }`}
                      >
                        {dist}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {categoryETFs.length === 0 ? (
              <div className="bg-[#FEFEFE] rounded-xl shadow-lg p-12 text-center border border-[#E8E8E6] mb-8">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-[#2D3436] mb-2">Geen handelbare ETF's gevonden</h3>
                <p className="text-[#636E72] mb-4">
                  Er zijn momenteel geen ETF's in deze categorie die handelbaar zijn via LYNX.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setCustomBuildStep('categories');
                  }}
                  className="px-6 py-2 bg-gray-700 text-[#2D3436] rounded-lg hover:bg-gray-600 transition-all"
                >
                  ← Terug naar categorieën
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 mb-8">
                {categoryETFs.map(etf => {
                  const isSelected = selectedInCategory.some(p => p.isin === etf.isin);

                  return (
                    <button
                      key={etf.isin}
                      onClick={(e) => handleETFToggle(etf, e)}
                      className={`bg-[#FEFEFE] rounded-xl shadow p-6 transition-all text-left border-2 ${
                        isSelected
                          ? 'border-[#7C9885] bg-[#7C9885]/10'
                          : 'border-[#E8E8E6] hover:border-[#E8E8E6]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-[#2D3436]">{etf.naam}</h3>
                            <span className="text-xs px-2 py-0.5 bg-[#7C9885]/20 text-[#7C9885] rounded-full">LYNX</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-[#636E72]">ISIN:</span>
                              <div className="font-medium text-[#636E72]">{etf.isin}</div>
                            </div>
                            <div>
                              <span className="text-[#636E72]">TER:</span>
                              <div className="font-medium text-[#636E72]">{etf['ter p.a.']}</div>
                            </div>
                            <div>
                              <span className="text-[#636E72]">Grootte:</span>
                              <div className="font-medium text-[#636E72]">€{formatNumber(etf['fund size (in m €)'])}M</div>
                            </div>
                            <div>
                              <span className="text-[#636E72]">2024:</span>
                              <div className={`font-medium ${parseFloat(etf['2024']) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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
            )}

            {selectedInCategory.length > 0 && (
              <div className="text-center">
                <button
                  onClick={handleContinue}
                  className="px-8 py-4 bg-[#7C9885] text-gray-900 rounded-xl text-lg font-bold hover:bg-[#20D4BA] transition-all"
                >
                  Bevestig Selectie →
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderAccountTypeSelection = () => {
      return (
        <div className="min-h-screen bg-[#F5F6F4]">
          <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <div className="text-2xl font-bold text-[#7C9885]">PIGG</div>
              <button onClick={() => setCustomBuildStep('categories')} className="text-[#636E72] hover:text-[#7C9885]">
                ← Terug naar Categorieën
              </button>
            </div>
          </nav>

          <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-center mb-4 text-[#2D3436]">Kies je Account Type</h1>
            <p className="text-center text-[#636E72] mb-12">Je hebt {portfolio.length} ETF(s) geselecteerd voor je portfolio</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fictieve Portfolio */}
              <div className="bg-[#FEFEFE] rounded-2xl shadow-lg p-8 border-2 border-[#E8E8E6] hover:border-[#7C9885] transition-all">
                <div className="text-5xl mb-4 text-center">📊</div>
                <h3 className="text-2xl font-bold mb-4 text-[#2D3436] text-center">Fictieve Portfolio</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <span className="text-[#7C9885]">✓</span>
                    <span className="text-[#636E72]">Gratis demo portfolio</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#7C9885]">✓</span>
                    <span className="text-[#636E72]">Test de applicatie zonder risico</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#7C9885]">✓</span>
                    <span className="text-[#636E72]">Simuleer investeringen</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#7C9885]">✓</span>
                    <span className="text-[#636E72]">Geen echte transacties</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setPortfolioValue(10000); // Default fictive value

                    // Set basic investment details if not set
                    if (!investmentDetails.amount || !investmentDetails.riskProfile) {
                      setInvestmentDetails({
                        goal: 'Demo',
                        horizon: '10',
                        amount: '10000',
                        monthlyContribution: '0',
                        riskProfile: 'Neutraal'
                      });
                    }

                    // Save to database
                    await savePortfolioToDatabase('fictief');

                    setCurrentPage('dashboard');
                  }}
                  className="w-full py-3 bg-gray-700 text-[#2D3436] rounded-xl hover:bg-gray-600 transition-all font-bold"
                >
                  Start met Fictieve Portfolio
                </button>
              </div>

              {/* Echte Portfolio */}
              <div className="bg-[#FEFEFE] rounded-2xl shadow-lg p-8 border-2 border-[#7C9885] transition-all">
                <div className="text-5xl mb-4 text-center">💎</div>
                <h3 className="text-2xl font-bold mb-4 text-[#2D3436] text-center">Echte Portfolio</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <span className="text-[#7C9885]">✓</span>
                    <span className="text-[#636E72]">Professioneel beheerde portfolio</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#7C9885]">✓</span>
                    <span className="text-[#636E72]">Echte investeringen</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#7C9885]">✓</span>
                    <span className="text-[#636E72]">Volledige ondersteuning</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#7C9885]">✓</span>
                    <span className="text-[#636E72]">Start vanaf €100</span>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentPage('trading')}
                  className="w-full py-3 bg-[#7C9885] text-gray-900 rounded-xl hover:bg-[#20D4BA] transition-all font-bold"
                >
                  Portfolio Aankopen via LYNX
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    if (customBuildStep === 'profile') return renderProfileSelection();
    if (customBuildStep === 'categories') return renderCategorySelection();
    if (customBuildStep === 'selectETFs') return renderETFSelection();
    if (customBuildStep === 'accountType') return renderAccountTypeSelection();
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
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <button onClick={() => setCurrentPage('mainDashboard')} className="flex items-center gap-3">
              <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 sm:w-12 sm:h-12">
                {/* Original piggy bank body */}
                <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                {/* Coin slot on top */}
                <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                {/* Gold coin */}
                <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                {/* Pig face - Eyes */}
                <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                {/* Pig snout */}
                <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                {/* Pig ears */}
                <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                {/* Smile */}
                <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                {/* Legs/feet */}
                <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
              </svg>
              <div className="text-2xl sm:text-3xl font-bold text-[#7C9885]">PIGG</div>
            </button>
            <button
              onClick={handleLogout}
              className="text-[#636E72] hover:text-[#2D3436] font-medium"
            >
              Uitloggen
            </button>
          </div>
        </nav>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8 text-center text-[#2D3436]">Upgrade naar Betaald Account</h1>
          {step === 1 && (
            <div className="bg-[#FEFEFE] rounded-lg shadow-lg p-8 space-y-8 border border-[#E8E8E6]">
              <div>
                <label className="block text-lg font-bold mb-4 text-[#2D3436]">Doelstelling</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, goal: 'Vermogensopbouw'}); setShowGoalCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.goal === 'Vermogensopbouw' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>Vermogensopbouw</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, goal: 'Pensioen'}); setShowGoalCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.goal === 'Pensioen' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>Pensioen</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, goal: 'Inkomsten'}); setShowGoalCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.goal === 'Inkomsten' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>Inkomsten</button>
                  <button onClick={() => { setShowGoalCustom(true); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${showGoalCustom ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>Anders</button>
                </div>
                {showGoalCustom && <input type="text" value={investmentDetails.goalCustom} onChange={(e) => setInvestmentDetails({...investmentDetails, goal: e.target.value, goalCustom: e.target.value})} placeholder="Vul je eigen doelstelling in" className="mt-3 w-full px-4 py-3 border-2 border-[#E8E8E6] rounded focus:outline-none focus:border-[#7C9885] bg-[#FEFEFE] text-[#2D3436] placeholder-[#B2BEC3]" />}
              </div>
              
              <div>
                <label className="block text-lg font-bold mb-4 text-[#2D3436]">Beleggingshorizon</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, horizon: '5'}); setShowHorizonCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.horizon === '5' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>5 jaar</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, horizon: '10'}); setShowHorizonCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.horizon === '10' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>10 jaar</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, horizon: '20'}); setShowHorizonCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.horizon === '20' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>20 jaar</button>
                  <button onClick={() => { setShowHorizonCustom(true); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${showHorizonCustom ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>Anders</button>
                </div>
                {showHorizonCustom && <input type="number" value={investmentDetails.horizonCustom} onChange={(e) => setInvestmentDetails({...investmentDetails, horizon: e.target.value, horizonCustom: e.target.value})} placeholder="Aantal jaren" className="mt-3 w-full px-4 py-3 border-2 border-[#E8E8E6] rounded focus:outline-none focus:border-[#7C9885] bg-[#FEFEFE] text-[#2D3436] placeholder-[#B2BEC3]" />}
              </div>
              
              <div>
                <label className="block text-lg font-bold mb-4 text-[#2D3436]">Te Beleggen Vermogen</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, amount: '10000'}); setShowAmountCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.amount === '10000' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>€ 10.000</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, amount: '25000'}); setShowAmountCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.amount === '25000' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>€ 25.000</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, amount: '50000'}); setShowAmountCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.amount === '50000' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>€ 50.000</button>
                  <button onClick={() => { setShowAmountCustom(true); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${showAmountCustom ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>Anders</button>
                </div>
                {showAmountCustom && <input type="text" value={investmentDetails.amountCustom} onChange={(e) => { const val = e.target.value.replace(/[^\d]/g, ''); setInvestmentDetails({...investmentDetails, amount: val, amountCustom: val}); }} placeholder="€ 0" className="mt-3 w-full px-4 py-3 border-2 border-[#E8E8E6] rounded focus:outline-none focus:border-[#7C9885] text-lg bg-[#FEFEFE] text-[#2D3436] placeholder-[#B2BEC3]" />}
              </div>

              <div>
                <label className="block text-lg font-bold mb-4 text-[#2D3436]">Maandelijkse Storting</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, monthlyContribution: '100'}); setShowMonthlyCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.monthlyContribution === '100' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>€ 100</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, monthlyContribution: '250'}); setShowMonthlyCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.monthlyContribution === '250' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>€ 250</button>
                  <button onClick={() => { setInvestmentDetails({...investmentDetails, monthlyContribution: '500'}); setShowMonthlyCustom(false); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.monthlyContribution === '500' ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>€ 500</button>
                  <button onClick={() => { setShowMonthlyCustom(true); }} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${showMonthlyCustom ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>Anders</button>
                </div>
                {showMonthlyCustom && <input type="text" value={investmentDetails.monthlyContributionCustom} onChange={(e) => { const val = e.target.value.replace(/[^\d]/g, ''); setInvestmentDetails({...investmentDetails, monthlyContribution: val, monthlyContributionCustom: val}); }} placeholder="€ 0" className="mt-3 w-full px-4 py-3 border-2 border-[#E8E8E6] rounded focus:outline-none focus:border-[#7C9885] text-lg bg-[#FEFEFE] text-[#2D3436] placeholder-[#B2BEC3]" />}
              </div>

              <div>
                <label className="block text-lg font-bold mb-4 text-[#2D3436]">Risicoprofiel</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(premadePortfolios).map(([key, config]) => (
                    <button key={key} onClick={() => setInvestmentDetails({...investmentDetails, riskProfile: config.name})} className={`px-6 py-4 border-2 rounded-lg font-medium transition ${investmentDetails.riskProfile === config.name ? 'border-[#7C9885] bg-[#7C9885]/20 text-[#7C9885]' : 'border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]'}`}>
                      <div>{config.name}</div>
                      <div className="text-xs text-[#636E72] mt-1">{(config.expectedReturn * 100).toFixed(1)}% verwacht rendement</div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(2)} disabled={!canProceed} className="w-full py-4 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] font-medium text-lg disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-[#636E72]">Volgende Stap →</button>
            </div>
          )}
          {step === 2 && (
            <div className="bg-[#FEFEFE] rounded-lg shadow-lg p-8 space-y-6 text-center border border-[#E8E8E6]">
              <div className="text-6xl mb-4">💳</div>
              <h2 className="text-2xl font-bold text-[#2D3436]">Stort je beginbedrag</h2>
              <p className="text-[#636E72]">Stort {formatEuro(parseInt(investmentDetails.amount))} via iDEAL om je portfolio te activeren</p>
              <div className="bg-[#7C9885]/20 p-6 rounded-lg border border-[#7C9885]/30"><div className="text-4xl font-bold text-[#7C9885] mb-2">{formatEuro(parseInt(investmentDetails.amount))}</div><div className="text-sm text-[#636E72]">Te storten bedrag</div></div>
              <button onClick={async () => {
                console.log('💰 PAYMENT BUTTON CLICKED');
                setPortfolioValue(parseFloat(investmentDetails.amount) || 10000);

                // Save portfolio and investment details to database using the helper function
                await savePortfolioToDatabase('betaald');

                setCurrentPage('dashboard');
              }} className="w-full py-4 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] font-medium text-lg">Betalen met iDEAL →</button>
              <button onClick={() => setStep(1)} className="text-[#636E72] hover:text-[#2D3436]">← Terug</button>
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
    const [showEditChoice, setShowEditChoice] = useState(false);
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdrawal, setShowWithdrawal] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    // const [portfolioEvents, setPortfolioEvents] = useState([]); // Track deposits, withdrawals, profile changes
    const metrics = calculatePortfolioMetrics();

    const horizon = parseInt(investmentDetails.horizon) || 10;
    // Fix: parseFloat("") gives NaN, so we need to check for valid values
    const amountValue = investmentDetails.amount && investmentDetails.amount !== ''
      ? parseFloat(investmentDetails.amount)
      : null;
    const initialValue = (amountValue && !isNaN(amountValue)) ? amountValue : 10000;
    const monthlyContribution = parseFloat(investmentDetails.monthlyContribution) || 500;
    const months = horizon * 12;

    // Fix: if amount is empty, initialize it with the current portfolio value
    useEffect(() => {
      if ((!investmentDetails.amount || investmentDetails.amount === '') && staticPerformanceData && staticPerformanceData[0]) {
        const initialPortfolioValue = staticPerformanceData[0].portfolioValue || 10000;
        const updatedDetails = {
          ...investmentDetails,
          amount: initialPortfolioValue.toString()
        };
        console.log('🔧 Initializing empty investmentDetails.amount with:', initialPortfolioValue);
        setInvestmentDetails(updatedDetails);
        localStorage.setItem('investmentDetails', JSON.stringify(updatedDetails));
      }
    }, [staticPerformanceData, investmentDetails, setInvestmentDetails]);

    // Debug log
    console.log('💰 Dashboard investmentDetails:', {
      rawAmount: investmentDetails.amount,
      amountValue,
      initialValue,
      fullDetails: investmentDetails
    });

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

    // Monte Carlo simulation - now simulates percentage returns instead of absolute values
    const runMonteCarloSimulation = useCallback((scenarios = 1000) => {
      const allSimulations = [];

      for (let sim = 0; sim < scenarios; sim++) {
        // Start with 0% return
        let cumulativeReturn = 0;
        const simulation = [0]; // Month 0: 0% return

        for (let month = 1; month <= months; month++) {
          // Generate monthly return using normal distribution
          // Annual return / 12 for monthly, stdDev / sqrt(12) for monthly volatility
          const monthlyReturn = generateNormalRandom(avgReturn / 12, stdDev / Math.sqrt(12));

          // Calculate cumulative return: (1 + old_return) * (1 + new_return) - 1
          cumulativeReturn = (1 + cumulativeReturn) * (1 + monthlyReturn) - 1;

          // Store as percentage
          simulation.push(cumulativeReturn * 100);
        }
        allSimulations.push(simulation);
      }

      // Calculate percentiles for each month
      const performanceData = [];
      for (let month = 0; month <= months; month++) {
        const monthReturns = allSimulations.map(sim => sim[month]).sort((a, b) => a - b);

        const date = new Date();
        date.setMonth(date.getMonth() + month);

        // Use 10th percentile for poor, median for expected, 90th percentile for good
        const p10 = monthReturns[Math.floor(scenarios * 0.10)];
        const p50 = monthReturns[Math.floor(scenarios * 0.50)];
        const p90 = monthReturns[Math.floor(scenarios * 0.90)];

        // Calculate portfolio value based on expected return percentage
        // This is used for display purposes (Totale Waarde, etc.)
        const totalInvested = initialValue + (monthlyContribution * month);
        const portfolioValue = totalInvested * (1 + p50 / 100);

        performanceData.push({
          date: date.toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' }),
          poor: p10,
          expected: p50,
          good: p90,
          portfolioValue: portfolioValue
        });
      }

      return performanceData;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [months, avgReturn, stdDev, generateNormalRandom, initialValue, monthlyContribution]);

    // Load saved simulation state from database on mount
    useEffect(() => {
      // Only load simulation state if we don't have it yet
      if (staticPerformanceData) return;

      const loadSimulationState = async () => {
        if (user && user.id) {
          try {
            const response = await fetch(`${API_URL}/simulation-state?customer_id=${user.id}`);
            const data = await response.json();

            if (data.success && data.state) {
              // Load saved simulation state
              setStaticPerformanceData(data.state.performanceData);
              setCurrentMonth(data.state.currentMonth);
              setIsAnimating(false); // Keep it paused
            } else if (portfolio && portfolio.length > 0) {
              // No saved state, generate new simulation
              const generatedData = runMonteCarloSimulation(1000);
              setStaticPerformanceData(generatedData);
              setCurrentMonth(0);
            }
          } catch (error) {
            console.error('Error loading simulation state:', error);
            // Fallback: generate new simulation
            if (portfolio && portfolio.length > 0) {
              const generatedData = runMonteCarloSimulation(1000);
              setStaticPerformanceData(generatedData);
              setCurrentMonth(0);
            }
          }
        } else if (portfolio && portfolio.length > 0) {
          // No user logged in, just generate simulation
          const generatedData = runMonteCarloSimulation(1000);
          setStaticPerformanceData(generatedData);
          setCurrentMonth(0);
        }
      };

      loadSimulationState();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

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

    // Auto-save portfolio value every 10 seconds while running
    useEffect(() => {
      if (user && user.id && staticPerformanceData && currentMonth >= 0) {
        const savePortfolioValue = async () => {
          try {
            // Fix: handle empty string and NaN
            const amountVal = investmentDetails.amount && investmentDetails.amount !== ''
              ? parseFloat(investmentDetails.amount)
              : null;
            const currentInvestedAmount = (amountVal && !isNaN(amountVal)) ? amountVal : 10000;
            const currentValue = staticPerformanceData[currentMonth]?.portfolioValue || currentInvestedAmount;
            // Calculate return including monthly contributions
            const totalInvestedNow = currentInvestedAmount + (monthlyContribution * currentMonth);
            const returnPct = totalInvestedNow > 0
              ? ((currentValue - totalInvestedNow) / totalInvestedNow * 100).toFixed(2)
              : '0.00';

            await fetch(`${API_URL}/update-portfolio-value`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                customer_id: user.id,
                current_portfolio_value: currentValue,
                total_return: parseFloat(returnPct)
              })
            });
            console.log('📊 Portfolio value auto-saved:', currentValue, 'Totaal Ingelegd:', totalInvestedNow, 'Return:', returnPct + '%');
          } catch (error) {
            console.error('Error auto-saving portfolio value:', error);
          }
        };

        // Save immediately
        savePortfolioValue();

        // Then save every 10 seconds
        const interval = setInterval(savePortfolioValue, 10000);
        return () => clearInterval(interval);
      }
    }, [currentMonth, staticPerformanceData, user, investmentDetails.amount]);

    const toggleAnimation = async () => {
      if (currentMonth >= months) {
        // Restart from beginning
        setCurrentMonth(0);
        setIsAnimating(true);
      } else {
        const newAnimatingState = !isAnimating;
        setIsAnimating(newAnimatingState);

        // If pausing (newAnimatingState is false), save the state
        if (!newAnimatingState && user && user.id) {
          try {
            // Save simulation state
            await fetch(`${API_URL}/simulation-state`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                customer_id: user.id,
                currentMonth: currentMonth,
                performanceData: staticPerformanceData
              })
            });

            // Also save current portfolio value
            const currentValue = staticPerformanceData[currentMonth]?.portfolioValue || initialValue;
            const returnPct = ((currentValue - initialValue) / initialValue * 100).toFixed(2);

            await fetch(`${API_URL}/update-portfolio-value`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                customer_id: user.id,
                current_portfolio_value: currentValue,
                total_return: parseFloat(returnPct)
              })
            });
          } catch (error) {
            console.error('Error saving simulation state:', error);
          }
        }
      }
    };

    const resetSimulation = async () => {
      setCurrentMonth(0);
      setIsAnimating(true);

      // Clear saved simulation state from database
      if (user && user.id) {
        try {
          await fetch(`${API_URL}/simulation-state`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customer_id: user.id,
              action: 'clear'
            })
          });
        } catch (error) {
          console.error('Error clearing simulation state:', error);
        }
      }
    };

    // Check if portfolio is empty - show quick start options instead of blocking
    if (!portfolio || portfolio.length === 0) {
      return (
        <div className="min-h-screen bg-[#F5F6F4] p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🚀</div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#2D3436] mb-3">
                Begin met beleggen
              </h1>
              <p className="text-[#636E72] text-lg max-w-2xl mx-auto">
                Kies een kant-en-klaar portfolio dat past bij jouw risicoprofiel en begin direct met investeren.
              </p>
            </div>

            {/* Portfolio Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Object.entries(TRADABLE_PORTFOLIO_DEFINITIONS)
                .filter(([key]) => key !== 'free')
                .map(([key, config]) => (
                  <PremadePortfolioCard
                    key={key}
                    portfolioKey={key}
                    config={{
                      name: config.name,
                      allocation: config.holdings.reduce((acc, h) => {
                        acc[h.category] = (acc[h.category] || 0) + h.weight;
                        return acc;
                      }, {}),
                      expectedReturn: config.expectedReturn,
                      stdDev: config.stdDev
                    }}
                    onSelect={(profileKey) => {
                      // Navigate to portfolio builder with this profile
                      setSelectedProfile(profileKey);
                      setCurrentPage('portfolioBuilder');
                    }}
                    onBuyNow={handleBulkBuyNow}
                    isTradable={true}
                  />
                ))}
            </div>

            {/* Alternative options */}
            <div className="text-center">
              <p className="text-[#636E72] mb-4">Of bouw je eigen portfolio</p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setCurrentPage('portfolioBuilder')}
                  className="px-6 py-3 bg-[#ECEEED] text-[#2D3436] rounded-lg hover:bg-gray-700 font-medium border border-[#E8E8E6]"
                >
                  Custom Portfolio Bouwen
                </button>
                <button
                  onClick={() => setCurrentPage('trading')}
                  className="px-6 py-3 bg-[#ECEEED] text-[#2D3436] rounded-lg hover:bg-gray-700 font-medium border border-[#E8E8E6]"
                >
                  Direct naar Trading
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!staticPerformanceData) {
      return (
        <div className="min-h-screen bg-[#F5F6F4] flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-[#2D3436]">Dashboard laden...</div>
            <div className="text-[#636E72]">Monte Carlo simulatie wordt berekend...</div>
          </div>
        </div>
      );
    }

    // Create display data - Monte Carlo already returns percentages
    const performanceData = staticPerformanceData.map((point, i) => {
      // Portfolio line shows expected scenario up to current month
      // This represents the median expected return path
      const portfolioReturn = i <= currentMonth ? point.expected : null;

      return {
        ...point,
        portfolio: portfolioReturn,
        poor: point.poor,      // Already in percentage
        expected: point.expected,  // Already in percentage
        good: point.good       // Already in percentage
      };
    });

    // Calculate current portfolio value based on animation progress
    const animatedPortfolioValue = staticPerformanceData[currentMonth]?.portfolioValue || initialValue;
    const totalInvestedAtCurrentMonth = initialValue + (monthlyContribution * currentMonth);
    const totalReturn = ((animatedPortfolioValue - totalInvestedAtCurrentMonth) / totalInvestedAtCurrentMonth * 100).toFixed(2);
    const categoryData = Object.entries(metrics.categories)
      .filter(([name, value]) => value > 0) // Filter out 0% categories
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value); // Sort by value descending (highest first)

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        {/* Market Indices Ticker - Beurskoersen balk */}
        <MarketIndicesTicker />

        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <button onClick={() => setCurrentPage('mainDashboard')} className="flex items-center gap-2 sm:gap-3">
                <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                  {/* Original piggy bank body */}
                  <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                  {/* Coin slot on top */}
                  <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                  {/* Gold coin */}
                  <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                  <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                  <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                  {/* Pig face - Eyes */}
                  <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                  <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                  {/* Pig snout */}
                  <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                  <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                  <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                  {/* Pig ears */}
                  <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                  {/* Smile */}
                  <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                  {/* Legs/feet */}
                  <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                  <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
                </svg>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold text-[#2D3436]">PIGG</div>
              </button>
              <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                <button onClick={() => setCurrentPage('welcome')} className="hidden sm:block text-[#636E72] hover:text-[#2D3436] text-xs sm:text-sm md:text-base">Home</button>
                <button onClick={() => setCurrentPage('dashboard')} className="text-[#7C9885] font-medium text-xs sm:text-sm md:text-base">Dashboard</button>
                <div className="hidden lg:block text-xs sm:text-sm text-[#636E72] truncate max-w-[100px]">{user?.name}</div>
                <button
                  onClick={handleLogout}
                  className="text-[#636E72] hover:text-[#2D3436] font-medium text-xs sm:text-sm md:text-base"
                >
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2D3436]">Mijn Dashboard</h1>
              {investmentDetails.pricesLastUpdated && (
                <p className="text-xs sm:text-sm text-[#636E72] mt-1">
                  Prijzen bijgewerkt: {new Date(investmentDetails.pricesLastUpdated).toLocaleString('nl-NL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  console.log('Button clicked!');
                  try {
                    generatePortfolioReport(user, portfolio, metrics, investmentDetails, staticPerformanceData, currentMonth, animatedPortfolioValue);
                  } catch (err) {
                    console.error('Error in button click handler:', err);
                    alert('Fout bij het genereren van het rapport: ' + err.message);
                  }
                }}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                📄 <span className="hidden sm:inline">Download Rapport</span><span className="sm:hidden">Rapport</span>
              </button>
              <button onClick={() => setShowDeposit(true)} className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 border-2 border-slate-700 text-[#2D3436] rounded-lg hover:border-[#7C9885] font-semibold text-sm sm:text-base">Storten</button>
              <button onClick={() => setShowWithdrawal(true)} className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 border-2 border-slate-700 text-[#2D3436] rounded-lg hover:border-[#7C9885] font-semibold text-sm sm:text-base">Opnemen</button>
              <button onClick={() => setShowEditChoice(true)} className="hidden md:block px-3 sm:px-6 py-2 sm:py-3 border-2 border-slate-700 text-[#2D3436] rounded-lg hover:border-[#7C9885] font-medium text-sm sm:text-base">Aanpassen</button>
              <button onClick={() => setShowRebalance(true)} className="hidden lg:block px-3 sm:px-6 py-2 sm:py-3 bg-slate-700 text-[#2D3436] rounded-lg hover:bg-slate-600 font-medium text-sm sm:text-base">Balanceren</button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
            <div className="text-[#7C9885] font-semibold text-sm tracking-wider">PORTFOLIO OVERZICHT</div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg shadow p-4 md:p-6 border-2 border-slate-800 hover:border-slate-700 transition-all"><div className="text-xs md:text-sm text-[#636E72] mb-1">Totale Waarde</div><div className="text-xl md:text-3xl font-bold text-[#2D3436]">{formatEuro(animatedPortfolioValue)}</div><div className={`text-xs md:text-sm mt-2 ${parseFloat(totalReturn) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{parseFloat(totalReturn) >= 0 ? '↑' : '↓'} {totalReturn}%</div></div>
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg shadow p-4 md:p-6 border-2 border-slate-800 hover:border-slate-700 transition-all"><div className="text-xs md:text-sm text-[#636E72] mb-1">Totaal Ingelegd</div><div className="text-xl md:text-3xl font-bold text-[#2D3436]">{formatEuro(totalInvestedAtCurrentMonth)}</div></div>
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg shadow p-4 md:p-6 border-2 border-slate-800 hover:border-slate-700 transition-all"><div className="text-xs md:text-sm text-[#636E72] mb-1">Winst/Verlies</div><div className={`text-xl md:text-3xl font-bold ${animatedPortfolioValue >= totalInvestedAtCurrentMonth ? 'text-green-500' : 'text-red-500'}`}>{formatEuro(animatedPortfolioValue - totalInvestedAtCurrentMonth)}</div></div>
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg shadow p-4 md:p-6 border-2 border-slate-800 hover:border-slate-700 transition-all"><div className="text-xs md:text-sm text-[#636E72] mb-1">Aantal ETF's</div><div className="text-xl md:text-3xl font-bold text-[#2D3436]">{portfolio.length}</div></div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6 mt-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
            <div className="text-[#7C9885] font-semibold text-sm tracking-wider">WAARDEONTWIKKELING</div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
          </div>

          <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg shadow-lg p-6 mb-10 border-2 border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg mb-2 text-[#2D3436]">Waardeontwikkeling ({horizon} jaar horizon)</h3>
                <div className="text-sm text-[#636E72]">
                  Monte Carlo simulatie met {(avgReturn * 100).toFixed(1)}% verwacht rendement en {(stdDev * 100).toFixed(1)}% risico
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleAnimation}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    isAnimating
                      ? 'bg-red-600 hover:bg-red-700 text-[#2D3436]'
                      : 'bg-green-600 hover:bg-green-700 text-[#2D3436]'
                  }`}
                >
                  {isAnimating ? '⏸ Pauzeer' : currentMonth >= months ? '🔄 Herstarten' : '▶ Start'}
                </button>
                <button
                  onClick={resetSimulation}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-[#2D3436] rounded-lg font-medium transition"
                >
                  ↺ Reset
                </button>
              </div>
            </div>
            <div className="text-xs text-[#636E72] mb-4">
              Voortgang: Maand {currentMonth} van {months} ({((currentMonth / months) * 100).toFixed(0)}%)
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performanceData}>
                <XAxis
                  dataKey="date"
                  interval={Math.floor(months / 10)}
                />
                <YAxis
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  label={{ value: 'Rendement (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value) => [`${value.toFixed(2)}%`, '']}
                  labelFormatter={(label) => `Datum: ${label}`}
                />
                <Legend />
                <Line type="monotone" dataKey="poor" stroke="#EF4444" strokeDasharray="5 5" name="Slecht Scenario (P10)" dot={false} />
                <Line type="monotone" dataKey="portfolio" stroke="#0088FE" strokeWidth={3} name="Jouw Portfolio (Median)" dot={false} connectNulls />
                <Line type="monotone" dataKey="expected" stroke="#FBBF24" strokeDasharray="5 5" name="Verwacht Scenario (Median)" dot={false} opacity={0.3} />
                <Line type="monotone" dataKey="good" stroke="#10B981" strokeDasharray="5 5" name="Goed Scenario (P90)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-[#636E72] text-center">
              Inclusief maandelijkse storting van {formatEuro(monthlyContribution)}. Gebaseerd op {portfolioConfig.name} risicoprofiel.
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
            <div className="text-[#7C9885] font-semibold text-sm tracking-wider">PORTFOLIO ANALYSE</div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-10">
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg shadow-lg p-4 md:p-6 border-2 border-slate-800 hover:border-slate-700 transition-all">
              <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-[#2D3436]">Asset Allocatie</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{backgroundColor: '#0f172a', border: '2px solid #334155', color: '#fff'}} /><Legend wrapperStyle={{color: '#9CA3AF'}} /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg shadow-lg p-6 border-2 border-slate-800 hover:border-slate-700 transition-all">
              <h3 className="font-bold text-lg mb-4 text-[#2D3436]">Portfolio Metrices</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-[#636E72]">Aantal Holdings:</span><span className="font-bold text-purple-400">{portfolio.reduce((total, etf) => total + (parseInt(etf.holdings) || getHoldingsCount(etf)), 0).toLocaleString('nl-NL')}</span></div>
                <div className="flex justify-between items-center"><span className="text-[#636E72]">Gemiddelde TER:</span><span className="font-bold text-[#7C9885]">{metrics.avgTER.toFixed(2)}%</span></div>
                <div className="flex justify-between items-center"><span className="text-[#636E72]">Verwacht Rendement:</span><span className="font-bold text-green-500">{(avgReturn * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between items-center"><span className="text-[#636E72]">Risico (Std Dev):</span><span className="font-bold text-orange-400">{(stdDev * 100).toFixed(1)}%</span></div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
            <div className="text-[#7C9885] font-semibold text-sm tracking-wider">PORTFOLIO HOLDINGS</div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
          </div>

          <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg shadow-lg p-6 border-2 border-slate-800">
            <h3 className="font-bold text-lg mb-4 text-[#2D3436]">Portfolio Holdings</h3>
            <div className="space-y-4">
              {(() => {
                console.log('📊 Portfolio Holdings Render:', {
                  animatedPortfolioValue,
                  portfolioLength: portfolio.length,
                  firstETF: portfolio[0]
                });
                return Object.entries(
                  portfolio.reduce((acc, etf) => {
                    const category = etf.categorie || 'Overig';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(etf);
                    return acc;
                  }, {})
                )
                .map(([category, etfs]) => {
                  const categoryWeight = etfs.reduce((sum, e) => sum + (e.weight || 0), 0);
                  return { category, etfs, categoryWeight };
                })
                .filter(item => item.categoryWeight > 0) // Filter out 0% categories
                .sort((a, b) => b.categoryWeight - a.categoryWeight) // Sort by weight descending
                .map(({ category, etfs, categoryWeight }) => {
                  const categoryValue = etfs.reduce((sum, e) => sum + (animatedPortfolioValue * (e.weight || 0) / 100), 0);

                  return (
                  <div key={category} className="border-2 border-slate-800 rounded-lg overflow-hidden">
                    <div className="bg-slate-800/70 px-4 py-3">
                      <h4 className="font-bold text-[#2D3436]">{category}</h4>
                    </div>
                    <div className="bg-slate-900/50">
                      <table className="w-full">
                        <tbody>
                          {etfs.map((etf, idx) => {
                            const etfValue = (animatedPortfolioValue * (etf.weight || 0) / 100);
                            return (
                              <tr key={idx} className="border-t border-slate-800 hover:bg-slate-800/40">
                                <td className="px-4 py-3">
                                  <button onClick={() => setSelectedETF(etf)} className="text-[#7C9885] hover:underline text-left text-sm">
                                    {etf.naam}
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-right text-[#636E72] text-sm w-24">{(etf.weight || 0).toFixed(1)}%</td>
                                <td className="px-4 py-3 text-right text-[#2D3436] font-medium text-sm w-32">{formatEuro(etfValue)}</td>
                              </tr>
                            );
                          })}
                          <tr className="border-t-2 border-slate-700 bg-slate-800/50">
                            <td className="px-4 py-3 text-sm font-bold text-[#2D3436]">Totaal {category}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-[#7C9885] w-24">{categoryWeight.toFixed(1)}%</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-[#7C9885] w-32">{formatEuro(categoryValue)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              });
              })()}
            </div>
          </div>
        </div>
        
        {showHoldings && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <div className="bg-[#FEFEFE] rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-[#E8E8E6]" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[#FEFEFE] border-b border-[#E8E8E6] px-6 py-4 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold text-[#2D3436]">Portfolio Holdings</h2>
                <button onClick={() => setShowHoldings(false)} className="text-3xl text-[#636E72] hover:text-[#2D3436] leading-none">×</button>
              </div>

              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setHoldingsView('top10')}
                    className={`px-6 py-2 rounded-lg font-medium transition ${holdingsView === 'top10' ? 'bg-[#7C9885] text-gray-900' : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'}`}
                  >
                    Top 10
                  </button>
                  <button
                    onClick={() => setHoldingsView('top100')}
                    className={`px-6 py-2 rounded-lg font-medium transition ${holdingsView === 'top100' ? 'bg-[#7C9885] text-gray-900' : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'}`}
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
                          <h3 className="text-xl font-bold mb-4 text-[#2D3436]">Aandelen</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-[#FEFEFE]/50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-[#636E72]">#</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-[#636E72]">Holding</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-[#636E72]">Regio</th>
                                  <th className="px-4 py-3 text-right text-sm font-medium text-[#636E72]">Weging</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-800">
                                {holdings.stocks.slice(0, limit).map((holding, idx) => (
                                  <tr key={idx} className="hover:bg-[#FEFEFE]/30">
                                    <td className="px-4 py-3 text-sm text-[#636E72]">{idx + 1}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-[#636E72]">{holding.name}</td>
                                    <td className="px-4 py-3 text-sm text-[#636E72]">{holding.region}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-[#636E72]">{holding.weight.toFixed(2)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {holdings.bonds.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 text-[#2D3436]">Obligaties</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-[#FEFEFE]/50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-[#636E72]">#</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-[#636E72]">Holding</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-[#636E72]">Regio</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-[#636E72]">Looptijd</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-[#636E72]">Coupon</th>
                                  <th className="px-4 py-3 text-right text-sm font-medium text-[#636E72]">Weging</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-800">
                                {holdings.bonds.slice(0, limit).map((holding, idx) => (
                                  <tr key={idx} className="hover:bg-[#FEFEFE]/30">
                                    <td className="px-4 py-3 text-sm text-[#636E72]">{idx + 1}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-[#636E72]">{holding.name}</td>
                                    <td className="px-4 py-3 text-sm text-[#636E72]">{holding.region}</td>
                                    <td className="px-4 py-3 text-sm text-[#636E72]">{holding.maturity}</td>
                                    <td className="px-4 py-3 text-sm text-[#636E72]">{holding.coupon}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-[#636E72]">{holding.weight.toFixed(2)}%</td>
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
            <div className="bg-[#FEFEFE] rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-6">Portfolio Balanceren & Profiel Beheer</h2>

              {/* Profile Change Section */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🎯</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-900 mb-2">Risicoprofiel Wijzigen</h3>
                    <p className="text-blue-700 text-sm mb-4">
                      Wijzig je risicoprofiel om je portfolio aan te passen aan je huidige beleggingsdoelen.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {Object.entries(premadePortfolios).filter(([key]) => key !== 'free').map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => {
                            const confirmChange = window.confirm(
                              `Wil je je risicoprofiel wijzigen naar ${config.name}?\n\n` +
                              `Verwacht rendement: ${(config.expectedReturn * 100).toFixed(1)}%\n` +
                              `Standaarddeviatie: ${(config.stdDev * 100).toFixed(0)}%\n\n` +
                              `Je portfolio wegingen worden automatisch aangepast naar dit profiel.`
                            );
                            if (confirmChange) {
                              setSelectedProfile(key);

                              // Automatically rebalance portfolio to new profile
                              const rebalanced = recalculateWeights(portfolio, key);
                              setPortfolio(rebalanced);

                              // Update investment details if they exist
                              if (investmentDetails) {
                                setInvestmentDetails({
                                  ...investmentDetails,
                                  riskProfile: config.name
                                });
                              }

                              // Update user's investment details and portfolio
                              if (user?.investmentDetails) {
                                const updatedUser = {
                                  ...user,
                                  investmentDetails: {
                                    ...user.investmentDetails,
                                    riskProfile: config.name
                                  },
                                  portfolio: rebalanced
                                };
                                setUser(updatedUser);

                                // Update in customers list
                                const updatedCustomers = customers.map(c =>
                                  c.email === user.email
                                    ? {
                                        ...c,
                                        investmentDetails: {
                                          ...c.investmentDetails,
                                          riskProfile: config.name
                                        },
                                        portfolio: rebalanced
                                      }
                                    : c
                                );
                                setCustomers(updatedCustomers);
                              }

                              alert(`✅ Je risicoprofiel is gewijzigd naar ${config.name} en je portfolio is automatisch gebalanceerd!`);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            selectedProfile === key
                              ? 'bg-blue-600 text-[#2D3436] border-blue-600'
                              : 'bg-[#FEFEFE] text-blue-900 border-blue-300 hover:border-blue-500'
                          }`}
                        >
                          {config.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600">
                      Huidig profiel: <span className="font-bold">{selectedProfile ? premadePortfolios[selectedProfile].name : 'Geen'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Original Rebalancing Content */}
              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-bold mb-3">Portfolio Balanceren</h3>
                <p className="text-gray-600 mb-6">
                  Door te balanceren worden alle wegingen aangepast naar de oorspronkelijke verdeling van je gekozen risicoprofiel:
                  <span className="font-bold text-indigo-600"> {selectedProfile ? premadePortfolios[selectedProfile].name : 'Aangepast'}</span>
                </p>
              </div>

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
                      {Object.entries(metrics.categories)
                        .filter(([cat, value]) => value > 0)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, value]) => (
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
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-[#2D3436] rounded-xl hover:shadow-lg font-semibold transition-all"
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

        {/* Portfolio Edit Choice Modal */}
        {showEditChoice && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowEditChoice(false)}>
            <div className="bg-[#FEFEFE] rounded-xl max-w-2xl w-full mx-4 p-8 border border-[#E8E8E6] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-3xl font-bold mb-6 text-[#2D3436]">Portfolio Aanpassen</h2>
              <p className="text-[#636E72] mb-8">Kies hoe je je portfolio wilt aanpassen</p>

              {/* Account Upgrade Section */}
              {(!user?.account_type || user.account_type === 'fictief') && (
                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border-2 border-purple-500 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">⭐</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[#2D3436] mb-2">Upgrade naar Betaald Account</h3>
                      <p className="text-purple-200 text-sm mb-4">
                        Ontgrendel premium functies en krijg toegang tot uitgebreide portfolio analyses, realtime marktdata en persoonlijk advies.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const confirmUpgrade = window.confirm(
                              'Wil je upgraden naar een betaald account?\n\n' +
                              'Voordelen:\n' +
                              '✓ Realtime portfolio tracking\n' +
                              '✓ Uitgebreide analyses\n' +
                              '✓ Persoonlijk advies\n' +
                              '✓ Premium ETF selecties\n\n' +
                              'Prijs: €4.99/maand'
                            );
                            if (confirmUpgrade) {
                              const updatedUser = { ...user, account_type: 'premium' };
                              setUser(updatedUser);

                              // Update in customers list if exists
                              const updatedCustomers = customers.map(c =>
                                c.email === user.email ? { ...c, account_type: 'premium' } : c
                              );
                              setCustomers(updatedCustomers);

                              alert('🎉 Gefeliciteerd! Je account is geüpgraded naar Premium!');
                            }
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-[#2D3436] rounded-lg hover:shadow-lg font-semibold transition-all"
                        >
                          Upgrade Nu - €4.99/maand
                        </button>
                        <button
                          onClick={() => {
                            alert('Je blijft het gratis account gebruiken. Sommige functies zijn beperkt.');
                          }}
                          className="px-6 py-2 border-2 border-purple-400 text-purple-200 rounded-lg hover:bg-purple-800 font-medium transition-all"
                        >
                          Later
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => {
                    setShowEditChoice(false);
                    setPortfolioType('premade');
                    setCurrentPage('portfolioBuilder');
                  }}
                  className="bg-[#FEFEFE] border-2 border-[#E8E8E6] hover:border-[#7C9885] rounded-xl p-6 text-left transition-all"
                >
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold mb-2 text-[#2D3436]">Ander Profiel Kiezen</h3>
                  <p className="text-[#636E72] text-sm">Kies een nieuw risicoprofiel en start opnieuw</p>
                </button>

                <button
                  onClick={() => {
                    setShowEditChoice(false);
                    setShowEditPortfolio(true);
                  }}
                  className="bg-[#FEFEFE] border-2 border-[#E8E8E6] hover:border-[#7C9885] rounded-xl p-6 text-left transition-all"
                >
                  <div className="text-4xl mb-4">⚙️</div>
                  <h3 className="text-xl font-bold mb-2 text-[#2D3436]">ETF's Aanpassen</h3>
                  <p className="text-[#636E72] text-sm">Wijzig de wegingen van je huidige ETF's</p>
                </button>
              </div>

              <button
                onClick={() => setShowEditChoice(false)}
                className="mt-6 w-full py-3 border-2 border-[#E8E8E6] text-[#2D3436] rounded-xl hover:bg-[#ECEEED] transition-all"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {/* Deposit Modal */}
        {showDeposit && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowDeposit(false)}>
            <div className="bg-[#FEFEFE] rounded-xl max-w-md w-full mx-4 p-8 border border-[#E8E8E6]" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-3xl font-bold mb-4 text-[#2D3436]">Geld Storten & Beleggen</h2>
              <p className="text-[#636E72] mb-6">Voer het bedrag in en kies hoe je wilt beleggen</p>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-[#636E72]">Bedrag (€)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[#ECEEED] border-2 border-[#E8E8E6] rounded-lg text-[#2D3436] text-lg focus:outline-none focus:border-[#7C9885]"
                />
              </div>

              {(() => {
                const currentValue = staticPerformanceData && staticPerformanceData[currentMonth]
                  ? staticPerformanceData[currentMonth].portfolioValue
                  : initialValue;
                // Fix: handle empty string and NaN
                const amountVal = investmentDetails.amount && investmentDetails.amount !== ''
                  ? parseFloat(investmentDetails.amount)
                  : null;
                const currentInvestedAmount = (amountVal && !isNaN(amountVal)) ? amountVal : initialValue;
                return (
                  <div className="bg-[#ECEEED] rounded-lg p-4 mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#636E72]">Huidige portfolio:</span>
                      <span className="text-[#2D3436] font-medium">{formatEuro(currentValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#636E72]">Huidige inleg:</span>
                      <span className="text-[#2D3436] font-medium">{formatEuro(currentInvestedAmount)}</span>
                    </div>
                    {depositAmount && parseFloat(depositAmount) > 0 && (
                      <>
                        <div className="border-t border-[#E8E8E6] my-2"></div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#636E72]">Nieuwe portfolio:</span>
                          <span className="text-[#7C9885] font-bold">{formatEuro(currentValue + parseFloat(depositAmount))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#636E72]">Nieuwe inleg:</span>
                          <span className="text-[#7C9885] font-bold">{formatEuro(currentInvestedAmount + parseFloat(depositAmount))}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {selectedProfile && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-4">
                  <div className="text-xs text-blue-300 mb-1">Huidig profiel:</div>
                  <div className="text-sm font-bold text-[#2D3436]">{premadePortfolios[selectedProfile].name}</div>
                </div>
              )}

              <div className="space-y-3 mb-4">
                <button
                  onClick={async () => {
                    if (depositAmount && parseFloat(depositAmount) > 0) {
                      const amount = parseFloat(depositAmount);
                      const currentPortfolioValue = staticPerformanceData && staticPerformanceData[currentMonth]
                        ? staticPerformanceData[currentMonth].portfolioValue
                        : initialValue;
                      const newTotalValue = currentPortfolioValue + amount;

                      // Update investment details amount (total deposited)
                      // Fix: handle empty string and NaN properly
                      const amountVal = investmentDetails.amount && investmentDetails.amount !== ''
                        ? parseFloat(investmentDetails.amount)
                        : null;
                      const currentInvestedAmount = (amountVal && !isNaN(amountVal)) ? amountVal : initialValue;
                      const newInvestedAmount = currentInvestedAmount + amount;
                      const updatedInvestmentDetails = {
                        ...investmentDetails,
                        amount: newInvestedAmount.toString()
                      };

                      // Invest according to current profile allocation
                      // Get the profile configuration
                      const selectedPortfolioKey = Object.keys(premadePortfolios).find(
                        key => premadePortfolios[key].name === investmentDetails.riskProfile
                      );
                      const profileConfig = premadePortfolios[selectedPortfolioKey] || premadePortfolios['neutral'];
                      const profileAllocation = profileConfig.allocation;

                      console.log('📊 Deposit - Distributing according to profile:', {
                        profile: investmentDetails.riskProfile,
                        allocation: profileAllocation,
                        depositAmount: amount,
                        currentPortfolioValue: currentPortfolioValue,
                        newTotalValue: newTotalValue
                      });

                      // Count ETFs per category in current portfolio
                      const categoryCounts = {};
                      portfolio.forEach(etf => {
                        const cat = etf.categorie;
                        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                      });

                      console.log('  Categories in portfolio:', Object.keys(categoryCounts));
                      console.log('  New money distribution per category:');

                      // Distribute new deposit according to profile allocation
                      const updatedPortfolio = portfolio.map((etf, index) => {
                        const category = etf.categorie;
                        const profilePercentage = profileAllocation[category] || 0;

                        // Current value of this ETF
                        const currentEtfValue = currentPortfolioValue * (etf.weight / 100);

                        // New money for this category according to profile
                        const newMoneyForCategory = amount * (profilePercentage / 100);

                        // Split new money equally among all ETFs in this category
                        const etfsInCategory = categoryCounts[category] || 1;
                        const newMoneyForThisETF = newMoneyForCategory / etfsInCategory;

                        // New total value for this ETF
                        const newEtfValue = currentEtfValue + newMoneyForThisETF;

                        // Calculate new weight
                        const newWeight = (newEtfValue / newTotalValue) * 100;

                        if (index === 0 || portfolio[index - 1].categorie !== category) {
                          console.log(`  - ${category} (${profilePercentage}%): €${newMoneyForCategory.toFixed(2)} → split over ${etfsInCategory} ETF(s)`);
                        }
                        console.log(`    • ${etf.naam}: €${currentEtfValue.toFixed(2)} + €${newMoneyForThisETF.toFixed(2)} = €${newEtfValue.toFixed(2)} (${newWeight.toFixed(2)}%)`);

                        return {
                          ...etf,
                          weight: newWeight,
                          _updateKey: Date.now() + index
                        };
                      });

                      // Update simulation with new values by adding the amount to all points
                      const updatedPerformanceData = staticPerformanceData.map(point => ({
                        ...point,
                        portfolioValue: point.portfolioValue + amount
                      }));

                      console.log('Depositing:', {
                        amount,
                        oldInleg: investmentDetails.amount,
                        newInleg: newInvestedAmount,
                        oldPortfolioValue: currentPortfolioValue,
                        newPortfolioValue: currentPortfolioValue + amount
                      });

                      // Update all states
                      setInvestmentDetails(updatedInvestmentDetails);
                      localStorage.setItem('investmentDetails', JSON.stringify(updatedInvestmentDetails));
                      setPortfolio(updatedPortfolio);
                      setStaticPerformanceData(updatedPerformanceData);

                      // Update user's investment details
                      if (user) {
                        const updatedUser = {
                          ...user,
                          investmentDetails: {
                            ...user.investmentDetails,
                            amount: newInvestedAmount.toString()
                          },
                          portfolio: updatedPortfolio
                        };
                        setUser(updatedUser);

                        // Update in customers list
                        const updatedCustomers = customers.map(c =>
                          c.email === user.email
                            ? {
                                ...c,
                                investmentDetails: {
                                  ...c.investmentDetails,
                                  amount: newInvestedAmount.toString()
                                },
                                portfolio: updatedPortfolio
                              }
                            : c
                        );
                        setCustomers(updatedCustomers);

                        // Save to database
                        try {
                          // Save investment details and portfolio
                          await fetch(`${API_URL}/save-portfolio`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              customer_id: user.id,
                              portfolio: updatedPortfolio,
                              investmentDetails: updatedInvestmentDetails,
                              account_type: user.account_type || 'fictief'
                            })
                          });

                          // Update portfolio value
                          await fetch(`${API_URL}/update-portfolio-value`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              customer_id: user.id,
                              portfolio_value: currentPortfolioValue + amount,
                              total_return: (((currentPortfolioValue + amount) - newInvestedAmount) / newInvestedAmount * 100).toFixed(2)
                            })
                          });

                          // Save simulation state
                          await fetch(`${API_URL}/simulation-state`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              customer_id: user.id,
                              currentMonth: currentMonth,
                              performanceData: updatedPerformanceData
                            })
                          });

                          console.log('✅ Database updated successfully - investmentDetails, portfolio, value and simulation saved');
                        } catch (error) {
                          console.error('❌ Error saving to database:', error);
                        }
                      }

                      // Small delay to ensure all state updates are processed before closing modal
                      setTimeout(() => {
                        setShowDeposit(false);
                        setDepositAmount('');
                        alert(`€${amount.toFixed(2)} succesvol gestort en belegd volgens je huidige portfolio verdeling!\n\nNieuwe inleg: €${newInvestedAmount.toFixed(2)}\nNieuwe portfolio waarde: €${(currentPortfolioValue + amount).toFixed(2)}`);
                      }, 100);
                    }
                  }}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-[#2D3436] rounded-xl hover:shadow-lg font-bold disabled:bg-gray-700 disabled:text-[#636E72] disabled:cursor-not-allowed transition-all"
                >
                  💼 Beleg volgens huidig profiel
                </button>

                <button
                  onClick={() => {
                    setShowDeposit(false);
                    setShowRebalance(true);
                  }}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  className="w-full py-3 bg-[#7C9885] text-gray-900 rounded-xl hover:bg-[#20D4BA] font-bold disabled:bg-gray-700 disabled:text-[#636E72] disabled:cursor-not-allowed transition-all"
                >
                  🎯 Profiel aanpassen en beleggen
                </button>
              </div>

              <button
                onClick={() => {
                  setShowDeposit(false);
                  setDepositAmount('');
                }}
                className="w-full py-3 border-2 border-[#E8E8E6] text-[#2D3436] rounded-xl hover:bg-[#ECEEED] transition-all"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {showWithdrawal && (() => {
          const amount = parseFloat(withdrawalAmount) || 0;
          const salesPreview = amount > 0 ? portfolio.map(etf => {
            const currentValue = animatedPortfolioValue * (etf.weight / 100);
            const saleAmount = amount * (etf.weight / 100);
            const remainingValue = currentValue - saleAmount;
            return {
              ...etf,
              currentValue,
              saleAmount,
              remainingValue
            };
          }) : [];

          return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowWithdrawal(false)}>
              <div className="bg-[#FEFEFE] rounded-xl max-w-2xl w-full mx-4 p-8 border border-[#E8E8E6] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-3xl font-bold mb-4 text-[#2D3436]">Geld Opnemen</h2>
                <p className="text-[#636E72] mb-6">Voer het bedrag in dat je wilt opnemen</p>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-[#636E72]">Bedrag (€)</label>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="0"
                    max={animatedPortfolioValue}
                    className="w-full px-4 py-3 bg-[#ECEEED] border-2 border-[#E8E8E6] rounded-lg text-[#2D3436] text-lg focus:outline-none focus:border-[#7C9885]"
                  />
                  {amount > animatedPortfolioValue && (
                    <p className="text-red-500 text-sm mt-2">Bedrag kan niet hoger zijn dan je portfolio waarde</p>
                  )}
                </div>

                <div className="bg-[#ECEEED] rounded-lg p-4 mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#636E72]">Huidige waarde:</span>
                    <span className="text-[#2D3436] font-medium">{formatEuro(animatedPortfolioValue)}</span>
                  </div>
                  {amount > 0 && amount <= animatedPortfolioValue && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#636E72]">Na opname:</span>
                      <span className="text-[#7C9885] font-bold">{formatEuro(animatedPortfolioValue - amount)}</span>
                    </div>
                  )}
                </div>

                {amount > 0 && amount <= animatedPortfolioValue && (
                  <div className="mb-6">
                    <h3 className="font-bold mb-3 text-[#2D3436]">Te verkopen (kaasschaaf methode):</h3>
                    <div className="bg-[#ECEEED] rounded-lg p-4 space-y-3">
                      {salesPreview.map((etf, idx) => (
                        <div key={idx} className="border-b border-[#E8E8E6] last:border-0 pb-3 last:pb-0">
                          <div className="font-medium text-sm mb-1 text-[#2D3436]">{etf.naam}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[#636E72]">Verkoop: </span>
                              <span className="text-[#C0736D]">{formatEuro(etf.saleAmount)}</span>
                            </div>
                            <div>
                              <span className="text-[#636E72]">Resteert: </span>
                              <span className="text-[#636E72]">{formatEuro(etf.remainingValue)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (amount > 0 && amount <= animatedPortfolioValue) {
                      // Calculate proportional reduction of invested amount
                      // If you withdraw from a portfolio that has grown, you withdraw both principal and gains proportionally
                      const currentInvestedAmount = parseFloat(investmentDetails.amount);
                      const proportionWithdrawn = amount / animatedPortfolioValue;
                      const investedAmountReduction = currentInvestedAmount * proportionWithdrawn;
                      const newInvestedAmount = currentInvestedAmount - investedAmountReduction;

                      // Update investment details amount
                      const updatedInvestmentDetails = {
                        ...investmentDetails,
                        amount: newInvestedAmount.toString()
                      };
                      setInvestmentDetails(updatedInvestmentDetails);

                      // Update user's investment details
                      if (user) {
                        const updatedUser = {
                          ...user,
                          investmentDetails: {
                            ...user.investmentDetails,
                            amount: newInvestedAmount.toString()
                          }
                        };
                        setUser(updatedUser);

                        // Update in customers list
                        const updatedCustomers = customers.map(c =>
                          c.email === user.email
                            ? {
                                ...c,
                                investmentDetails: {
                                  ...c.investmentDetails,
                                  amount: newInvestedAmount.toString()
                                }
                              }
                            : c
                        );
                        setCustomers(updatedCustomers);
                      }

                      // Update portfolio value and simulation data
                      setStaticPerformanceData(prev => prev.map(point => ({
                        ...point,
                        portfolioValue: point.portfolioValue - amount
                      })));

                      setShowWithdrawal(false);
                      setWithdrawalAmount('');
                      alert(`€${amount.toFixed(2)} succesvol opgenomen!`);
                    }
                  }}
                  disabled={!amount || amount <= 0 || amount > animatedPortfolioValue}
                  className="w-full py-3 bg-[#7C9885] text-gray-900 rounded-xl hover:bg-[#20D4BA] font-bold disabled:bg-gray-700 disabled:text-[#636E72] disabled:cursor-not-allowed transition-all mb-3"
                >
                  Bevestig Opname
                </button>

                <button
                  onClick={() => {
                    setShowWithdrawal(false);
                    setWithdrawalAmount('');
                  }}
                  className="w-full py-3 border-2 border-[#E8E8E6] text-[#2D3436] rounded-xl hover:bg-[#ECEEED] transition-all"
                >
                  Annuleren
                </button>
              </div>
            </div>
          );
        })()}

        {showEditPortfolio && <EditPortfolioModal onClose={() => setShowEditPortfolio(false)} />}
      </div>
    );
  };

  const WelcomePage = () => {
    const [marketData, setMarketData] = useState({
      indices: [
        { name: 'S&P 500', value: 5234.18, baseValue: 5234.18, change: 1.2, positive: true },
        { name: 'Dow Jones', value: 41250.50, baseValue: 41250.50, change: 0.8, positive: true },
        { name: 'NASDAQ', value: 16825.93, baseValue: 16825.93, change: 1.5, positive: true },
        { name: 'AEX', value: 915.32, baseValue: 915.32, change: -0.3, positive: false },
        { name: 'DAX', value: 19850.45, baseValue: 19850.45, change: 0.6, positive: true },
        { name: 'FTSE 100', value: 8350.22, baseValue: 8350.22, change: 0.4, positive: true },
      ],
      currencies: [
        { name: 'EUR/USD', value: 1.0875, baseValue: 1.0875, change: 0.2, positive: true },
        { name: 'GBP/USD', value: 1.2650, baseValue: 1.2650, change: -0.1, positive: false },
        { name: 'USD/JPY', value: 149.85, baseValue: 149.85, change: 0.3, positive: true },
        { name: 'EUR/GBP', value: 0.8595, baseValue: 0.8595, change: 0.1, positive: true },
      ],
      commodities: [
        { name: 'Gold', symbol: 'XAU', value: 2345.60, baseValue: 2345.60, change: 0.8, positive: true },
        { name: 'Bitcoin', symbol: 'BTC', value: 98250.00, baseValue: 98250.00, change: 2.3, positive: true },
        { name: 'Ethereum', symbol: 'ETH', value: 3420.50, baseValue: 3420.50, change: 1.9, positive: true },
      ]
    });

    // Navbar is always visible - removed auto-hide functionality

    // Simulate real-time price updates
    useEffect(() => {
      const interval = setInterval(() => {
        setMarketData(prevData => {
          const updateCategory = (items) => items.map(item => {
            // Random price change between -0.15% and +0.15%
            const randomChange = (Math.random() - 0.5) * 0.3;
            const newValue = item.value * (1 + randomChange / 100);

            // Calculate change percentage from base value
            const changePercent = ((newValue - item.baseValue) / item.baseValue) * 100;

            return {
              ...item,
              value: newValue,
              change: changePercent,
              positive: changePercent >= 0
            };
          });

          return {
            indices: updateCategory(prevData.indices),
            currencies: updateCategory(prevData.currencies),
            commodities: updateCategory(prevData.commodities)
          };
        });
      }, 2000); // Update every 2 seconds

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        {/* Spacer to prevent content from going under fixed navbar */}
        <div style={{ height: '72px' }}></div>

        <nav
          className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg fixed top-0 left-0 right-0 z-50"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <button onClick={() => setCurrentPage('mainDashboard')} className="flex items-center gap-2 sm:gap-3">
                <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                  {/* Original piggy bank body */}
                  <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                  {/* Coin slot on top */}
                  <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                  {/* Gold coin */}
                  <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                  <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                  <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                  {/* Pig face - Eyes */}
                  <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                  <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                  {/* Pig snout */}
                  <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                  <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                  <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                  {/* Pig ears */}
                  <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                  {/* Smile */}
                  <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                  {/* Legs/feet */}
                  <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                  <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
                </svg>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold text-[#2D3436]">PIGG</div>
              </button>
              <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                <button onClick={() => setCurrentPage('welcome')} className="text-[#7C9885] font-medium text-xs sm:text-sm md:text-base">Home</button>
                <button onClick={() => setCurrentPage('dashboard')} className="hidden sm:block text-[#636E72] hover:text-[#2D3436] text-xs sm:text-sm md:text-base">Dashboard</button>
                <div className="hidden lg:block text-xs sm:text-sm text-[#636E72] truncate max-w-[100px]">{user?.name}</div>
                <button
                  onClick={handleLogout}
                  className="text-[#636E72] hover:text-[#2D3436] font-medium text-xs sm:text-sm md:text-base"
                >
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 md:py-8">
          <div className="mb-6 sm:mb-8 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D3436] mb-2">Welkom terug, {user?.firstName || user?.name?.split(' ')[0]}!</h1>
            <p className="text-sm sm:text-base text-[#636E72]">Bekijk de laatste marktgegevens en beheer je portfolio</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
            <div className="text-[#7C9885] font-semibold text-sm tracking-wider">SNELLE ACTIES</div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="bg-gradient-to-br from-[#7C9885] to-[#20D4BA] hover:shadow-xl hover:shadow-[#7C9885]/30 rounded-lg p-3 text-left transition-all group border border-[#7C9885]/50"
            >
              <div className="text-2xl mb-1.5">📊</div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Mijn Portfolio</h3>
              <p className="text-xs text-gray-800">Bekijk en beheer je beleggingen</p>
              <div className="mt-2 text-xs text-gray-900 font-medium group-hover:translate-x-2 transition-transform inline-block">
                Ga naar dashboard →
              </div>
            </button>

            <button
              onClick={() => setCurrentPage('financialNews')}
              className="bg-[#FEFEFE] border border-[#E8E8E6] hover:border-[#7C9885] hover:shadow-lg hover:shadow-[#7C9885]/20 rounded-lg p-3 text-left transition-all group"
            >
              <div className="text-2xl mb-1.5">📰</div>
              <h3 className="text-base font-bold text-[#2D3436] mb-1">Financieel Nieuws</h3>
              <p className="text-xs text-[#636E72]">Blijf op de hoogte van marktontwikkelingen</p>
              <div className="mt-2 text-xs text-[#7C9885] font-medium group-hover:translate-x-2 transition-transform inline-block">
                Bekijk nieuws →
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
            <div className="text-[#7C9885] font-semibold text-sm tracking-wider">MARKTGEGEVENS</div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          </div>

          {/* Market Indices */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#2D3436] mb-2 sm:mb-3">📈 Beursindices</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {marketData.indices.map((index, i) => (
                <div key={i} className="bg-[#FEFEFE] border border-[#E8E8E6] hover:border-[#E8E8E6] rounded-lg p-2 sm:p-2.5 transition-all hover:shadow-md">
                  <div className="text-xs text-[#636E72] mb-0.5 uppercase tracking-wide truncate">{index.name}</div>
                  <div className="text-sm sm:text-base font-bold text-[#2D3436] mb-1">{index.value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="h-px bg-[#ECEEED] mb-1"></div>
                  <div className={`text-xs font-bold ${index.positive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                    {index.positive ? '▲' : '▼'} {index.positive ? '+' : ''}{index.change.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Currencies */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#2D3436] mb-2 sm:mb-3">💱 Valuta</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {marketData.currencies.map((currency, i) => (
                <div key={i} className="bg-[#FEFEFE] border border-[#E8E8E6] hover:border-[#E8E8E6] rounded-lg p-2 sm:p-2.5 transition-all hover:shadow-md">
                  <div className="text-xs text-[#636E72] mb-0.5 uppercase tracking-wide">{currency.name}</div>
                  <div className="text-sm sm:text-base font-bold text-[#2D3436] mb-1">{currency.value.toFixed(4)}</div>
                  <div className="h-px bg-[#ECEEED] mb-1"></div>
                  <div className={`text-xs font-bold ${currency.positive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                    {currency.positive ? '▲' : '▼'} {currency.positive ? '+' : ''}{currency.change.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commodities */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#2D3436] mb-2 sm:mb-3">🪙 Grondstoffen & Crypto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {marketData.commodities.map((commodity, i) => (
                <div key={i} className="bg-[#FEFEFE] border border-[#E8E8E6] hover:border-[#E8E8E6] rounded-lg p-2.5 sm:p-3 transition-all hover:shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-[#2D3436]">{commodity.name}</div>
                      <div className="text-xs text-[#636E72] uppercase tracking-wider">{commodity.symbol}</div>
                    </div>
                    <div className="text-xl sm:text-2xl">
                      {commodity.name === 'Gold' && '🥇'}
                      {commodity.name === 'Bitcoin' && '₿'}
                      {commodity.name === 'Ethereum' && 'Ξ'}
                    </div>
                  </div>
                  <div className="h-px bg-[#ECEEED] mb-2"></div>
                  <div className="text-base sm:text-lg font-bold text-[#2D3436] mb-1">${commodity.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className={`text-xs sm:text-sm font-bold ${commodity.positive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                    {commodity.positive ? '▲' : '▼'} {commodity.positive ? '+' : ''}{commodity.change.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-[#7C9885]/20 to-blue-600/20 border-2 border-[#7C9885]/50 rounded-xl p-4 sm:p-6 md:p-8 text-center shadow-lg shadow-[#7C9885]/10">
            <h3 className="text-xl sm:text-2xl font-bold text-[#2D3436] mb-2 sm:mb-4">Klaar om te beleggen?</h3>
            <p className="text-sm sm:text-base text-[#636E72] mb-4 sm:mb-6">Bekijk je portfolio en volg de ontwikkeling van je beleggingen in real-time</p>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] font-bold text-base sm:text-lg transition-all inline-flex items-center gap-2"
            >
              Naar Mijn Dashboard
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Post-registration welcome page (shown once after account creation)
  const PostRegisterWelcome = () => {
    return (
      <div className="min-h-screen bg-[#F5F6F4] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <svg viewBox="0 0 48 48" fill="none" className="w-20 h-20">
              <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>
              <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>
              <circle cx="24" cy="6" r="4" fill="#FFD700"/>
              <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
              <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>
              <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
              <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>
              <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
              <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
              <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>
              <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>
              <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
              <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
            </svg>
          </div>

          {/* Title & subtitle */}
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2D3436] mb-3">
            Welkom bij PIGG{user?.firstName ? `, ${user.firstName}` : ''}!
          </h1>
          <p className="text-base sm:text-lg text-[#636E72] mb-10">
            Je account is aangemaakt en klaar voor gebruik.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCurrentPage('mainDashboard')}
              className="px-8 py-4 bg-gradient-to-r from-[#7C9885] to-[#20D4BA] text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-[#7C9885]/30 transition-all"
            >
              Direct investeren
            </button>
            <button
              onClick={() => setCurrentPage('welcome')}
              className="px-8 py-4 border-2 border-[#7C9885] text-[#7C9885] font-bold text-lg rounded-xl hover:bg-[#7C9885]/10 transition-all"
            >
              Rond kijken
            </button>
          </div>
        </div>
      </div>
    );
  };

  // First-time user welcome page (no portfolio yet)
  const FirstTimeWelcome = () => {
    return (
      <div className="min-h-screen bg-[#F5F6F4] flex items-center justify-center px-4">
        <div className="max-w-3xl w-full">
          {/* Logo at the top */}
          <div className="flex justify-center mb-12">
            <svg viewBox="0 0 48 48" fill="none" className="w-20 h-20 sm:w-24 sm:h-24">
              {/* Piggy bank body */}
              <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

              {/* Coin slot on top */}
              <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

              {/* Gold coin */}
              <circle cx="24" cy="6" r="4" fill="#FFD700"/>
              <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
              <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

              {/* Pig face - Eyes */}
              <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
              <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

              {/* Pig snout */}
              <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
              <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
              <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

              {/* Pig ears */}
              <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

              {/* Smile */}
              <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

              {/* Legs/feet */}
              <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
              <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
            </svg>
          </div>

          {/* Welcome content */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#2D3436] mb-6 leading-tight">
              Invest your money
              <br />
              <span className="bg-gradient-to-r from-[#7C9885] to-blue-500 bg-clip-text text-transparent">
                in the world!
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-[#636E72] max-w-2xl mx-auto">
              Start building your investment portfolio today and watch your wealth grow with smart ETF investments.
            </p>
          </div>

          {/* Shiny Invest Now button */}
          <div className="flex justify-center">
            <button
              onClick={() => setCurrentPage('mainDashboard')}
              className="group relative px-12 py-6 text-xl sm:text-2xl font-bold text-gray-900 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#7C9885]/50"
              style={{
                background: 'linear-gradient(135deg, #7C9885 0%, #20D4BA 50%, #7C9885 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite'
              }}
            >
              {/* Shine effect overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shine 2s ease-in-out infinite'
                }}
              />

              <span className="relative z-10 flex items-center gap-3">
                Invest Now
                <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl opacity-75 blur-xl"
                style={{
                  background: 'linear-gradient(135deg, #7C9885, #20D4BA)',
                  zIndex: -1
                }}
              />
            </button>
          </div>

          {/* Additional info */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl mb-2">🌍</div>
              <div className="text-sm text-[#636E72]">Global ETF Access</div>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm text-[#636E72]">Smart Portfolio Building</div>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">🔒</div>
              <div className="text-sm text-[#636E72]">Secure & Reliable</div>
            </div>
          </div>
        </div>

        {/* CSS animations */}
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            50% { background-position: 0% 0; }
            100% { background-position: -200% 0; }
          }

          @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  };

  const FinancialNewsPage = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
      { id: 'all', name: 'Alles', icon: '📰' },
      { id: 'markets', name: 'Markten', icon: '📈' },
      { id: 'crypto', name: 'Crypto', icon: '₿' },
      { id: 'commodities', name: 'Grondstoffen', icon: '🛢️' },
      { id: 'tech', name: 'Technologie', icon: '💻' },
      { id: 'banking', name: 'Banking', icon: '🏦' }
    ];

    const categoryMap = {
      'Markets': 'markets',
      'Cryptocurrency': 'crypto',
      'Commodities': 'commodities',
      'Technology': 'tech',
      'Central Banking': 'banking'
    };

    const filteredNews = selectedCategory === 'all'
      ? financialNews
      : financialNews.filter(news => categoryMap[news.category] === selectedCategory);

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <button onClick={() => setCurrentPage('welcome')} className="flex items-center gap-2 sm:gap-3">
                <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                  <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>
                  <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>
                  <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                  <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                  <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>
                  <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                  <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>
                  <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                  <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                  <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>
                  <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>
                  <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                  <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
                </svg>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold text-[#2D3436]">PIGG</div>
              </button>
              <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                <button onClick={() => setCurrentPage('welcome')} className="text-[#636E72] hover:text-[#2D3436] text-xs sm:text-sm md:text-base">Home</button>
                <button onClick={() => setCurrentPage('dashboard')} className="hidden sm:block text-[#636E72] hover:text-[#2D3436] text-xs sm:text-sm md:text-base">Dashboard</button>
                <div className="hidden lg:block text-xs sm:text-sm text-[#636E72] truncate max-w-[100px]">{user?.name}</div>
                <button onClick={handleLogout} className="text-[#636E72] hover:text-[#2D3436] font-medium text-xs sm:text-sm md:text-base">
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2D3436] mb-2">📰 Financieel Nieuws</h1>
            <p className="text-sm sm:text-base text-[#636E72]">Blijf op de hoogte van de laatste ontwikkelingen op de financiële markten</p>
          </div>

          {/* Category Filter */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#7C9885] text-gray-900'
                      : 'bg-[#FEFEFE] text-[#636E72] border border-[#E8E8E6] hover:border-[#7C9885]'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredNews.map((news) => (
              <div
                key={news.id}
                className="bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-slate-800 rounded-xl p-4 sm:p-5 hover:border-[#7C9885]/50 transition-all cursor-pointer group shadow-lg hover:shadow-[#7C9885]/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold text-[#7C9885] bg-[#7C9885]/10 px-2 py-1 rounded">
                    {news.category}
                  </span>
                  <span className="text-xs text-[#636E72]">{news.time}</span>
                </div>

                <h3 className="text-[#2D3436] font-bold text-base sm:text-lg mb-3 group-hover:text-[#7C9885] transition-colors">
                  {news.title}
                </h3>

                <p className="text-[#636E72] text-sm mb-4 leading-relaxed">
                  {news.summary}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-[#E8E8E6]">
                  <span className="text-xs font-medium text-[#636E72]">{news.source}</span>
                  <span className="text-[#7C9885] text-sm font-medium group-hover:translate-x-1 transition-transform">Lees meer →</span>
                </div>
              </div>
            ))}
          </div>

          {filteredNews.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📰</div>
              <p className="text-[#636E72] text-lg">Geen nieuws beschikbaar in deze categorie</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const CustomerDatabasePage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [conversationMessages, setConversationMessages] = useState([]);
    const [responseMessage, setResponseMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    // Function to fetch customers
    const fetchCustomers = async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setRefreshing(true);
      try {
        const response = await fetch(`${API_URL}/customers`);
        const data = await response.json();
        console.log('Fetched customers data:', data);
        if (data.success) {
          // Transform database format to app format
          const transformedCustomers = data.customers.map(c => {
            console.log('Customer investmentDetails from API:', c.investmentDetails);
            console.log('Customer riskProfile:', c.investmentDetails?.riskProfile);
            return {
              ...c,
              firstName: c.first_name,
              lastName: c.last_name,
              name: `${c.first_name} ${c.last_name}`,
              houseNumber: c.house_number,
              postalCode: c.postal_code,
              birthDate: c.birth_date,
              address: `${c.street} ${c.house_number}, ${c.postal_code} ${c.city}`,
              registeredAt: c.registered_at || c.created_at,
              portfolio: c.portfolio || [],
              investmentDetails: c.investmentDetails || {}
            };
          });
          console.log('Transformed customers:', transformedCustomers);
          // Only update if data has changed to prevent unnecessary re-renders
          setCustomers(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(transformedCustomers)) {
              return transformedCustomers;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
        if (showRefreshIndicator) setRefreshing(false);
      }
    };

    // Function to fetch chat inquiries
    const fetchChatInquiries = async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setRefreshing(true);
      try {
        const response = await fetch(`${API_URL}/chat-inquiries`);
        const data = await response.json();
        if (data.success) {
          const newInquiries = data.inquiries || [];
          // Only update if data has changed to prevent unnecessary re-renders
          setChatInquiries(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(newInquiries)) {
              return newInquiries;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Failed to fetch chat inquiries:', error);
      } finally {
        if (showRefreshIndicator) setRefreshing(false);
      }
    };

    // Function to fetch conversation messages for a specific inquiry
    const fetchConversationMessages = async (inquiryId) => {
      try {
        const response = await fetch(`${API_URL}/chat-inquiries?inquiry_id=${inquiryId}`);
        const data = await response.json();
        if (data.success) {
          setConversationMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to fetch conversation messages:', error);
      }
    };

    // Function to send a response message
    const sendResponseMessage = async (e) => {
      e.preventDefault();
      if (!responseMessage.trim() || !selectedInquiry) return;

      setSendingMessage(true);
      try {
        const response = await fetch(`${API_URL}/chat-inquiries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inquiry_id: selectedInquiry.id,
            sender: 'manager',
            message: responseMessage
          })
        });

        const data = await response.json();
        if (data.success) {
          setResponseMessage('');
          // Refresh conversation messages
          await fetchConversationMessages(selectedInquiry.id);
          // Refresh inquiries list to update status
          await fetchChatInquiries();
        } else {
          // Show detailed error message including database error details
          const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Unknown error');
          alert('Failed to send message: ' + errorMsg);
          console.error('Message send error:', data);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message: ' + error.message);
      } finally {
        setSendingMessage(false);
      }
    };

    // Function to open conversation modal
    const openConversation = async (inquiry) => {
      setSelectedInquiry(inquiry);
      await fetchConversationMessages(inquiry.id);
    };

    // Function to close conversation modal
    const closeConversation = () => {
      setSelectedInquiry(null);
      setConversationMessages([]);
      setResponseMessage('');
    };

    // Fetch customers on mount and every 10 seconds
    useEffect(() => {
      fetchCustomers();
      fetchChatInquiries();
      const interval = setInterval(() => {
        fetchCustomers();
        fetchChatInquiries();
      }, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }, []);

    const filteredCustomers = customers.filter(customer => {
      const search = searchTerm.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.toLowerCase().includes(search) ||
        customer.city?.toLowerCase().includes(search)
      );
    });

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20">
                  {/* Original piggy bank body */}
                  <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>

                  {/* Coin slot on top */}
                  <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>

                  {/* Gold coin */}
                  <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                  <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                  <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>

                  {/* Pig face - Eyes */}
                  <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                  <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>

                  {/* Pig snout */}
                  <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                  <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                  <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>

                  {/* Pig ears */}
                  <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>

                  {/* Smile */}
                  <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>

                  {/* Legs/feet */}
                  <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                  <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
                </svg>
                <div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D3436]">PIGG</div>
                  <div className="text-sm sm:text-base text-[#636E72]">Account Manager Portal</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout();
                }}
                className="text-[#636E72] hover:text-[#7C9885] transition-colors font-medium cursor-pointer"
              >
                {t.common.logout}
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Notification Alerts */}
          {chatInquiries.filter(i => i.status === 'new').length > 0 && (
            <div className="mb-6 bg-[#7C9885]/10 border border-[#7C9885] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#7C9885] rounded-full animate-pulse"></div>
                <span className="text-[#7C9885] font-semibold">
                  {chatInquiries.filter(i => i.status === 'new').length} nieuwe chat {chatInquiries.filter(i => i.status === 'new').length === 1 ? 'vraag' : 'vragen'}
                </span>
              </div>
              <button
                onClick={() => setCustomerPortalTab('inquiries')}
                className="px-4 py-2 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] font-medium transition-all"
              >
                Bekijk
              </button>
            </div>
          )}
          {chatInquiries.filter(i => i.has_unread_response).length > 0 && (
            <div className="mb-6 bg-red-500/10 border border-red-500 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[#C0736D] font-semibold">
                  {chatInquiries.filter(i => i.has_unread_response).length} {chatInquiries.filter(i => i.has_unread_response).length === 1 ? 'klant heeft' : 'klanten hebben'} gereageerd
                </span>
              </div>
              <button
                onClick={() => setCustomerPortalTab('inquiries')}
                className="px-4 py-2 bg-red-500 text-[#2D3436] rounded-lg hover:bg-red-600 font-medium transition-all"
              >
                Bekijk
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2D3436]">Account Manager Portal</h1>
            <button
              onClick={() => {
                fetchCustomers(true);
                fetchChatInquiries(true);
              }}
              disabled={refreshing}
              className="px-6 py-3 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] font-medium transition-all disabled:opacity-50"
            >
              {refreshing ? 'Laden...' : 'Ververs Data'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-[#E8E8E6]">
            <button
              onClick={() => setCustomerPortalTab('customers')}
              className={`px-6 py-3 font-medium transition-colors ${
                customerPortalTab === 'customers'
                  ? 'text-[#7C9885] border-b-2 border-[#7C9885]'
                  : 'text-[#636E72] hover:text-[#2D3436]'
              }`}
            >
              Klanten ({customers.length})
            </button>
            <button
              onClick={() => setCustomerPortalTab('inquiries')}
              className={`px-6 py-3 font-medium transition-colors ${
                customerPortalTab === 'inquiries'
                  ? 'text-[#7C9885] border-b-2 border-[#7C9885]'
                  : 'text-[#636E72] hover:text-[#2D3436]'
              }`}
            >
              Chat Vragen ({chatInquiries.length})
            </button>
            <button
              onClick={() => setCustomerPortalTab('cashAllocation')}
              className={`px-6 py-3 font-medium transition-colors ${
                customerPortalTab === 'cashAllocation'
                  ? 'text-[#7C9885] border-b-2 border-[#7C9885]'
                  : 'text-[#636E72] hover:text-[#2D3436]'
              }`}
            >
              Cash Allocation
            </button>
          </div>

          {customerPortalTab === 'customers' && (
            <>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Zoek op naam, email, telefoon of woonplaats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg text-[#2D3436] placeholder-[#B2BEC3] focus:ring-2 focus:ring-[#7C9885] focus:border-transparent"
                />
              </div>

              <p className="text-[#636E72] mb-6">
                {searchTerm ? `${filteredCustomers.length} van ${customers.length} klanten` : `Totaal aantal klanten: ${customers.length}`}
              </p>
            </>
          )}

          {customerPortalTab === 'customers' && (
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FEFEFE]/50 border-b border-[#E8E8E6]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Naam</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Telefoon</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Woonplaats</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Account Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Trading Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Portfolio</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Geregistreerd</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-[#636E72]">Actie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-[#636E72]">
                        {searchTerm ? 'Geen klanten gevonden' : 'Nog geen geregistreerde klanten'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(customer => (
                      <tr key={customer.id} className="hover:bg-[#FEFEFE]/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-[#2D3436]">{customer.name}</td>
                        <td className="px-6 py-4 text-sm text-[#636E72]">{customer.email}</td>
                        <td className="px-6 py-4 text-sm text-[#636E72]">{customer.phone}</td>
                        <td className="px-6 py-4 text-sm text-[#636E72]">{customer.city}</td>
                        <td className="px-6 py-4 text-sm">
                          {customer.account_type === 'betaald' ? (
                            <span className="px-2 py-1 bg-green-600/20 text-[#7C9885] rounded-full text-xs font-semibold">Betaald</span>
                          ) : customer.account_type === 'fictief' ? (
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-semibold">Fictief</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-700 text-[#636E72] rounded-full text-xs font-semibold">Gratis</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col gap-2">
                            {customer.trading_status === 'approved' ? (
                              <span className="px-2 py-1 bg-green-600/20 text-[#7C9885] rounded-full text-xs font-semibold inline-block w-fit">Trading Actief</span>
                            ) : customer.trading_status === 'rejected' ? (
                              <span className="px-2 py-1 bg-red-600/20 text-[#C0736D] rounded-full text-xs font-semibold inline-block w-fit">Afgewezen</span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-xs font-semibold inline-block w-fit">Pending</span>
                            )}
                            {customer.trading_status !== 'approved' && (
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`${API_URL}/update-trading-status`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        customerId: customer.id,
                                        tradingStatus: 'approved',
                                        adminEmail: user?.email
                                      })
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                      fetchCustomers(true);
                                    } else {
                                      alert('Error: ' + data.message);
                                    }
                                  } catch (error) {
                                    alert('Error updating trading status');
                                  }
                                }}
                                className="px-2 py-1 bg-[#7C9885] text-gray-900 rounded text-xs font-medium hover:bg-[#20D4BA] transition-all w-fit"
                              >
                                Goedkeuren
                              </button>
                            )}
                            {customer.trading_status === 'approved' && (
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`${API_URL}/update-trading-status`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        customerId: customer.id,
                                        tradingStatus: 'rejected',
                                        adminEmail: user?.email
                                      })
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                      fetchCustomers(true);
                                    } else {
                                      alert('Error: ' + data.message);
                                    }
                                  } catch (error) {
                                    alert('Error updating trading status');
                                  }
                                }}
                                className="px-2 py-1 bg-red-600 text-[#2D3436] rounded text-xs font-medium hover:bg-red-700 transition-all w-fit"
                              >
                                Intrekken
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#636E72]">
                          {customer.portfolio && customer.portfolio.length > 0 ? (
                            <span className="text-[#7C9885] font-medium">{customer.portfolio.length} ETFs</span>
                          ) : (
                            <span className="text-[#636E72]">Geen</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#636E72]">
                          {new Date(customer.registeredAt).toLocaleDateString('nl-NL')}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setCurrentPage('customerDetail');
                              }}
                              className="px-4 py-2 bg-[#7C9885] text-gray-900 rounded-lg hover:bg-[#20D4BA] font-medium transition-all"
                            >
                              Bekijk Details
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Weet je zeker dat je ${customer.name} wilt verwijderen?`)) {
                                  // Immediately remove from UI for instant feedback
                                  setCustomers(prev => prev.filter(c => c.id !== customer.id));

                                  // Delete from database in background
                                  try {
                                    await fetch(`${API_URL}/customers/${customer.id}`, {
                                      method: 'DELETE'
                                    });
                                  } catch (error) {
                                    console.error('Delete error:', error);
                                    // Refresh to restore customer if delete failed
                                    fetchCustomers();
                                  }
                                }
                              }}
                              className="px-4 py-2 bg-red-600 text-[#2D3436] rounded-lg hover:bg-red-700 font-medium transition-all"
                            >
                              Verwijder
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Chat Inquiries Tab */}
          {customerPortalTab === 'inquiries' && (
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FEFEFE]/50 border-b border-[#E8E8E6]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Datum</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Naam</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Telefoon</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Berichten</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#636E72]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {chatInquiries.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-[#636E72]">
                          Nog geen chat vragen ontvangen
                        </td>
                      </tr>
                    ) : (
                      chatInquiries.map((inquiry) => (
                        <tr key={inquiry.id} className="hover:bg-[#ECEEED]/30">
                          <td className="px-6 py-4">
                            <div className="text-sm text-[#636E72]">
                              {new Date(inquiry.created_at).toLocaleDateString('nl-NL', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openConversation(inquiry)}
                              className="text-sm font-medium text-[#7C9885] hover:text-[#20D4BA] underline cursor-pointer transition-colors flex items-center gap-2"
                            >
                              {inquiry.name}
                              {inquiry.has_unread_response && (
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-[#636E72]">{inquiry.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-[#636E72]">{inquiry.phone || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-[#636E72]">
                              {inquiry.response_count || 0} {inquiry.response_count === 1 ? 'bericht' : 'berichten'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              inquiry.status === 'new'
                                ? 'bg-[#7C9885]/20 text-[#7C9885]'
                                : inquiry.status === 'responded'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-700 text-[#636E72]'
                            }`}>
                              {inquiry.status === 'new' ? 'Nieuw' : inquiry.status === 'responded' ? 'Beantwoord' : inquiry.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {customerPortalTab === 'cashAllocation' && (
            <AdminCashAllocation user={user} onBack={() => setCustomerPortalTab('customers')} embedded />
          )}

          {/* Conversation Modal */}
          {selectedInquiry && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex justify-between items-start p-6 border-b border-[#E8E8E6]">
                  <div>
                    <h2 className="text-2xl font-bold text-[#2D3436] mb-2">Conversatie met {selectedInquiry.name}</h2>
                    <div className="flex gap-4 text-sm text-[#636E72]">
                      <span>{selectedInquiry.email}</span>
                      {selectedInquiry.phone && <span>{selectedInquiry.phone}</span>}
                    </div>
                  </div>
                  <button
                    onClick={closeConversation}
                    className="text-[#636E72] hover:text-[#2D3436] transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {conversationMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'manager' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          msg.sender === 'manager'
                            ? 'bg-[#7C9885] text-gray-900'
                            : 'bg-[#ECEEED] text-[#2D3436]'
                        }`}
                      >
                        <div className="text-sm mb-1">
                          <strong>{msg.sender === 'manager' ? 'Account Manager' : selectedInquiry.name}</strong>
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                        <div className={`text-xs mt-2 ${msg.sender === 'manager' ? 'text-gray-700' : 'text-[#636E72]'}`}>
                          {new Date(msg.created_at).toLocaleDateString('nl-NL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Response Input Area */}
                <div className="p-6 border-t border-[#E8E8E6]">
                  <form onSubmit={sendResponseMessage} className="flex gap-3">
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Typ je antwoord..."
                      className="flex-1 px-4 py-3 bg-[#ECEEED] border border-[#E8E8E6] rounded-xl text-[#2D3436] placeholder-[#B2BEC3] focus:ring-2 focus:ring-[#7C9885] focus:border-transparent resize-none"
                      rows="3"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !responseMessage.trim()}
                      className="px-6 py-3 bg-[#7C9885] text-gray-900 rounded-xl hover:bg-[#20D4BA] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed self-end"
                    >
                      {sendingMessage ? 'Verzenden...' : 'Verzenden'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
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
      <div className="min-h-screen bg-[#F5F6F4]">
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20">
                  <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>
                  <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>
                  <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                  <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                  <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>
                  <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                  <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
                </svg>
                <div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D3436]">PIGG</div>
                  <div className="text-sm sm:text-base text-[#636E72]">Account Manager Portal</div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setCurrentPage('customerDatabase')} className="text-[#636E72] hover:text-[#7C9885] transition-colors font-medium">
                  ← Terug naar Database
                </button>
                <button onClick={handleLogout} className="text-[#636E72] hover:text-[#7C9885] transition-colors font-medium">
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-[#2D3436]">Klant Gegevens</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-[#7C9885]">Persoonlijke Informatie</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-[#636E72]">Voornaam:</span>
                  <div className="font-medium text-[#2D3436]">{selectedCustomer.firstName || selectedCustomer.name?.split(' ')[0] || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-sm text-[#636E72]">Achternaam:</span>
                  <div className="font-medium text-[#2D3436]">{selectedCustomer.lastName || selectedCustomer.name?.split(' ').slice(1).join(' ') || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-sm text-[#636E72]">Geboortedatum:</span>
                  <div className="font-medium text-[#2D3436]">{selectedCustomer.birthDate || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-sm text-[#636E72]">Email:</span>
                  <div className="font-medium text-[#2D3436]">{selectedCustomer.email}</div>
                </div>
                <div>
                  <span className="text-sm text-[#636E72]">Telefoon:</span>
                  <div className="font-medium text-[#2D3436]">{selectedCustomer.phone}</div>
                </div>
                <div>
                  <span className="text-sm text-[#636E72]">Straat + Huisnummer:</span>
                  <div className="font-medium text-[#2D3436]">{selectedCustomer.street && selectedCustomer.houseNumber ? `${selectedCustomer.street} ${selectedCustomer.houseNumber}` : selectedCustomer.address}</div>
                </div>
                <div>
                  <span className="text-sm text-[#636E72]">Postcode:</span>
                  <div className="font-medium text-[#2D3436]">{selectedCustomer.postalCode || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-sm text-[#636E72]">Woonplaats:</span>
                  <div className="font-medium text-[#2D3436]">{selectedCustomer.city}</div>
                </div>
                <div>
                  <span className="text-sm text-[#636E72]">Geregistreerd op:</span>
                  <div className="font-medium text-[#2D3436]">
                    {new Date(selectedCustomer.registeredAt).toLocaleDateString('nl-NL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-[#7C9885]">Beleggingsinformatie</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-[#636E72]">Account Type:</span>
                  <div className="font-medium">
                    {selectedCustomer.account_type === 'betaald' ? (
                      <span className="px-3 py-1 bg-green-600/20 text-[#7C9885] rounded-full text-sm font-semibold">
                        Betaald Account
                      </span>
                    ) : selectedCustomer.account_type === 'fictief' ? (
                      <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-semibold">
                        Fictief Account
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-700 text-[#636E72] rounded-full text-sm font-semibold">
                        Gratis Account
                      </span>
                    )}
                  </div>
                </div>
                {selectedCustomer.investmentDetails?.goal ? (
                  <>
                    <div>
                      <span className="text-sm text-[#636E72]">Doelstelling:</span>
                      <div className="font-medium text-[#2D3436]">{selectedCustomer.investmentDetails.goal}</div>
                    </div>
                    <div>
                      <span className="text-sm text-[#636E72]">Horizon:</span>
                      <div className="font-medium text-[#2D3436]">{selectedCustomer.investmentDetails.horizon} jaar</div>
                    </div>
                    <div>
                      <span className="text-sm text-[#636E72]">Beleggingsbedrag:</span>
                      <div className="font-medium text-[#2D3436]">€ {parseInt(selectedCustomer.investmentDetails.amount || 0).toLocaleString('nl-NL')}</div>
                    </div>
                    <div>
                      <span className="text-sm text-[#636E72]">Maandelijkse storting:</span>
                      <div className="font-medium text-[#2D3436]">€ {parseInt(selectedCustomer.investmentDetails.monthlyContribution || 0).toLocaleString('nl-NL')}</div>
                    </div>
                    <div>
                      <span className="text-sm text-[#636E72]">Risicoprofiel:</span>
                      <div className="font-medium text-[#2D3436]">{selectedCustomer.investmentDetails.riskProfile || 'Niet ingesteld'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-[#636E72]">Actuele Waarde:</span>
                      <div className="font-medium text-lg text-[#7C9885]">
                        € {parseInt(selectedCustomer.investmentDetails.current_portfolio_value || selectedCustomer.investmentDetails.amount || 0).toLocaleString('nl-NL')}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-[#636E72]">Totaal Rendement:</span>
                      <div className={`font-medium text-lg ${(() => {
                        const initialValue = parseFloat(selectedCustomer.investmentDetails.amount || 0);
                        const currentValue = selectedCustomer.investmentDetails.current_portfolio_value || initialValue;
                        const returnPercentage = selectedCustomer.investmentDetails.total_return || (initialValue > 0 ? ((currentValue - initialValue) / initialValue * 100) : 0);
                        return returnPercentage >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]';
                      })()}`}>
                        {(() => {
                          const returnPercentage = selectedCustomer.investmentDetails.total_return !== null && selectedCustomer.investmentDetails.total_return !== undefined
                            ? parseFloat(selectedCustomer.investmentDetails.total_return).toFixed(2)
                            : '0.00';
                          return `${parseFloat(returnPercentage) >= 0 ? '+' : ''}${returnPercentage}%`;
                        })()}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[#636E72]">Nog geen beleggingsinformatie beschikbaar</p>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio Performance */}
          {selectedCustomer.portfolioValue && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-xl p-6">
                <h2 className="text-xl font-bold mb-4 text-[#7C9885]">Portfolio Waarde</h2>
                <div className="text-3xl font-bold text-[#2D3436]">
                  € {selectedCustomer.portfolioValue.toLocaleString('nl-NL')}
                </div>
              </div>
              <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-xl p-6">
                <h2 className="text-xl font-bold mb-4 text-[#7C9885]">Totaal Rendement</h2>
                <div className={`text-3xl font-bold ${selectedCustomer.totalReturn >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                  {selectedCustomer.totalReturn >= 0 ? '+' : ''}{selectedCustomer.totalReturn}%
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-[#7C9885]">Portfolio</h2>
            {selectedCustomer.portfolio && selectedCustomer.portfolio.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FEFEFE]/50 border-b border-[#E8E8E6]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#636E72]">ETF</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#636E72]">Categorie</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-[#636E72]">Weging</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-[#636E72]">TER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {selectedCustomer.portfolio.map((etf, idx) => {
                      const fullETF = etfs.find(e => e.isin === etf.isin) || etf;
                      return (
                        <tr key={idx} className="hover:bg-[#FEFEFE]/30 transition-colors">
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => setSelectedETF(fullETF)}
                              className="text-[#7C9885] hover:text-[#20D4BA] hover:underline text-left"
                            >
                              {etf.naam}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#636E72]">{etf.categorie}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-[#2D3436]">{(etf.weight || 0).toFixed(1)}%</td>
                          <td className="px-4 py-3 text-sm text-right text-[#636E72]">{etf['ter p.a.']}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[#636E72]">Klant heeft nog geen portfolio samengesteld</p>
            )}
          </div>

          {/* Transaction History */}
          {selectedCustomer.transactions && selectedCustomer.transactions.length > 0 && (
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-[#7C9885]">Transactie Geschiedenis</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FEFEFE]/50 border-b border-[#E8E8E6]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#636E72]">Datum</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#636E72]">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#636E72]">Beschrijving</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-[#636E72]">Bedrag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {selectedCustomer.transactions.map((transaction, idx) => (
                      <tr key={idx} className="hover:bg-[#FEFEFE]/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-[#636E72]">
                          {new Date(transaction.date).toLocaleDateString('nl-NL')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            transaction.type === 'Storting' ? 'bg-green-600/20 text-[#7C9885]' : 'bg-blue-600/20 text-blue-400'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#636E72]">{transaction.description}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-[#7C9885]">
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

  // ========================
  // TRADING PAGE COMPONENT
  // ========================
  const TradingPage = () => {
    const [etfs, setEtfs] = useState([]);
    const [orders, setOrders] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState({ connected: false, account: null });
    const [orderForm, setOrderForm] = useState({ symbol: '', conid: 0, side: 'BUY', quantity: 1 });
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [orderSuccess, setOrderSuccess] = useState('');

    // Model Portfolio state
    const [activeTab, setActiveTab] = useState('trade'); // 'trade', 'modelPortfolio', 'customPortfolio'
    const [customPortfolio, setCustomPortfolio] = useState([]); // [{conid, symbol, weight}]
    const [portfolioAmount, setPortfolioAmount] = useState(1000); // Amount to invest
    const [executionStatus, setExecutionStatus] = useState([]); // [{symbol, status, message}]
    const [isExecuting, setIsExecuting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // {type: 'buy'|'sell', data: ...}
    const [executionSummary, setExecutionSummary] = useState(null); // {success: X, failed: Y}

    // Predefined Model Portfolios
    const MODEL_PORTFOLIOS = [
      {
        id: 'classic60-40',
        name: 'Classic 60/40',
        description: '60% Stocks, 40% World ETF - Balanced approach',
        allocations: [
          { symbol: 'VUSA', weight: 60 },
          { symbol: 'IWDA', weight: 40 }
        ]
      },
      {
        id: 'all-world',
        name: 'All World',
        description: '100% Global exposure',
        allocations: [
          { symbol: 'IWDA', weight: 100 }
        ]
      },
      {
        id: 'diversified',
        name: 'Diversified Global',
        description: 'Mix of US, Europe and Emerging Markets',
        allocations: [
          { symbol: 'VUSA', weight: 40 },
          { symbol: 'EXSA', weight: 30 },
          { symbol: 'EMIM', weight: 30 }
        ]
      }
    ];

    // Fetch ETFs from API
    const fetchETFs = async () => {
      try {
        const response = await fetch(`${TRADING_API_URL}/trading/etfs`);
        if (response.ok) {
          const data = await response.json();
          setEtfs(data.etfs || []);
          if (data.etfs?.length > 0 && !orderForm.conid) {
            setOrderForm(prev => ({ ...prev, symbol: data.etfs[0].symbol, conid: data.etfs[0].conid }));
          }
        }
      } catch (error) {
        console.error('Error fetching ETFs:', error);
      }
    };

    // Fetch orders
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${TRADING_API_URL}/trading/orders`);
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    // Fetch positions
    const fetchPositions = async () => {
      try {
        const response = await fetch(`${TRADING_API_URL}/trading/positions`);
        if (response.ok) {
          const data = await response.json();
          setPositions(data.positions || []);
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
      }
    };

    // Auto-link broker account
    const linkBrokerAccount = async () => {
      try {
        const response = await fetch(`${TRADING_API_URL}/trading/broker/link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Customer-ID': user?.id?.toString() || '0',
            'X-Customer-Email': user?.email || ''
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.linked) {
            setConnectionStatus({ connected: true, account: data.account_id });
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Error linking broker:', error);
        return false;
      }
    };

    // Check connection status
    const checkConnection = async () => {
      try {
        const response = await fetch(`${TRADING_API_URL}/health`);
        if (response.ok) {
          const data = await response.json();
          if (data.ib_gateway?.connected) {
            // Try to link account automatically
            await linkBrokerAccount();
            return true;
          }
        }
        return false;
      } catch (error) {
        return false;
      }
    };

    // Place order
    const placeOrder = async (e) => {
      e.preventDefault();
      setOrderLoading(true);
      setOrderError('');
      setOrderSuccess('');

      try {
        const response = await fetch(`${TRADING_API_URL}/trading/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: orderForm.symbol,
            conid: orderForm.conid,
            side: orderForm.side,
            quantity: parseInt(orderForm.quantity),
            order_type: 'MKT'
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setOrderSuccess(`Order executed: ${orderForm.side} ${orderForm.quantity} ${orderForm.symbol}`);
          setOrderForm(prev => ({ ...prev, quantity: 1 }));
          // Refresh data
          setTimeout(() => {
            fetchOrders();
            fetchPositions();
          }, 1000);
        } else {
          setOrderError(data.detail || data.message || 'Order failed');
        }
      } catch (error) {
        setOrderError('Network error: ' + error.message);
      } finally {
        setOrderLoading(false);
      }
    };

    // Execute single order (helper for portfolio execution)
    const executeSingleOrder = async (symbol, conid, side, quantity) => {
      try {
        const response = await fetch(`${TRADING_API_URL}/trading/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            conid,
            side,
            quantity: parseInt(quantity),
            order_type: 'MKT'
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          return { success: true, message: `${side} ${quantity} ${symbol}` };
        }
        return { success: false, message: data.detail || data.message || 'Order failed' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    };

    // Execute portfolio (buy model or custom portfolio)
    const executePortfolio = async (allocations, amount) => {
      setIsExecuting(true);
      setExecutionStatus([]);
      setExecutionSummary(null);

      let successCount = 0;
      let failCount = 0;

      // Calculate quantities for each ETF
      // Simple approach: divide amount by weight, use 1 share minimum
      const ordersToExecute = allocations.map(alloc => {
        const etf = etfs.find(e => e.symbol === alloc.symbol);
        if (!etf) return null;
        // Simple quantity calculation: weight% of 10 shares max (for demo)
        // In production, you'd use actual prices
        const quantity = Math.max(1, Math.round((alloc.weight / 100) * 10));
        return { ...alloc, conid: etf.conid, quantity };
      }).filter(Boolean);

      // Execute orders sequentially
      for (const order of ordersToExecute) {
        setExecutionStatus(prev => [...prev, { symbol: order.symbol, status: 'pending', message: 'Submitting...' }]);

        const result = await executeSingleOrder(order.symbol, order.conid, 'BUY', order.quantity);

        if (result.success) {
          successCount++;
          setExecutionStatus(prev => prev.map(s =>
            s.symbol === order.symbol ? { ...s, status: 'success', message: result.message } : s
          ));
        } else {
          failCount++;
          setExecutionStatus(prev => prev.map(s =>
            s.symbol === order.symbol ? { ...s, status: 'error', message: result.message } : s
          ));
        }

        // Small delay between orders
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setExecutionSummary({ success: successCount, failed: failCount });
      setIsExecuting(false);

      // Refresh positions after execution
      setTimeout(() => {
        fetchOrders();
        fetchPositions();
      }, 1500);
    };

    // Sell all positions
    const sellAllPositions = async () => {
      setIsExecuting(true);
      setExecutionStatus([]);
      setExecutionSummary(null);

      let successCount = 0;
      let failCount = 0;

      // Fetch fresh positions
      const freshPositions = await fetchPositions();
      const positionsToSell = positions.filter(p => parseFloat(p.quantity) > 0);

      for (const pos of positionsToSell) {
        const etf = etfs.find(e => e.symbol === pos.symbol);
        if (!etf) {
          failCount++;
          setExecutionStatus(prev => [...prev, { symbol: pos.symbol, status: 'error', message: 'ETF not found' }]);
          continue;
        }

        setExecutionStatus(prev => [...prev, { symbol: pos.symbol, status: 'pending', message: 'Selling...' }]);

        const result = await executeSingleOrder(pos.symbol, etf.conid, 'SELL', Math.abs(parseFloat(pos.quantity)));

        if (result.success) {
          successCount++;
          setExecutionStatus(prev => prev.map(s =>
            s.symbol === pos.symbol ? { ...s, status: 'success', message: result.message } : s
          ));
        } else {
          failCount++;
          setExecutionStatus(prev => prev.map(s =>
            s.symbol === pos.symbol ? { ...s, status: 'error', message: result.message } : s
          ));
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setExecutionSummary({ success: successCount, failed: failCount });
      setIsExecuting(false);

      setTimeout(() => {
        fetchOrders();
        fetchPositions();
      }, 1500);
    };

    // Handle confirmation
    const handleConfirm = () => {
      setShowConfirmModal(false);
      if (pendingAction?.type === 'buyPortfolio') {
        executePortfolio(pendingAction.allocations, pendingAction.amount);
      } else if (pendingAction?.type === 'sellAll') {
        sellAllPositions();
      }
      setPendingAction(null);
    };

    // Add ETF to custom portfolio
    const addToCustomPortfolio = (etf) => {
      if (customPortfolio.find(p => p.conid === etf.conid)) return;
      setCustomPortfolio(prev => [...prev, { conid: etf.conid, symbol: etf.symbol, name: etf.name, weight: 0 }]);
    };

    // Update weight in custom portfolio
    const updateCustomWeight = (conid, weight) => {
      setCustomPortfolio(prev => prev.map(p =>
        p.conid === conid ? { ...p, weight: Math.max(0, Math.min(100, parseInt(weight) || 0)) } : p
      ));
    };

    // Remove from custom portfolio
    const removeFromCustomPortfolio = (conid) => {
      setCustomPortfolio(prev => prev.filter(p => p.conid !== conid));
    };

    // Calculate total weight
    const totalWeight = customPortfolio.reduce((sum, p) => sum + p.weight, 0);

    // Initial load
    useEffect(() => {
      const loadData = async () => {
        setLoading(true);
        const connected = await checkConnection();
        if (connected) {
          await Promise.all([fetchETFs(), fetchOrders(), fetchPositions()]);
        } else {
          await fetchETFs(); // Still load ETFs to show the interface
        }
        setLoading(false);
      };
      loadData();
    }, []);

    // Refresh orders periodically
    useEffect(() => {
      if (connectionStatus.connected) {
        const interval = setInterval(() => {
          fetchOrders();
          fetchPositions();
        }, 10000);
        return () => clearInterval(interval);
      }
    }, [connectionStatus.connected]);

    if (loading) {
      return (
        <div className="min-h-screen bg-[#F5F6F4] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C9885] mx-auto mb-4"></div>
            <div className="text-[#2D3436] text-xl">Connecting to LYNX Trading...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        {/* Navigation */}
        <nav className="bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <button onClick={() => setCurrentPage('mainDashboard')} className="text-[#7C9885] font-medium hover:text-[#20D4BA]">
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-[#2D3436]">LYNX Trading</h1>
              <div className="text-sm">
                {connectionStatus.connected ? (
                  <span className="text-[#7C9885] flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    {connectionStatus.account || 'Connected'}
                  </span>
                ) : (
                  <span className="text-yellow-400">Disconnected</span>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Connection Warning */}
          {!connectionStatus.connected && (
            <div className="bg-orange-900/30 border border-orange-600 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-orange-400 mb-2">IB Gateway Not Connected</h2>
              <p className="text-[#636E72] mb-4">
                Cannot connect to IB Gateway. Please ensure:
              </p>
              <ul className="text-[#636E72] text-sm list-disc list-inside space-y-1">
                <li>IB Gateway is running on localhost:4001</li>
                <li>You are logged into LYNX Paper Trading</li>
                <li>The Trading API is running on localhost:8002</li>
              </ul>
              <button
                onClick={async () => {
                  setLoading(true);
                  await checkConnection();
                  await Promise.all([fetchETFs(), fetchOrders(), fetchPositions()]);
                  setLoading(false);
                }}
                className="mt-4 px-4 py-2 bg-orange-600 text-[#2D3436] rounded-lg hover:bg-orange-700"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Messages */}
          {orderError && (
            <div className="bg-red-900/30 border border-red-600 rounded-xl p-4 mb-6">
              <p className="text-[#C0736D]">{orderError}</p>
              <button onClick={() => setOrderError('')} className="text-red-300 text-sm mt-2 hover:underline">Dismiss</button>
            </div>
          )}
          {orderSuccess && (
            <div className="bg-green-900/30 border border-green-600 rounded-xl p-4 mb-6">
              <p className="text-[#7C9885]">{orderSuccess}</p>
              <button onClick={() => setOrderSuccess('')} className="text-green-300 text-sm mt-2 hover:underline">Dismiss</button>
            </div>
          )}

          {/* Execution Summary */}
          {executionSummary && (
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-[#2D3436] mb-4">Execution Summary</h3>
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#7C9885]">{executionSummary.success}</div>
                  <div className="text-[#636E72] text-sm">Orders Submitted</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#C0736D]">{executionSummary.failed}</div>
                  <div className="text-[#636E72] text-sm">Failed</div>
                </div>
              </div>
              <button
                onClick={() => { setExecutionSummary(null); setExecutionStatus([]); }}
                className="mt-4 text-[#636E72] text-sm hover:text-[#2D3436]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Execution Progress */}
          {executionStatus.length > 0 && !executionSummary && (
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-[#2D3436] mb-4">
                {isExecuting ? 'Executing Orders...' : 'Execution Complete'}
              </h3>
              <div className="space-y-2">
                {executionStatus.map((status, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#ECEEED]/50 rounded-lg p-3">
                    <span className="text-[#2D3436] font-medium">{status.symbol}</span>
                    <div className="flex items-center gap-2">
                      {status.status === 'pending' && (
                        <div className="animate-spin h-4 w-4 border-2 border-[#7C9885] border-t-transparent rounded-full"></div>
                      )}
                      {status.status === 'success' && (
                        <span className="text-[#7C9885]">Submitted</span>
                      )}
                      {status.status === 'error' && (
                        <span className="text-[#C0736D]">{status.message}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setActiveTab('trade')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'trade'
                  ? 'bg-[#7C9885] text-gray-900'
                  : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
              }`}
            >
              Single Trade
            </button>
            <button
              onClick={() => setActiveTab('modelPortfolio')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'modelPortfolio'
                  ? 'bg-[#7C9885] text-gray-900'
                  : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
              }`}
            >
              Model Portfolios
            </button>
            <button
              onClick={() => setActiveTab('customPortfolio')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'customPortfolio'
                  ? 'bg-[#7C9885] text-gray-900'
                  : 'bg-[#ECEEED] text-[#636E72] hover:bg-gray-700'
              }`}
            >
              Custom Portfolio
            </button>
          </div>

          {/* SINGLE TRADE TAB */}
          {activeTab === 'trade' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#2D3436] mb-6">Place Order</h2>
              <form onSubmit={placeOrder} className="space-y-5">
                {/* ETF Selector */}
                <div>
                  <label className="block text-[#636E72] text-sm mb-2">Select ETF</label>
                  <select
                    value={orderForm.conid}
                    onChange={(e) => {
                      const etf = etfs.find(et => et.conid === parseInt(e.target.value));
                      setOrderForm(prev => ({ ...prev, conid: parseInt(e.target.value), symbol: etf?.symbol || '' }));
                    }}
                    className="w-full px-4 py-3 bg-[#ECEEED] border border-[#E8E8E6] rounded-lg text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
                  >
                    {etfs.map(etf => (
                      <option key={etf.conid} value={etf.conid}>
                        {etf.symbol} - {etf.name} ({etf.currency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* BUY/SELL Toggle */}
                <div>
                  <label className="block text-[#636E72] text-sm mb-2">Order Side</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setOrderForm(prev => ({ ...prev, side: 'BUY' }))}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        orderForm.side === 'BUY'
                          ? 'bg-green-600 text-[#2D3436]'
                          : 'bg-[#ECEEED] text-[#636E72] border border-[#E8E8E6] hover:border-green-600'
                      }`}
                    >
                      BUY
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderForm(prev => ({ ...prev, side: 'SELL' }))}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        orderForm.side === 'SELL'
                          ? 'bg-red-600 text-[#2D3436]'
                          : 'bg-[#ECEEED] text-[#636E72] border border-[#E8E8E6] hover:border-red-600'
                      }`}
                    >
                      SELL
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[#636E72] text-sm mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#ECEEED] border border-[#E8E8E6] rounded-lg text-[#2D3436] text-center text-xl font-mono focus:border-[#7C9885] focus:outline-none"
                  />
                </div>

                {/* Order Type Info */}
                <div className="bg-[#ECEEED]/50 rounded-lg p-3 text-center">
                  <span className="text-[#636E72] text-sm">Order Type: </span>
                  <span className="text-[#2D3436] font-semibold">MARKET</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={orderLoading || !connectionStatus.connected || etfs.length === 0}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                    orderForm.side === 'BUY'
                      ? 'bg-green-600 hover:bg-green-700 text-[#2D3436]'
                      : 'bg-red-600 hover:bg-red-700 text-[#2D3436]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {orderLoading
                    ? 'Processing...'
                    : `${orderForm.side} ${orderForm.quantity} ${orderForm.symbol}`}
                </button>

                {!connectionStatus.connected && (
                  <p className="text-yellow-400 text-sm text-center">Connect to IB Gateway to place orders</p>
                )}
              </form>
            </div>

            {/* ETF List */}
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#2D3436] mb-4">Available ETFs</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {etfs.map(etf => (
                  <div
                    key={etf.conid}
                    onClick={() => setOrderForm(prev => ({ ...prev, conid: etf.conid, symbol: etf.symbol }))}
                    className={`bg-[#ECEEED]/50 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-700/50 ${
                      orderForm.conid === etf.conid ? 'ring-2 ring-[#7C9885]' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-[#2D3436] font-semibold">{etf.symbol}</h3>
                        <p className="text-[#636E72] text-sm">{etf.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#636E72]">{etf.exchange}</span>
                        <p className="text-[#7C9885] font-mono">{etf.currency}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {etfs.length === 0 && (
                  <p className="text-[#636E72] text-center py-4">No ETFs available</p>
                )}
              </div>
            </div>

            {/* Positions */}
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#2D3436] mb-4">Positions</h2>
              {positions.length > 0 ? (
                <div className="space-y-3">
                  {positions.map((pos, idx) => (
                    <div key={idx} className="bg-[#ECEEED]/50 rounded-lg p-4">
                      <div className="flex justify-between">
                        <span className="text-[#2D3436] font-semibold">{pos.symbol}</span>
                        <span className={`font-mono ${parseFloat(pos.unrealized_pnl || 0) >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                          {pos.unrealized_pnl ? `€${parseFloat(pos.unrealized_pnl).toFixed(2)}` : '-'}
                        </span>
                      </div>
                      <div className="text-[#636E72] text-sm mt-1">
                        {pos.quantity} shares @ €{parseFloat(pos.avg_cost || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#636E72] text-center py-4">No positions</p>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#2D3436] mb-4">Recent Orders</h2>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order, idx) => (
                    <div key={idx} className="bg-[#ECEEED]/50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            order.side === 'BUY' || order.side === 'BOT'
                              ? 'bg-green-600/30 text-[#7C9885]'
                              : 'bg-red-600/30 text-[#C0736D]'
                          }`}>
                            {order.side === 'BOT' ? 'BUY' : order.side}
                          </span>
                          <span className="text-[#2D3436]">{order.quantity} {order.symbol}</span>
                        </div>
                        <span className={`text-sm font-medium ${
                          order.status === 'Filled' ? 'text-[#7C9885]' :
                          order.status === 'Cancelled' ? 'text-[#C0736D]' : 'text-yellow-400'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      {order.avg_fill_price && (
                        <div className="text-[#636E72] text-sm mt-1">
                          Filled @ €{parseFloat(order.avg_fill_price).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#636E72] text-center py-4">No recent orders</p>
              )}
            </div>
          </div>
          )}

          {/* MODEL PORTFOLIOS TAB */}
          {activeTab === 'modelPortfolio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MODEL_PORTFOLIOS.map(portfolio => (
                  <div key={portfolio.id} className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6">
                    <h3 className="text-xl font-bold text-[#2D3436] mb-2">{portfolio.name}</h3>
                    <p className="text-[#636E72] text-sm mb-4">{portfolio.description}</p>

                    {/* Allocations */}
                    <div className="space-y-2 mb-6">
                      {portfolio.allocations.map((alloc, idx) => {
                        const etf = etfs.find(e => e.symbol === alloc.symbol);
                        return (
                          <div key={idx} className="flex justify-between items-center bg-[#ECEEED]/50 rounded-lg p-3">
                            <div>
                              <span className="text-[#2D3436] font-medium">{alloc.symbol}</span>
                              {etf && <span className="text-[#636E72] text-xs ml-2">{etf.name}</span>}
                            </div>
                            <span className="text-[#7C9885] font-bold">{alloc.weight}%</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Buy Button */}
                    <button
                      onClick={() => {
                        setPendingAction({ type: 'buyPortfolio', allocations: portfolio.allocations, amount: portfolioAmount });
                        setShowConfirmModal(true);
                      }}
                      disabled={isExecuting || !connectionStatus.connected}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-[#2D3436] font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Buy Portfolio
                    </button>
                  </div>
                ))}
              </div>

              {/* Positions with Sell All */}
              <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-[#2D3436]">Current Positions</h2>
                  {positions.length > 0 && (
                    <button
                      onClick={() => {
                        setPendingAction({ type: 'sellAll' });
                        setShowConfirmModal(true);
                      }}
                      disabled={isExecuting || !connectionStatus.connected}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[#2D3436] font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sell All Positions
                    </button>
                  )}
                </div>
                {positions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {positions.map((pos, idx) => (
                      <div key={idx} className="bg-[#ECEEED]/50 rounded-lg p-4">
                        <div className="flex justify-between">
                          <span className="text-[#2D3436] font-semibold">{pos.symbol}</span>
                          <span className={`font-mono ${parseFloat(pos.unrealized_pnl || 0) >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                            {pos.unrealized_pnl ? `€${parseFloat(pos.unrealized_pnl).toFixed(2)}` : '-'}
                          </span>
                        </div>
                        <div className="text-[#636E72] text-sm mt-1">
                          {pos.quantity} shares @ €{parseFloat(pos.avg_cost || 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#636E72] text-center py-4">No positions</p>
                )}
              </div>
            </div>
          )}

          {/* CUSTOM PORTFOLIO TAB */}
          {activeTab === 'customPortfolio' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ETF Selector */}
              <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6">
                <h2 className="text-xl font-bold text-[#2D3436] mb-4">Select ETFs</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {etfs.map(etf => {
                    const isInPortfolio = customPortfolio.some(p => p.conid === etf.conid);
                    return (
                      <div
                        key={etf.conid}
                        onClick={() => !isInPortfolio && addToCustomPortfolio(etf)}
                        className={`bg-[#ECEEED]/50 rounded-lg p-4 transition-all ${
                          isInPortfolio
                            ? 'opacity-50 cursor-not-allowed ring-2 ring-[#7C9885]'
                            : 'cursor-pointer hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-[#2D3436] font-semibold">{etf.symbol}</h3>
                            <p className="text-[#636E72] text-sm">{etf.name}</p>
                          </div>
                          {isInPortfolio ? (
                            <span className="text-[#7C9885] text-sm">Added</span>
                          ) : (
                            <button className="text-[#636E72] hover:text-[#2D3436] text-sm">+ Add</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Portfolio Builder */}
              <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6">
                <h2 className="text-xl font-bold text-[#2D3436] mb-4">Your Custom Portfolio</h2>

                {customPortfolio.length === 0 ? (
                  <p className="text-[#636E72] text-center py-8">Select ETFs from the list to build your portfolio</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {customPortfolio.map(item => (
                        <div key={item.conid} className="bg-[#ECEEED]/50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[#2D3436] font-semibold">{item.symbol}</span>
                            <button
                              onClick={() => removeFromCustomPortfolio(item.conid)}
                              className="text-[#C0736D] hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.weight}
                              onChange={(e) => updateCustomWeight(item.conid, e.target.value)}
                              className="w-20 px-3 py-2 bg-gray-700 border border-[#D5D5D3] rounded-lg text-[#2D3436] text-center focus:border-[#7C9885] focus:outline-none"
                            />
                            <span className="text-[#636E72]">%</span>
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-[#7C9885] h-2 rounded-full transition-all"
                                style={{ width: `${item.weight}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Weight */}
                    <div className={`flex justify-between items-center p-4 rounded-lg mb-6 ${
                      totalWeight === 100 ? 'bg-green-900/30 border border-green-600' : 'bg-orange-900/30 border border-orange-600'
                    }`}>
                      <span className="text-[#2D3436] font-medium">Total Weight</span>
                      <span className={`text-xl font-bold ${totalWeight === 100 ? 'text-[#7C9885]' : 'text-orange-400'}`}>
                        {totalWeight}%
                      </span>
                    </div>

                    {totalWeight !== 100 && (
                      <p className="text-orange-400 text-sm mb-4">Weights must equal 100% to buy portfolio</p>
                    )}

                    {/* Buy Custom Portfolio Button */}
                    <button
                      onClick={() => {
                        setPendingAction({ type: 'buyPortfolio', allocations: customPortfolio, amount: portfolioAmount });
                        setShowConfirmModal(true);
                      }}
                      disabled={isExecuting || !connectionStatus.connected || totalWeight !== 100}
                      className="w-full py-4 bg-green-600 hover:bg-green-700 text-[#2D3436] font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Buy Custom Portfolio
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-[#2D3436] mb-4">Confirm Action</h3>

              {pendingAction?.type === 'buyPortfolio' && (
                <>
                  <p className="text-[#636E72] mb-4">
                    This will place <span className="text-[#7C9885] font-bold">{pendingAction.allocations.length}</span> MARKET orders:
                  </p>
                  <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                    {pendingAction.allocations.map((alloc, idx) => (
                      <div key={idx} className="flex justify-between bg-[#ECEEED]/50 rounded-lg p-3">
                        <span className="text-[#2D3436]">{alloc.symbol}</span>
                        <span className="text-[#7C9885]">BUY {alloc.weight}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {pendingAction?.type === 'sellAll' && (
                <>
                  <p className="text-[#636E72] mb-4">
                    This will sell <span className="text-[#C0736D] font-bold">ALL</span> your positions ({positions.length} ETFs):
                  </p>
                  <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                    {positions.map((pos, idx) => (
                      <div key={idx} className="flex justify-between bg-[#ECEEED]/50 rounded-lg p-3">
                        <span className="text-[#2D3436]">{pos.symbol}</span>
                        <span className="text-[#C0736D]">SELL {pos.quantity}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-3 mb-6">
                <p className="text-orange-400 text-sm">
                  Warning: This will place multiple trades using MARKET orders. Orders will be submitted sequentially.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => { setShowConfirmModal(false); setPendingAction(null); }}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-[#2D3436] font-medium rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-3 font-bold rounded-lg transition-all ${
                    pendingAction?.type === 'sellAll'
                      ? 'bg-red-600 hover:bg-red-700 text-[#2D3436]'
                      : 'bg-green-600 hover:bg-green-700 text-[#2D3436]'
                  }`}
                >
                  {pendingAction?.type === 'sellAll' ? 'Sell All' : 'Buy Portfolio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes phone-float {
          0%, 100% {
            box-shadow: 0 0 0 2px #1e3a5f, 0 0 0 12px #2c4f7c, 0 20px 40px rgba(40, 235, 207, 0.15), 0 0 60px rgba(40, 235, 207, 0.1);
          }
          50% {
            box-shadow: 0 0 0 2px #0f1e3a, 0 0 0 12px #1a3555, 0 20px 40px rgba(40, 235, 207, 0.3), 0 0 100px rgba(40, 235, 207, 0.3);
          }
        }

        .phone-float {
          animation: phone-float 3s ease-in-out infinite;
        }
      `}</style>
      <TradingProvider user={user}>
      <div className="font-sans">
        {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'register' && <RegisterPage />}
      {currentPage === 'verify-code' && <VerifyCodePage />}
      {currentPage === 'resetPassword' && <ResetPasswordPage />}
      {currentPage === 'emailVerificationPending' && <EmailVerificationPendingPage />}
      {currentPage === 'verify-email' && <EmailVerifyPage />}
      {currentPage === 'mainDashboard' && <MainDashboard />}
      {currentPage === 'portfolioBuilder' && <PortfolioBuilderPage />}
      {currentPage === 'portfolioOverview' && <PortfolioOverviewPage />}
      {currentPage === 'purchase' && <PurchasePage />}
      {currentPage === 'welcome' && <WelcomePage />}
      {currentPage === 'postRegisterWelcome' && <PostRegisterWelcome />}
      {currentPage === 'firstTimeWelcome' && <FirstTimeWelcome />}
      {currentPage === 'financialNews' && <FinancialNewsPage />}
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'customerDatabase' && <CustomerDatabasePage />}
      {currentPage === 'customerDetail' && <CustomerDetailPage />}
      {currentPage === 'incomeCalculator' && <IncomeCalculator onBack={() => setCurrentPage('mainDashboard')} />}
      {currentPage === 'trading' && <TradingDashboard user={user} onBack={() => setCurrentPage('mainDashboard')} onNavigateToBroker={() => setCurrentPage('brokerSettings')} />}
      {currentPage === 'batchTrading' && (
          <div className="min-h-screen bg-[#F5F6F4]">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <button onClick={() => setCurrentPage('mainDashboard')} className="text-[#7C9885] hover:text-[#6B8A74] text-sm mb-2">&larr; Back to Dashboard</button>
                  <h1 className="text-2xl font-bold text-[#2D3436]">Batch Trading</h1>
                  <p className="text-[#636E72]">Submit orders to be executed in the next daily batch</p>
                </div>
              </div>
              <BatchTradingDashboard user={user} />
            </div>
          </div>
      )}
      {currentPage === 'modelPortfolios' && <ModelPortfoliosPage user={user} onBack={() => setCurrentPage('mainDashboard')} onNavigateToTrading={() => setCurrentPage('trading')} />}
      {currentPage === 'community' && <CommunityPage user={user} onBack={() => setCurrentPage('mainDashboard')} onNavigateToTrading={() => setCurrentPage('trading')} />}
      {currentPage === 'brokerSettings' && <BrokerSettings user={user} onBack={() => setCurrentPage('mainDashboard')} />}
      {currentPage === 'totaleWaardeDetail' && (
          <TotaleWaardeDetail onBack={() => setCurrentPage('mainDashboard')} />
      )}
      {currentPage === 'belegdVermogenDetail' && (
          <BelegdVermogenDetail onBack={() => setCurrentPage('mainDashboard')} />
      )}
      {currentPage === 'beschikbaarDetail' && (
          <BeschikbaarDetail onBack={() => setCurrentPage('mainDashboard')} onNavigateToTrading={() => setCurrentPage('trading')} />
      )}
      {currentPage === 'rendementDetail' && (
          <RendementDetail onBack={() => setCurrentPage('mainDashboard')} />
      )}
      {selectedETF && <ETFDetailModal etf={selectedETF} onClose={() => setSelectedETF(null)} />}

      {/* Bulk Buy Modal */}
      <BulkBuyFlow
        user={user}
        isOpen={bulkBuyModalOpen}
        onClose={() => {
          setBulkBuyModalOpen(false);
          setSelectedBulkPortfolioKey(null);
        }}
        portfolioKey={selectedBulkPortfolioKey}
        onAddedToBasket={handleBulkBuyAddedToBasket}
      />

      {/* Chat Widget */}
      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-[#7C9885] to-[#20D4BA] text-[#2D3436] rounded-full p-4 shadow-2xl hover:shadow-[#7C9885]/50 transition-all duration-300 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      <Footer />
      </div>
      </TradingProvider>
    </>
  );
};

export default ETFPortal;