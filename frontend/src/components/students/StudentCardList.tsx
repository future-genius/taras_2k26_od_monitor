import React from 'react';
import { Student } from '../../types/student';
import { useAuth } from '../../context/AuthContext';
import { getStatusBadgeStyle } from '../../utils/formatters';
import { Eye, Edit3, UserX } from 'lucide-react';

interface StudentCardListProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeactivateStudent: (student: Student) => void;
}

export const StudentCardList: React.FC<StudentCardListProps> = ({
  students,
  onSelectStudent,
  onEditStudent,
  onDeactivateStudent,
}) => {
  const { isPresident } = useAuth();

  return (
    <div className="grid grid-cols-1 gap-3 sm:hidden">
      {students.map((student) => (
        <div
          key={student.id}
          className="bg-white p-4 rounded-xl border border-taras-200 shadow-sm"
          onClick={() => onSelectStudent(student)}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-taras-500">{student.registerNumber}</span>
              <h4 className="font-bold text-taras-900 text-sm mt-0.5">{student.name}</h4>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-taras-600 flex-wrap">
                <span className="font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] border border-emerald-200">
                  {student.role || 'Student'}
                </span>
                <span>•</span>
                <span>ECE</span>
                <span>•</span>
                <span>Year {student.year}</span>
                <span>•</span>
                <span className="font-bold">Sec {student.section}</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadgeStyle(student.status)}`}>
              {student.status}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-taras-100 text-xs" onClick={e => e.stopPropagation()}>
            <span className="text-taras-500">
              DOB: <strong className="text-taras-700">{isPresident ? student.dateOfBirth : '••-••-••••'}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectStudent(student)}
                className="px-2.5 py-1 rounded bg-taras-100 text-taras-800 font-medium text-xs flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              {isPresident && (
                <>
                  <button onClick={() => onEditStudent(student)} className="p-1 rounded bg-amber-50 text-amber-700">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {student.status === 'Active' && (
                    <button onClick={() => onDeactivateStudent(student)} className="p-1 rounded bg-rose-50 text-rose-700">
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {students.length === 0 && (
        <div className="bg-white p-8 rounded-xl border border-taras-200 text-center text-taras-500">
          <p className="font-semibold text-sm">No students found.</p>
          <p className="text-xs text-taras-400 mt-1">Import students or adjust your filters.</p>
        </div>
      )}
    </div>
  );
};
