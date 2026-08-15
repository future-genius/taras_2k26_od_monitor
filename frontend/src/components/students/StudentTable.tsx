import React from 'react';
import { Student } from '../../types/student';
import { useAuth } from '../../context/AuthContext';
import { getStatusBadgeStyle } from '../../utils/formatters';
import { Eye, Edit3, UserX } from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeactivateStudent: (student: Student) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onSelectStudent,
  onEditStudent,
  onDeactivateStudent,
}) => {
  const { isPresident } = useAuth();

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-taras-200 p-8 text-center">
        <p className="font-semibold text-taras-800 text-sm">No students found.</p>
        <p className="text-xs text-taras-400 mt-1">Import students or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-taras-200 shadow-sm overflow-hidden">
      {/* Horizontal scroll works on all screen sizes */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left" style={{ minWidth: '600px' }}>
          <thead className="bg-taras-900 text-white font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-3 sm:px-4 py-3.5 whitespace-nowrap">Reg. No.</th>
              <th className="px-3 sm:px-4 py-3.5">Name</th>
              <th className="px-3 sm:px-4 py-3.5 whitespace-nowrap">Role</th>
              <th className="px-3 sm:px-4 py-3.5 whitespace-nowrap">Yr / Sec</th>
              <th className="px-3 sm:px-4 py-3.5 whitespace-nowrap">DOB</th>
              <th className="px-3 sm:px-4 py-3.5 whitespace-nowrap">Status</th>
              <th className="px-3 sm:px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-taras-100 font-medium">
            {students.map((student) => (
              <tr
                key={student.id}
                className="hover:bg-taras-50/80 transition-colors group cursor-pointer"
                onClick={() => onSelectStudent(student)}
              >
                <td className="px-3 sm:px-4 py-3 font-mono font-bold text-taras-900 text-xs sm:text-sm whitespace-nowrap">
                  {student.registerNumber}
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <div className="font-semibold text-taras-900 text-xs sm:text-sm group-hover:text-taras-accent transition-colors leading-tight">
                    {student.name}
                  </div>
                  <div className="text-[10px] text-taras-400 font-normal">ECE</div>
                </td>
                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {student.role || 'Student'}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 text-taras-700 text-xs whitespace-nowrap">
                  Y{student.year} / S{student.section}
                </td>
                <td className="px-3 sm:px-4 py-3 font-mono text-taras-600 text-[10px] sm:text-[11px] whitespace-nowrap">
                  {isPresident ? student.dateOfBirth : '••-••-••••'}
                </td>
                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold border ${getStatusBadgeStyle(student.status)}`}>
                    {student.status}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onSelectStudent(student)}
                      className="p-1.5 rounded-md text-taras-600 hover:text-taras-900 hover:bg-taras-100 transition-colors"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {isPresident && (
                      <>
                        <button
                          onClick={() => onEditStudent(student)}
                          className="p-1.5 rounded-md text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {student.status === 'Active' && (
                          <button
                            onClick={() => onDeactivateStudent(student)}
                            className="p-1.5 rounded-md text-rose-600 hover:text-rose-900 hover:bg-rose-50 transition-colors"
                            title="Deactivate"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
