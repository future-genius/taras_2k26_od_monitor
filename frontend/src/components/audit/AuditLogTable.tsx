import React from 'react';
import { AuditLogEntry } from '../../types/audit';
import { ShieldCheck, Clock } from 'lucide-react';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-xl border border-taras-200 shadow-sm overflow-hidden space-y-4">
      <div className="p-4 bg-taras-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-sm">President Administrative Audit Trail</h3>
            <p className="text-[11px] text-taras-300">Complete immutable record of modifications and student updates</p>
          </div>
        </div>
        <span className="text-xs font-mono bg-taras-800 px-2.5 py-1 rounded text-taras-300 border border-taras-700">
          {logs.length} Entries
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-taras-50 border-b border-taras-200 text-taras-700 font-semibold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Administrator</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Register No.</th>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Audit Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-taras-100 font-medium">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-taras-50/60 transition-colors">
                <td className="px-4 py-3 text-taras-600 font-mono whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-taras-400" />
                    <span>{log.date} {log.time}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-taras-900">{log.user}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded font-semibold text-[10px] bg-taras-100 text-taras-800 border border-taras-200">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-taras-800">{log.studentRegNo}</td>
                <td className="px-4 py-3 text-taras-900 font-semibold">{log.studentName || '—'}</td>
                <td className="px-4 py-3 text-taras-600">{log.details || '—'}</td>
              </tr>
            ))}

            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-taras-500">
                  No audit logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
