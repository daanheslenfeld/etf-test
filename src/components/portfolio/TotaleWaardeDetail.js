import React, { useMemo, useState } from 'react';
import { PiggyBank, ChevronDown, ChevronUp, Banknote, TrendingUp, Landmark, Gem, Building2, Layers, CircleDollarSign } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { classifyAssetClass } from '../../utils/etfClassifiers';
import DetailPageHeader, { getETFName } from './DetailPageHeader';

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num);
};

const formatPercent = (value) => {
  const num = parseFloat(value) || 0;
  return `${num.toFixed(1)}%`;
};

const ASSET_CLASS_CONFIG = {
  cash: { label: 'Cash', icon: Banknote, color: '#7C9885' },
  equity: { label: 'Aandelen', icon: TrendingUp, color: '#6B7B8A' },
  bonds: { label: 'Obligaties', icon: Landmark, color: '#C9A962' },
  commodities: { label: 'Grondstoffen', icon: Gem, color: '#C0736D' },
  realEstate: { label: 'Vastgoed', icon: Building2, color: '#8B6B9B' },
  moneyMarket: { label: 'Geldmarkt', icon: CircleDollarSign, color: '#5B9BD5' },
  crypto: { label: 'Crypto', icon: CircleDollarSign, color: '#E8A838' },
  mixed: { label: 'Gemengd', icon: Layers, color: '#636E72' },
};

export default function TotaleWaardeDetail({ onBack }) {
  const { positions, totalValue, portfolioValue, cashBalance } = useTrading();
  const [expandedSections, setExpandedSections] = useState({});

  const assetGroups = useMemo(() => {
    const groups = {};

    // Group positions by asset class
    for (const pos of positions) {
      const name = getETFName(pos);
      const assetClass = classifyAssetClass(name, pos.symbol);
      if (!groups[assetClass]) {
        groups[assetClass] = { positions: [], totalValue: 0 };
      }
      const mv = parseFloat(pos.market_value) || 0;
      groups[assetClass].positions.push(pos);
      groups[assetClass].totalValue += mv;
    }

    // Add cash as its own group
    if (cashBalance > 0 || Object.keys(groups).length === 0) {
      groups.cash = {
        positions: [],
        totalValue: parseFloat(cashBalance) || 0,
      };
    }

    // Calculate percentages and sort by value
    const totalVal = parseFloat(totalValue) || 1;
    const result = Object.entries(groups)
      .map(([key, group]) => ({
        key,
        ...group,
        percentage: (group.totalValue / totalVal) * 100,
        config: ASSET_CLASS_CONFIG[key] || ASSET_CLASS_CONFIG.mixed,
      }))
      .filter(g => g.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue);

    return result;
  }, [positions, cashBalance, totalValue]);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <DetailPageHeader title="Totale Waarde" onBack={onBack}>
      {/* Summary Card */}
      <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-5 mb-6 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#7C9885]/10 rounded-xl">
            <PiggyBank className="w-5 h-5 text-[#7C9885]" />
          </div>
          <div>
            <div className="text-xs text-[#B2BEC3] font-medium">Totale Waarde</div>
            <div className="text-2xl font-bold text-[#2D3436] tabular-nums">
              {formatCurrency(totalValue)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-[#F5F6F4] rounded-lg p-3">
            <div className="text-xs text-[#B2BEC3] mb-1">Belegd</div>
            <div className="font-semibold text-[#2D3436] tabular-nums">{formatCurrency(portfolioValue)}</div>
          </div>
          <div className="bg-[#F5F6F4] rounded-lg p-3">
            <div className="text-xs text-[#B2BEC3] mb-1">Cash</div>
            <div className={`font-semibold tabular-nums ${cashBalance > 0 ? 'text-[#7C9885]' : 'text-[#2D3436]'}`}>
              {formatCurrency(cashBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Composition Bar */}
      {assetGroups.length > 0 && (
        <div className="mb-6">
          <div className="flex rounded-full overflow-hidden h-3 bg-[#E8E8E6]">
            {assetGroups.map((group) => (
              <div
                key={group.key}
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.max(group.percentage, 1)}%`,
                  backgroundColor: group.config.color,
                }}
                title={`${group.config.label}: ${formatPercent(group.percentage)}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {assetGroups.map((group) => (
              <div key={group.key} className="flex items-center gap-1.5 text-xs text-[#636E72]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.config.color }} />
                <span>{group.config.label} {formatPercent(group.percentage)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asset Class Sections */}
      <div className="space-y-3">
        {assetGroups.map((group) => {
          const Icon = group.config.icon;
          const isExpanded = expandedSections[group.key];
          const hasPositions = group.positions.length > 0;

          return (
            <div key={group.key} className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(45,52,54,0.04)]">
              <button
                onClick={() => hasPositions && toggleSection(group.key)}
                className={`w-full flex items-center justify-between p-4 text-left ${hasPositions ? 'hover:bg-[#F5F6F4] cursor-pointer' : 'cursor-default'} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${group.config.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: group.config.color }} />
                  </div>
                  <div>
                    <div className="font-medium text-[#2D3436] text-sm">{group.config.label}</div>
                    <div className="text-xs text-[#B2BEC3]">
                      {group.key === 'cash' ? 'Beschikbaar saldo' : `${group.positions.length} positie${group.positions.length !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold text-[#2D3436] text-sm tabular-nums">{formatCurrency(group.totalValue)}</div>
                    <div className="text-xs text-[#B2BEC3] tabular-nums">{formatPercent(group.percentage)}</div>
                  </div>
                  {hasPositions && (
                    <div className="text-[#B2BEC3]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded Holdings */}
              {isExpanded && hasPositions && (
                <div className="border-t border-[#E8E8E6]">
                  {group.positions.map((pos, idx) => {
                    const marketValue = parseFloat(pos.market_value) || 0;
                    const totalVal = parseFloat(totalValue) || 1;
                    const posPercent = (marketValue / totalVal) * 100;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-4 py-3 ${idx > 0 ? 'border-t border-[#F5F6F4]' : ''}`}
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="text-sm text-[#2D3436] truncate">{getETFName(pos)}</div>
                          <div className="text-xs text-[#B2BEC3]">
                            {pos.symbol} &middot; {parseFloat(pos.quantity || 0).toFixed(0)} stuks
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium text-[#2D3436] tabular-nums">{formatCurrency(marketValue)}</div>
                          <div className="text-xs text-[#B2BEC3] tabular-nums">{formatPercent(posPercent)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {positions.length === 0 && cashBalance === 0 && (
        <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-10 text-center shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
          <PiggyBank className="w-10 h-10 text-[#B2BEC3] mx-auto mb-3" />
          <p className="text-[#636E72]">Geen portfolio data gevonden</p>
        </div>
      )}
    </DetailPageHeader>
  );
}
