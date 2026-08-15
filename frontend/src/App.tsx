import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { StudentProvider } from './context/StudentContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DailyOD } from './pages/DailyOD';
import { ODHistory } from './pages/ODHistory';
import { Students } from './pages/Students';
import { StudentDetail } from './pages/StudentDetail';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { ChangePassword } from './pages/ChangePassword';
import { EventManagement } from './pages/EventManagement';
import { NotFound } from './pages/NotFound';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('PRESIDENT' | 'STAFF' | 'STUDENT')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, mustChangePassword } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;

  // If role is restricted, redirect students safely to their dashboard portal
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Accessible to all authenticated users (President, Staff, Student) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['PRESIDENT', 'STAFF', 'STUDENT']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute allowedRoles={['PRESIDENT', 'STAFF', 'STUDENT']}>
            <EventManagement />
          </ProtectedRoute>
        }
      />

      {/* Restricted to President and Staff (Students cannot access) */}
      <Route
        path="/daily-od"
        element={
          <ProtectedRoute allowedRoles={['PRESIDENT', 'STAFF']}>
            <DailyOD />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute allowedRoles={['PRESIDENT', 'STAFF']}>
            <ODHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute allowedRoles={['PRESIDENT', 'STAFF']}>
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:id"
        element={
          <ProtectedRoute allowedRoles={['PRESIDENT', 'STAFF']}>
            <StudentDetail />
          </ProtectedRoute>
        }
      />

      {/* President only */}
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['PRESIDENT']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['PRESIDENT']}>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Aliases for compatibility */}
      <Route path="/activities" element={<Navigate to="/events" replace />} />
      <Route path="/reports" element={<Navigate to="/history" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <StudentProvider>
            <AppContent />
          </StudentProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
