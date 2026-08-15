import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { StudentFilters } from '../components/students/StudentFilters';
import { StudentTable } from '../components/students/StudentTable';
import { StudentCardList } from '../components/students/StudentCardList';
import { StudentProfileDrawer } from '../components/students/StudentProfileDrawer';
import { StudentFormModal } from '../components/students/StudentFormModal';
import { DeactivateModal } from '../components/students/DeactivateModal';
import { ExcelImportModal } from '../components/students/ExcelImportModal';
import { ExportModal } from '../components/reports/ExportModal';
import { useStudents } from '../context/StudentContext';
import { Student } from '../types/student';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Students: React.FC = () => {
  const {
    paginatedStudents,
    filters,
    sortOptions,
    currentPage,
    isLoading,
    error,
    setFilters,
    setSortOptions,
    setCurrentPage,
    refreshData,
    addStudent,
    updateStudent,
    deactivateStudent,
    previewImport,
    confirmImport,
  } = useStudents();

  const students = paginatedStudents.data;
  const { total, totalPages, pageSize } = paginatedStudents;

  // Modal & Drawer State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [studentToDeactivate, setStudentToDeactivate] = useState<Student | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleOpenAddModal = () => { setStudentToEdit(null); setIsFormModalOpen(true); };
  const handleOpenEditModal = (student: Student) => { setStudentToEdit(student); setIsFormModalOpen(true); };
  const handleOpenDeactivateModal = (student: Student) => { setStudentToDeactivate(student); setIsDeactivateModalOpen(true); };

  const handleSaveStudentForm = async (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'department' | 'mustChangePassword'>) => {
    if (studentToEdit) {
      return await updateStudent(studentToEdit.id, data);
    }
    return await addStudent(data);
  };

  const handleConfirmDeactivate = async (id: string) => deactivateStudent(id);

  const startNum = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endNum = Math.min(currentPage * pageSize, total);

  return (
    <Layout title="Student Directory" subtitle="ECE Department — TARAS Student Monitoring">
      {/* Filters */}
      <StudentFilters
        filters={filters}
        sortOptions={sortOptions}
        onFilterChange={setFilters}
        onSortChange={setSortOptions}
        onOpenAddModal={handleOpenAddModal}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center justify-between text-sm">
          <span>⚠ {error}</span>
          <button onClick={refreshData} className="px-3 py-1 rounded bg-rose-700 text-white text-xs font-semibold">Retry</button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error ? (
        <div className="bg-white p-12 rounded-xl border border-taras-200 text-center text-taras-500 font-medium">
          <div className="inline-block w-5 h-5 border-2 border-taras-300 border-t-taras-900 rounded-full animate-spin mb-2"></div>
          <p>Loading students...</p>
        </div>
      ) : !error && (
        <>
          {/* Result Count */}
          <div className="flex items-center justify-between text-xs text-taras-500 px-1">
            <span>
              {total === 0
                ? 'No students found'
                : `Showing ${startNum}–${endNum} of ${total} student${total !== 1 ? 's' : ''}`}
            </span>
            <span className="font-semibold text-taras-800">ECE Department</span>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block">
            <StudentTable
              students={students}
              onSelectStudent={setSelectedStudent}
              onEditStudent={handleOpenEditModal}
              onDeactivateStudent={handleOpenDeactivateModal}
            />
          </div>

          {/* Mobile Cards */}
          <StudentCardList
            students={students}
            onSelectStudent={setSelectedStudent}
            onEditStudent={handleOpenEditModal}
            onDeactivateStudent={handleOpenDeactivateModal}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-taras-200 text-xs font-semibold text-taras-700 hover:bg-taras-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs text-taras-600 font-medium">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-taras-200 text-xs font-semibold text-taras-700 hover:bg-taras-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Side Profile Drawer */}
      <StudentProfileDrawer
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onEditStudent={handleOpenEditModal}
        onDeactivateStudent={handleOpenDeactivateModal}
      />

      {/* Add/Edit Modal */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        studentToEdit={studentToEdit}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveStudentForm}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onPreview={previewImport}
        onConfirmImport={confirmImport}
      />

      {/* Deactivate Modal */}
      <DeactivateModal
        isOpen={isDeactivateModalOpen}
        student={studentToDeactivate}
        onClose={() => setIsDeactivateModalOpen(false)}
        onConfirmDeactivate={handleConfirmDeactivate}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </Layout>
  );
};
