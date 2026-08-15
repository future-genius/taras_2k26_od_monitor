import { StudentStatus } from '../types/student';

export const getStatusBadgeStyle = (status: StudentStatus) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Inactive':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Graduated':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Transferred':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const maskSensitiveField = (value: string, show: boolean) => {
  if (show) return value;
  if (!value) return '••••••••';
  if (value.includes('@')) {
    const parts = value.split('@');
    return `${parts[0].substring(0, 2)}***@${parts[1]}`;
  }
  return value.substring(0, 4) + ' •••• ' + value.substring(value.length - 2);
};
