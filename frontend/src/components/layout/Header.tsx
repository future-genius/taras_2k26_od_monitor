import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { ShieldCheck, Eye, PanelLeftClose, PanelLeftOpen, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onOpenMobileNav }) => {
  const { role, isPresident } = useAuth();
  const { isSidebarCollapsed, toggleSidebar } = useStudents();

  return (
    <header className="bg-white border-b border-taras-200 sticky top-0 z-30 px-3 sm:px-5 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-lg text-taras-600 hover:bg-taras-100 transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden md:flex items-center gap-1.5 p-2 rounded-lg text-taras-600 hover:text-taras-900 hover:bg-taras-100 transition-colors border border-taras-200 shrink-0"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
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

        {/* Page Title */}
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-taras-900 leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-taras-500 mt-0.5 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Role Badge */}
      <div className="shrink-0 ml-2">
        {isPresident ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">President</span>
            <span className="sm:hidden">Pres.</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Read-Only ({role})</span>
            <span className="sm:hidden">{role}</span>
          </div>
        )}
      </div>
    </header>
  );
};
