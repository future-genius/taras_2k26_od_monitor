import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Student, StudentFilterParams, StudentSortOptions, PaginatedStudents, ImportPreview } from '../types/student';
import { DailyODRecord, DailySummary, StudentODHistoryItem, TarasEventItem } from '../types/od';
import { AuditLogEntry } from '../types/audit';
import { PrivacySettings } from '../types/user';
import { apiService } from '../services/api';
import { supabaseApi } from '../services/supabaseApi';
import { supabase, isSupabaseConfigured } from '../services/supabase';
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

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allDailyRecords, setAllDailyRecords] = useState<DailyODRecord[]>([]);
  const [managedEvents, setManagedEvents] = useState<TarasEventItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(supabaseApi.getPrivacySettings());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to allStudents for saveDailyOD mapping
  const allStudentsRef = useRef<Student[]>([]);
  allStudentsRef.current = allStudents;

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
    const timer = setTimeout(() => setDebouncedFilters(filters), 250);
    return () => clearTimeout(timer);
  }, [filters]);

  const setFilters = (f: StudentFilterParams) => {
    setFiltersState(f);
    setCurrentPage(1);
  };

  // ── Central Real-Time Data Loader (Supabase Cloud + Local fallback) ──
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      if (isSupabaseConfigured && supabase) {
        // Attempt cloud fetch from Supabase
        const [students, events, odRecords, audits] = await Promise.all([
          supabaseApi.getAllStudentsAsync(),
          supabaseApi.getAllEventsAsync(),
          supabaseApi.getAllDailyRecordsAsync(),
          supabaseApi.getAuditLogsAsync(role),
        ]);

        setAllStudents(students);
        setManagedEvents(events);
        setAllDailyRecords(odRecords);
        setAuditLogs(audits);
      } else {
        // LocalStorage fallback
        setAllStudents(apiService.getAllStudents());
        setManagedEvents(apiService.getManagedEvents());
        setAllDailyRecords(apiService.getAllDailyRecords());
        setAuditLogs(apiService.getAuditLogs(role));
      }
      setPrivacySettings(supabaseApi.getPrivacySettings());
    } catch (err: any) {
      console.warn('Supabase fetch notice, using local fallback:', err.message);
      // Seamless fallback to local storage
      setAllStudents(apiService.getAllStudents());
      setManagedEvents(apiService.getManagedEvents());
      setAllDailyRecords(apiService.getAllDailyRecords());
      setAuditLogs(apiService.getAuditLogs(role));
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [role]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Realtime Multi-Device Sync: Supabase Realtime + Polling ──
  useEffect(() => {
    // 1. Supabase Realtime Subscription for instant cloud push
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('taras-cloud-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
          loadData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'taras_events' }, () => {
          loadData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_od_records' }, () => {
          loadData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
          loadData(true);
        })
        .subscribe();
    }

    // 2. High-Frequency Periodic Sync (Every 3.5s) to guarantee all mobile & PC devices sync instantly
    const syncInterval = setInterval(() => {
      loadData(true);
    }, 3500);

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      clearInterval(syncInterval);
    };
  }, [loadData]);

  // ── Computed Filtered & Paginated Students ──
  const paginatedStudents = React.useMemo<PaginatedStudents>(() => {
    let result = [...allStudents];

    if (debouncedFilters) {
      const q = debouncedFilters.searchQuery?.toLowerCase().trim();
      if (q) {
        result = result.filter(
          s =>
            s.name.toLowerCase().includes(q) ||
            s.registerNumber.toLowerCase().includes(q) ||
            s.section.toLowerCase().includes(q) ||
            (s.role && s.role.toLowerCase().includes(q))
        );
      }
      if (debouncedFilters.year && debouncedFilters.year !== 'ALL') {
        result = result.filter(s => s.year === debouncedFilters.year);
      }
      if (debouncedFilters.section && debouncedFilters.section !== 'ALL') {
        result = result.filter(s => s.section === debouncedFilters.section);
      }
      if (debouncedFilters.role && debouncedFilters.role !== 'ALL') {
        result = result.filter(s => s.role.toLowerCase() === debouncedFilters.role?.toLowerCase());
      }
      if (debouncedFilters.status && debouncedFilters.status !== 'ALL') {
        result = result.filter(s => s.status === debouncedFilters.status);
      }
    }

    if (sortOptions) {
      const { field, order } = sortOptions;
      result.sort((a, b) => {
        const valA = ((a as any)[field] || '').toLowerCase();
        const valB = ((b as any)[field] || '').toLowerCase();
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = result.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSize;
    const data = result.slice(start, start + pageSize);

    return { data, total, page: safePage, pageSize, totalPages };
  }, [allStudents, debouncedFilters, sortOptions, currentPage, pageSize]);

  // ── Computed Statistics ──
  const stats = React.useMemo(() => {
    return supabaseApi.getStudentStats(allStudents);
  }, [allStudents]);

  // ── Computed Daily Summaries ──
  const dailySummaries = React.useMemo<DailySummary[]>(() => {
    const map = new Map<string, DailySummary>();
    allDailyRecords.forEach(r => {
      const key = `${r.date}___${r.workName}`;
      if (!map.has(key)) {
        map.set(key, {
          date: r.date,
          workName: r.workName,
          totalStudents: 0,
          odCount: 0,
          absentCount: 0,
          records: [],
          updatedAt: r.markedAt || r.date,
        });
      }
      const summary = map.get(key)!;
      summary.records.push(r);
      summary.totalStudents++;
      if (r.status === 'OD') summary.odCount++;
      if (r.status === 'Absent') summary.absentCount++;
    });
    return Array.from(map.values()).sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [allDailyRecords]);

  // ── Computed Today OD Stats ──
  const todayODStats = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = allDailyRecords.filter(r => r.date === today);
    const odCount = todayRecords.filter(r => r.status === 'OD').length;
    const absentCount = todayRecords.filter(r => r.status === 'Absent').length;
    const uniqueWorks = Array.from(new Set(todayRecords.map(r => r.workName)));
    return {
      today,
      totalMarkedToday: todayRecords.length,
      odCount,
      absentCount,
      worksCount: uniqueWorks.length,
      works: uniqueWorks,
    };
  }, [allDailyRecords]);

  // ── Computed Event Participation Summary ──
  const eventParticipationSummary = React.useMemo(() => {
    return supabaseApi.getEventParticipationSummary(allDailyRecords);
  }, [allDailyRecords]);

  // ── Student Mutations ──
  const addStudent = async (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'department' | 'mustChangePassword'>): Promise<boolean> => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabaseApi.addStudentAsync(data, user?.name || 'President', role);
      } else {
        apiService.addStudent(data, user?.name || 'President', role);
      }
      showToast(`Student ${data.name} added successfully.`, 'success');
      await loadData(true);
      return true;
    } catch (err: any) {
      // If error, try local
      try {
        apiService.addStudent(data, user?.name || 'President', role);
        showToast(`Student ${data.name} saved locally.`, 'success');
        await loadData(true);
        return true;
      } catch (localErr: any) {
        showToast(err.message || localErr.message || 'Failed to add student.', 'error');
        return false;
      }
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>): Promise<boolean> => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabaseApi.updateStudentAsync(id, updates, user?.name || 'President', role);
      } else {
        apiService.updateStudent(id, updates, user?.name || 'President', role);
      }
      showToast('Student updated successfully.', 'success');
      await loadData(true);
      return true;
    } catch (err: any) {
      try {
        apiService.updateStudent(id, updates, user?.name || 'President', role);
        showToast('Student updated locally.', 'success');
        await loadData(true);
        return true;
      } catch (localErr: any) {
        showToast(err.message || 'Failed to update student.', 'error');
        return false;
      }
    }
  };

  const deactivateStudent = async (id: string): Promise<boolean> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const s = await supabaseApi.deactivateStudentAsync(id, user?.name || 'President', role);
        showToast(`${s.name} deactivated.`, 'success');
      } else {
        const s = apiService.deactivateStudent(id, user?.name || 'President', role);
        showToast(`${s.name} deactivated.`, 'success');
      }
      await loadData(true);
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
      const validRows = preview.rows.filter(r => r.isValid && !r.isDuplicate);
      if (isSupabaseConfigured && supabase) {
        const result = await supabaseApi.bulkImportStudentsAsync(validRows, user?.name || 'President', role);
        showToast(`Import complete: ${result.added} students added.`, 'success');
        await loadData(true);
        return { added: result.added, failed: result.failed };
      } else {
        const result = apiService.confirmImport(preview, user?.name || 'President', role);
        showToast(`Import complete: ${result.added} students added.`, 'success');
        await loadData(true);
        return result;
      }
    } catch (err: any) {
      const result = apiService.confirmImport(preview, user?.name || 'President', role);
      showToast(`Import saved locally: ${result.added} students added.`, 'success');
      await loadData(true);
      return result;
    }
  };

  // ── Event Management Mutations ──
  const addManagedEvent = async (data: Omit<TarasEventItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const created = await supabaseApi.addEventAsync(data, user?.name || 'President', role);
        showToast(`Event "${created.name}" created successfully.`, 'success');
      } else {
        const created = apiService.addManagedEvent(data, user?.name || 'President', role);
        showToast(`Event "${created.name}" created successfully.`, 'success');
      }
      await loadData(true);
      return true;
    } catch (err: any) {
      try {
        const created = apiService.addManagedEvent(data, user?.name || 'President', role);
        showToast(`Event "${created.name}" saved locally.`, 'success');
        await loadData(true);
        return true;
      } catch (localErr: any) {
        showToast(err.message || 'Failed to create event.', 'error');
        return false;
      }
    }
  };

  const updateManagedEvent = async (id: string, updates: Partial<TarasEventItem>): Promise<boolean> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const updated = await supabaseApi.updateEventAsync(id, updates, user?.name || 'President', role);
        showToast(`Event "${updated.name}" updated successfully.`, 'success');
      } else {
        const updated = apiService.updateManagedEvent(id, updates, user?.name || 'President', role);
        showToast(`Event "${updated.name}" updated successfully.`, 'success');
      }
      await loadData(true);
      return true;
    } catch (err: any) {
      try {
        const updated = apiService.updateManagedEvent(id, updates, user?.name || 'President', role);
        showToast(`Event "${updated.name}" updated locally.`, 'success');
        await loadData(true);
        return true;
      } catch (localErr: any) {
        showToast(err.message || 'Failed to update event.', 'error');
        return false;
      }
    }
  };

  const deleteManagedEvent = async (id: string): Promise<boolean> => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabaseApi.deleteEventAsync(id, user?.name || 'President', role);
      } else {
        apiService.deleteManagedEvent(id, user?.name || 'President', role);
      }
      showToast('Event deleted successfully.', 'success');
      await loadData(true);
      return true;
    } catch (err: any) {
      try {
        apiService.deleteManagedEvent(id, user?.name || 'President', role);
        showToast('Event deleted locally.', 'success');
        await loadData(true);
        return true;
      } catch (localErr: any) {
        showToast(err.message || 'Failed to delete event.', 'error');
        return false;
      }
    }
  };

  // ── Daily OD Synchronous Queries (Instant response from state) ──
  const getDailyODRecords = (date: string, workName: string): DailyODRecord[] => {
    return allDailyRecords.filter(
      r => r.date === date && r.workName.toLowerCase() === workName.toLowerCase()
    );
  };

  const saveDailyOD = async (
    date: string,
    workName: string,
    records: Array<{ studentId: string; status: 'OD' | 'Absent'; remarks?: string }>
  ): Promise<boolean> => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabaseApi.saveDailyODRecordsAsync(
          date,
          workName,
          records,
          allStudentsRef.current,
          user?.name || 'President',
          role
        );
      } else {
        apiService.saveDailyODRecords(date, workName, records, user?.name || 'President', role);
      }
      const odCount = records.filter(r => r.status === 'OD').length;
      showToast(`Saved OD records: ${odCount} marked OD.`, 'success');
      await loadData(true);
      return true;
    } catch (err: any) {
      try {
        apiService.saveDailyODRecords(date, workName, records, user?.name || 'President', role);
        const odCount = records.filter(r => r.status === 'OD').length;
        showToast(`Saved OD records locally: ${odCount} marked OD.`, 'success');
        await loadData(true);
        return true;
      } catch (localErr: any) {
        showToast(err.message || 'Failed to save OD records.', 'error');
        return false;
      }
    }
  };

  const getStudentODHistory = (studentIdOrRegNo: string): StudentODHistoryItem[] => {
    const student = allStudents.find(
      s => s.id === studentIdOrRegNo || s.registerNumber.toLowerCase() === studentIdOrRegNo.toLowerCase()
    );
    if (!student) return [];

    return allDailyRecords
      .filter(r => r.studentId === student.id || r.registerNumber.toLowerCase() === student.registerNumber.toLowerCase())
      .map(r => ({
        id: r.id,
        date: r.date,
        workName: r.workName,
        status: r.status,
        remarks: r.remarks,
      }))
      .sort((a, b) => (b.date > a.date ? 1 : -1));
  };

  const downloadDailyODExcel = (date: string, workName: string) => {
    const records = getDailyODRecords(date, workName);
    if (records.length === 0) {
      showToast('No OD records found for this date and work.', 'error');
      return;
    }
    exportDailyODExcel(date, workName, records);
    showToast('Daily OD Excel downloaded successfully.', 'success');
  };

  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    try {
      const updated = supabaseApi.updatePrivacySettings(settings, role);
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
      refreshData: () => loadData(false),
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
