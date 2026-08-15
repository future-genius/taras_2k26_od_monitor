import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useStudents } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import { exportDailyODExcel, formatDateDisplay } from '../utils/excelExport';
import {
  Calendar,
  Search,
  FileSpreadsheet,
  Edit3,
  CheckCircle2,
  XCircle,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  AlertCircle,
  Download,
} from 'lucide-react';

export const ODHistory: React.FC = () => {
  const navigate = useNavigate();
  const { isPresident } = useAuth();
  const { dailySummaries, managedEvents } = useStudents();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState<string>('ALL');

  // All unique event/work names across all records
  const workNames = useMemo(() => {
    const names = new Set(dailySummaries.map(s => s.workName));
    return Array.from(names).sort();
  }, [dailySummaries]);

  const filteredSummaries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dailySummaries.filter(s => {
      const matchSearch = !q || s.date.includes(q) || s.workName.toLowerCase().includes(q);
      const matchEvent = filterEvent === 'ALL' || s.workName === filterEvent;
      return matchSearch && matchEvent;
    });
  }, [dailySummaries, searchQuery, filterEvent]);

  const totalDays = dailySummaries.length;
  const totalODRecorded = dailySummaries.reduce((sum, d) => sum + d.odCount, 0);
  const totalAbsentRecorded = dailySummaries.reduce((sum, d) => sum + d.absentCount, 0);

  const handleDownload = (date: string, workName: string, records: any[]) => {
    exportDailyODExcel(date, workName, records);
  };

  const handleEdit = (date: string, workName: string) => {
    // Navigate to DailyOD with URL params — DailyOD reads these to pre-fill date & work
    navigate(`/daily-od?date=${date}&work=${encodeURIComponent(workName)}`);
  };

  return (
    <Layout
      title="Daily OD History & Reports"
      subtitle="Complete day-by-day TARAS preparation records, OD logs & re-downloadable Excel files for Class Advisors"
    >
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-taras-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-taras-500 block">Total Work Sessions</span>
          <span className="text-2xl font-extrabold text-taras-900 block mt-0.5">{totalDays}</span>
          <span className="text-[10px] text-taras-400">TARAS 2K26 Preparation</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm text-center">
          <span className="text-xs font-bold text-emerald-700 block">Total OD Granted</span>
          <span className="text-2xl font-extrabold text-emerald-700 block mt-0.5">{totalODRecorded}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Cumulative OD entries</span>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-sm text-center">
          <span className="text-xs font-bold text-rose-700 block">Total Absences</span>
          <span className="text-2xl font-extrabold text-rose-700 block mt-0.5">{totalAbsentRecorded}</span>
          <span className="text-[10px] text-rose-600 font-medium">Cumulative absent entries</span>
        </div>
      </div>

      {/* ── Search, Filter & New OD Button ── */}
      <div className="bg-white p-4 rounded-xl border border-taras-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-taras-400" />
              <input
                type="text"
                placeholder="Search by date or work name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-taras-200 bg-taras-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
              />
            </div>

            {/* Event/Work filter */}
            {workNames.length > 0 && (
              <select
                value={filterEvent}
                onChange={e => setFilterEvent(e.target.value)}
                className="px-3 py-2 border border-taras-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
              >
                <option value="ALL">All Events / Work</option>
                {workNames.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => navigate('/daily-od')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-taras-900 hover:bg-taras-800 text-white text-xs font-bold shadow-sm transition-colors shrink-0 w-full sm:w-auto justify-center"
          >
            <span>+ Mark New Daily OD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filterEvent !== 'ALL' && (
          <div className="text-[11px] text-taras-500 flex items-center gap-2">
            <span>Filtered by: <strong className="text-taras-800">{filterEvent}</strong></span>
            <button
              onClick={() => setFilterEvent('ALL')}
              className="text-rose-600 underline font-semibold"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* ── No Records State ── */}
      {filteredSummaries.length === 0 ? (
        <div className="bg-white p-16 rounded-xl border border-taras-200 text-center space-y-3">
          <Layers className="w-10 h-10 text-taras-300 mx-auto" />
          <p className="font-bold text-taras-800 text-sm">
            {dailySummaries.length === 0 ? 'No Daily OD Records Yet' : 'No Records Match Your Filter'}
          </p>
          <p className="text-xs text-taras-400 max-w-sm mx-auto">
            {dailySummaries.length === 0
              ? 'Daily On Duty records will appear here after the President marks and saves TARAS work sessions.'
              : 'Try adjusting your search or event filter.'}
          </p>
          {dailySummaries.length === 0 && (
            <button
              onClick={() => navigate('/daily-od')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-taras-900 text-white text-xs font-bold mt-2 shadow-sm"
            >
              Go to Daily OD Marking
            </button>
          )}
        </div>
      ) : (
        /* ── OD Records Grid ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSummaries.map(summary => {
            const formattedDate = formatDateDisplay(summary.date);
            // Find the event info from managedEvents if it matches
            const matchedEvent = managedEvents.find(e => e.name === summary.workName);

            return (
              <div
                key={`${summary.date}-${summary.workName}`}
                className="bg-white rounded-xl border border-taras-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-taras-100 bg-gradient-to-r from-taras-50/50 to-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-taras-600 font-mono mb-1">
                        <Calendar className="w-3.5 h-3.5 text-taras-500" />
                        {formattedDate}
                      </span>
                      <h3 className="font-bold text-taras-900 text-sm leading-tight truncate">
                        {summary.workName}
                      </h3>
                      {matchedEvent?.category && (
                        <span className="inline-block text-[10px] font-semibold text-taras-500 mt-0.5">
                          {matchedEvent.category}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-taras-900 text-white shrink-0">
                      ECE
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="p-4 flex-1 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-taras-50 rounded-lg border border-taras-100">
                    <span className="font-bold text-base text-taras-900 block">{summary.totalStudents}</span>
                    <span className="text-[10px] text-taras-500">Total</span>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="font-bold text-base text-emerald-700 block">{summary.odCount}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">OD</span>
                  </div>
                  <div className="p-2 bg-rose-50 rounded-lg border border-rose-100">
                    <span className="font-bold text-base text-rose-700 block">{summary.absentCount}</span>
                    <span className="text-[10px] text-rose-600 font-medium">Absent</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-3 border-t border-taras-100 bg-taras-50/40 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(summary.date, summary.workName, summary.records)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-sm transition-colors"
                    title="Download official Excel file for Class Advisor / EOT"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Download Excel</span>
                  </button>

                  {isPresident && (
                    <button
                      type="button"
                      onClick={() => handleEdit(summary.date, summary.workName)}
                      className="p-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors border border-amber-200"
                      title="Edit / Correct records for this session"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};
