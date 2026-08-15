import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/user';
import { PRESIDENT_USER } from '../services/mockData';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isPresident: boolean;
  isStaff: boolean;
  isStudent: boolean;
  mustChangePassword: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsPresident: () => void;
  logout: () => void;
  completePasswordChange: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'taras_v2_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Starts logged out by default unless a valid session exists in localStorage
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // President login
    if (cleanUser === 'president@taras.edu' || cleanUser === 'president' || cleanUser === 'admin') {
      if (cleanPass === 'president@taras' || cleanPass === 'taras2026' || cleanPass === 'admin') {
        setUser(PRESIDENT_USER);
        setMustChangePassword(false);
        return { success: true };
      }
      return { success: false, error: 'Invalid President password.' };
    }

    // Student login: username = register number, password = DOB or changed password
    const account = apiService.verifyLogin(username, password);
    if (!account) {
      return { success: false, error: 'Invalid Register Number or Password.' };
    }

    const student = apiService.getStudentById(account.studentId);
    if (!student) {
      return { success: false, error: 'Student account not found.' };
    }

    const studentUser: User = {
      id: account.studentId,
      name: student.name,
      email: student.email || student.registerNumber,
      role: 'STUDENT',
      registerNumber: student.registerNumber,
    };

    setUser(studentUser);
    setMustChangePassword(account.mustChangePassword);
    return { success: true };
  };

  const loginAsPresident = () => {
    setUser(PRESIDENT_USER);
    setMustChangePassword(false);
  };

  const logout = () => {
    setUser(null);
    setMustChangePassword(false);
  };

  const completePasswordChange = () => {
    setMustChangePassword(false);
    if (user) {
      const updated = { ...user };
      setUser(updated);
    }
  };

  const role: UserRole = user?.role || 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isPresident: role === 'PRESIDENT',
        isStaff: role === 'STAFF',
        isStudent: role === 'STUDENT',
        mustChangePassword,
        login,
        loginAsPresident,
        logout,
        completePasswordChange,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
