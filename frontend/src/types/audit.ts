export interface AuditLogEntry {
  id: string;
  user: string;
  userRole: string;
  action: string;
  studentRegNo: string;
  studentName?: string;
  date: string;
  time: string;
  details?: string;
}
