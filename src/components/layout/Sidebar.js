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
 * Sidebar Component
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
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 h-full w-64 bg-[#1A1B1F] border-r border-gray-800/50 z-50
            transform transition-transform duration-300 ease-out lg:hidden
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800/50">
              <span className="text-white font-semibold">Menu</span>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.id} item={item} onClick={onClose} />
              ))}
            </nav>

            {/* Bottom nav */}
            <div className="px-3 py-4 border-t border-gray-800/50 space-y-1">
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
        hidden lg:flex flex-col h-full border-r border-gray-800/50 bg-[#1A1B1F]
        transition-all duration-300 ease-out
        ${collapsed ? 'w-16' : 'w-64'}
        ${className}
      `}
    >
      {/* Collapse toggle */}
      <div className="h-16 flex items-center justify-end px-3 border-b border-gray-800/50">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          title={collapsed ? 'Uitklappen' : 'Inklappen'}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-4 border-t border-gray-800/50 space-y-1">
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
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-gradient-to-r from-[#28EBCF]/10 to-transparent text-[#28EBCF] border-l-2 border-[#28EBCF]'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
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
