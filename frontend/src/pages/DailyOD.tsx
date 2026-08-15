import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useStudents } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import { SYMPOSIUM_DISPLAY_DATE } from '../types/od';
import { AcademicYear, Section } from '../types/student';
import { exportDailyODExcel } from '../utils/excelExport';
import {
  Calendar,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Download,
  Save,
  RotateCcw,
  CheckCheck,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Plus,
  Info,
} from 'lucide-react';

export const DailyOD: React.FC = () => {
  const { isPresident } = useAuth();
  const { allStudents, managedEvents, getDailyODRecords, saveDailyOD } = useStudents();

  // Read URL query params for "edit from history" flow
  const [searchParams] = useSearchParams();
  const urlDate = searchParams.get('date');
  const urlWork = searchParams.get('work');

  // ── Work options derived from President-managed events ──
  const workOptions = useMemo(() => {
    const names = managedEvents.map(e => e.name);
    if (!names.includes('Other (Custom)')) names.push('Other (Custom)');
    return names.length > 0 ? names : ['Other (Custom)'];
  }, [managedEvents]);

  // ── Date & Work Selection ──
  const [selectedDate, setSelectedDate] = useState<string>(
    () => urlDate || new Date().toISOString().split('T')[0]
  );
  const [selectedWork, setSelectedWork] = useState<string>(
    () => urlWork || workOptions[0] || 'Other (Custom)'
  );
  const [customWork, setCustomWork] = useState<string>('');

  // Sync selectedWork if workOptions change and current value is gone
  useEffect(() => {
    if (workOptions.length > 0 && !workOptions.includes(selectedWork) && selectedWork !== 'Other (Custom)') {
      setSelectedWork(workOptions[0]);
    }
  }, [workOptions]);

  // Apply URL params when they change (coming back from History edit)
  useEffect(() => {
    if (urlDate) setSelectedDate(urlDate);
    if (urlWork) {
      if (workOptions.includes(urlWork)) {
        setSelectedWork(urlWork);
      } else {
        setSelectedWork('Other (Custom)');
        setCustomWork(urlWork);
      }
    }
  }, [urlDate, urlWork]);

  const activeWorkName =
    selectedWork === 'Other (Custom)'
      ? (customWork.trim() || 'TARAS Work')
      : selectedWork;

  // ── Student search & section/year filter ──
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<AcademicYear | 'ALL'>('ALL');
  const [selectedSection, setSelectedSection] = useState<Section | 'ALL'>('ALL');

  // ── Attendance status map: studentId → 'OD' | 'Absent' ──
  const [statusMap, setStatusMap] = useState<Record<string, 'OD' | 'Absent'>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingSaved, setHasExistingSaved] = useState(false);

  // ── Load saved records when Date or Work changes ──
  useEffect(() => {
    const existing = getDailyODRecords(selectedDate, activeWorkName);
    const newStatusMap: Record<string, 'OD' | 'Absent'> = {};
    const newRemarksMap: Record<string, string> = {};

    if (existing.length > 0) {
      existing.forEach(r => {
        newStatusMap[r.studentId] = r.status;
        if (r.remarks) newRemarksMap[r.studentId] = r.remarks;
      });
      setHasExistingSaved(true);
    } else {
      setHasExistingSaved(false);
    }

    setStatusMap(newStatusMap);
    setRemarksMap(newRemarksMap);
  }, [selectedDate, activeWorkName]);

  // ── Active students only — filter by search and section/year ──
  const activeStudents = useMemo(
    () => allStudents.filter(s => s.status === 'Active'),
    [allStudents]
  );

  const filteredStudents = useMemo(() => {
    return activeStudents.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.registerNumber.toLowerCase().includes(q) ||
        (s.role && s.role.toLowerCase().includes(q));
      const matchYear = selectedYear === 'ALL' || s.year === selectedYear;
      const matchSec = selectedSection === 'ALL' || s.section === selectedSection;
      return matchSearch && matchYear && matchSec;
    });
  }, [activeStudents, searchQuery, selectedYear, selectedSection]);

  // ── Summary counts (always across ALL active students, not just filtered) ──
  const totalActiveStudents = activeStudents.length;
  const odCount = activeStudents.filter(s => statusMap[s.id] === 'OD').length;
  const absentCount = activeStudents.filter(s => statusMap[s.id] === 'Absent').length;
  const unassignedCount = totalActiveStudents - odCount - absentCount;

  // ── Visible-list counts (for filtered view) ──
  const visibleOD = filteredStudents.filter(s => statusMap[s.id] === 'OD').length;
  const visibleAbsent = filteredStudents.filter(s => statusMap[s.id] === 'Absent').length;

  // ── Handlers ──
  const handleMarkStatus = (studentId: string, status: 'OD' | 'Absent') => {
    if (!isPresident) return;
    setStatusMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? (undefined as any) : status,
    }));
  };

  const handleMarkAllOD = () => {
    if (!isPresident) return;
    const newMap = { ...statusMap };
    filteredStudents.forEach(s => { newMap[s.id] = 'OD'; });
    setStatusMap(newMap);
  };

  const handleMarkAllAbsent = () => {
    if (!isPresident) return;
    const newMap = { ...statusMap };
    filteredStudents.forEach(s => { newMap[s.id] = 'Absent'; });
    setStatusMap(newMap);
  };

  const handleResetVisible = () => {
    if (!isPresident) return;
    const newMap = { ...statusMap };
    filteredStudents.forEach(s => { delete newMap[s.id]; });
    setStatusMap(newMap);
  };

  const handleSave = async () => {
    if (!isPresident) return;
    setIsSaving(true);

    // Save ALL active students who have a status set (not just visible/filtered ones)
    const recordsToSave = activeStudents
      .filter(s => statusMap[s.id] !== undefined)
      .map(s => ({
        studentId: s.id,
        status: statusMap[s.id],
        remarks: remarksMap[s.id] || '',
      }));

    if (recordsToSave.length === 0) {
      alert('Please mark at least one student as OD or Absent before saving.');
      setIsSaving(false);
      return;
    }

    const success = await saveDailyOD(selectedDate, activeWorkName, recordsToSave);
    setIsSaving(false);
    if (success) {
      setHasExistingSaved(true);
    }
  };

  // Download uses saved records from DB (not just what's visible in UI)
  const handleDownloadExcel = () => {
    const savedRecords = getDailyODRecords(selectedDate, activeWorkName);

    // If not yet saved to DB, generate from current statusMap
    const records = savedRecords.length > 0
      ? savedRecords
      : activeStudents
          .filter(s => statusMap[s.id] !== undefined)
          .map(s => ({
            id: `od-preview-${selectedDate}-${s.registerNumber}`,
            studentId: s.id,
            studentName: s.name,
            registerNumber: s.registerNumber,
            section: s.section,
            year: s.year,
            department: 'ECE' as const,
            date: selectedDate,
            workName: activeWorkName,
            status: statusMap[s.id],
            markedBy: 'President',
            markedAt: new Date().toISOString(),
            remarks: remarksMap[s.id] || '',
          }));

    if (records.length === 0) {
      alert('Please mark at least one student as OD or Absent before generating the Excel report. Save the records first for best results.');
      return;
    }

    exportDailyODExcel(selectedDate, activeWorkName, records);
  };

  const noEventsConfigured = managedEvents.length === 0;

  return (
    <Layout
      title="Daily OD Monitoring"
      subtitle={`TARAS 2K26 (${SYMPOSIUM_DISPLAY_DATE}) — Mark On Duty (OD) / Absent & Generate Official Excel for Class Advisors`}
    >
      {/* ── No Events Warning Banner ── */}
      {noEventsConfigured && isPresident && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-950 mb-0.5">No Events / Work Categories Configured Yet</p>
            <p>
              The work dropdown is empty because no events have been added. Add TARAS preparation tasks
              (e.g. "Video Recording", "Stage Setup") in{' '}
              <Link to="/events" className="font-bold underline text-amber-800 hover:text-amber-950">
                Event &amp; Work Management
              </Link>
              {' '}first, then come back to mark daily OD.
            </p>
          </div>
          <Link
            to="/events"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Events</span>
          </Link>
        </div>
      )}

      {/* ── No Students Warning Banner ── */}
      {allStudents.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-950 mb-0.5">No Students in the System</p>
            <p>
              Import or add ECE students via the{' '}
              <Link to="/students" className="font-bold underline text-rose-800 hover:text-rose-950">
                Student Directory
              </Link>
              {' '}page before marking daily OD.
            </p>
          </div>
          <Link
            to="/students"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold shrink-0 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Students</span>
          </Link>
        </div>
      )}

      {/* ── Top Controls: Date & Work Selection ── */}
      <div className="bg-white p-5 rounded-xl border border-taras-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Picker */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-taras-800 uppercase tracking-wider mb-1.5">
              <Calendar className="w-4 h-4 text-taras-700" />
              <span>Select Date</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm font-semibold bg-taras-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
              />
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 rounded-lg bg-taras-100 hover:bg-taras-200 text-taras-800 text-xs font-bold shrink-0 transition-colors"
              >
                Today
              </button>
            </div>
          </div>

          {/* Work / Event Name — from EventManagement */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-taras-800 uppercase tracking-wider">
                <Briefcase className="w-4 h-4 text-taras-700" />
                <span>TARAS Work / Event</span>
              </label>
              {managedEvents.length === 0 && isPresident && (
                <Link
                  to="/events"
                  className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add in Events</span>
                </Link>
              )}
            </div>

            {managedEvents.length > 0 ? (
              <select
                value={selectedWork}
                onChange={e => setSelectedWork(e.target.value)}
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm font-semibold bg-taras-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
              >
                {workOptions.map(w => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={customWork}
                onChange={e => setCustomWork(e.target.value)}
                placeholder="Type work name (e.g. Video Recording, Stage Setup)..."
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-taras-800 font-medium"
              />
            )}
          </div>

          {/* Custom Work Input if "Other (Custom)" is selected */}
          {managedEvents.length > 0 && selectedWork === 'Other (Custom)' && (
            <div>
              <label className="block text-xs font-bold text-taras-800 uppercase tracking-wider mb-1.5">
                Custom Work Name
              </label>
              <input
                type="text"
                value={customWork}
                onChange={e => setCustomWork(e.target.value)}
                placeholder="e.g. Auditorium Sound Setup"
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-taras-800 font-medium"
              />
            </div>
          )}
        </div>

        {hasExistingSaved && (
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              OD records for <strong>{selectedDate}</strong> ({activeWorkName}) are already saved.
              You can edit and re-save anytime. Re-download the Excel after saving.
            </span>
          </div>
        )}
      </div>

      {/* ── Summary Counts (ALL active students, not just filtered view) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-taras-200 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-taras-500 block">Active Students</span>
          <span className="text-2xl font-extrabold text-taras-900 block mt-0.5">{totalActiveStudents}</span>
          <span className="text-[10px] text-taras-400">ECE Department</span>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-emerald-700 block">Marked OD</span>
          <span className="text-2xl font-extrabold text-emerald-700 block mt-0.5">{odCount}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Present on duty</span>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-rose-700 block">Marked Absent</span>
          <span className="text-2xl font-extrabold text-rose-700 block mt-0.5">{absentCount}</span>
          <span className="text-[10px] text-rose-600 font-medium">No duty given</span>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-amber-700 block">Unmarked</span>
          <span className="text-2xl font-extrabold text-amber-700 block mt-0.5">{unassignedCount}</span>
          <span className="text-[10px] text-amber-600 font-medium">Pending action</span>
        </div>
      </div>

      {/* ── Filters & Bulk Actions ── */}
      <div className="bg-white p-4 rounded-xl border border-taras-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-taras-400" />
            <input
              type="text"
              placeholder="Search by name, reg. no. or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-taras-200 bg-taras-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
            />
          </div>

          {/* Bulk Mark Buttons (President only) */}
          {isPresident && (
            <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
              <span className="text-[11px] text-taras-500 font-medium">Bulk (visible):</span>
              <button
                type="button"
                onClick={handleMarkAllOD}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                title="Mark all visible students as OD"
              >
                <CheckCheck className="w-4 h-4" />
                <span>All OD</span>
              </button>
              <button
                type="button"
                onClick={handleMarkAllAbsent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors"
                title="Mark all visible students as Absent"
              >
                <XCircle className="w-4 h-4" />
                <span>All Absent</span>
              </button>
              <button
                type="button"
                onClick={handleResetVisible}
                className="p-1.5 rounded-lg bg-taras-100 hover:bg-taras-200 text-taras-700 transition-colors"
                title="Reset visible markings"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-taras-100 text-xs flex-wrap">
          <span className="font-semibold text-taras-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          <span className="px-2.5 py-1 rounded bg-taras-900 text-white font-bold text-[11px]">
            ECE Only
          </span>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value as any)}
            className="px-2.5 py-1 rounded-md border border-taras-200 bg-white font-medium focus:outline-none"
          >
            <option value="ALL">All Years</option>
            <option value="I">I Year</option>
            <option value="II">II Year</option>
            <option value="III">III Year</option>
            <option value="IV">IV Year</option>
          </select>

          {/* Section filter: 1, 2, 3 */}
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value as any)}
            className="px-2.5 py-1 rounded-md border border-taras-200 bg-white font-bold focus:outline-none"
          >
            <option value="ALL">All Sections</option>
            <option value="1">Section 1</option>
            <option value="2">Section 2</option>
            <option value="3">Section 3</option>
          </select>

          {(searchQuery || selectedYear !== 'ALL' || selectedSection !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedYear('ALL');
                setSelectedSection('ALL');
              }}
              className="text-rose-600 underline font-semibold text-xs ml-auto"
            >
              Clear Filters
            </button>
          )}

          {/* Visible vs Total indicator */}
          {(searchQuery || selectedYear !== 'ALL' || selectedSection !== 'ALL') && (
            <span className="ml-auto text-taras-500 font-medium text-[11px]">
              Showing {filteredStudents.length} of {totalActiveStudents} active students
            </span>
          )}
        </div>
      </div>

      {/* ── Student Marking Table ── */}
      <div className="bg-white rounded-xl border border-taras-200 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-taras-500 space-y-2">
            <Layers className="w-10 h-10 text-taras-300 mx-auto" />
            <p className="font-bold text-taras-800 text-sm">No students found.</p>
            <p className="text-xs text-taras-400">
              {allStudents.length === 0
                ? 'Import or add ECE students first via the Student Directory page.'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-taras-900 text-white font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Reg. No</th>
                  <th className="px-4 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Year / Sec</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">
                    {isPresident ? 'Mark OD / Absent' : 'Status View'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-taras-100 font-medium">
                {filteredStudents.map(student => {
                  const currentStatus = statusMap[student.id];

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-taras-50/70 transition-colors ${
                        currentStatus === 'OD'
                          ? 'bg-emerald-50/30'
                          : currentStatus === 'Absent'
                          ? 'bg-rose-50/30'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-taras-900">
                        {student.registerNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-taras-900">{student.name}</div>
                        <div className="text-[10px] text-taras-400 font-mono">ECE</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {student.role || 'Student'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-taras-700">
                        Year {student.year} • Sec {student.section}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {currentStatus === 'OD' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            OD
                          </span>
                        ) : currentStatus === 'Absent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Absent
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Not Marked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isPresident ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleMarkStatus(student.id, 'OD')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                currentStatus === 'OD'
                                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-1'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              OD
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkStatus(student.id, 'Absent')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                currentStatus === 'Absent'
                                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600 ring-offset-1'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-taras-400 font-medium italic">Read-Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Floating Action Bar ── */}
      <div className="sticky bottom-4 z-20 bg-taras-900 text-white p-4 rounded-xl shadow-2xl border border-taras-700 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-sm text-white">
            {selectedDate} — {activeWorkName}
          </p>
          <p className="text-taras-300">
            <strong className="text-emerald-400">{odCount}</strong> OD&nbsp;•&nbsp;
            <strong className="text-rose-400">{absentCount}</strong> Absent&nbsp;•&nbsp;
            <strong className="text-amber-400">{unassignedCount}</strong> Unmarked
            {(searchQuery || selectedYear !== 'ALL' || selectedSection !== 'ALL') && (
              <span className="ml-2 text-taras-400">
                (View: {visibleOD} OD / {visibleAbsent} Absent)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {isPresident && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || activeStudents.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Records...' : 'Save Daily OD'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={odCount === 0 && absentCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Daily OD Excel (.xlsx)</span>
          </button>
        </div>
      </div>
    </Layout>
  );
};
