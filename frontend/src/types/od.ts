export type ODStatus = 'OD' | 'Absent' | 'Not Marked';

export const SYMPOSIUM_DATE = '2026-09-26';
export const SYMPOSIUM_DISPLAY_DATE = '26 September 2026';
export const SYMPOSIUM_NAME = 'TARAS 2K26';
export const DEPARTMENT = 'ECE';

export interface TarasEventItem {
  id: string;
  name: string;
  category?: string;
  date?: string;
  description?: string;
  venue?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyODRecord {
  id: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  section: string;
  year: string;
  role?: string;
  department: 'ECE';
  date: string; // YYYY-MM-DD
  workName: string;
  status: 'OD' | 'Absent';
  markedBy: string;
  markedAt: string;
  remarks?: string;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  workName: string;
  totalStudents: number;
  odCount: number;
  absentCount: number;
  records: DailyODRecord[];
  updatedAt: string;
}

export interface StudentODHistoryItem {
  id: string;
  date: string;
  workName: string;
  status: 'OD' | 'Absent';
  remarks?: string;
}
