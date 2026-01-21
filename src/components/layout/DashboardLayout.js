import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { LoadingSpinner } from '../common';

/**
 * DashboardLayout Component
 *
 * Main layout wrapper for all dashboard pages
 * Provides consistent header, sidebar, and content structure
 */
export function DashboardLayout({
  children,
  user,
  isConnected = false,
  tradingMode,
  isLoading = false,
  onLogout,
  showSidebar = true,
  className = '',
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D0E10]">
      {/* Header */}
      <Header
        user={user}
        isConnected={isConnected}
        tradingMode={tradingMode}
        onMenuClick={() => setMobileSidebarOpen(true)}
        onLogout={onLogout}
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Mobile Sidebar */}
        {showSidebar && (
          <Sidebar
            isMobile
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto ${className}`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="lg" text="Laden..." />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * PageContainer - Content wrapper with consistent padding
 */
export function PageContainer({
  children,
  title,
  subtitle,
  action,
  maxWidth = 'max-w-7xl',
  className = '',
}) {
  return (
    <div className={`${maxWidth} mx-auto p-4 lg:p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {title && (
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * PageSection - Section within a page
 */
export function PageSection({
  children,
  title,
  subtitle,
  action,
  className = '',
}) {
  return (
    <section className={`mb-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * PageGrid - Responsive grid for cards
 */
export function PageGrid({
  children,
  cols = 3,
  gap = 4,
  className = '',
}) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
  };

  return (
    <div className={`grid ${colClasses[cols] || colClasses[3]} ${gapClasses[gap] || gapClasses[4]} ${className}`}>
      {children}
    </div>
  );
}

export default DashboardLayout;
