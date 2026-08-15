// ECE is the ONLY department for TARAS
export type Department = 'ECE';
export type AcademicYear = 'I' | 'II' | 'III' | 'IV';
export type Section = '1' | '2' | '3';
export type StudentStatus = 'Active' | 'Inactive' | 'Graduated' | 'Transferred';

export interface Student {
  id: string;
  registerNumber: string;
  name: string;
  department: Department;
  year: AcademicYear;
  section: Section;
  role: string; // e.g. "Student", "Coordinator", "Volunteer", "Lead", "Member"
  dateOfBirth: string; // Stored as DD-MM-YYYY
  email?: string;
  phone?: string;
  status: StudentStatus;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFilterParams {
  searchQuery?: string;
  year?: AcademicYear | 'ALL';
  section?: Section | 'ALL';
  role?: string | 'ALL';
  status?: StudentStatus | 'ALL';
}

export type StudentSortField = 'name' | 'registerNumber' | 'year' | 'section' | 'role';
export type SortOrder = 'asc' | 'desc';

export interface StudentSortOptions {
  field: StudentSortField;
  order: SortOrder;
}

export interface PaginatedStudents {
  data: Student[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Normalize section: '1', '2', '3' (or 'A'->'1', 'B'->'2', 'C'->'3')
export const normalizeSection = (sec: string): Section => {
  const clean = sec.trim().toUpperCase().replace(/SECTION/i, '').replace(/SEC/i, '').trim();
  if (clean === '1' || clean === 'A') return '1';
  if (clean === '2' || clean === 'B') return '2';
  if (clean === '3' || clean === 'C') return '3';
  return '1';
};

export const isValidSection = (sec: string): boolean => {
  const clean = sec.trim().toUpperCase().replace(/SECTION/i, '').replace(/SEC/i, '').trim();
  return clean === '1' || clean === '2' || clean === '3' || clean === 'A' || clean === 'B' || clean === 'C';
};

// Password utilities for student auth
export const formatDOBToPassword = (dob: string): string => {
  // Input: DD-MM-YYYY or DD/MM/YYYY → Output: DDMMYYYY
  const clean = dob.replace(/[-/\.]/g, '');
  if (clean.length === 8) return clean;
  const parts = dob.split(/[-/\.]/);
  if (parts.length === 3) {
    const dd = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    const yyyy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${dd}${mm}${yyyy}`;
  }
  return clean;
};

export const normalizeDOB = (dob: string): string => {
  // Normalize to DD-MM-YYYY for storage
  const clean = dob.replace(/[-/\.]/g, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4)}`;
  }
  const parts = dob.split(/[-/\.]/);
  if (parts.length === 3) {
    const dd = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    const yyyy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${dd}-${mm}-${yyyy}`;
  }
  return dob;
};

export const validateDOB = (dob: string): boolean => {
  const normalized = normalizeDOB(dob);
  const regex = /^\d{2}-\d{2}-\d{4}$/;
  if (!regex.test(normalized)) return false;
  const [dd, mm, yyyy] = normalized.split('-').map(Number);
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  if (yyyy < 1990 || yyyy > 2015) return false;
  return true;
};

// Excel import types
export interface ImportRow {
  name: string;
  registerNumber: string;
  section: string;
  year: string;
  role: string;
  dateOfBirth: string;
  rowIndex: number;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export interface ImportPreview {
  rows: ImportRow[];
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
}
