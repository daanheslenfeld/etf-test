import React from 'react';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Table Component - Pastel Design System
 *
 * Clean tables with subtle styling, light headers, soft pastel colors
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
 * TableHeader - Subtle sticky header
 */
export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-[#F5F6F4] sticky top-0 z-10 ${className}`}>
      {children}
    </thead>
  );
}

/**
 * TableBody - Body with subtle zebra striping
 */
export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-[#E8E8E6] ${className}`}>
      {children}
    </tbody>
  );
}

/**
 * TableRow - Single row with subtle hover
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
        transition-colors duration-150 group
        ${onClick ? 'cursor-pointer' : ''}
        ${selected
          ? 'bg-[#7C9885]/10'
          : 'hover:bg-[#F5F6F4]'
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
        px-6 py-4 text-xs font-medium text-[#636E72] uppercase tracking-wider
        ${alignClasses[align]}
        ${sortable ? 'cursor-pointer hover:text-[#2D3436] transition-colors select-none' : ''}
        ${className}
      `}
    >
      <span className="flex items-center gap-2">
        {children}
        {sortable && sorted && (
          <span className="text-[#7C9885] bg-[#7C9885]/10 px-1.5 py-0.5 rounded-md text-[10px]">
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
        ${muted ? 'text-[#B2BEC3]' : 'text-[#2D3436]'}
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
    <div className={`flex items-center justify-between px-6 py-4 border-t border-[#E8E8E6] ${className}`}>
      <span className="text-sm text-[#636E72]">
        {start}-{end} van {total} resultaten
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3.5 py-1.5 text-sm text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Vorige
        </button>
        <span className="text-sm text-[#636E72]">
          Pagina {page} van {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3.5 py-1.5 text-sm text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Volgende
        </button>
      </div>
    </div>
  );
}

export default Table;
