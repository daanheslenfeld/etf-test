/**
 * CreatePortfolio Component
 *
 * Modal for creating a new community portfolio with:
 * - Portfolio name and description
 * - ETF selection from tradable ETFs
 * - Weight allocation
 * - Public/Private toggle
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Info,
} from 'lucide-react';
import { TRADABLE_ETFS, isTradable, getTradingInfo } from '../../data/tradableETFs';

// Get a subset of popular ETFs for quick selection
const POPULAR_ETFS = [
  { isin: 'IE00B4L5Y983', name: 'iShares Core MSCI World', category: 'Aandelen' },
  { isin: 'IE00BK5BQT80', name: 'Vanguard FTSE All-World', category: 'Aandelen' },
  { isin: 'IE00B5BMR087', name: 'iShares Core S&P 500', category: 'Aandelen' },
  { isin: 'IE00BKM4GZ66', name: 'iShares Core MSCI EM IMI', category: 'Aandelen' },
  { isin: 'IE00B53SZB19', name: 'Invesco NASDAQ-100', category: 'Aandelen' },
  { isin: 'IE00B4WXJJ64', name: 'iShares Core Euro Government Bond', category: 'Obligaties' },
  { isin: 'IE00B3F81R35', name: 'iShares Core EUR Corporate Bond', category: 'Obligaties' },
  { isin: 'IE00B579F325', name: 'Invesco Physical Gold', category: 'Commodities' },
  { isin: 'IE00B1FZS350', name: 'iShares Dev Markets Property', category: 'Vastgoed' },
  { isin: 'LU0290358497', name: 'Xtrackers EUR Overnight Rate', category: 'Money market' },
  { isin: 'IE00BKX55T58', name: 'iShares MSCI World SRI', category: 'Aandelen' },
  { isin: 'IE00B1XNHC34', name: 'iShares Global Clean Energy', category: 'Aandelen' },
];

export default function CreatePortfolio({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? false);
  const [holdings, setHoldings] = useState(initialData?.holdings || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate total weight
  const totalWeight = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (h.weight || 0), 0);
  }, [holdings]);

  // Check if portfolio is valid
  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (holdings.length === 0) return false;
    if (Math.abs(totalWeight - 100) > 0.01) return false;
    return true;
  }, [name, holdings, totalWeight]);

  // Search tradable ETFs
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return POPULAR_ETFS.filter(etf =>
        !holdings.some(h => h.isin === etf.isin)
      );
    }

    const q = searchQuery.toLowerCase();
    const results = [];

    // Search in TRADABLE_ETFS
    Object.entries(TRADABLE_ETFS).forEach(([isin, info]) => {
      if (holdings.some(h => h.isin === isin)) return;
      if (results.length >= 20) return;

      const matchesIsin = isin.toLowerCase().includes(q);
      const matchesSymbol = info.symbol?.toLowerCase().includes(q);
      const matchesName = info.name?.toLowerCase().includes(q);

      if (matchesIsin || matchesSymbol || matchesName) {
        results.push({
          isin,
          name: info.name,
          symbol: info.symbol,
          category: 'ETF',
        });
      }
    });

    return results;
  }, [searchQuery, holdings]);

  // Add ETF to holdings
  const addHolding = useCallback((etf) => {
    setHoldings(prev => [
      ...prev,
      {
        isin: etf.isin,
        name: etf.name,
        symbol: etf.symbol || getTradingInfo(etf.isin)?.symbol,
        category: etf.category,
        weight: 0,
      },
    ]);
    setSearchQuery('');
  }, []);

  // Remove ETF from holdings
  const removeHolding = useCallback((isin) => {
    setHoldings(prev => prev.filter(h => h.isin !== isin));
  }, []);

  // Update holding weight
  const updateWeight = useCallback((isin, weight) => {
    setHoldings(prev => prev.map(h =>
      h.isin === isin ? { ...h, weight: Math.max(0, Math.min(100, weight)) } : h
    ));
  }, []);

  // Distribute weights equally
  const distributeEqually = useCallback(() => {
    if (holdings.length === 0) return;
    const equalWeight = Math.floor(100 / holdings.length);
    const remainder = 100 - (equalWeight * holdings.length);

    setHoldings(prev => prev.map((h, i) => ({
      ...h,
      weight: equalWeight + (i < remainder ? 1 : 0),
    })));
  }, [holdings.length]);

  // Normalize weights to 100%
  const normalizeWeights = useCallback(() => {
    if (holdings.length === 0 || totalWeight === 0) return;

    const factor = 100 / totalWeight;
    setHoldings(prev => prev.map(h => ({
      ...h,
      weight: Math.round(h.weight * factor * 10) / 10,
    })));
  }, [holdings, totalWeight]);

  // Handle save
  const handleSave = useCallback(async () => {
    const newErrors = [];

    if (!name.trim()) {
      newErrors.push('Portfolio naam is verplicht');
    }
    if (holdings.length === 0) {
      newErrors.push('Voeg minimaal 1 ETF toe');
    }
    if (Math.abs(totalWeight - 100) > 0.01) {
      newErrors.push(`Totale weging moet 100% zijn (huidige: ${totalWeight.toFixed(1)}%)`);
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    setIsSaving(true);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        isPublic,
        holdings: holdings.filter(h => h.weight > 0),
        riskLevel: calculateRiskLevel(holdings),
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch (error) {
      setErrors([error.message || 'Opslaan mislukt']);
    } finally {
      setIsSaving(false);
    }
  }, [name, description, isPublic, holdings, totalWeight, onSave, onClose]);

  // Calculate risk level based on asset allocation
  const calculateRiskLevel = (holdings) => {
    const categories = {};
    holdings.forEach(h => {
      const cat = h.category || 'Other';
      categories[cat] = (categories[cat] || 0) + h.weight;
    });

    const equityWeight = (categories['Aandelen'] || 0) + (categories['ETF'] || 0);
    if (equityWeight >= 90) return 5;
    if (equityWeight >= 70) return 4;
    if (equityWeight >= 40) return 3;
    if (equityWeight >= 20) return 2;
    return 1;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-[#1A1B1F] rounded-2xl shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              {initialData ? 'Portfolio bewerken' : 'Nieuw portfolio maken'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Stel je eigen portfolio samen uit 2400+ tradable ETFs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              {errors.map((error, i) => (
                <div key={i} className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              ))}
            </div>
          )}

          {/* Basic info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Portfolio naam *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bijv. Tech Growth Portfolio"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#28EBCF]"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Beschrijving
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschrijf je beleggingsstrategie..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#28EBCF] resize-none"
                maxLength={500}
              />
            </div>

            {/* Public/Private toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Eye className="w-5 h-5 text-[#28EBCF]" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <div className="font-medium text-white">
                    {isPublic ? 'Publiek portfolio' : 'Prive portfolio'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {isPublic
                      ? 'Andere gebruikers kunnen dit portfolio zien en kopiëren'
                      : 'Alleen jij kunt dit portfolio zien'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isPublic ? 'bg-[#28EBCF]' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    isPublic ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ETF Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">ETF Selectie</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={distributeEqually}
                  disabled={holdings.length === 0}
                  className="text-sm px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Gelijk verdelen
                </button>
                <button
                  onClick={normalizeWeights}
                  disabled={holdings.length === 0 || totalWeight === 0}
                  className="text-sm px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Normaliseer naar 100%
                </button>
              </div>
            </div>

            {/* Search ETFs */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek ETF op ISIN, symbool of naam..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#28EBCF]"
              />
            </div>

            {/* Search results / Popular ETFs */}
            {searchResults.length > 0 && (
              <div className="mb-4 max-h-48 overflow-y-auto bg-gray-800/50 rounded-lg border border-gray-700">
                {searchResults.map(etf => (
                  <button
                    key={etf.isin}
                    onClick={() => addHolding(etf)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 transition-colors text-left"
                  >
                    <div>
                      <div className="text-white font-medium">{etf.name}</div>
                      <div className="text-sm text-gray-400">
                        {etf.symbol || etf.isin} • {etf.category}
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-[#28EBCF]" />
                  </button>
                ))}
              </div>
            )}

            {/* Selected holdings */}
            {holdings.length > 0 ? (
              <div className="space-y-2">
                {holdings.map(holding => (
                  <div
                    key={holding.isin}
                    className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {holding.symbol || holding.isin.slice(-6)}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                          {holding.category}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 truncate">{holding.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateWeight(holding.isin, holding.weight - 5)}
                        className="p-1 rounded hover:bg-gray-700"
                      >
                        <Minus className="w-4 h-4 text-gray-400" />
                      </button>
                      <input
                        type="number"
                        value={holding.weight}
                        onChange={(e) => updateWeight(holding.isin, parseFloat(e.target.value) || 0)}
                        className="w-16 text-center py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-[#28EBCF]"
                        min="0"
                        max="100"
                        step="1"
                      />
                      <span className="text-gray-400">%</span>
                      <button
                        onClick={() => updateWeight(holding.isin, holding.weight + 5)}
                        className="p-1 rounded hover:bg-gray-700"
                      >
                        <Plus className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => removeHolding(holding.isin)}
                        className="p-1 rounded hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-dashed border-gray-700">
                <Info className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">
                  Zoek en selecteer ETFs om toe te voegen aan je portfolio
                </p>
              </div>
            )}

            {/* Total weight indicator */}
            {holdings.length > 0 && (
              <div className={`mt-4 p-3 rounded-lg flex items-center justify-between ${
                Math.abs(totalWeight - 100) <= 0.01
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-yellow-500/10 text-yellow-400'
              }`}>
                <span>Totale weging</span>
                <span className="font-bold">
                  {totalWeight.toFixed(1)}%
                  {Math.abs(totalWeight - 100) > 0.01 && (
                    <span className="text-sm font-normal ml-2">
                      ({totalWeight > 100 ? '+' : ''}{(totalWeight - 100).toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-[#1A1B1F]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {holdings.length} ETF{holdings.length !== 1 ? 's' : ''} geselecteerd
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid || isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-[#28EBCF] text-gray-900 hover:bg-[#20d4ba] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Portfolio opslaan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
