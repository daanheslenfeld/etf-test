import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Settings, LogOut, User, Bell } from 'lucide-react';
import { StatusBadge, Badge } from '../common';

/**
 * Header Component
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
    <header className={`h-16 bg-[#1A1B1F] border-b border-gray-800/50 px-4 lg:px-6 ${className}`}>
      <div className="h-full flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#28EBCF] to-[#20D4B8] rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-sm">EP</span>
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block">
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
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>

          {/* Settings */}
          <Link
            to="/settings"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>

          {/* User menu */}
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-800/50">
            <div className="hidden sm:block text-right">
              <div className="text-sm text-white font-medium">
                {user?.name || user?.email || 'Gebruiker'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.email || ''}
              </div>
            </div>
            <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
