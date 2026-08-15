import React from 'react';
import { Layout } from '../components/layout/Layout';
import { AuditLogTable } from '../components/audit/AuditLogTable';
import { useStudents } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { auditLogs } = useStudents();
  const { isPresident } = useAuth();

  if (!isPresident) {
    return (
      <Layout title="Audit Logs" subtitle="System modification history">
        <div className="bg-white p-8 rounded-xl border border-taras-200 text-center max-w-md mx-auto space-y-3">
          <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="text-base font-bold text-taras-900">Access Restricted</h3>
          <p className="text-xs text-taras-500">
            Audit log inspection is restricted exclusively to the TARAS President. Staff and student accounts do not have audit viewing privileges.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Administrative Audit Logs" subtitle="Immutable log of student modifications, status updates, and additions">
      <AuditLogTable logs={auditLogs} />
    </Layout>
  );
};
