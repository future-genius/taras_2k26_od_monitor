import {
  Student,
  StudentFilterParams,
  StudentSortOptions,
  PaginatedStudents,
  ImportRow,
  ImportPreview,
  formatDOBToPassword,
  normalizeDOB,
  validateDOB,
  normalizeSection,
  isValidSection,
} from '../types/student';
import { UserRole, PrivacySettings } from '../types/user';
import { DailyODRecord, DailySummary, StudentODHistoryItem, TarasEventItem } from '../types/od';
import { AuditLogEntry } from '../types/audit';

// ============================================================
// Storage Keys
// ============================================================
const KEYS = {
  STUDENTS: 'taras_v2_students',
  DAILY_OD: 'taras_v2_daily_od',
  MANAGED_EVENTS: 'taras_v2_managed_events',
  AUDIT: 'taras_v2_audit_logs',
  PRIVACY: 'taras_v2_privacy',
  AUTH_ACCOUNTS: 'taras_v2_auth_accounts',
};

const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
};

interface AuthAccount {
  username: string; // register number
  passwordHash: string;
  mustChangePassword: boolean;
  studentId: string;
}

class TarasApiService {
  private students: Student[];
  private dailyODRecords: DailyODRecord[];
  private managedEvents: TarasEventItem[];
  private auditLogs: AuditLogEntry[];
  private privacySettings: PrivacySettings;
  private authAccounts: AuthAccount[];

  constructor() {
    this.students = this.load(KEYS.STUDENTS, []);
    this.dailyODRecords = this.load(KEYS.DAILY_OD, []);
    this.managedEvents = this.load(KEYS.MANAGED_EVENTS, []);
    this.auditLogs = this.load(KEYS.AUDIT, []);
    this.authAccounts = this.load(KEYS.AUTH_ACCOUNTS, []);
    this.privacySettings = this.load(KEYS.PRIVACY, {
      allowStaffViewPhone: false,
      allowStaffViewEmail: false,
      allowStudentExport: false,
    });
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  private save(key: string, data: unknown) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ============================================================
  // AUTH
  // ============================================================
  public verifyLogin(username: string, password: string): AuthAccount | null {
    const acc = this.authAccounts.find(a => a.username.toLowerCase() === username.toLowerCase());
    if (!acc) return null;
    if (acc.passwordHash !== simpleHash(password)) return null;
    return acc;
  }

  public changePassword(username: string, newPassword: string): boolean {
    const idx = this.authAccounts.findIndex(a => a.username.toLowerCase() === username.toLowerCase());
    if (idx === -1) return false;
    this.authAccounts[idx].passwordHash = simpleHash(newPassword);
    this.authAccounts[idx].mustChangePassword = false;
    this.save(KEYS.AUTH_ACCOUNTS, this.authAccounts);
    const student = this.students.find(s => s.registerNumber.toLowerCase() === username.toLowerCase());
    if (student) {
      student.mustChangePassword = false;
      this.save(KEYS.STUDENTS, this.students);
    }
    return true;
  }

  private createAuthAccount(registerNumber: string, dob: string, studentId: string) {
    const initialPassword = formatDOBToPassword(dob);
    const existing = this.authAccounts.findIndex(
      a => a.username.toLowerCase() === registerNumber.toLowerCase()
    );
    const account: AuthAccount = {
      username: registerNumber,
      passwordHash: simpleHash(initialPassword),
      mustChangePassword: true,
      studentId,
    };
    if (existing >= 0) {
      this.authAccounts[existing] = account;
    } else {
      this.authAccounts.push(account);
    }
    this.save(KEYS.AUTH_ACCOUNTS, this.authAccounts);
  }

  // ============================================================
  // PRIVACY & AUDIT
  // ============================================================
  public getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }

  public updatePrivacySettings(settings: Partial<PrivacySettings>, role: UserRole): PrivacySettings {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    this.privacySettings = { ...this.privacySettings, ...settings };
    this.save(KEYS.PRIVACY, this.privacySettings);
    return this.privacySettings;
  }

  public getAuditLogs(role: UserRole): AuditLogEntry[] {
    if (role !== 'PRESIDENT') return [];
    return [...this.auditLogs];
  }

