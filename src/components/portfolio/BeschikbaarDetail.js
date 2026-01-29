import React, { useState, useMemo, useCallback } from 'react';
import { Wallet, ArrowLeft, PieChart, Plus, Search, AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import DetailPageHeader, { getETFName } from './DetailPageHeader';

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num);
};

// --- Sub-views ---

function OverviewView({ cashBalance, onSelect }) {
  const options = [
    {
      key: 'proRata',
      icon: PieChart,
      title: 'Pro-rata verdeling',
      desc: 'Verdeel over je bestaande posities op basis van hun huidige gewicht',
      color: '#7C9885',
    },
    {
      key: 'addExisting',
      icon: Plus,
      title: 'Toevoegen aan positie',
      desc: 'Koop meer van een ETF die je al in portefeuille hebt',
      color: '#6B7B8A',
    },
    {
      key: 'buyNew',
      icon: Search,
      title: 'Nieuw ETF kopen',
      desc: 'Zoek en koop een ETF die nog niet in je portefeuille zit',
      color: '#C9A962',
    },
  ];

  return (
    <>
      <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-5 mb-6 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7C9885]/10 rounded-xl">
            <Wallet className="w-5 h-5 text-[#7C9885]" />
          </div>
          <div>
            <div className="text-xs text-[#B2BEC3] font-medium">Beschikbaar Saldo</div>
            <div className={`text-2xl font-bold tabular-nums ${cashBalance > 0 ? 'text-[#7C9885]' : 'text-[#2D3436]'}`}>
              {formatCurrency(cashBalance)}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key)}
              className="w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 text-left hover:border-[#7C9885]/40 hover:shadow-[0_4px_16px_rgba(45,52,54,0.08)] transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${opt.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: opt.color }} />
                </div>
                <div>
                  <div className="font-medium text-[#2D3436] text-sm">{opt.title}</div>
                  <div className="text-xs text-[#B2BEC3] mt-0.5">{opt.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function ProRataView({ onBack, onDone }) {
  const { positions, portfolioValue, cashBalance, availableFunds, addMultipleToBasket } = useTrading();
  const maxAmount = parseFloat(availableFunds || cashBalance) || 0;
  const [amount, setAmount] = useState(maxAmount.toFixed(2));
  const [submitted, setSubmitted] = useState(false);

  const allocation = useMemo(() => {
    const investAmount = parseFloat(amount) || 0;
    if (investAmount <= 0 || positions.length === 0) return [];

    const totalPortfolioVal = parseFloat(portfolioValue) || 1;
    const result = [];
    let totalCost = 0;

    for (const pos of positions) {
      const marketValue = parseFloat(pos.market_value) || 0;
      const lastPrice = parseFloat(pos.last_price) || parseFloat(pos.avg_cost) || 0;
      if (lastPrice <= 0) continue;

      const weight = marketValue / totalPortfolioVal;
      const units = Math.floor((investAmount * weight) / lastPrice);
      const cost = units * lastPrice;

      if (units > 0) {
        result.push({
          symbol: pos.symbol,
          conid: pos.conid,
          name: getETFName(pos),
          weight,
          units,
          price: lastPrice,
          cost,
        });
        totalCost += cost;
      }
    }

    return result.map(r => ({ ...r, totalCost, remaining: investAmount - totalCost }));
  }, [amount, positions, portfolioValue]);

  const totalCost = allocation.length > 0 ? allocation[0].totalCost : 0;
  const remaining = allocation.length > 0 ? allocation[0].remaining : parseFloat(amount) || 0;
  const investAmount = parseFloat(amount) || 0;

  const handleSubmit = () => {
    const orders = allocation.map(a => ({
      symbol: a.symbol,
      conid: a.conid,
      side: 'BUY',
      quantity: a.units,
      orderType: 'MKT',
    }));
    addMultipleToBasket(orders);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-10">
        <CheckCircle className="w-12 h-12 text-[#7C9885] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#2D3436] mb-2">Toegevoegd aan mandje</h3>
        <p className="text-sm text-[#636E72] mb-6">
          {allocation.length} order{allocation.length !== 1 ? 's' : ''} voor {formatCurrency(totalCost)}
        </p>
        <button onClick={onDone} className="px-6 py-2.5 bg-[#7C9885] text-white rounded-xl text-sm font-medium hover:bg-[#6B8A74] transition-colors">
          Naar Trading
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#636E72] hover:text-[#2D3436] mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>
      <h2 className="text-lg font-semibold text-[#2D3436] mb-4">Pro-rata Verdeling</h2>

      {/* Amount Input */}
      <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 mb-4">
        <label className="text-xs text-[#B2BEC3] font-medium block mb-2">Te beleggen bedrag</label>
        <div className="flex items-center gap-2">
          <span className="text-[#636E72] font-medium">&euro;</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={maxAmount}
            min={0}
            step="0.01"
            className="flex-1 text-xl font-bold text-[#2D3436] bg-transparent outline-none tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        <div className="text-xs text-[#B2BEC3] mt-1">Max: {formatCurrency(maxAmount)}</div>
        {investAmount > maxAmount && (
          <div className="flex items-center gap-1 text-xs text-[#C0736D] mt-2">
            <AlertCircle className="w-3.5 h-3.5" /> Bedrag overschrijdt beschikbaar saldo
          </div>
        )}
      </div>

      {/* Preview Table */}
      {allocation.length > 0 && investAmount <= maxAmount && (
        <>
          <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl overflow-hidden mb-4">
            <div className="divide-y divide-[#F5F6F4]">
              {allocation.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="text-sm font-medium text-[#2D3436] truncate">{a.name}</div>
                    <div className="text-xs text-[#B2BEC3]">{(a.weight * 100).toFixed(1)}% gewicht</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium text-[#2D3436] tabular-nums">{a.units} stuks</div>
                    <div className="text-xs text-[#B2BEC3] tabular-nums">{formatCurrency(a.cost)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#F5F6F4] px-4 py-3 flex justify-between text-sm">
              <span className="text-[#636E72] font-medium">Totale kosten</span>
              <span className="font-semibold text-[#2D3436] tabular-nums">{formatCurrency(totalCost)}</span>
            </div>
            <div className="bg-[#F5F6F4] px-4 py-2 flex justify-between text-xs border-t border-[#E8E8E6]">
              <span className="text-[#B2BEC3]">Resterend na aankoop</span>
              <span className="text-[#636E72] tabular-nums">{formatCurrency(remaining)}</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#7C9885] text-white rounded-xl font-medium hover:bg-[#6B8A74] transition-colors active:scale-[0.98]"
          >
            <ShoppingCart className="w-4 h-4" />
            Toevoegen aan mandje
          </button>
        </>
      )}

      {allocation.length === 0 && investAmount > 0 && investAmount <= maxAmount && (
        <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#C9A962] mx-auto mb-2" />
          <p className="text-sm text-[#636E72]">Bedrag te laag om hele eenheden te kopen</p>
        </div>
      )}
    </>
  );
}

function AddExistingView({ onBack, onDone }) {
  const { positions, cashBalance, availableFunds, addToBasket } = useTrading();
  const maxAmount = parseFloat(availableFunds || cashBalance) || 0;
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedPos = positions.find(p => p.symbol === selected);
  const lastPrice = selectedPos ? (parseFloat(selectedPos.last_price) || parseFloat(selectedPos.avg_cost) || 0) : 0;
  const investAmount = parseFloat(amount) || 0;
  const units = lastPrice > 0 ? Math.floor(investAmount / lastPrice) : 0;
  const cost = units * lastPrice;

  const handleSubmit = () => {
    if (!selectedPos || units <= 0) return;
    addToBasket({
      symbol: selectedPos.symbol,
      conid: selectedPos.conid,
      side: 'BUY',
      quantity: units,
      orderType: 'MKT',
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-10">
        <CheckCircle className="w-12 h-12 text-[#7C9885] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#2D3436] mb-2">Toegevoegd aan mandje</h3>
        <p className="text-sm text-[#636E72] mb-6">
          {units}x {selectedPos?.symbol} voor {formatCurrency(cost)}
        </p>
        <button onClick={onDone} className="px-6 py-2.5 bg-[#7C9885] text-white rounded-xl text-sm font-medium hover:bg-[#6B8A74] transition-colors">
          Naar Trading
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#636E72] hover:text-[#2D3436] mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>
      <h2 className="text-lg font-semibold text-[#2D3436] mb-4">Toevoegen aan Positie</h2>

      {/* Position Selector */}
      {!selected && (
        <div className="space-y-2">
          {positions.map((pos, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(pos.symbol)}
              className="w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 text-left hover:border-[#7C9885]/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#2D3436] text-sm">{getETFName(pos)}</div>
                  <div className="text-xs text-[#B2BEC3]">{pos.symbol} &middot; {parseFloat(pos.quantity || 0).toFixed(0)} stuks</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-[#2D3436] tabular-nums">{formatCurrency(pos.market_value)}</div>
                  <div className="text-xs text-[#B2BEC3] tabular-nums">{formatCurrency(parseFloat(pos.last_price) || parseFloat(pos.avg_cost) || 0)}/stuk</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Amount Input + Preview */}
      {selected && selectedPos && (
        <>
          <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium text-[#2D3436] text-sm">{getETFName(selectedPos)}</div>
                <div className="text-xs text-[#B2BEC3]">{selectedPos.symbol} &middot; {formatCurrency(lastPrice)}/stuk</div>
              </div>
              <button onClick={() => { setSelected(null); setAmount(''); }} className="text-xs text-[#7C9885] hover:underline">Wijzig</button>
            </div>
            <label className="text-xs text-[#B2BEC3] font-medium block mb-2">Bedrag</label>
            <div className="flex items-center gap-2">
              <span className="text-[#636E72] font-medium">&euro;</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={maxAmount}
                min={0}
                step="0.01"
                placeholder="0.00"
                className="flex-1 text-xl font-bold text-[#2D3436] bg-transparent outline-none tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                autoFocus
              />
            </div>
            <div className="text-xs text-[#B2BEC3] mt-1">Max: {formatCurrency(maxAmount)}</div>
            {investAmount > maxAmount && (
              <div className="flex items-center gap-1 text-xs text-[#C0736D] mt-2">
                <AlertCircle className="w-3.5 h-3.5" /> Overschrijdt beschikbaar saldo
              </div>
            )}
          </div>

          {units > 0 && investAmount <= maxAmount && (
            <>
              <div className="bg-[#F5F6F4] rounded-xl p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#636E72]">Stuks</span>
                  <span className="font-medium text-[#2D3436] tabular-nums">{units}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#636E72]">Geschatte kosten</span>
                  <span className="font-medium text-[#2D3436] tabular-nums">{formatCurrency(cost)}</span>
                </div>
                <div className="flex justify-between border-t border-[#E8E8E6] pt-2">
                  <span className="text-[#636E72]">Resterend</span>
                  <span className="text-[#636E72] tabular-nums">{formatCurrency(maxAmount - cost)}</span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#7C9885] text-white rounded-xl font-medium hover:bg-[#6B8A74] transition-colors active:scale-[0.98]"
              >
                <ShoppingCart className="w-4 h-4" />
                Toevoegen aan mandje
              </button>
            </>
          )}

          {units === 0 && investAmount > 0 && investAmount <= maxAmount && (
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 text-center">
              <p className="text-sm text-[#636E72]">Bedrag te laag voor 1 eenheid ({formatCurrency(lastPrice)})</p>
            </div>
          )}
        </>
      )}
    </>
  );
}

function BuyNewView({ onBack, onDone }) {
  const { tradableETFs, cashBalance, availableFunds, addToBasket, positions } = useTrading();
  const maxAmount = parseFloat(availableFunds || cashBalance) || 0;
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Get list of tradable ETFs not in current portfolio
  const currentSymbols = useMemo(() => new Set(positions.map(p => p.symbol)), [positions]);

  const filteredETFs = useMemo(() => {
    const etfs = Object.values(tradableETFs || {}).filter(etf => {
      if (!etf.tradable_via_lynx || !etf.contract) return false;
      // Exclude already held positions
      if (currentSymbols.has(etf.contract.symbol)) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (etf.name || '').toLowerCase().includes(q) ||
        (etf.contract?.symbol || '').toLowerCase().includes(q) ||
        (etf.isin || '').toLowerCase().includes(q)
      );
    });
    return etfs.slice(0, 20);
  }, [tradableETFs, search, currentSymbols]);

  const selectedETF = selected ? tradableETFs[selected] : null;
  const lastPrice = selectedETF?.contract ? 0 : 0; // No market data for new ETFs
  const investAmount = parseFloat(amount) || 0;

  const handleSubmit = () => {
    if (!selectedETF?.contract) return;
    const qty = parseInt(amount) || 0;
    if (qty <= 0) return;
    addToBasket({
      symbol: selectedETF.contract.symbol,
      conid: selectedETF.contract.conId,
      side: 'BUY',
      quantity: qty,
      orderType: 'MKT',
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-10">
        <CheckCircle className="w-12 h-12 text-[#7C9885] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#2D3436] mb-2">Toegevoegd aan mandje</h3>
        <p className="text-sm text-[#636E72] mb-6">
          {amount}x {selectedETF?.contract?.symbol}
        </p>
        <button onClick={onDone} className="px-6 py-2.5 bg-[#7C9885] text-white rounded-xl text-sm font-medium hover:bg-[#6B8A74] transition-colors">
          Naar Trading
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#636E72] hover:text-[#2D3436] mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>
      <h2 className="text-lg font-semibold text-[#2D3436] mb-4">Nieuw ETF Kopen</h2>

      {!selected && (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B2BEC3]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op naam, symbool of ISIN..."
              className="w-full pl-10 pr-4 py-3 bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl text-sm text-[#2D3436] outline-none focus:border-[#7C9885] transition-colors"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredETFs.map((etf) => (
              <button
                key={etf.isin}
                onClick={() => setSelected(etf.isin)}
                className="w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 text-left hover:border-[#7C9885]/40 transition-all"
              >
                <div className="font-medium text-[#2D3436] text-sm truncate">{etf.name}</div>
                <div className="text-xs text-[#B2BEC3] mt-0.5">
                  {etf.contract?.symbol} &middot; {etf.contract?.exchange} &middot; {etf.contract?.currency}
                </div>
              </button>
            ))}
            {filteredETFs.length === 0 && search && (
              <div className="text-center py-6 text-sm text-[#B2BEC3]">
                Geen ETFs gevonden voor "{search}"
              </div>
            )}
            {filteredETFs.length === 0 && !search && Object.keys(tradableETFs || {}).length === 0 && (
              <div className="text-center py-6 text-sm text-[#B2BEC3]">
                Geen tradable ETFs geladen
              </div>
            )}
          </div>
        </>
      )}

      {/* Selected ETF - Quantity Input */}
      {selected && selectedETF && (
        <>
          <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium text-[#2D3436] text-sm truncate">{selectedETF.name}</div>
                <div className="text-xs text-[#B2BEC3]">{selectedETF.contract?.symbol} &middot; {selectedETF.contract?.exchange}</div>
              </div>
              <button onClick={() => { setSelected(null); setAmount(''); }} className="text-xs text-[#7C9885] hover:underline">Wijzig</button>
            </div>
            <label className="text-xs text-[#B2BEC3] font-medium block mb-2">Aantal stuks</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              step={1}
              placeholder="0"
              className="w-full text-xl font-bold text-[#2D3436] bg-transparent outline-none tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              autoFocus
            />
            <div className="text-xs text-[#B2BEC3] mt-1">
              Beschikbaar: {formatCurrency(maxAmount)}
            </div>
          </div>

          {parseInt(amount) > 0 && (
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#7C9885] text-white rounded-xl font-medium hover:bg-[#6B8A74] transition-colors active:scale-[0.98]"
            >
              <ShoppingCart className="w-4 h-4" />
              Toevoegen aan mandje
            </button>
          )}
        </>
      )}
    </>
  );
}

// --- Main Component ---

export default function BeschikbaarDetail({ onBack, onNavigateToTrading }) {
  const { cashBalance } = useTrading();
  const [view, setView] = useState('overview');

  const handleDone = useCallback(() => {
    if (onNavigateToTrading) {
      onNavigateToTrading();
    } else {
      onBack();
    }
  }, [onNavigateToTrading, onBack]);

  return (
    <DetailPageHeader title="Beschikbaar" onBack={onBack}>
      {view === 'overview' && (
        <OverviewView cashBalance={cashBalance} onSelect={setView} />
      )}
      {view === 'proRata' && (
        <ProRataView onBack={() => setView('overview')} onDone={handleDone} />
      )}
      {view === 'addExisting' && (
        <AddExistingView onBack={() => setView('overview')} onDone={handleDone} />
      )}
      {view === 'buyNew' && (
        <BuyNewView onBack={() => setView('overview')} onDone={handleDone} />
      )}
    </DetailPageHeader>
  );
}
