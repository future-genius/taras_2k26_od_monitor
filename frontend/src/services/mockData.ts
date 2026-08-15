import { User } from '../types/user';

// ============================================================
// PRESIDENT ACCOUNT — The only pre-existing user
// All other accounts are created through the app
// ============================================================
export const PRESIDENT_USER: User = {
  id: 'user-president-001',
  name: 'Hariharan R',
  email: 'president@taras.edu',
  role: 'PRESIDENT',
};

// DEMO_USERS kept for AuthContext compatibility — only President
export const DEMO_USERS: Record<string, User> = {
  president: PRESIDENT_USER,
};

// ============================================================
// EMPTY DATA — No demo students, events, or audit logs
// All data will be imported via Excel or added manually
// ============================================================
export const INITIAL_STUDENTS = [];
export const INITIAL_ACTIVITIES = [];
export const INITIAL_AUDIT_LOGS = [];
export const INITIAL_EVENTS = [];
export const INITIAL_PARTICIPANTS = [];
