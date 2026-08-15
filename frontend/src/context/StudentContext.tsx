import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student, StudentFilterParams, StudentSortOptions, PaginatedStudents, ImportPreview } from '../types/student';
import { DailyODRecord, DailySummary, StudentODHistoryItem, TarasEventItem } from '../types/od';
import { AuditLogEntry } from '../types/audit';
import { PrivacySettings } from '../types/user';
import { apiService } from '../services/api';
import { exportDailyODExcel } from '../utils/excelExport';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface StudentContextType {
  // Students Master List
  paginatedStudents: PaginatedStudents;
  allStudents: Student[];
  filters: StudentFilterParams;
  sortOptions: StudentSortOptions;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  stats: ReturnType<typeof apiService.getStudentStats>;

  // Daily OD Monitoring
  dailySummaries: DailySummary[];
  todayODStats: ReturnType<typeof apiService.getTodayODStats>;
  eventParticipationSummary: Array<{ eventName: string; totalOD: number; totalAbsent: number; totalCount: number }>;

  // Event Management (President Only for mutations)
  managedEvents: TarasEventItem[];

  // Sidebar collapse toggle
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Audit & Privacy
  auditLogs: AuditLogEntry[];
  privacySettings: PrivacySettings;

  // Actions
  setFilters: (f: StudentFilterParams) => void;
  setSortOptions: (s: StudentSortOptions) => void;
  setCurrentPage: (p: number) => void;
  refreshData: () => void;

  // Student Mutations
  addStudent: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'department' | 'mustChangePassword'>) => Promise<boolean>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<boolean>;
  deactivateStudent: (id: string) => Promise<boolean>;
  previewImport: (rows: Array<{ name: string; registerNumber: string; section: string; year: string; role: string; dateOfBirth: string }>) => ImportPreview;
  confirmImport: (preview: ImportPreview) => Promise<{ added: number; failed: number } | null>;

  // Event Management Actions
  addManagedEvent: (data: Omit<TarasEventItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateManagedEvent: (id: string, updates: Partial<TarasEventItem>) => Promise<boolean>;
  deleteManagedEvent: (id: string) => Promise<boolean>;

  // Daily OD Mutations
  getDailyODRecords: (date: string, workName: string) => DailyODRecord[];
  saveDailyOD: (date: string, workName: string, records: Array<{ studentId: string; status: 'OD' | 'Absent'; remarks?: string }>) => Promise<boolean>;
  getStudentODHistory: (studentIdOrRegNo: string) => StudentODHistoryItem[];
  downloadDailyODExcel: (date: string, workName: string) => void;

  // Privacy
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [filters, setFiltersState] = useState<StudentFilterParams>({
    searchQuery: '',
    year: 'ALL',
    section: 'ALL',
    role: 'ALL',
    status: 'ALL',
  });
  const [sortOptions, setSortOptions] = useState<StudentSortOptions>({ field: 'registerNumber', order: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const [paginatedStudents, setPaginatedStudents] = useState<PaginatedStudents>({
    data: [], total: 0, page: 1, pageSize, totalPages: 1,
  });
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState(apiService.getStudentStats());
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [todayODStats, setTodayODStats] = useState(apiService.getTodayODStats());
  const [eventParticipationSummary, setEventParticipationSummary] = useState<Array<{ eventName: string; totalOD: number; totalAbsent: number; totalCount: number }>>([]);
  const [managedEvents, setManagedEvents] = useState<TarasEventItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(apiService.getPrivacySettings());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebar toggle state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('taras_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('taras_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut (Ctrl+B or \ to toggle sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && (e.key === 'b' || e.key === 'B')) || e.key === '\\') {
        if (['input', 'textarea', 'select'].includes((e.target as HTMLElement).tagName.toLowerCase())) return;
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const setFilters = (f: StudentFilterParams) => {
    setFiltersState(f);
    setCurrentPage(1);
  };

  const loadData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const paginated = apiService.getStudents(debouncedFilters, sortOptions, currentPage, pageSize);
      setPaginatedStudents(paginated);
      setAllStudents(apiService.getAllStudents());
      setStats(apiService.getStudentStats());
      setDailySummaries(apiService.getAllDailySummaries());
      setTodayODStats(apiService.getTodayODStats());
      setEventParticipationSummary(apiService.getEventParticipationSummary());
      setManagedEvents(apiService.getManagedEvents());
      setAuditLogs(apiService.getAuditLogs(role));
      setPrivacySettings(apiService.getPrivacySettings());
    } catch (err: any) {
      setError(err.message || 'Unable to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters, sortOptions, currentPage, role]);

  useEffect(() => { loadData(); }, [loadData]);

  // Student Mutations
  const addStudent = async (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'department' | 'mustChangePassword'>): Promise<boolean> => {
    try {
      apiService.addStudent(data, user?.name || 'President', role);
      showToast(`Student ${data.name} added successfully.`, 'success');
      loadData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to add student.', 'error');
      return false;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>): Promise<boolean> => {
    try {
      apiService.updateStudent(id, updates, user?.name || 'President', role);
      showToast('Student updated successfully.', 'success');
      loadData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update student.', 'error');
      return false;
    }
  };

  const deactivateStudent = async (id: string): Promise<boolean> => {
    try {
      const s = apiService.deactivateStudent(id, user?.name || 'President', role);
      showToast(`${s.name} deactivated.`, 'success');
      loadData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate.', 'error');
      return false;
    }
  };

  const previewImport = (rows: Array<{ name: string; registerNumber: string; section: string; year: string; role: string; dateOfBirth: string }>) => {
    return apiService.previewImport(rows, role);
  };

  const confirmImport = async (preview: ImportPreview): Promise<{ added: number; failed: number } | null> => {
    try {
      const result = apiService.confirmImport(preview, user?.name || 'President', role);
      showToast(`Import complete: ${result.added} students added.`, 'success');
      loadData();
      return result;
    } catch (err: any) {
      showToast(err.message || 'Import failed.', 'error');
      return null;
    }
  };

  // Event Management Mutations
  const addManagedEvent = async (data: Omit<TarasEventItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const created = apiService.addManagedEvent(data, user?.name || 'President', role);
      showToast(`Event "${created.name}" created successfully.`, 'success');
      loadData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to create event.', 'error');
      return false;
    }
  };

  const updateManagedEvent = async (id: string, updates: Partial<TarasEventItem>): Promise<boolean> => {
    try {
      const updated = apiService.updateManagedEvent(id, updates, user?.name || 'President', role);
      showToast(`Event "${updated.name}" updated successfully.`, 'success');
      loadData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update event.', 'error');
      return false;
    }
  };

  const deleteManagedEvent = async (id: string): Promise<boolean> => {
    try {
      apiService.deleteManagedEvent(id, user?.name || 'President', role);
      showToast('Event deleted successfully.', 'success');
      loadData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to delete event.', 'error');
      return false;
    }
  };

  // Daily OD Mutations
  const getDailyODRecords = (date: string, workName: string): DailyODRecord[] => {
    return apiService.getDailyODRecords(date, workName);
  };

  const saveDailyOD = async (
    date: string,
    workName: string,
    records: Array<{ studentId: string; status: 'OD' | 'Absent'; remarks?: string }>
  ): Promise<boolean> => {
    try {
      apiService.saveDailyODRecords(date, workName, records, user?.name || 'President', role);
      const odCount = records.filter(r => r.status === 'OD').length;
      showToast(`Saved OD records: ${odCount} marked OD.`, 'success');
      loadData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to save OD records.', 'error');
      return false;
    }
  };

  const getStudentODHistory = (studentIdOrRegNo: string): StudentODHistoryItem[] => {
    return apiService.getStudentODHistory(studentIdOrRegNo);
  };

  const downloadDailyODExcel = (date: string, workName: string) => {
    const records = apiService.getDailyODRecords(date, workName);
    if (records.length === 0) {
      showToast('No OD records found for this date and work.', 'error');
      return;
    }
    exportDailyODExcel(date, workName, records);
    showToast('Daily OD Excel downloaded successfully.', 'success');
  };

  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    try {
      const updated = apiService.updatePrivacySettings(settings, role);
      setPrivacySettings(updated);
      showToast('Privacy settings updated.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings.', 'error');
    }
  };

  return (
    <StudentContext.Provider value={{
      paginatedStudents,
      allStudents,
      filters,
      sortOptions,
      currentPage,
      pageSize,
      isLoading,
      error,
      stats,
      dailySummaries,
      todayODStats,
      eventParticipationSummary,
      managedEvents,
      isSidebarCollapsed,
      toggleSidebar,
      auditLogs,
      privacySettings,
      setFilters,
      setSortOptions,
      setCurrentPage,
      refreshData: loadData,
      addStudent,
      updateStudent,
      deactivateStudent,
      previewImport,
      confirmImport,
      addManagedEvent,
      updateManagedEvent,
      deleteManagedEvent,
      getDailyODRecords,
      saveDailyOD,
      getStudentODHistory,
      downloadDailyODExcel,
      updatePrivacySettings,
    }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = () => {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudents must be used within StudentProvider');
  return ctx;
};
