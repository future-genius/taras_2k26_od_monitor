import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { ShieldCheck, Eye, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onOpenMobileNav }) => {
  const { role, isPresident } = useAuth();
  const { isSidebarCollapsed, toggleSidebar } = useStudents();

  return (
    <header className="bg-white border-b border-taras-200 sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger toggle */}
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-lg text-taras-600 hover:bg-taras-100 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Sidebar Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden md:flex items-center gap-1.5 p-2 rounded-lg text-taras-600 hover:text-taras-900 hover:bg-taras-100 transition-colors border border-taras-200"
          title={isSidebarCollapsed ? 'Expand Sidebar (Ctrl+B or \\)' : 'Collapse Sidebar (Ctrl+B or \\)'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-emerald-600" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-taras-600" />
          )}
          <span className="text-[11px] font-semibold text-taras-600">
            {isSidebarCollapsed ? 'Expand' : 'Collapse'}
          </span>
        </button>

        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-taras-900 leading-tight truncate">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-taras-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Banner / Badge */}
        {isPresident ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">President Privileges Active</span>
            <span className="sm:hidden">President</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Read-Only ({role})</span>
          </div>
        )}
      </div>
    </header>
  );
};
