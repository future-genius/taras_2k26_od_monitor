import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useStudents } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import { ExportModal } from '../components/reports/ExportModal';
import { Download, PieChart as PieChartIcon, BarChart3, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const Reports: React.FC = () => {
  const { stats } = useStudents();
  const { isPresident } = useAuth();
  const [isExportOpen, setIsExportOpen] = useState(false);

  const statusData = [
    { name: 'Active', value: stats.activeStudents, color: '#15803D' },
    { name: 'Inactive', value: stats.inactiveStudents, color: '#B91C1C' },
    { name: 'Graduated', value: stats.graduatedStudents, color: '#0369A1' },
    { name: 'Transferred', value: stats.transferredStudents, color: '#B45309' },
  ].filter(d => d.value > 0);

  return (
    <Layout title="Reports & Analytics" subtitle="Institutional distribution statistics & data export center">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-taras-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-taras-900">Official Student Directory Reports</h3>
          <p className="text-xs text-taras-500 mt-0.5">
            Export complete enrollment logs and department breakdowns.
          </p>
        </div>

        {isPresident && (
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-taras-900 hover:bg-taras-800 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV / PDF Report</span>
          </button>
        )}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-taras-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-taras-700" />
            <h4 className="font-bold text-sm text-taras-900">Student Status Breakdown</h4>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={4}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-taras-100 text-xs">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-taras-600 font-medium">{item.name}:</span>
                <strong className="text-taras-900">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Breakdown Table */}
        <div className="bg-white p-6 rounded-xl border border-taras-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-taras-700" />
            <h4 className="font-bold text-sm text-taras-900">Participation & Enrollment Summary</h4>
          </div>

          <div className="overflow-x-auto border border-taras-200 rounded-lg text-xs">
            <table className="w-full text-left">
              <thead className="bg-taras-50 border-b border-taras-200 text-taras-700 font-semibold uppercase">
                <tr>
                  <th className="px-3.5 py-2.5">Metric</th>
                  <th className="px-3.5 py-2.5 text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-taras-100 font-medium">
                <tr>
                  <td className="px-3.5 py-2.5 font-semibold text-taras-900">Total Enrolled Students</td>
                  <td className="px-3.5 py-2.5 text-right text-taras-800">{stats.totalStudents}</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 font-semibold text-taras-900">Active Students</td>
                  <td className="px-3.5 py-2.5 text-right text-taras-800">{stats.activeStudents}</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 font-semibold text-taras-900">Department</td>
                  <td className="px-3.5 py-2.5 text-right text-taras-800 font-bold">ECE Only</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 font-semibold text-taras-900">Inactive / Graduated / Transferred</td>
                  <td className="px-3.5 py-2.5 text-right text-taras-800">{stats.inactiveStudents + stats.graduatedStudents + stats.transferredStudents}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </Layout>
  );
};
