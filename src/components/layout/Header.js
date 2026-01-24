import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Settings, LogOut, User, Bell } from 'lucide-react';
import { StatusBadge, Badge } from '../common';

/**
 * Header Component - Pastel Design System
 *
 * Top navigation bar with logo, connection status, and user menu
 */
export function Header({
  user,
  isConnected,
  tradingMode,
  onMenuClick,
  onLogout,
  className = '',
}) {
  return (
    <header className={`h-16 bg-[#FEFEFE] border-b border-[#E8E8E6] px-4 lg:px-6 shadow-[0_1px_3px_rgba(45,52,54,0.04)] ${className}`}>
      <div className="h-full flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#7C9885] rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(124,152,133,0.35)]">
              <span className="text-white font-bold text-sm">EP</span>
            </div>
            <span className="text-[#2D3436] font-semibold text-lg hidden sm:block">
              ETF Portal
            </span>
          </Link>
        </div>

        {/* Center section - Status */}
        <div className="hidden md:flex items-center gap-3">
          <StatusBadge
            status={isConnected ? 'online' : 'offline'}
            label={isConnected ? 'Verbonden' : 'Niet verbonden'}
            pulse={!isConnected}
          />
          {tradingMode && (
            <Badge variant={tradingMode === 'live' ? 'error' : 'info'}>
              {tradingMode === 'live' ? 'LIVE' : 'PAPER'}
            </Badge>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-xl transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>

          {/* Settings */}
          <Link
            to="/settings"
            className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>

          {/* User menu */}
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-[#E8E8E6]">
            <div className="hidden sm:block text-right">
              <div className="text-sm text-[#2D3436] font-medium">
                {user?.name || user?.email || 'Gebruiker'}
              </div>
              <div className="text-xs text-[#B2BEC3]">
                {user?.email || ''}
              </div>
            </div>
            <div className="w-9 h-9 bg-[#F5F6F4] rounded-full flex items-center justify-center border border-[#E8E8E6]">
              <User className="w-4 h-4 text-[#636E72]" />
            </div>
          </div>

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-[#636E72] hover:text-[#C0736D] hover:bg-[#C0736D]/10 rounded-xl transition-colors"
              title="Uitloggen"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
