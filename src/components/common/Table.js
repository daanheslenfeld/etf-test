import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Table Component
 *
 * Consistent table styling with sorting support
 */
export function Table({
  children,
  className = '',
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}

/**
 * TableHeader - Sticky header with background
 */
export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-gray-800/50 sticky top-0 z-10 backdrop-blur-sm ${className}`}>
      {children}
    </thead>
  );
}

/**
 * TableBody - Body with dividers
 */
export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-gray-800/30 ${className}`}>
      {children}
    </tbody>
  );
}

/**
 * TableRow - Single row with hover effect
 */
export function TableRow({
  children,
  onClick,
  selected = false,
  className = '',
}) {
  return (
    <tr
      onClick={onClick}
      className={`
        transition-all duration-200 group
        ${onClick ? 'cursor-pointer' : ''}
        ${selected
          ? 'bg-[#28EBCF]/5'
          : 'hover:bg-gradient-to-r hover:from-gray-800/40 hover:to-transparent'
        }
        ${className}
      `}
    >
      {children}
    </tr>
  );
}

/**
 * TableHeaderCell - Header cell with optional sorting
 */
export function TableHeaderCell({
  children,
  sortable = false,
  sorted = false,
  sortDirection = 'asc',
  onSort,
  align = 'left',
  className = '',
}) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <th
      onClick={sortable ? onSort : undefined}
      className={`
        px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider
        ${alignClasses[align]}
        ${sortable ? 'cursor-pointer hover:text-white transition-colors select-none' : ''}
        ${className}
      `}
    >
      <span className="flex items-center gap-2">
        {children}
        {sortable && sorted && (
          <span className="text-[#28EBCF] bg-[#28EBCF]/10 px-1.5 py-0.5 rounded text-[10px]">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </span>
    </th>
  );
}

/**
 * TableCell - Standard cell
 */
export function TableCell({
  children,
  align = 'left',
  mono = false,
  muted = false,
  className = '',
}) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      className={`
        px-6 py-4 text-sm
        ${alignClasses[align]}
        ${mono ? 'font-mono tabular-nums' : ''}
        ${muted ? 'text-gray-500' : 'text-white'}
        ${className}
      `}
    >
      {children}
    </td>
  );
}

/**
 * TableEmpty - Empty state row
 */
export function TableEmpty({
  colSpan,
  title = 'Geen data',
  description,
  action,
  onAction,
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState
          preset="noData"
          title={title}
          description={description}
          action={action}
          onAction={onAction}
          size="md"
        />
      </td>
    </tr>
  );
}

/**
 * TableLoading - Loading state row
 */
export function TableLoading({ colSpan, text = 'Laden...' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12">
        <LoadingSpinner text={text} />
      </td>
    </tr>
  );
}

/**
 * TablePagination - Pagination footer
 */
export function TablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  className = '',
}) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={`flex items-center justify-between px-6 py-4 border-t border-gray-800/30 ${className}`}>
      <span className="text-sm text-gray-500">
        {start}-{end} van {total} resultaten
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Vorige
        </button>
        <span className="text-sm text-gray-400">
          Pagina {page} van {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Volgende
        </button>
      </div>
    </div>
  );
}

export default Table;