  private audit(userName: string, role: UserRole, action: string, regNo: string, studentName?: string, details?: string) {
    const now = new Date();
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      user: userName,
      userRole: role,
      action,
      studentRegNo: regNo,
      studentName,
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      details,
    };
    this.auditLogs.unshift(entry);
    this.save(KEYS.AUDIT, this.auditLogs);
  }

  // ============================================================
  // STUDENTS (ECE Only, Sections 1, 2, 3)
  // ============================================================
  public getStudents(
    filters?: StudentFilterParams,
    sortOptions?: StudentSortOptions,
    page = 1,
    pageSize = 25
  ): PaginatedStudents {
    let result = [...this.students];

    if (filters) {
      const q = filters.searchQuery?.toLowerCase().trim();
      if (q) {
        result = result.filter(
          s =>
            s.name.toLowerCase().includes(q) ||
            s.registerNumber.toLowerCase().includes(q) ||
            s.section.toLowerCase().includes(q) ||
            (s.role && s.role.toLowerCase().includes(q))
        );
      }
      if (filters.year && filters.year !== 'ALL') {
        result = result.filter(s => s.year === filters.year);
      }
      if (filters.section && filters.section !== 'ALL') {
        result = result.filter(s => s.section === filters.section);
      }
      if (filters.role && filters.role !== 'ALL') {
        result = result.filter(s => s.role.toLowerCase() === filters.role?.toLowerCase());
      }
      if (filters.status && filters.status !== 'ALL') {
        result = result.filter(s => s.status === filters.status);
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
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const data = result.slice(start, start + pageSize);

    return { data, total, page: safePage, pageSize, totalPages };
  }

  public getAllStudents(): Student[] {
    return [...this.students];
  }

  public getStudentById(id: string): Student | undefined {
    return this.students.find(s => s.id === id || s.registerNumber.toLowerCase() === id.toLowerCase());
  }

  public getStudentStats() {
    const total = this.students.length;
    const active = this.students.filter(s => s.status === 'Active').length;
    const inactive = this.students.filter(s => s.status === 'Inactive').length;
    const graduated = this.students.filter(s => s.status === 'Graduated').length;
    const transferred = this.students.filter(s => s.status === 'Transferred').length;

    // Breakdown by section (1, 2, 3)
    const section1 = this.students.filter(s => s.section === '1').length;
    const section2 = this.students.filter(s => s.section === '2').length;
    const section3 = this.students.filter(s => s.section === '3').length;

    // Breakdown by academic year (I, II, III, IV)
    const yearI = this.students.filter(s => s.year === 'I').length;
    const yearII = this.students.filter(s => s.year === 'II').length;
    const yearIII = this.students.filter(s => s.year === 'III').length;
    const yearIV = this.students.filter(s => s.year === 'IV').length;

    return {
      totalStudents: total,
      activeStudents: active,
      inactiveStudents: inactive,
      graduatedStudents: graduated,
      transferredStudents: transferred,
      departmentCount: 1,
      sectionDistribution: [
        { section: 'Section 1', count: section1 },
        { section: 'Section 2', count: section2 },
        { section: 'Section 3', count: section3 },
      ],
      yearDistribution: [
        { year: 'Year I', count: yearI },
        { year: 'Year II', count: yearII },
        { year: 'Year III', count: yearIII },
        { year: 'Year IV', count: yearIV },
      ],
    };
  }

  public addStudent(
    data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'department' | 'mustChangePassword'>,
    presidentName: string,
    role: UserRole
  ): Student {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized: Only the President can add students.');
    const existing = this.students.find(s => s.registerNumber.toLowerCase() === data.registerNumber.toLowerCase());
    if (existing) throw new Error(`A student with Register Number "${data.registerNumber}" already exists.`);

    if (!validateDOB(data.dateOfBirth)) {
      throw new Error('Invalid Date of Birth. Use DD-MM-YYYY format (e.g. 12-05-2005).');
    }

    const now = new Date().toISOString().split('T')[0];
    const newStudent: Student = {
      ...data,
      id: `std-${Date.now()}`,
      department: 'ECE',
      section: normalizeSection(data.section),
      role: data.role?.trim() || 'Student',
      dateOfBirth: normalizeDOB(data.dateOfBirth),
      mustChangePassword: true,
      createdAt: now,
      updatedAt: now,
    };

    this.students.push(newStudent);
    this.save(KEYS.STUDENTS, this.students);
    this.createAuthAccount(newStudent.registerNumber, newStudent.dateOfBirth, newStudent.id);
    this.audit(presidentName, role, 'Added Student', newStudent.registerNumber, newStudent.name, `Role: ${newStudent.role}, Year ${newStudent.year}, Section ${newStudent.section}`);
    return newStudent;
  }

  public previewImport(
    rows: Array<{ name: string; registerNumber: string; section: string; year: string; role: string; dateOfBirth: string }>,
    role: UserRole
  ): ImportPreview {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');

    const existingRegNos = new Set(this.students.map(s => s.registerNumber.toLowerCase()));
    const seenInFile = new Set<string>();
    const importRows: ImportRow[] = rows.map((row, i) => {
      const errors: string[] = [];
      const regNo = (row.registerNumber || '').trim();
      const name = (row.name || '').trim();
      const rawSection = (row.section || '').trim();
      const year = (row.year || '').trim();
      const studentRole = (row.role || 'Student').trim();
      const dob = (row.dateOfBirth || '').trim();

      if (!name) errors.push('Name is required');
      if (!regNo) errors.push('Register Number is required');
      if (!rawSection || !isValidSection(rawSection)) {
        errors.push('Section must be 1, 2, or 3');
      }
      if (!year || !['I', 'II', 'III', 'IV'].includes(year)) errors.push('Year must be I, II, III, or IV');
      if (!dob) errors.push('Date of Birth is required');
      else if (!validateDOB(dob)) errors.push('Invalid DOB — use DD-MM-YYYY');

      const isDuplicate = existingRegNos.has(regNo.toLowerCase()) || seenInFile.has(regNo.toLowerCase());
      if (isDuplicate && regNo) errors.push('Duplicate Register Number');
      if (regNo) seenInFile.add(regNo.toLowerCase());

      return {
        name,
        registerNumber: regNo,
        section: isValidSection(rawSection) ? normalizeSection(rawSection) : rawSection,
        year,
        role: studentRole || 'Student',
        dateOfBirth: dob,
        rowIndex: i + 2,
        isValid: errors.length === 0 && !isDuplicate,
        isDuplicate,
        errors,
      };
    });

    const valid = importRows.filter(r => r.isValid).length;
    const duplicates = importRows.filter(r => r.isDuplicate).length;
    const invalid = importRows.filter(r => !r.isValid && !r.isDuplicate).length;

    return { rows: importRows, total: rows.length, valid, duplicates, invalid };
  }

  public confirmImport(preview: ImportPreview, presidentName: string, role: UserRole): { added: number; failed: number } {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    const validRows = preview.rows.filter(r => r.isValid);
    let added = 0;
    let failed = 0;
    const now = new Date().toISOString().split('T')[0];

    validRows.forEach(row => {
      try {
        const existing = this.students.find(s => s.registerNumber.toLowerCase() === row.registerNumber.toLowerCase());
        if (existing) { failed++; return; }

        const student: Student = {
          id: `std-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          registerNumber: row.registerNumber,
          name: row.name,
          department: 'ECE',
          year: row.year as any,
          section: normalizeSection(row.section),
          role: row.role || 'Student',
          dateOfBirth: normalizeDOB(row.dateOfBirth),
          status: 'Active',
          mustChangePassword: true,
          createdAt: now,
          updatedAt: now,
        };
        this.students.push(student);
        this.createAuthAccount(student.registerNumber, student.dateOfBirth, student.id);
        added++;
      } catch {
        failed++;
      }
    });

    this.save(KEYS.STUDENTS, this.students);
    this.audit(presidentName, role, 'Bulk Import', 'MULTIPLE', undefined, `Imported ${added} ECE students`);
    return { added, failed };
  }

  public updateStudent(id: string, updates: Partial<Student>, presidentName: string, role: UserRole): Student {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    const idx = this.students.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Student not found.');
    const updated = {
      ...this.students[idx],
      ...updates,
      section: updates.section ? normalizeSection(updates.section) : this.students[idx].section,
      role: updates.role !== undefined ? updates.role : this.students[idx].role,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    this.students[idx] = updated;
    this.save(KEYS.STUDENTS, this.students);
    this.audit(presidentName, role, 'Updated Student', updated.registerNumber, updated.name);
    return updated;
  }

  public deactivateStudent(id: string, presidentName: string, role: UserRole): Student {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    const idx = this.students.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Student not found.');
    this.students[idx] = { ...this.students[idx], status: 'Inactive', updatedAt: new Date().toISOString().split('T')[0] };
    this.save(KEYS.STUDENTS, this.students);
    this.audit(presidentName, role, 'Status Changed', this.students[idx].registerNumber, this.students[idx].name, 'Deactivated');
    return this.students[idx];
  }

  // ============================================================
  // EVENT MANAGEMENT (President only for Add/Edit/Delete)
  // ============================================================
  public getManagedEvents(): TarasEventItem[] {
    return [...this.managedEvents];
  }

  public addManagedEvent(
    data: Omit<TarasEventItem, 'id' | 'createdAt' | 'updatedAt'>,
    presidentName: string,
    role: UserRole
  ): TarasEventItem {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized: Only the President can create events.');

    const name = data.name.trim();
    if (!name) throw new Error('Event name is required.');

    const existing = this.managedEvents.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (existing) throw new Error(`An event or work named "${name}" already exists.`);

    const now = new Date().toISOString();
    const newEvent: TarasEventItem = {
      ...data,
      name,
      id: `evt-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    this.managedEvents.push(newEvent);
    this.save(KEYS.MANAGED_EVENTS, this.managedEvents);
    this.audit(presidentName, role, 'Added Event/Work', 'EVENT', undefined, `Event: ${newEvent.name}`);
    return newEvent;
  }

  public updateManagedEvent(
    id: string,
    updates: Partial<TarasEventItem>,
    presidentName: string,
    role: UserRole
  ): TarasEventItem {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized: Only the President can edit events.');

    const idx = this.managedEvents.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Event not found.');

    const now = new Date().toISOString();
    const updated = {
      ...this.managedEvents[idx],
      ...updates,
      updatedAt: now,
    };

    this.managedEvents[idx] = updated;
    this.save(KEYS.MANAGED_EVENTS, this.managedEvents);
    this.audit(presidentName, role, 'Updated Event/Work', 'EVENT', undefined, `Event: ${updated.name}`);
    return updated;
  }

  public deleteManagedEvent(id: string, presidentName: string, role: UserRole): boolean {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized: Only the President can delete events.');

    const event = this.managedEvents.find(e => e.id === id);
    if (!event) return false;

    this.managedEvents = this.managedEvents.filter(e => e.id !== id);
    this.save(KEYS.MANAGED_EVENTS, this.managedEvents);
    this.audit(presidentName, role, 'Deleted Event/Work', 'EVENT', undefined, `Event: ${event.name}`);
    return true;
  }

  // ============================================================
  // DAILY OD MONITORING (Core Daily Workflow)
  // ============================================================
  public getDailyODRecords(date: string, workName: string): DailyODRecord[] {
    return this.dailyODRecords.filter(
      r => r.date === date && r.workName.toLowerCase() === workName.toLowerCase()
    );
  }

  public saveDailyODRecords(
    date: string,
    workName: string,
    records: Array<{ studentId: string; status: 'OD' | 'Absent'; remarks?: string }>,
    presidentName: string,
    role: UserRole
  ): DailyODRecord[] {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized: Only President can mark Daily OD.');

    const now = new Date().toISOString();
    const updatedDateWorkRecords: DailyODRecord[] = [];

    this.dailyODRecords = this.dailyODRecords.filter(
      r => !(r.date === date && r.workName.toLowerCase() === workName.toLowerCase())
    );

    records.forEach(item => {
      const student = this.students.find(s => s.id === item.studentId);
      if (!student) return;

      const record: DailyODRecord = {
        id: `od-${date}-${workName.replace(/\s+/g, '-')}-${student.registerNumber}`,
        studentId: student.id,
        studentName: student.name,
        registerNumber: student.registerNumber,
        section: student.section,
        year: student.year,
        role: student.role || 'Student',
        department: 'ECE',
        date,
        workName,
        status: item.status,
        markedBy: presidentName,
        markedAt: now,
        remarks: item.remarks || '',
      };

      this.dailyODRecords.push(record);
      updatedDateWorkRecords.push(record);
    });

    this.save(KEYS.DAILY_OD, this.dailyODRecords);

    const odCount = updatedDateWorkRecords.filter(r => r.status === 'OD').length;
    const absentCount = updatedDateWorkRecords.filter(r => r.status === 'Absent').length;
    this.audit(
      presidentName,
      role,
      'Saved Daily OD',
      'DAILY_OD',
      undefined,
      `Date: ${date}, Work: ${workName}, OD: ${odCount}, Absent: ${absentCount}`
    );

    return updatedDateWorkRecords;
  }

  public getAllDailySummaries(): DailySummary[] {
    const map = new Map<string, DailySummary>();

    this.dailyODRecords.forEach(r => {
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
  }

  public getEventParticipationSummary(): Array<{ eventName: string; totalOD: number; totalAbsent: number; totalCount: number }> {
    const map = new Map<string, { totalOD: number; totalAbsent: number; totalCount: number }>();

    this.dailyODRecords.forEach(r => {
      if (!map.has(r.workName)) {
        map.set(r.workName, { totalOD: 0, totalAbsent: 0, totalCount: 0 });
      }
      const item = map.get(r.workName)!;
      item.totalCount++;
      if (r.status === 'OD') item.totalOD++;
      if (r.status === 'Absent') item.totalAbsent++;
    });

    return Array.from(map.entries()).map(([eventName, stats]) => ({
      eventName,
      ...stats,
    }));
  }

  public getStudentODHistory(studentIdOrRegNo: string): StudentODHistoryItem[] {
    const student = this.students.find(
      s => s.id === studentIdOrRegNo || s.registerNumber.toLowerCase() === studentIdOrRegNo.toLowerCase()
    );
    if (!student) return [];

    return this.dailyODRecords
      .filter(r => r.studentId === student.id || r.registerNumber.toLowerCase() === student.registerNumber.toLowerCase())
      .map(r => ({
        id: r.id,
        date: r.date,
        workName: r.workName,
        status: r.status,
        remarks: r.remarks,
      }))
      .sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  public getTodayODStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = this.dailyODRecords.filter(r => r.date === today);
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
  }
}

export const apiService = new TarasApiService();
