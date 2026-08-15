import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { StatCard } from '../components/dashboard/StatCard';
import { useStudents } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import { SYMPOSIUM_DISPLAY_DATE } from '../types/od';
import { exportDailyODExcel, formatDateDisplay } from '../utils/excelExport';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Briefcase,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart2,
} from 'lucide-react';

const SECTION_COLORS = ['#1e3a5f', '#0ea5e9', '#10b981'];
const YEAR_COLORS = ['#4f46e5', '#7c3aed', '#a21caf', '#be185d'];
const OD_COLOR = '#10b981';
const ABSENT_COLOR = '#f43f5e';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isPresident } = useAuth();
  const { stats, todayODStats, dailySummaries, managedEvents, eventParticipationSummary } = useStudents();

  const handleQuickDownload = (date: string, workName: string, records: any[]) => {
    exportDailyODExcel(date, workName, records);
  };

  const sectionData = stats.sectionDistribution;
  const yearData = stats.yearDistribution;

  return (
    <Layout
      title="TARAS Daily OD Dashboard"
      subtitle={`TARAS 2K26 (${SYMPOSIUM_DISPLAY_DATE}) — Daily On Duty (OD) Student Work Monitoring`}
    >
      {/* ── Symposium Banner ── */}
      <div className="bg-gradient-to-r from-taras-950 via-taras-900 to-taras-800 text-white p-6 rounded-2xl border border-taras-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Symposium Date: {SYMPOSIUM_DISPLAY_DATE}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              ECE Department Exclusive
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            TARAS 2K26 Daily OD Monitoring System
          </h2>
          <p className="text-xs text-taras-300 max-w-xl">
            Track daily student preparation work, mark On Duty (OD) / Absent attendance, and instantly download official Excel spreadsheets for Class Advisors and EOT staff.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {isPresident && (
            <button
              onClick={() => navigate('/daily-od')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-taras-accent hover:bg-taras-accent-hover text-white text-xs font-bold shadow-lg transition-all"
            >
              <span>+ Mark Today's OD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-taras-800/80 hover:bg-taras-700 text-slate-200 text-xs font-semibold border border-taras-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <span>View OD History</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total ECE Students"
          value={stats.totalStudents}
          subtitle={stats.totalStudents === 0 ? 'No students imported yet' : 'Enrolled student master list'}
          icon={Users}
          colorTheme="dark"
        />

        <StatCard
          title="Today's Marked OD"
          value={todayODStats.odCount}
          subtitle={`Students on duty on ${formatDateDisplay(todayODStats.today)}`}
          icon={CheckCircle2}
          colorTheme="emerald"
        />

        <StatCard
          title="Today's Absent"
          value={todayODStats.absentCount}
          subtitle="Students marked absent today"
          icon={XCircle}
          colorTheme="amber"
        />

        <StatCard
          title="Configured Events"
          value={managedEvents.length}
          subtitle="TARAS work & event categories"
          icon={Briefcase}
          colorTheme="sky"
        />
      </div>

      {/* ── Fresh Database Banner (if 0 students) ── */}
      {stats.totalStudents === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl text-xs text-amber-900 space-y-1.5">
          <p className="font-bold text-sm text-amber-950">
            🚀 Ready for ECE Student Master List
          </p>
          <p>
            The database is currently clean and fresh. When ready, use the <strong>Students → Import Students</strong> button to upload the real Excel file containing:
          </p>
          <p className="font-mono bg-amber-100/70 p-2 rounded text-[11px] text-amber-950">
            Name, Register Number, Section (1/2/3), Year, Role, Date of Birth
          </p>
        </div>
      )}

      {/* ── VISUAL REPRESENTATIONS ── */}
      {stats.totalStudents > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Student Count by Section (Pie Chart) */}
          <div className="bg-white rounded-2xl border border-taras-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-4 h-4 text-taras-600" />
              <div>
                <h3 className="font-bold text-taras-900 text-sm">Students by Section</h3>
                <p className="text-[11px] text-taras-500">ECE Sections 1, 2, 3 — student distribution</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={sectionData}
                  dataKey="count"
                  nameKey="section"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ section, count }) => count > 0 ? `${section}: ${count}` : ''}
                  labelLine={false}
                >
                  {sectionData.map((_, idx) => (
                    <Cell key={idx} fill={SECTION_COLORS[idx % SECTION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} students`, '']} />
                <Legend
                  formatter={(value) => <span className="text-xs font-semibold text-taras-800">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Student Count by Year (Bar Chart) */}
          <div className="bg-white rounded-2xl border border-taras-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-taras-600" />
              <div>
                <h3 className="font-bold text-taras-900 text-sm">Students by Academic Year</h3>
                <p className="text-[11px] text-taras-500">Year I, II, III, IV — student count per year</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={yearData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf4" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontWeight: 600, fill: '#334155' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(val) => [`${val} students`, 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {yearData.map((_, idx) => (
                    <Cell key={idx} fill={YEAR_COLORS[idx % YEAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Event-Based OD Participation (if any) */}
          {eventParticipationSummary.length > 0 && (
            <div className="bg-white rounded-2xl border border-taras-200 shadow-sm p-5 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-taras-600" />
                <div>
                  <h3 className="font-bold text-taras-900 text-sm">Event-Based OD Participation</h3>
                  <p className="text-[11px] text-taras-500">OD marked vs. Absent per TARAS work/event</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={eventParticipationSummary}
                  margin={{ top: 5, right: 10, left: -10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf4" />
                  <XAxis
                    dataKey="eventName"
                    tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={55}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }}
                  />
                  <Bar dataKey="totalOD" name="OD Marked" fill={OD_COLOR} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="totalAbsent" name="Absent" fill={ABSENT_COLOR} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Recent Daily OD Records Table ── */}
      <div className="bg-white rounded-xl border border-taras-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-taras-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-taras-900 text-sm">Recent Daily OD Records</h3>
            <p className="text-[11px] text-taras-500 mt-0.5">
              Day-by-day TARAS work logs ready for submission to Class Advisors &amp; EOT
            </p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-xs font-bold text-taras-700 hover:text-taras-900 flex items-center gap-1"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {dailySummaries.length === 0 ? (
          <div className="p-12 text-center text-taras-400 text-xs space-y-2">
            <Calendar className="w-8 h-8 text-taras-300 mx-auto" />
            <p className="font-semibold text-taras-700">No Daily OD sessions recorded yet.</p>
            <p className="text-taras-400">Click &quot;Mark Today&apos;s OD&quot; above to begin tracking daily attendance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-taras-50 border-b border-taras-200 text-taras-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Work / Event Name</th>
                  <th className="px-4 py-3 text-center">Total Students</th>
                  <th className="px-4 py-3 text-center">Marked OD</th>
                  <th className="px-4 py-3 text-center">Absent</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-taras-100 font-medium">
                {dailySummaries.slice(0, 5).map(summary => (
                  <tr key={`${summary.date}-${summary.workName}`} className="hover:bg-taras-50/60">
                    <td className="px-4 py-3 font-mono font-bold text-taras-900">
                      {formatDateDisplay(summary.date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-taras-900">
                      {summary.workName}
                    </td>
                    <td className="px-4 py-3 text-center text-taras-700">
                      {summary.totalStudents}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {summary.odCount} OD
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        {summary.absentCount} Absent
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleQuickDownload(summary.date, summary.workName, summary.records)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-[11px] font-bold transition-colors shadow-xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Download .xlsx</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};
