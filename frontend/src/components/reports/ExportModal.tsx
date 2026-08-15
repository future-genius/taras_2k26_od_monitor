import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { exportToCSV, exportToPDFPrint } from '../../utils/exportUtils';
import { X, FileSpreadsheet, Printer, ShieldAlert } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { isPresident, isStaff } = useAuth();
  const { paginatedStudents, privacySettings } = useStudents();
  const students = paginatedStudents.data;

  if (!isOpen) return null;

  // Export permitted if President OR if President enabled staff export
  const canExport = isPresident || (isStaff && privacySettings.allowStudentExport);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-taras-950/70 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden z-10 border border-taras-200">
        <div className="px-6 py-4 bg-taras-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-base">Export Student Records</h3>
          <button onClick={onClose} className="p-1 rounded text-taras-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {!canExport ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Export Restricted</span>
              </div>
              <p>
                Exporting sensitive student data is currently restricted. Only the TARAS President or authorized staff can download directory reports.
              </p>
            </div>
          ) : (
            <>
              <p className="text-taras-600">
                Export total <strong>{students.length} student records</strong> matching your current active filters.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => { exportToCSV(students); onClose(); }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-taras-200 hover:border-taras-800 hover:bg-taras-50 transition-all text-left group"
                >
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-taras-900 text-sm">Download CSV Spreadsheet</h4>
                    <p className="text-taras-500 text-[11px]">Structured data compatible with Excel and Google Sheets</p>
                  </div>
                </button>

                <button
                  onClick={() => { exportToPDFPrint(students); onClose(); }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-taras-200 hover:border-taras-800 hover:bg-taras-50 transition-all text-left group"
                >
                  <div className="p-3 rounded-lg bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-taras-900 text-sm">Print / Export PDF Report</h4>
                    <p className="text-taras-500 text-[11px]">Formatted institutional directory document ready for printing</p>
                  </div>
                </button>
              </div>
            </>
          )}

          <div className="pt-3 border-t border-taras-200 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-taras-100 hover:bg-taras-200 text-taras-800 font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
