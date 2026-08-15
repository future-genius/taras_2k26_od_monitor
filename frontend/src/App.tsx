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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, mustChangePassword } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/daily-od" element={<ProtectedRoute><DailyOD /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><ODHistory /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><EventManagement /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />

      {/* Aliases for compatibility */}
      <Route path="/activities" element={<Navigate to="/events" replace />} />
      <Route path="/reports" element={<Navigate to="/history" replace />} />

      <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

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
