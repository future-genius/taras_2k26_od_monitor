import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  FileSpreadsheet,
  Settings,
  X,
  LogOut,
  ShieldCheck,
  UserCheck,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { user, role, isPresident, logout, switchRole } = useAuth();

  if (!isOpen) return null;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, visible: true },
    { label: 'Students', path: '/students', icon: Users, visible: true },
    { label: 'Activities', path: '/activities', icon: CalendarCheck, visible: true },
    { label: 'Reports', path: '/reports', icon: BarChart3, visible: true },
    { label: 'Audit Logs', path: '/audit-logs', icon: FileSpreadsheet, visible: isPresident },
    { label: 'Settings', path: '/settings', icon: Settings, visible: isPresident },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-taras-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="relative w-4/5 max-w-xs bg-taras-900 text-white min-h-screen flex flex-col z-10 shadow-2xl">
        <div className="p-4 border-b border-taras-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-taras-accent flex items-center justify-center font-bold text-white">
              T
            </div>
            <div>
              <h2 className="font-bold text-sm">TARAS System</h2>
              <p className="text-[10px] text-taras-400">Student Monitor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-taras-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.filter(item => item.visible).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-taras-accent text-white' : 'text-slate-300 hover:bg-taras-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Demo Role Switcher */}
        <div className="p-3 m-3 bg-taras-950/80 rounded-lg border border-taras-800">
          <p className="text-[10px] font-medium text-taras-400 mb-1.5">Role Switcher (Demo):</p>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => { switchRole('PRESIDENT'); onClose(); }}
              className={`py-1 rounded text-[10px] font-medium ${role === 'PRESIDENT' ? 'bg-emerald-600 text-white' : 'bg-taras-800 text-slate-300'}`}
            >
              Pres
            </button>
            <button
              onClick={() => { switchRole('STAFF'); onClose(); }}
              className={`py-1 rounded text-[10px] font-medium ${role === 'STAFF' ? 'bg-sky-600 text-white' : 'bg-taras-800 text-slate-300'}`}
            >
              Staff
            </button>
            <button
              onClick={() => { switchRole('STUDENT'); onClose(); }}
              className={`py-1 rounded text-[10px] font-medium ${role === 'STUDENT' ? 'bg-slate-600 text-white' : 'bg-taras-800 text-slate-300'}`}
            >
              Student
            </button>
          </div>
        </div>

        {/* User Info Footer */}
        <div className="p-4 border-t border-taras-800 bg-taras-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-taras-700 font-bold flex items-center justify-center text-xs">
              {user?.name.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-xs font-medium truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] text-taras-400">{role}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); onClose(); }}
            className="p-1.5 text-rose-400 hover:bg-taras-800 rounded-md"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
