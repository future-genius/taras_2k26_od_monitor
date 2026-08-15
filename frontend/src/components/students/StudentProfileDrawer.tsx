import React from 'react';
import { Student } from '../../types/student';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { getStatusBadgeStyle } from '../../utils/formatters';
import { formatDateDisplay } from '../../utils/excelExport';
import {
  X,
  Edit3,
  UserX,
  Calendar,
  Phone,
  Mail,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Briefcase,
} from 'lucide-react';

interface StudentProfileDrawerProps {
  student: Student | null;
  onClose: () => void;
  onEditStudent: (student: Student) => void;
  onDeactivateStudent: (student: Student) => void;
}

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({
  student,
  onClose,
  onEditStudent,
  onDeactivateStudent,
}) => {
  const { isPresident, isStaff } = useAuth();
  const { privacySettings, getStudentODHistory } = useStudents();

  if (!student) return null;

  const canViewPhone = isPresident || (isStaff && privacySettings.allowStaffViewPhone);
  const canViewEmail = isPresident || (isStaff && privacySettings.allowStaffViewEmail);

  const workHistory = getStudentODHistory(student.id);
  const totalWorkDays = workHistory.length;
  const odDays = workHistory.filter(h => h.status === 'OD').length;
  const absentDays = workHistory.filter(h => h.status === 'Absent').length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-taras-950/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white min-h-screen flex flex-col z-10 shadow-2xl border-l border-taras-200 overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-taras-900 text-white sticky top-0 z-20 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-taras-300">{student.registerNumber}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadgeStyle(student.status)}`}>
                {student.status}
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">{student.name}</h2>
            <p className="text-xs text-taras-300 mt-0.5">ECE • Year {student.year} • Section {student.section}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-taras-300 hover:text-white hover:bg-taras-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* President Controls */}
          {isPresident && (
            <div className="flex items-center justify-end gap-2 p-3 bg-taras-50 rounded-lg border border-taras-200">
              <button
                onClick={() => { onClose(); onEditStudent(student); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Student
              </button>
              {student.status === 'Active' && (
                <button
                  onClick={() => { onClose(); onDeactivateStudent(student); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors"
                >
                  <UserX className="w-3.5 h-3.5" /> Deactivate
                </button>
              )}
            </div>
          )}

          {/* Academic Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-taras-400 mb-3">Student Information</h3>
            <div className="grid grid-cols-2 gap-4 bg-taras-50/50 p-4 rounded-xl border border-taras-200">
              <div><span className="text-taras-500 block">Department</span><span className="font-bold text-taras-900">ECE</span></div>
              <div><span className="text-taras-500 block">Academic Year</span><span className="font-bold text-taras-900">Year {student.year}</span></div>
              <div><span className="text-taras-500 block">Section</span><span className="font-bold text-taras-900">Section {student.section}</span></div>
              <div><span className="text-taras-500 block">Status</span><span className="font-bold text-taras-900">{student.status}</span></div>
              <div className="col-span-2 pt-2 border-t border-taras-200">
                <span className="text-taras-500 block mb-0.5">Role / Designation</span>
                <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
                  {student.role || 'Student'}
                </span>
              </div>

              {/* DOB — only President */}
              {isPresident && (
                <div className="col-span-2 pt-2 border-t border-taras-200">
                  <span className="text-taras-500 flex items-center gap-1 block mb-0.5">
                    <Calendar className="w-3 h-3" /> Date of Birth
                  </span>
                  <span className="font-mono font-bold text-taras-900">{student.dateOfBirth}</span>
                  <span className="text-[10px] text-taras-400 block mt-0.5">Initial password: {student.dateOfBirth.replace(/[-/]/g, '')}</span>
                </div>
              )}

              {/* Contact info */}
              {(student.email || student.phone) && (
                <div className="col-span-2 pt-2 border-t border-taras-200 grid grid-cols-2 gap-3">
                  {student.email && (
                    <div>
                      <span className="text-taras-500 flex items-center gap-1 block mb-0.5"><Mail className="w-3 h-3" /> Email</span>
                      <span className={`font-medium ${canViewEmail ? 'text-taras-900' : 'text-slate-400 italic'}`}>
                        {canViewEmail ? student.email : '••••@••••'}
                      </span>
                      {!canViewEmail && <span className="text-[10px] text-amber-600 flex items-center gap-0.5 mt-0.5"><ShieldAlert className="w-3 h-3" /> Restricted</span>}
                    </div>
                  )}
                  {student.phone && (
                    <div>
                      <span className="text-taras-500 flex items-center gap-1 block mb-0.5"><Phone className="w-3 h-3" /> Phone</span>
                      <span className={`font-medium ${canViewPhone ? 'text-taras-900' : 'text-slate-400 italic'}`}>
                        {canViewPhone ? student.phone : '+91 •••• ••••••'}
                      </span>
                      {!canViewPhone && <span className="text-[10px] text-amber-600 flex items-center gap-0.5 mt-0.5"><ShieldAlert className="w-3 h-3" /> Restricted</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* TARAS Daily Work & OD Monitoring History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-taras-400">TARAS Work &amp; OD History</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-taras-900 text-white">
                {odDays} Days OD
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-taras-50 rounded-lg border border-taras-200 text-center">
                <span className="text-[11px] text-taras-500 block">Total Work Days</span>
                <span className="text-2xl font-bold text-taras-900 mt-0.5 block">{totalWorkDays}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                <span className="text-[11px] text-emerald-700 block font-semibold">Granted OD</span>
                <span className="text-2xl font-bold text-emerald-700 mt-0.5 block">{odDays}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-center">
                <span className="text-[11px] text-rose-700 block font-semibold">Absent</span>
                <span className="text-2xl font-bold text-rose-700 mt-0.5 block">{absentDays}</span>
              </div>
            </div>

            {/* Work History Table */}
            {workHistory.length > 0 ? (
              <div className="border border-taras-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-taras-50 border-b border-taras-200 text-taras-700 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Work / Event</th>
                      <th className="px-3.5 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-taras-100 font-medium">
                    {workHistory.map(record => (
                      <tr key={record.id} className="hover:bg-taras-50/50">
                        <td className="px-3.5 py-2.5 font-mono text-taras-800">
                          {formatDateDisplay(record.date)}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-taras-900">
                          {record.workName}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                              record.status === 'OD'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {record.status === 'OD' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-600" />
                            )}
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-taras-200 rounded-xl p-6 text-center text-taras-400 bg-taras-50/50 text-xs italic">
                No TARAS daily OD work sessions recorded for this student yet.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-taras-200 bg-white sticky bottom-0 z-20 text-right">
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-taras-100 hover:bg-taras-200 text-taras-800 text-xs font-semibold transition-colors">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
