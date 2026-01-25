/**
 * NotificationBell Component
 *
 * Bell icon with badge count and dropdown for notifications.
 * Uses NotificationContext for state management.
 * Includes its own provider wrapper for easy integration.
 */

import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Briefcase,
  Users,
  Trophy,
  Award,
  Heart,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import NotificationContext, { NotificationProvider, useNotifications } from '../../context/NotificationContext';

// Notification type icons
const TYPE_ICONS = {
  portfolio_updated: Briefcase,
  portfolio_followed: Heart,
  competition_started: Trophy,
  competition_ended: Trophy,
  badge_earned: Award,
  new_follower: Users,
};

// Notification type colors
const TYPE_COLORS = {
  portfolio_updated: 'text-[#7C9885]',
  portfolio_followed: 'text-[#C0736D]',
  competition_started: 'text-[#C9A962]',
  competition_ended: 'text-[#C9A962]',
  badge_earned: 'text-[#8B7B9A]',
  new_follower: 'text-[#6B7B8A]',
};

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'zojuist';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m geleden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}u geleden`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d geleden`;
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function NotificationItem({ notification, onMarkRead, onNavigate }) {
  const Icon = TYPE_ICONS[notification.type] || Bell;
  const colorClass = TYPE_COLORS[notification.type] || 'text-[#636E72]';

  return (
    <div
      className={`flex items-start gap-3 p-3 hover:bg-[#F5F6F4] transition-colors cursor-pointer ${
        !notification.read ? 'bg-[#7C9885]/5' : ''
      }`}
      onClick={() => {
        if (!notification.read) {
          onMarkRead(notification.id);
        }
        if (notification.data?.portfolio_id) {
          onNavigate(notification.data.portfolio_id);
        }
      }}
    >
      {/* Icon */}
      <div className={`p-2 rounded-lg ${
        notification.read ? 'bg-[#ECEEED]' : 'bg-[#7C9885]/10'
      }`}>
        <Icon className={`w-4 h-4 ${notification.read ? 'text-[#B2BEC3]' : colorClass}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${notification.read ? 'text-[#636E72]' : 'text-[#2D3436] font-medium'}`}>
            {notification.title}
          </p>
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-[#7C9885] flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-[#B2BEC3] line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-[#B2BEC3] mt-1">
          {formatTimeAgo(notification.created_at)}
        </p>
      </div>
    </div>
  );
}

function NotificationBellInner({ onNavigateToPortfolio }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const handleNavigate = (portfolioId) => {
    setIsOpen(false);
    if (onNavigateToPortfolio) {
      onNavigateToPortfolio(portfolioId);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-colors ${
          isOpen
            ? 'bg-[#7C9885]/10 text-[#7C9885]'
            : 'hover:bg-[#F5F6F4] text-[#636E72] hover:text-[#2D3436]'
        }`}
      >
        <Bell className="w-5 h-5" />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-[#C0736D] text-white text-xs font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#FEFEFE] rounded-xl border border-[#E8E8E6] shadow-[0_8px_32px_rgba(45,52,54,0.12)] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#E8E8E6]">
            <h3 className="font-semibold text-[#2D3436]">Meldingen</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-[#7C9885] hover:text-[#6B8A74] font-medium"
                >
                  <CheckCheck className="w-4 h-4" />
                  Alles gelezen
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#F5F6F4] rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-[#636E72]" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#7C9885] animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-10 h-10 text-[#B2BEC3] mx-auto mb-3" />
                <p className="text-[#636E72] font-medium">Geen meldingen</p>
                <p className="text-xs text-[#B2BEC3] mt-1">
                  Volg portfolios om updates te ontvangen
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E8E8E6]">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#E8E8E6] bg-[#F5F6F4]">
              <button
                onClick={() => {
                  // Could navigate to full notifications page
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1 text-sm text-[#7C9885] hover:text-[#6B8A74] font-medium"
              >
                Alle meldingen bekijken
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Wrapper component that includes its own NotificationProvider
// This makes it easy to use in any component without worrying about context
export default function NotificationBell({ user, onNavigateToPortfolio }) {
  // Check if we're already inside a NotificationProvider
  const existingContext = useContext(NotificationContext);

  // If context exists, use the inner component directly
  if (existingContext) {
    return <NotificationBellInner onNavigateToPortfolio={onNavigateToPortfolio} />;
  }

  // Otherwise, wrap with provider
  // Get user from localStorage as fallback
  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <NotificationProvider user={currentUser}>
      <NotificationBellInner onNavigateToPortfolio={onNavigateToPortfolio} />
    </NotificationProvider>
  );
}
