import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  colorTheme?: 'dark' | 'emerald' | 'amber' | 'sky';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorTheme = 'dark'
}) => {
  const themeStyles = {
    dark: 'border-taras-800 bg-taras-900 text-white',
    emerald: 'border-emerald-200 bg-white text-taras-900',
    amber: 'border-amber-200 bg-white text-taras-900',
    sky: 'border-sky-200 bg-white text-taras-900',
  };

  const iconBgStyles = {
    dark: 'bg-taras-800 text-taras-300',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
  };

  return (
    <div className={`p-5 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${themeStyles[colorTheme]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs mt-1.5 opacity-70">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconBgStyles[colorTheme]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
