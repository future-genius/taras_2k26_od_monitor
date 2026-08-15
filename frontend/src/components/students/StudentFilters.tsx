import React from 'react';
import { Search, Filter, Plus, ArrowUpDown, X, Download, Upload } from 'lucide-react';
import { AcademicYear, Section, StudentStatus, StudentFilterParams, StudentSortOptions, StudentSortField } from '../../types/student';
import { useAuth } from '../../context/AuthContext';

interface StudentFiltersProps {
  filters: StudentFilterParams;
  sortOptions: StudentSortOptions;
  onFilterChange: (filters: StudentFilterParams) => void;
  onSortChange: (sort: StudentSortOptions) => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
}

export const StudentFilters: React.FC<StudentFiltersProps> = ({
  filters,
  sortOptions,
  onFilterChange,
  onSortChange,
  onOpenAddModal,
  onOpenImportModal,
  onOpenExportModal,
}) => {
  const { isPresident } = useAuth();

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    filters.year !== 'ALL' ||
    filters.section !== 'ALL' ||
    filters.status !== 'ALL';

  return (
    <div className="bg-white p-4 rounded-xl border border-taras-200 shadow-sm space-y-4">
      {/* Top Row: Search + Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-taras-400" />
          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={e => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search by name, reg. no., role, section..."
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-taras-200 bg-taras-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taras-800 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-taras-400 hover:text-taras-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {isPresident && (
            <>
              <button
                onClick={onOpenImportModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>Import Students</span>
              </button>
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-taras-900 hover:bg-taras-800 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Student</span>
              </button>
            </>
          )}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-taras-100 hover:bg-taras-200 text-taras-800 text-xs font-medium transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden xs:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-taras-100 text-xs">
        <div className="flex items-center gap-1 text-taras-500 font-medium mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* ECE Department badge (static) */}
        <span className="px-2.5 py-1.5 rounded-md border border-taras-200 bg-taras-900 text-white font-bold text-[11px]">
          ECE
        </span>

        {/* Year */}
        <select
          value={filters.year || 'ALL'}
          onChange={e => onFilterChange({ ...filters, year: e.target.value as AcademicYear | 'ALL' })}
          className="px-2.5 py-1.5 rounded-md border border-taras-200 bg-white text-taras-800 font-medium focus:outline-none focus:ring-1 focus:ring-taras-700"
        >
          <option value="ALL">All Years</option>
          <option value="I">I Year</option>
          <option value="II">II Year</option>
          <option value="III">III Year</option>
          <option value="IV">IV Year</option>
        </select>

        {/* Section (strictly 1, 2, 3) */}
        <select
          value={filters.section || 'ALL'}
          onChange={e => onFilterChange({ ...filters, section: e.target.value as Section | 'ALL' })}
          className="px-2.5 py-1.5 rounded-md border border-taras-200 bg-white text-taras-800 font-bold focus:outline-none focus:ring-1 focus:ring-taras-700"
        >
          <option value="ALL">All Sections</option>
          <option value="1">Section 1</option>
          <option value="2">Section 2</option>
          <option value="3">Section 3</option>
        </select>

        {/* Status */}
        <select
          value={filters.status || 'ALL'}
          onChange={e => onFilterChange({ ...filters, status: e.target.value as StudentStatus | 'ALL' })}
          className="px-2.5 py-1.5 rounded-md border border-taras-200 bg-white text-taras-800 font-medium focus:outline-none focus:ring-1 focus:ring-taras-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Graduated">Graduated</option>
          <option value="Transferred">Transferred</option>
        </select>

        {/* Sort */}
        <div className="flex items-center gap-1 ml-auto border-l border-taras-200 pl-2">
          <span className="text-taras-500 hidden sm:inline">Sort:</span>
          <select
            value={sortOptions.field}
            onChange={e => onSortChange({ ...sortOptions, field: e.target.value as StudentSortField })}
            className="px-2 py-1.5 rounded-md border border-taras-200 bg-white text-taras-800 font-medium focus:outline-none"
          >
            <option value="registerNumber">Register No</option>
            <option value="name">Name</option>
            <option value="role">Role</option>
            <option value="year">Year</option>
            <option value="section">Section</option>
          </select>
          <button
            onClick={() => onSortChange({ ...sortOptions, order: sortOptions.order === 'asc' ? 'desc' : 'asc' })}
            className="p-1.5 rounded-md border border-taras-200 bg-white hover:bg-taras-50 text-taras-700"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => onFilterChange({ searchQuery: '', year: 'ALL', section: 'ALL', status: 'ALL' })}
            className="text-xs text-rose-600 font-semibold underline"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
