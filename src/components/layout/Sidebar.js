import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  PieChart,
  Settings,
  HelpCircle,
  X,
  ChevronLeft,
} from 'lucide-react';

/**
 * Sidebar Component - Pastel Design System
 *
 * Navigation sidebar with collapsible state
 */

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    id: 'trading',
    label: 'Trading',
    path: '/trading',
    icon: TrendingUp,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    path: '/portfolio',
    icon: Briefcase,
  },
  {
    id: 'analysis',
    label: 'Analyse',
    path: '/analysis',
    icon: PieChart,
  },
];

const BOTTOM_NAV_ITEMS = [
  {
    id: 'settings',
    label: 'Instellingen',
    path: '/settings',
    icon: Settings,
  },
  {
    id: 'help',
    label: 'Help',
    path: '/help',
    icon: HelpCircle,
  },
];

export function Sidebar({
  isOpen = true,
  isMobile = false,
  collapsed = false,
  onClose,
  onToggleCollapse,
  className = '',
}) {
  // Mobile overlay
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-[#2D3436]/20 z-40 lg:hidden backdrop-blur-sm"
            onClick={onClose}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 h-full w-64 bg-[#FEFEFE] border-r border-[#E8E8E6] z-50 shadow-[4px_0_16px_rgba(45,52,54,0.06)]
            transform transition-transform duration-300 ease-out lg:hidden
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-[#E8E8E6]">
              <span className="text-[#2D3436] font-semibold">Menu</span>
              <button
                onClick={onClose}
                className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.id} item={item} onClick={onClose} />
              ))}
            </nav>

            {/* Bottom nav */}
            <div className="px-3 py-4 border-t border-[#E8E8E6] space-y-1.5">
              {BOTTOM_NAV_ITEMS.map((item) => (
                <NavItem key={item.id} item={item} onClick={onClose} />
              ))}
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={`
        hidden lg:flex flex-col h-full border-r border-[#E8E8E6] bg-[#FEFEFE]
        transition-all duration-300 ease-out
        ${collapsed ? 'w-16' : 'w-64'}
        ${className}
      `}
    >
      {/* Collapse toggle */}
      <div className="h-16 flex items-center justify-end px-3 border-b border-[#E8E8E6]">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-xl transition-colors"
          title={collapsed ? 'Uitklappen' : 'Inklappen'}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-4 border-t border-[#E8E8E6] space-y-1.5">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </div>
    </aside>
  );
}

/**
 * NavItem - Single navigation item
 */
function NavItem({ item, collapsed = false, onClick }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
        ${isActive
          ? 'bg-[#7C9885]/10 text-[#7C9885] border-l-2 border-[#7C9885] font-medium'
          : 'text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4]'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && (
        <span className="font-medium">{item.label}</span>
      )}
    </NavLink>
  );
}

export default Sidebar;
