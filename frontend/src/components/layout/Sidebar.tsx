import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  History,
  Briefcase,
  Users,
  FileSpreadsheet,
  Settings,
  LogOut,
  ShieldCheck,
  UserCheck,
  User as UserIcon,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { UserRole } from '../../types/user';

export const Sidebar: React.FC = () => {
  const { user, role, isPresident, logout } = useAuth();
  const { isSidebarCollapsed, toggleSidebar } = useStudents();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, visible: true },
    { label: 'Daily OD Marking', path: '/daily-od', icon: CheckSquare, visible: true },
    { label: 'OD History & Reports', path: '/history', icon: History, visible: true },
    { label: 'Event & Work Management', path: '/events', icon: Briefcase, visible: true },
    { label: 'Student Directory', path: '/students', icon: Users, visible: true },
    { label: 'Audit Logs', path: '/audit-logs', icon: FileSpreadsheet, visible: isPresident },
    { label: 'Settings', path: '/settings', icon: Settings, visible: isPresident },
  ];

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'PRESIDENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" /> President
          </span>
        );
      case 'STAFF':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <UserCheck className="w-3 h-3" /> Staff
          </span>
        );
      case 'STUDENT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300 border border-slate-600">
            <UserIcon className="w-3 h-3" /> Student
          </span>
        );
    }
  };

  return (
    <aside
      className={`hidden md:flex flex-col bg-gradient-to-b from-taras-950 via-taras-900 to-taras-950 border-r border-taras-800 text-slate-200 shrink-0 min-h-screen transition-all duration-300 ease-in-out z-20 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header & Toggle Button */}
      <div className="p-4 border-b border-taras-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-taras-accent flex items-center justify-center font-black text-white shadow-lg text-lg tracking-wider shrink-0">
            T
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 transition-opacity duration-200">
              <h1 className="font-extrabold text-base tracking-wider text-white leading-none truncate">
                TARAS 2K26
              </h1>
              <p className="text-[10px] text-taras-400 mt-1 font-medium truncate">
                Daily OD Monitoring
              </p>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-taras-800 transition-colors shrink-0"
          title={isSidebarCollapsed ? 'Expand Sidebar (Ctrl+B or \\)' : 'Collapse Sidebar (Ctrl+B or \\)'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {!isSidebarCollapsed && (
          <div className="text-[10px] font-bold text-taras-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
        )}
        {navItems.filter(item => item.visible).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isSidebarCollapsed ? item.label : undefined}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3.5 py-2.5'
                } rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-taras-accent text-white shadow-md font-semibold ring-1 ring-white/10'
                    : 'text-slate-300 hover:bg-taras-800/80 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!isSidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout (No switch role) */}
      <div className="p-3 border-t border-taras-800 bg-taras-950/60">
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-taras-800 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 border border-taras-700 shadow-xs">
              {user?.name.charAt(0) || 'P'}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <div className="mt-0.5">{getRoleBadge(role)}</div>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-taras-800 rounded-lg transition-colors shrink-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
