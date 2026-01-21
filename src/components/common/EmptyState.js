import React from 'react';
import { Search, FileX, AlertCircle, Inbox } from 'lucide-react';
import { Button } from './Button';

/**
 * EmptyState Component
 *
 * Consistent empty state display with icon, title, description, and optional action
 */

const PRESETS = {
  noResults: {
    icon: Search,
    title: 'Geen resultaten gevonden',
    description: 'Probeer andere filters of zoektermen',
  },
  noData: {
    icon: Inbox,
    title: 'Geen data beschikbaar',
    description: 'Er is nog geen data om weer te geven',
  },
  error: {
    icon: AlertCircle,
    title: 'Er ging iets mis',
    description: 'Probeer het later opnieuw',
  },
  empty: {
    icon: FileX,
    title: 'Leeg',
    description: 'Voeg items toe om te beginnen',
  },
};

export function EmptyState({
  preset,
  icon: CustomIcon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  size = 'md',
  className = '',
}) {
  // Use preset if provided
  const presetConfig = preset ? PRESETS[preset] : null;
  const Icon = CustomIcon || presetConfig?.icon || Inbox;
  const displayTitle = title || presetConfig?.title || 'Geen items';
  const displayDescription = description || presetConfig?.description;

  const sizes = {
    sm: {
      container: 'p-8',
      iconWrapper: 'w-12 h-12',
      icon: 'w-6 h-6',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'p-12',
      iconWrapper: 'w-16 h-16',
      icon: 'w-8 h-8',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'p-16',
      iconWrapper: 'w-20 h-20',
      icon: 'w-10 h-10',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div className={`${sizeConfig.container} text-center ${className}`}>
      <div className={`inline-flex items-center justify-center ${sizeConfig.iconWrapper} bg-gray-800/50 rounded-2xl mb-4`}>
        <Icon className={`${sizeConfig.icon} text-gray-600`} />
      </div>
      <h3 className={`${sizeConfig.title} font-medium text-gray-400 mb-2`}>
        {displayTitle}
      </h3>
      {displayDescription && (
        <p className={`${sizeConfig.description} text-gray-600 mb-4`}>
          {displayDescription}
        </p>
      )}
      {(action || onAction) && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
        >
          {actionLabel || action || 'Actie'}
        </Button>
      )}
    </div>
  );
}

/**
 * EmptyTableState - Empty state specifically for tables
 */
export function EmptyTableState({
  colSpan,
  ...props
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState {...props} />
      </td>
    </tr>
  );
}

export default EmptyState;
