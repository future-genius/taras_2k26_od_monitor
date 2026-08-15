import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Clock,
  User as UserIcon,
  ShieldAlert,
  Layers,
  Award,
} from 'lucide-react';

const SECTION_COLORS = ['#1e3a5f', '#0ea5e9', '#10b981'];
const YEAR_COLORS = ['#4f46e5', '#7c3aed', '#a21caf', '#be185d'];
const OD_COLOR = '#10b981';
const ABSENT_COLOR = '#f43f5e';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPresident, isStudent } = useAuth();
  const { stats, todayODStats, dailySummaries, managedEvents, eventParticipationSummary, allStudents, getStudentODHistory } = useStudents();

  // ════════════════════════════════════════════════════════════
  // 1. STUDENT PERSONAL PORTAL VIEW (When logged in as Student)
  // ════════════════════════════════════════════════════════════
  if (isStudent && user) {
    // Find this student's master record
    const student = allStudents.find(
      s => s.id === user.id || s.registerNumber.toLowerCase() === (user.registerNumber || '').toLowerCase()
    );

    const history = getStudentODHistory(user.id || user.registerNumber || '');
    const totalSessions = history.length;
    const odDays = history.filter(h => h.status === 'OD').length;
    const absentDays = history.filter(h => h.status === 'Absent').length;
    const odRate = totalSessions > 0 ? Math.round((odDays / totalSessions) * 100) : 0;

    return (
      <Layout
        title={`Student Portal: ${user.name}`}
        subtitle={`Register No: ${user.registerNumber || 'Student'} • ECE Department`}
      >
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-taras-950 via-taras-900 to-indigo-950 text-white p-6 rounded-2xl border border-taras-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> TARAS 2K26 Symposium Date: {SYMPOSIUM_DISPLAY_DATE}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Student Attendance Portal
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Welcome, {user.name}
              </h2>
              <p className="text-xs text-taras-300 mt-0.5">
                Here is your live daily TARAS On Duty (OD) record and symposium schedule.
              </p>
            </div>

            {student && (
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs border border-white/10 shrink-0">
                <div className="text-right text-xs">
                  <span className="text-taras-300 block text-[10px] uppercase font-bold">Assigned Role</span>
                  <span className="font-bold text-amber-300 text-sm">{student.role || 'Member'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Student Profile & Personal Metric Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-taras-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-taras-500 block">Class Details</span>
            <span className="text-lg font-bold text-taras-900 block mt-1">
              {student ? `Year ${student.year} • Sec ${student.section}` : 'ECE'}
            </span>
            <span className="text-[10px] text-taras-400 font-mono">{user.registerNumber}</span>
          </div>

          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 shadow-sm text-center">
            <span className="text-[11px] font-bold text-emerald-700 block">Granted OD Days</span>
            <span className="text-2xl font-extrabold text-emerald-700 block mt-0.5">{odDays}</span>
            <span className="text-[10px] text-emerald-600 font-medium">{odRate}% OD Rate</span>
          </div>

          <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-200 shadow-sm text-center">
            <span className="text-[11px] font-bold text-rose-700 block">Absent Days</span>
            <span className="text-2xl font-extrabold text-rose-700 block mt-0.5">{absentDays}</span>
            <span className="text-[10px] text-rose-600 font-medium">No Duty Given</span>
          </div>

          <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 shadow-sm text-center">
            <span className="text-[11px] font-bold text-indigo-700 block">Total Work Sessions</span>
            <span className="text-2xl font-extrabold text-indigo-700 block mt-0.5">{totalSessions}</span>
            <span className="text-[10px] text-indigo-600 font-medium">TARAS Preparation</span>
          </div>
        </div>

        {/* Personal OD Attendance History */}
        <div className="bg-white rounded-2xl border border-taras-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 sm:p-5 border-b border-taras-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-taras-900 text-sm sm:text-base">My Daily OD Attendance Records</h3>
                <p className="text-xs text-taras-500">Official log submitted to your Class Advisor</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-taras-900 text-white">
              {odDays} OD / {totalSessions} Total
            </span>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center text-taras-400 space-y-2">
              <Layers className="w-10 h-10 text-taras-300 mx-auto" />
              <p className="font-bold text-taras-800 text-sm">No Daily OD Records Yet</p>
              <p className="text-xs text-taras-500 max-w-sm mx-auto">
                When you participate in TARAS preparation work and the President marks your daily attendance, your OD records will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-taras-50 border-b border-taras-200 text-taras-700 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Event / Work Description</th>
                    <th className="px-4 py-3">Remarks / Task</th>
                    <th className="px-4 py-3 text-right">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-taras-100 font-medium">
                  {history.map(item => (
                    <tr key={item.id} className="hover:bg-taras-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-taras-900 whitespace-nowrap">
                        {formatDateDisplay(item.date)}
                      </td>
                      <td className="px-4 py-3 font-bold text-taras-900">
                        {item.workName}
                      </td>
                      <td className="px-4 py-3 text-taras-600 text-xs">
                        {item.remarks || '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs border ${
                            item.status === 'OD'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {item.status === 'OD' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          {item.status === 'OD' ? 'On Duty (OD)' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TARAS 2K26 Events & Work Schedule (Student Reference) */}
        <div className="bg-white p-5 rounded-2xl border border-taras-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-taras-100 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-taras-800" />
              <div>
                <h3 className="font-bold text-taras-900 text-sm">TARAS 2K26 Events &amp; Preparation Schedule</h3>
                <p className="text-[11px] text-taras-500">Symposium event line-up and official activities</p>
              </div>
            </div>
            <Link
              to="/events"
              className="text-xs font-bold text-taras-900 hover:text-taras-700 flex items-center gap-1"
            >
              <span>View All Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {managedEvents.length === 0 ? (
            <p className="text-xs text-taras-400 italic text-center py-4">No events posted yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {managedEvents.slice(0, 6).map(evt => (
                <div key={evt.id} className="p-3.5 rounded-xl border border-taras-100 bg-taras-50/50 space-y-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-taras-200 text-taras-800">
                    {evt.category || 'TARAS Event'}
                  </span>
                  <h4 className="font-bold text-taras-900 text-sm">{evt.name}</h4>
                  {evt.description && <p className="text-taras-600 line-clamp-2 text-[11px]">{evt.description}</p>}
                  {evt.venue && <p className="text-[10px] text-taras-500 font-medium">📍 {evt.venue}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ════════════════════════════════════════════════════════════
  // 2. PRESIDENT / STAFF INSTITUTIONAL DASHBOARD
  // ════════════════════════════════════════════════════════════
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
          subtitle={`Active: ${stats.activeStudents} | Inactive: ${stats.inactiveStudents}`}
          icon={Users}
          colorTheme="dark"
        />

        <StatCard
          title="Today's Marked OD"
          value={todayODStats.odCount}
          subtitle={`Across ${todayODStats.worksCount} TARAS task${todayODStats.worksCount !== 1 ? 's' : ''}`}
          icon={CheckCircle2}
          colorTheme="emerald"
        />

        <StatCard
          title="Today's Absent"
          value={todayODStats.absentCount}
          subtitle="No duty assigned today"
          icon={XCircle}
          colorTheme="amber"
        />

        <StatCard
          title="Configured Events"
          value={managedEvents.length}
          subtitle="TARAS 2K26 Work items"
          icon={Briefcase}
          colorTheme="sky"
        />
      </div>

      {/* ── Visual Charts: Recharts Section & Year Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Section Breakdown Pie Chart (Sections 1, 2, 3) */}
        <div className="bg-white p-5 rounded-2xl border border-taras-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-taras-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-taras-700" />
              <h3 className="font-bold text-taras-900 text-sm">ECE Section Distribution (Sec 1, 2, 3)</h3>
            </div>
            <span className="text-[11px] font-semibold text-taras-500">
              Total: {stats.totalStudents} Students
            </span>
          </div>

          <div className="h-60 w-full">
            {stats.totalStudents === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-taras-400 italic">
                No students enrolled yet. Import students to see distribution.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={sectionData}
                    dataKey="count"
                    nameKey="section"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={4}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SECTION_COLORS[index % SECTION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string) => [`${val} Students`, name]}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Year Breakdown Bar Chart (Years I, II, III, IV) */}
        <div className="bg-white p-5 rounded-2xl border border-taras-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-taras-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-taras-700" />
              <h3 className="font-bold text-taras-900 text-sm">ECE Academic Year Breakdown</h3>
            </div>
            <span className="text-[11px] font-semibold text-taras-500">
              Years I – IV
            </span>
          </div>

          <div className="h-60 w-full">
            {stats.totalStudents === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-taras-400 italic">
                No students enrolled yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={yearData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: number) => [`${val} Students`, 'Total']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#1e3a5f" radius={[6, 6, 0, 0]}>
                    {yearData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={YEAR_COLORS[index % YEAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Event-Based OD Participation Chart ── */}
      {eventParticipationSummary.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-taras-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-taras-100 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-taras-900 text-sm">TARAS Work / Event OD Participation</h3>
            </div>
            <span className="text-[11px] text-taras-500 font-medium">Cumulative attendance by task</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={eventParticipationSummary} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="eventName" tick={{ fontSize: 10, fill: '#334155' }} angle={-15} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="totalOD" name="Granted OD" fill={OD_COLOR} radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalAbsent" name="Absent" fill={ABSENT_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Recent Daily OD Records Table ── */}
      <div className="bg-white rounded-2xl border border-taras-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-taras-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-taras-900 text-sm sm:text-base">Recent Daily OD Records</h3>
            <p className="text-xs text-taras-500">Latest TARAS work attendance sessions</p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-xs font-bold text-taras-900 hover:text-taras-700 flex items-center gap-1"
          >
            <span>See All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {dailySummaries.length === 0 ? (
          <div className="p-12 text-center text-taras-400 space-y-2">
            <Calendar className="w-10 h-10 text-taras-300 mx-auto" />
            <p className="font-bold text-taras-800 text-sm">No Daily OD Records Yet</p>
            <p className="text-xs text-taras-500">
              Start marking daily TARAS preparation OD to generate records and official Excel sheets.
            </p>
            {isPresident && (
              <button
                onClick={() => navigate('/daily-od')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-taras-900 text-white text-xs font-bold mt-2 shadow-sm"
              >
                Mark Today's OD
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-taras-50 border-b border-taras-200 text-taras-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Work / Event Name</th>
                  <th className="px-4 py-3 text-center">OD Count</th>
                  <th className="px-4 py-3 text-center">Absent Count</th>
                  <th className="px-4 py-3 text-center">Total Students</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-taras-100 font-medium">
                {dailySummaries.slice(0, 5).map(summary => (
                  <tr key={`${summary.date}-${summary.workName}`} className="hover:bg-taras-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-taras-900 whitespace-nowrap">
                      {formatDateDisplay(summary.date)}
                    </td>
                    <td className="px-4 py-3 font-bold text-taras-900">
                      {summary.workName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {summary.odCount} OD
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        {summary.absentCount} Absent
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-taras-700">
                      {summary.totalStudents}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleQuickDownload(summary.date, summary.workName, summary.records)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-sm transition-colors"
                        title="Download official Excel for Class Advisor"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Excel</span>
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
