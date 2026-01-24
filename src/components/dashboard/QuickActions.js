import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Search,
  ShoppingCart,
  PieChart,
  ArrowRightLeft,
  Plus,
  RefreshCw,
  Settings,
  ExternalLink,
} from 'lucide-react';

/**
 * QuickActions Component - Premium Banking Style
 *
 * Quick access buttons for common actions
 * Can be displayed as cards, buttons, or a compact row
 */

const DEFAULT_ACTIONS = [
  {
    id: 'trade',
    label: 'Trade',
    description: 'Koop of verkoop ETFs',
    icon: TrendingUp,
    path: '/trading',
    color: '#7C9885',
  },
  {
    id: 'browse',
    label: 'ETF Browser',
    description: 'Ontdek nieuwe ETFs',
    icon: Search,
    path: '/trading',
    color: '#6B7B8A',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    description: 'Bekijk je posities',
    icon: PieChart,
    path: '/portfolio',
    color: '#8B7B9A',
  },
  {
    id: 'rebalance',
    label: 'Herbalanceer',
    description: 'Optimaliseer allocatie',
    icon: ArrowRightLeft,
    path: '/portfolio/rebalance',
    color: '#C9A962',
  },
];

export function QuickActions({
  actions = DEFAULT_ACTIONS,
  variant = 'cards', // 'cards' | 'buttons' | 'compact' | 'list'
  onActionClick,
  className = '',
}) {
  const handleClick = (action, e) => {
    if (onActionClick) {
      onActionClick(action, e);
    }
  };

  if (variant === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {actions.map((action) => {
          const Icon = action.icon;
          const Component = action.path ? Link : 'button';
          const props = action.path ? { to: action.path } : { onClick: (e) => handleClick(action, e) };

          return (
            <Component
              key={action.id}
              {...props}
              className="w-full flex items-center gap-3 p-3 bg-[#F5F6F4] hover:bg-[#ECEEED] rounded-xl transition-colors group"
            >
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: action.color }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-[#2D3436] group-hover:text-[#2D3436]">
                  {action.label}
                </p>
                {action.description && (
                  <p className="text-xs text-[#636E72]">{action.description}</p>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-[#B2BEC3] group-hover:text-[#636E72] transition-colors" />
            </Component>
          );
        })}
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {actions.map((action) => {
          const Icon = action.icon;
          const Component = action.path ? Link : 'button';
          const props = action.path ? { to: action.path } : { onClick: (e) => handleClick(action, e) };

          return (
            <Component
              key={action.id}
              {...props}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FEFEFE] hover:bg-[#F5F6F4] border border-[#E8E8E6] hover:border-[#D5D5D3] rounded-xl transition-all text-sm font-medium text-[#2D3436] shadow-[0_1px_2px_rgba(45,52,54,0.04)]"
            >
              <Icon className="w-4 h-4" style={{ color: action.color }} />
              {action.label}
            </Component>
          );
        })}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {actions.map((action) => {
          const Icon = action.icon;
          const Component = action.path ? Link : 'button';
          const props = action.path ? { to: action.path } : { onClick: (e) => handleClick(action, e) };

          return (
            <Component
              key={action.id}
              {...props}
              className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-lg transition-colors"
              title={action.label}
            >
              <Icon className="w-4 h-4" />
            </Component>
          );
        })}
      </div>
    );
  }

  // Default: cards
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
      {actions.map((action) => {
        const Icon = action.icon;
        const Component = action.path ? Link : 'button';
        const props = action.path ? { to: action.path } : { onClick: (e) => handleClick(action, e) };

        return (
          <Component
            key={action.id}
            {...props}
            className="group p-4 bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl hover:border-[#D5D5D3] hover:shadow-[0_4px_12px_rgba(45,52,54,0.06)] transition-all shadow-[0_1px_3px_rgba(45,52,54,0.04)]"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${action.color}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: action.color }} />
            </div>
            <p className="text-sm font-medium text-[#2D3436] mb-0.5">{action.label}</p>
            {action.description && (
              <p className="text-xs text-[#636E72]">{action.description}</p>
            )}
          </Component>
        );
      })}
    </div>
  );
}

/**
 * QuickActionButton - Single action button
 */
export function QuickActionButton({
  label,
  icon: Icon,
  onClick,
  href,
  color = '#7C9885',
  variant = 'default', // 'default' | 'primary' | 'ghost'
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
}) {
  const Component = href ? Link : 'button';
  const props = href ? { to: href } : { onClick, disabled: disabled || loading };

  const variants = {
    default: 'bg-[#FEFEFE] hover:bg-[#F5F6F4] border border-[#E8E8E6] hover:border-[#D5D5D3] text-[#2D3436] shadow-[0_1px_2px_rgba(45,52,54,0.04)]',
    primary: `bg-[#7C9885] hover:bg-[#6B8574] text-white shadow-[0_2px_8px_rgba(124,152,133,0.25)]`,
    ghost: 'hover:bg-[#F5F6F4] text-[#636E72] hover:text-[#2D3436]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2.5',
  };

  return (
    <Component
      {...props}
      className={`
        inline-flex items-center justify-center font-medium rounded-xl transition-all
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" style={variant !== 'primary' ? { color } : undefined} />
      ) : null}
      {label}
    </Component>
  );
}

/**
 * AddToBasketButton - Specific action for adding to order basket
 */
export function AddToBasketButton({
  onClick,
  loading = false,
  disabled = false,
  size = 'md',
  className = '',
}) {
  return (
    <QuickActionButton
      label="Trade"
      icon={ShoppingCart}
      onClick={onClick}
      color="#7C9885"
      variant="default"
      size={size}
      loading={loading}
      disabled={disabled}
      className={className}
    />
  );
}

export default QuickActions;
