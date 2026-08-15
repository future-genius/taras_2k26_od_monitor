/**
 * TARAS 2K26 — Supabase Cloud API Service
 * Replaces localStorage-based api.ts with real Supabase database calls.
 * All data is stored in Supabase and shared across all devices in real-time.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import {
  Student,
  StudentFilterParams,
  StudentSortOptions,
  PaginatedStudents,
  ImportPreview,
  formatDOBToPassword,
  normalizeDOB,
  validateDOB,
  normalizeSection,
} from '../types/student';
import { UserRole, PrivacySettings } from '../types/user';
import {
  DailyODRecord,
  DailySummary,
  StudentODHistoryItem,
  TarasEventItem,
} from '../types/od';
import { AuditLogEntry } from '../types/audit';

// ────────────────────────────────────────────────────────
// Simple hash (for student password matching, not security-critical)
// ────────────────────────────────────────────────────────
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
};

// ────────────────────────────────────────────────────────
// Row-level type mapping: DB row → App type
// ────────────────────────────────────────────────────────
function rowToStudent(row: any): Student {
  return {
    id: row.id,
    registerNumber: row.register_number,
    name: row.name,
    department: row.department ?? 'ECE',
    year: row.year,
    section: row.section,
    role: row.role ?? 'Student',
    dateOfBirth: row.date_of_birth,
    email: row.email ?? '',
    phone: row.phone ?? '',
    status: row.status ?? 'Active',
    mustChangePassword: row.must_change_password ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function studentToRow(s: Student) {
  return {
    id: s.id,
    register_number: s.registerNumber,
    name: s.name,
    department: s.department ?? 'ECE',
    year: s.year,
    section: s.section,
    role: s.role ?? 'Student',
    date_of_birth: s.dateOfBirth,
    email: s.email ?? '',
    phone: s.phone ?? '',
    status: s.status ?? 'Active',
    must_change_password: s.mustChangePassword ?? true,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

function rowToEvent(row: any): TarasEventItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? '',
    description: row.description ?? '',
    date: row.date ?? '',
    venue: row.venue ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToODRecord(row: any): DailyODRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    registerNumber: row.register_number,
    section: row.section,
    year: row.year,
    role: row.role ?? 'Student',
    department: row.department ?? 'ECE',
    date: row.date,
    workName: row.work_name,
    status: row.status,
    markedBy: row.marked_by,
    markedAt: row.marked_at,
    remarks: row.remarks ?? '',
  };
}

function rowToAuditLog(row: any): AuditLogEntry {
  return {
    id: row.id,
    user: row.user_name,
    userRole: row.user_role,
    action: row.action,
    studentRegNo: row.student_reg_no,
    studentName: row.student_name ?? '',
    details: row.details ?? '',
    date: row.date,
    time: row.time,
  };
}

// ────────────────────────────────────────────────────────
// LocalStorage fallback key (for auth accounts only)
// ────────────────────────────────────────────────────────
const AUTH_KEY = 'taras_v2_auth_accounts';
const PRIVACY_KEY = 'taras_v2_privacy';

interface AuthAccount {
  username: string;
  passwordHash: string;
  mustChangePassword: boolean;
  studentId: string;
}

// ────────────────────────────────────────────────────────
// Supabase API Service
// ────────────────────────────────────────────────────────
class SupabaseApiService {
  private get db() {
    return supabase;
  }

  private loadAuth(): AuthAccount[] {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveAuth(accounts: AuthAccount[]) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(accounts));
  }

  // ── Privacy Settings (kept in localStorage as it's device preference) ──
  public getPrivacySettings(): PrivacySettings {
    try {
      const raw = localStorage.getItem(PRIVACY_KEY);
      return raw ? JSON.parse(raw) : { allowStaffViewPhone: false, allowStaffViewEmail: false, allowStudentExport: false };
    } catch {
      return { allowStaffViewPhone: false, allowStaffViewEmail: false, allowStudentExport: false };
    }
  }

  public updatePrivacySettings(settings: Partial<PrivacySettings>, role: UserRole): PrivacySettings {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    const current = this.getPrivacySettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(PRIVACY_KEY, JSON.stringify(updated));
    return updated;
  }

  // ── AUTH ──
  public verifyLogin(username: string, password: string): AuthAccount | null {
    const accounts = this.loadAuth();
    const acc = accounts.find(a => a.username.toLowerCase() === username.toLowerCase());
    if (!acc) return null;
    if (acc.passwordHash !== simpleHash(password)) return null;
    return acc;
  }

  public changePassword(username: string, newPassword: string): boolean {
    const accounts = this.loadAuth();
    const idx = accounts.findIndex(a => a.username.toLowerCase() === username.toLowerCase());
    if (idx === -1) return false;
    accounts[idx].passwordHash = simpleHash(newPassword);
    accounts[idx].mustChangePassword = false;
    this.saveAuth(accounts);
    return true;
  }

  private ensureAuthAccount(registerNumber: string, dob: string, studentId: string) {
    const accounts = this.loadAuth();
    const initialPassword = formatDOBToPassword(dob);
    const existing = accounts.findIndex(a => a.username.toLowerCase() === registerNumber.toLowerCase());
    const account: AuthAccount = {
      username: registerNumber,
      passwordHash: simpleHash(initialPassword),
      mustChangePassword: true,
      studentId,
    };
    if (existing >= 0) {
      accounts[existing] = account;
    } else {
      accounts.push(account);
    }
    this.saveAuth(accounts);
  }

  // ── STUDENTS ──
  public async getAllStudentsAsync(): Promise<Student[]> {
    if (!this.db) return [];
    const { data, error } = await this.db
      .from('students')
      .select('*')
      .order('register_number', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToStudent);
  }

  public async getStudentByIdAsync(id: string): Promise<Student | undefined> {
    if (!this.db) return undefined;
    const { data, error } = await this.db
      .from('students')
      .select('*')
      .or(`id.eq.${id},register_number.ilike.${id}`)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToStudent(data) : undefined;
  }

  public async addStudentAsync(
    data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'department' | 'mustChangePassword'>,
    presidentName: string,
    role: UserRole
  ): Promise<Student> {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized: Only the President can add students.');
    if (!this.db) throw new Error('Supabase not configured.');
    if (!validateDOB(data.dateOfBirth)) throw new Error('Invalid Date of Birth. Use DD-MM-YYYY format.');

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

    const { error } = await this.db.from('students').insert(studentToRow(newStudent));
    if (error) throw new Error(error.message);

    this.ensureAuthAccount(newStudent.registerNumber, newStudent.dateOfBirth, newStudent.id);
    await this.auditAsync(presidentName, role, 'Added Student', newStudent.registerNumber, newStudent.name, `Role: ${newStudent.role}, Year ${newStudent.year}, Section ${newStudent.section}`);
    return newStudent;
  }

  public async updateStudentAsync(
    id: string,
    updates: Partial<Student>,
    presidentName: string,
    role: UserRole
  ): Promise<Student> {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    if (!this.db) throw new Error('Supabase not configured.');

    const now = new Date().toISOString().split('T')[0];
    const updateRow: any = { updated_at: now };
    if (updates.name !== undefined) updateRow.name = updates.name;
    if (updates.year !== undefined) updateRow.year = updates.year;
    if (updates.section !== undefined) updateRow.section = normalizeSection(updates.section);
    if (updates.role !== undefined) updateRow.role = updates.role;
    if (updates.email !== undefined) updateRow.email = updates.email;
    if (updates.phone !== undefined) updateRow.phone = updates.phone;
    if (updates.status !== undefined) updateRow.status = updates.status;
    if (updates.dateOfBirth !== undefined) {
      updateRow.date_of_birth = normalizeDOB(updates.dateOfBirth);
    }

    const { data, error } = await this.db
      .from('students')
      .update(updateRow)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    const updated = rowToStudent(data);
    await this.auditAsync(presidentName, role, 'Updated Student', updated.registerNumber, updated.name, `Updated fields`);
    return updated;
  }

  public async deactivateStudentAsync(
    id: string,
    presidentName: string,
    role: UserRole
  ): Promise<Student> {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    if (!this.db) throw new Error('Supabase not configured.');
    const { data, error } = await this.db
      .from('students')
      .update({ status: 'Inactive', updated_at: new Date().toISOString().split('T')[0] })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const s = rowToStudent(data);
    await this.auditAsync(presidentName, role, 'Deactivated Student', s.registerNumber, s.name);
    return s;
  }

  public async bulkImportStudentsAsync(
    rows: Array<{ name: string; registerNumber: string; section: string; year: string; role: string; dateOfBirth: string }>,
    presidentName: string,
    role: UserRole
  ): Promise<{ added: number; failed: number; errors: string[] }> {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    if (!this.db) throw new Error('Supabase not configured.');

    let added = 0;
    let failed = 0;
    const errors: string[] = [];

    // Get existing register numbers
    const { data: existing } = await this.db.from('students').select('register_number');
    const existingNums = new Set((existing ?? []).map((r: any) => r.register_number.toLowerCase()));

    const toInsert: any[] = [];
    const authToCreate: Array<{ reg: string; dob: string; id: string }> = [];

    for (const row of rows) {
      if (existingNums.has(row.registerNumber.toLowerCase())) {
        failed++;
        errors.push(`${row.registerNumber}: Already exists`);
        continue;
      }
      if (!validateDOB(row.dateOfBirth)) {
        failed++;
        errors.push(`${row.registerNumber}: Invalid DOB "${row.dateOfBirth}"`);
        continue;
      }
      const now = new Date().toISOString().split('T')[0];
      const id = `std-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const student: Student = {
        id,
        registerNumber: row.registerNumber,
        name: row.name,
        department: 'ECE',
        year: row.year as any,
        section: normalizeSection(row.section),
        role: row.role?.trim() || 'Student',
        dateOfBirth: normalizeDOB(row.dateOfBirth),
        email: '',
        phone: '',
        status: 'Active',
        mustChangePassword: true,
        createdAt: now,
        updatedAt: now,
      };
      toInsert.push(studentToRow(student));
      authToCreate.push({ reg: student.registerNumber, dob: student.dateOfBirth, id: student.id });
    }

    if (toInsert.length > 0) {
      const { error } = await this.db.from('students').insert(toInsert);
      if (error) {
        failed += toInsert.length;
        errors.push(`Batch insert error: ${error.message}`);
      } else {
        added = toInsert.length;
        authToCreate.forEach(a => this.ensureAuthAccount(a.reg, a.dob, a.id));
      }
    }

    if (added > 0) {
      await this.auditAsync(presidentName, role, 'Bulk Imported Students', 'BULK', undefined, `Added ${added} students, ${failed} skipped`);
    }

    return { added, failed, errors };
  }

  // ── EVENTS ──
  public async getAllEventsAsync(): Promise<TarasEventItem[]> {
    if (!this.db) return [];
    const { data, error } = await this.db
      .from('taras_events')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToEvent);
  }

  public async addEventAsync(
    eventData: Omit<TarasEventItem, 'id' | 'createdAt' | 'updatedAt'>,
    presidentName: string,
    role: UserRole
  ): Promise<TarasEventItem> {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    if (!this.db) throw new Error('Supabase not configured.');
    const now = new Date().toISOString();
    const row = {
      id: `evt-${Date.now()}`,
      name: eventData.name,
      category: eventData.category ?? '',
      description: eventData.description ?? '',
      date: eventData.date ?? '',
      venue: eventData.venue ?? '',
      created_at: now,
      updated_at: now,
    };
    const { data, error } = await this.db.from('taras_events').insert(row).select().single();
    if (error) throw new Error(error.message);
    await this.auditAsync(presidentName, role, 'Added Event', 'EVENT', undefined, `Event: ${eventData.name}`);
    return rowToEvent(data);
  }

  public async updateEventAsync(
    id: string,
    updates: Partial<TarasEventItem>,
    presidentName: string,
    role: UserRole
  ): Promise<TarasEventItem> {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    if (!this.db) throw new Error('Supabase not configured.');
    const row: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.date !== undefined) row.date = updates.date;
    if (updates.venue !== undefined) row.venue = updates.venue;
    const { data, error } = await this.db.from('taras_events').update(row).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    await this.auditAsync(presidentName, role, 'Updated Event', 'EVENT', undefined, `Event: ${data.name}`);
    return rowToEvent(data);
  }

  public async deleteEventAsync(
    id: string,
    presidentName: string,
    role: UserRole
  ): Promise<void> {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    if (!this.db) throw new Error('Supabase not configured.');
    const { error } = await this.db.from('taras_events').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await this.auditAsync(presidentName, role, 'Deleted Event', 'EVENT');
  }

  // ── DAILY OD RECORDS ──
  public async getAllDailyRecordsAsync(): Promise<DailyODRecord[]> {
    if (!this.db) return [];
    const { data, error } = await this.db
      .from('daily_od_records')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToODRecord);
  }

  public async getDailyODRecordsAsync(date: string, workName: string): Promise<DailyODRecord[]> {
    if (!this.db) return [];
    const { data, error } = await this.db
      .from('daily_od_records')
      .select('*')
      .eq('date', date)
      .ilike('work_name', workName);
    if (error) throw error;
    return (data ?? []).map(rowToODRecord);
  }

  public async saveDailyODRecordsAsync(
    date: string,
    workName: string,
    records: Array<{ studentId: string; status: 'OD' | 'Absent'; remarks?: string }>,
    students: Student[],
    presidentName: string,
    role: UserRole
  ): Promise<DailyODRecord[]> {
    if (role !== 'PRESIDENT') throw new Error('Unauthorized');
    if (!this.db) throw new Error('Supabase not configured.');

    // Delete existing records for this date+work first
    await this.db
      .from('daily_od_records')
      .delete()
      .eq('date', date)
      .ilike('work_name', workName);

    const now = new Date().toISOString();
    const rows = records
      .map(item => {
        const student = students.find(s => s.id === item.studentId);
        if (!student) return null;
        return {
          id: `od-${date}-${workName.replace(/\s+/g, '-')}-${student.registerNumber}`,
          student_id: student.id,
          student_name: student.name,
          register_number: student.registerNumber,
          section: student.section,
          year: student.year,
          role: student.role || 'Student',
          department: 'ECE',
          date,
          work_name: workName,
          status: item.status,
          marked_by: presidentName,
          marked_at: now,
          remarks: item.remarks || '',
        };
      })
      .filter(Boolean) as any[];

    if (rows.length === 0) return [];

    const { data, error } = await this.db.from('daily_od_records').insert(rows).select();
    if (error) throw new Error(error.message);

    const odCount = rows.filter(r => r.status === 'OD').length;
    const absentCount = rows.filter(r => r.status === 'Absent').length;
    await this.auditAsync(
      presidentName, role, 'Saved Daily OD', 'DAILY_OD', undefined,
      `Date: ${date}, Work: ${workName}, OD: ${odCount}, Absent: ${absentCount}`
    );

    return (data ?? []).map(rowToODRecord);
  }

  public async getAllDailySummariesAsync(): Promise<DailySummary[]> {
    if (!this.db) return [];
    const { data, error } = await this.db
      .from('daily_od_records')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;

    const map = new Map<string, DailySummary>();
    for (const row of data ?? []) {
      const r = rowToODRecord(row);
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
    }
    return Array.from(map.values()).sort((a, b) => b.date > a.date ? 1 : -1);
  }

  public async getStudentODHistoryAsync(studentIdOrRegNo: string): Promise<StudentODHistoryItem[]> {
    if (!this.db) return [];
    const { data, error } = await this.db
      .from('daily_od_records')
      .select('*')
      .or(`student_id.eq.${studentIdOrRegNo},register_number.ilike.${studentIdOrRegNo}`)
      .order('date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(row => ({
      id: row.id,
      date: row.date,
      workName: row.work_name,
      status: row.status,
      remarks: row.remarks,
    }));
  }

  public async getTodayODStatsAsync(): Promise<{
    today: string;
    totalMarkedToday: number;
    odCount: number;
    absentCount: number;
    worksCount: number;
    works: string[];
  }> {
    const today = new Date().toISOString().split('T')[0];
    if (!this.db) return { today, totalMarkedToday: 0, odCount: 0, absentCount: 0, worksCount: 0, works: [] };
    const { data } = await this.db.from('daily_od_records').select('*').eq('date', today);
    const records = (data ?? []).map(rowToODRecord);
    const odCount = records.filter(r => r.status === 'OD').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    const uniqueWorks = Array.from(new Set(records.map(r => r.workName)));
    return {
      today,
      totalMarkedToday: records.length,
      odCount,
      absentCount,
      worksCount: uniqueWorks.length,
      works: uniqueWorks,
    };
  }

  // ── AUDIT LOGS ──
  public async getAuditLogsAsync(role: UserRole): Promise<AuditLogEntry[]> {
    if (role !== 'PRESIDENT') return [];
    if (!this.db) return [];
    const { data, error } = await this.db
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return [];
    return (data ?? []).map(rowToAuditLog);
  }

  private async auditAsync(
    userName: string,
    role: UserRole,
    action: string,
    regNo: string,
    studentName?: string,
    details?: string
  ) {
    if (!this.db) return;
    const now = new Date();
    const entry = {
      id: `aud-${Date.now()}`,
      user_name: userName,
      user_role: role,
      action,
      student_reg_no: regNo,
      student_name: studentName ?? '',
      details: details ?? '',
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
    await this.db.from('audit_logs').insert(entry).then(() => {});
  }

  // ── STAT HELPERS ──
  public getStudentStats(students: Student[]) {
    const total = students.length;
    return {
      totalStudents: total,
      activeStudents: students.filter(s => s.status === 'Active').length,
      inactiveStudents: students.filter(s => s.status === 'Inactive').length,
      graduatedStudents: students.filter(s => s.status === 'Graduated').length,
      transferredStudents: students.filter(s => s.status === 'Transferred').length,
      departmentCount: 1,
      sectionDistribution: [
        { section: 'Section 1', count: students.filter(s => s.section === '1').length },
        { section: 'Section 2', count: students.filter(s => s.section === '2').length },
        { section: 'Section 3', count: students.filter(s => s.section === '3').length },
      ],
      yearDistribution: [
        { year: 'Year I', count: students.filter(s => s.year === 'I').length },
        { year: 'Year II', count: students.filter(s => s.year === 'II').length },
        { year: 'Year III', count: students.filter(s => s.year === 'III').length },
        { year: 'Year IV', count: students.filter(s => s.year === 'IV').length },
      ],
    };
  }

  public getEventParticipationSummary(
    records: DailyODRecord[]
  ): Array<{ eventName: string; totalOD: number; totalAbsent: number; totalCount: number }> {
    const map = new Map<string, { totalOD: number; totalAbsent: number; totalCount: number }>();
    records.forEach(r => {
      if (!map.has(r.workName)) map.set(r.workName, { totalOD: 0, totalAbsent: 0, totalCount: 0 });
      const item = map.get(r.workName)!;
      item.totalCount++;
      if (r.status === 'OD') item.totalOD++;
      if (r.status === 'Absent') item.totalAbsent++;
    });
    return Array.from(map.entries()).map(([eventName, stats]) => ({ eventName, ...stats }));
  }
}

export const supabaseApi = new SupabaseApiService();
