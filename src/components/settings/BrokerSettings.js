import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Link2, Link2Off, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';

const TRADING_API_URL = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';

export default function BrokerSettings({ user, onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Broker link state
  const [brokerLink, setBrokerLink] = useState({
    linked: false,
    status: 'unlinked',
    ib_account_id: null
  });

  // Form state
  const [ibAccountId, setIbAccountId] = useState('');
  const [validationError, setValidationError] = useState(null);

  // Get auth headers
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'X-Customer-ID': user?.id?.toString() || '0',
      'X-Customer-Email': user?.email || '',
      'ngrok-skip-browser-warning': 'true',
    };
  }, [user]);

  // Fetch current broker link status
  const fetchBrokerLink = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${TRADING_API_URL}/broker/link`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setBrokerLink(data);
        if (data.ib_account_id) {
          setIbAccountId(data.ib_account_id);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to fetch broker link status');
      }
    } catch (err) {
      setError('Failed to connect to trading API');
      console.error('Error fetching broker link:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchBrokerLink();
  }, [fetchBrokerLink]);

  // Validate IB account ID format
  const validateIbAccountId = (value) => {
    if (!value) {
      return 'IB Account ID is required';
    }
    if (!/^DU[0-9]+$/.test(value.toUpperCase())) {
      return 'Account ID must be in format DUxxxxxx (DU followed by numbers)';
    }
    return null;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase();
    setIbAccountId(value);
    setValidationError(null);
    setError(null);
    setSuccess(null);
  };

  // Handle save/link
  const handleSave = async () => {
    const validation = validateIbAccountId(ibAccountId);
    if (validation) {
      setValidationError(validation);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${TRADING_API_URL}/broker/link`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ib_account_id: ibAccountId.toUpperCase() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || 'Broker account linked successfully');
        setBrokerLink({
          linked: true,
          status: 'linked',
          ib_account_id: data.ib_account_id
        });
      } else {
        setError(data.detail || data.message || 'Failed to link broker account');
      }
    } catch (err) {
      setError('Failed to connect to trading API');
      console.error('Error saving broker link:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your LYNX account?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${TRADING_API_URL}/broker/link`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || 'Broker account disconnected');
        setBrokerLink({
          linked: false,
          status: 'unlinked',
          ib_account_id: null
        });
        setIbAccountId('');
      } else {
        setError(data.detail || data.message || 'Failed to disconnect broker account');
      }
    } catch (err) {
      setError('Failed to connect to trading API');
      console.error('Error disconnecting broker:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F4]">
      {/* Navigation */}
      <nav className="bg-[#FEFEFE] border-b border-[#E8E8E6] shadow-[0_1px_3px_rgba(45,52,54,0.04)] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="text-[#7C9885] font-medium hover:text-[#6B8A74] flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Terug
            </button>
            <h1 className="text-xl font-bold text-[#2D3436]">Broker Instellingen</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Info Card */}
        <div className="bg-[#7C9885]/10 border border-[#7C9885]/30 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-[#7C9885] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#2D3436] text-sm">
                Koppel je LYNX paper trading account om ETF's te verhandelen via dit portaal.
                Je account ID vind je in LYNX Trader Workstation of de LYNX app.
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-[0_2px_8px_rgba(45,52,54,0.06)] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-[#E8E8E6]">
            <div className="flex items-center gap-3">
              {brokerLink.linked ? (
                <div className="w-10 h-10 bg-[#7C9885]/10 rounded-full flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-[#7C9885]" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-[#B2BEC3]/10 rounded-full flex items-center justify-center">
                  <Link2Off className="w-5 h-5 text-[#B2BEC3]" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-[#2D3436]">LYNX Account</h2>
                <p className="text-sm text-[#636E72]">
                  {brokerLink.linked ? 'Gekoppeld' : 'Niet gekoppeld'}
                </p>
              </div>
              {brokerLink.linked && (
                <span className="ml-auto px-3 py-1 bg-[#7C9885]/10 text-[#7C9885] text-sm font-medium rounded-full">
                  Actief
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-[#7C9885] animate-spin" />
              </div>
            ) : (
              <>
                {/* Error Message */}
                {error && (
                  <div className="bg-[#C0736D]/10 border border-[#C0736D]/30 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#C0736D] flex-shrink-0 mt-0.5" />
                    <p className="text-[#C0736D] text-sm">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="bg-[#7C9885]/10 border border-[#7C9885]/30 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#7C9885] flex-shrink-0 mt-0.5" />
                    <p className="text-[#7C9885] text-sm">{success}</p>
                  </div>
                )}

                {/* Account ID Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2D3436] mb-2">
                    IB Account ID
                  </label>
                  <input
                    type="text"
                    value={ibAccountId}
                    onChange={handleInputChange}
                    placeholder="DU0521473"
                    disabled={saving}
                    className={`w-full px-4 py-3 border rounded-lg text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none focus:ring-2 transition-colors ${
                      validationError
                        ? 'border-[#C0736D] focus:ring-[#C0736D]/30'
                        : 'border-[#E8E8E6] focus:ring-[#7C9885]/30 focus:border-[#7C9885]'
                    } disabled:bg-[#F5F6F4] disabled:cursor-not-allowed`}
                  />
                  {validationError && (
                    <p className="mt-2 text-sm text-[#C0736D]">{validationError}</p>
                  )}
                  <p className="mt-2 text-xs text-[#636E72]">
                    Paper trading accounts beginnen met "DU" (bijv. DU0521473)
                  </p>
                </div>

                {/* Current Status */}
                {brokerLink.linked && brokerLink.ib_account_id && (
                  <div className="bg-[#F5F6F4] rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#636E72]">Huidig gekoppeld account:</span>
                      <span className="font-mono font-medium text-[#2D3436]">{brokerLink.ib_account_id}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || !ibAccountId}
                    className="flex-1 py-3 bg-[#7C9885] text-white font-bold rounded-lg hover:bg-[#6B8A74] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Opslaan...
                      </>
                    ) : brokerLink.linked ? (
                      'Account Bijwerken'
                    ) : (
                      'Account Koppelen'
                    )}
                  </button>

                  {brokerLink.linked && (
                    <button
                      onClick={handleDisconnect}
                      disabled={saving}
                      className="px-6 py-3 bg-[#FEFEFE] border border-[#C0736D]/30 text-[#C0736D] font-medium rounded-lg hover:bg-[#C0736D]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ontkoppelen
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#636E72]">
            Problemen met koppelen?{' '}
            <a href="mailto:support@example.com" className="text-[#7C9885] hover:underline">
              Neem contact op met support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
