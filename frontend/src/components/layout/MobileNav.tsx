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
  X,
  LogOut,
  ShieldCheck,
  UserCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { user, role, isPresident, logout } = useAuth();

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-taras-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="relative w-4/5 max-w-xs bg-taras-900 text-white min-h-screen flex flex-col z-10 shadow-2xl">
        <div className="p-4 border-b border-taras-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-taras-accent flex items-center justify-center font-bold text-white shadow-md">
              T
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">TARAS 2K26</h2>
              <p className="text-[10px] text-taras-400">Daily OD Monitor</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-taras-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-bold text-taras-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
          {navItems.filter(item => item.visible).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-taras-accent text-white shadow-md font-semibold ring-1 ring-white/10'
                      : 'text-slate-300 hover:bg-taras-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Info Footer (No role switcher) */}
        <div className="p-4 border-t border-taras-800 bg-taras-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-taras-800 text-emerald-400 font-extrabold flex items-center justify-center text-xs shrink-0 border border-taras-700">
              {user?.name.charAt(0) || 'P'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate text-white">{user?.name}</p>
              <div className="mt-0.5">{getRoleBadge(role)}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { logout(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-taras-800 rounded-lg transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
