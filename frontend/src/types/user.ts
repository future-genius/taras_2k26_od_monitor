export type UserRole = 'PRESIDENT' | 'STAFF' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  registerNumber?: string;
  avatarUrl?: string;
  department?: string;
}

export interface PrivacySettings {
  allowStaffViewPhone: boolean;
  allowStaffViewEmail: boolean;
  allowStudentExport: boolean;
}
