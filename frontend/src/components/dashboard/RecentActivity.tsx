import React from 'react';
import { AuditLogEntry } from '../../types/audit';
import { Clock } from 'lucide-react';

interface RecentActivityProps {
  logs: AuditLogEntry[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ logs }) => {
  const displayLogs = logs.slice(0, 5);

  const getActionBadge = (action: string) => {
    if (action.includes('Added')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('Status')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-sky-50 text-sky-700 border-sky-200';
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-taras-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-taras-900">Recent Activity</h3>
          <p className="text-xs text-taras-500">Latest administrative updates logged by the President</p>
        </div>
        <Clock className="w-4 h-4 text-taras-400" />
      </div>

      <div className="overflow-x-auto border border-taras-200 rounded-lg">
        <table className="w-full text-xs text-left">
          <thead className="bg-taras-50 border-b border-taras-200 text-taras-700 font-semibold uppercase">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-taras-100 font-medium">
            {displayLogs.map((log) => (
              <tr key={log.id} className="hover:bg-taras-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-bold text-taras-900">{log.studentName || log.studentRegNo}</div>
                  <div className="text-[11px] text-taras-500">{log.studentRegNo}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getActionBadge(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-taras-600">
                  {log.date} — {log.time}
                </td>
                <td className="px-4 py-3 text-taras-700 font-semibold">{log.user}</td>
              </tr>
            ))}

            {displayLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-taras-500">
                  No recent activity logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
