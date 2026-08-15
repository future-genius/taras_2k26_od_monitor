import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/user';
import { PRESIDENT_USER } from '../services/mockData';
import { apiService } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { formatDOBToPassword, normalizeDOB } from '../types/student';

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
    const cleanUser = username.trim();
    const cleanUserLower = cleanUser.toLowerCase();
    const cleanPass = password.trim();

    // 1. President Login Check
    if (cleanUserLower === 'president@taras.edu' || cleanUserLower === 'president' || cleanUserLower === 'admin') {
      if (cleanPass === 'president@taras' || cleanPass === 'taras2026' || cleanPass === 'admin') {
        setUser(PRESIDENT_USER);
        setMustChangePassword(false);
        return { success: true };
      }
      return { success: false, error: 'Invalid President credentials.' };
    }

    // 2. Student Login Check (Username = Register Number, Password = DOB DDMMYYYY)
    // Clean entered password for comparison (e.g. "12-05-2005" -> "12052005")
    const cleanEnteredDOB = cleanPass.replace(/[-/\.]/g, '');

    // A. Check Supabase cloud database first (handles mass upload from any device)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: studentRow, error } = await supabase
          .from('students')
          .select('*')
          .ilike('register_number', cleanUser)
          .maybeSingle();

        if (studentRow) {
          const studentDOB = studentRow.date_of_birth || '';
          const expectedPassword = formatDOBToPassword(studentDOB);
          const normalizedDOB = normalizeDOB(studentDOB).replace(/[-/\.]/g, '');

          const isPasswordValid =
            cleanEnteredDOB === expectedPassword ||
            cleanEnteredDOB === normalizedDOB ||
            cleanPass === studentDOB;

          if (isPasswordValid) {
            const studentUser: User = {
              id: studentRow.id,
              name: studentRow.name,
              email: studentRow.email || studentRow.register_number,
              role: 'STUDENT',
              registerNumber: studentRow.register_number,
            };
            setUser(studentUser);
            setMustChangePassword(Boolean(studentRow.must_change_password));
            return { success: true };
          } else {
            return {
              success: false,
              error: 'Incorrect password. Enter your Date of Birth as DDMMYYYY (e.g. 12052005).',
            };
          }
        }
      } catch (err) {
        console.warn('Supabase auth check notice, falling back to local list:', err);
      }
    }

    // B. Check local state list as fallback
    const localStudent = apiService.getAllStudents().find(
      s => s.registerNumber.toLowerCase() === cleanUserLower
    );

    if (!localStudent) {
      return {
        success: false,
        error: 'Register Number not found. Only students in the TARAS roster have access.',
      };
    }

    const expectedPassword = formatDOBToPassword(localStudent.dateOfBirth);
    const normalizedDOB = normalizeDOB(localStudent.dateOfBirth).replace(/[-/\.]/g, '');

    const isPasswordValid =
      cleanEnteredDOB === expectedPassword ||
      cleanEnteredDOB === normalizedDOB ||
      cleanPass === localStudent.dateOfBirth;

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Incorrect password. Enter your Date of Birth as DDMMYYYY (e.g. 12052005).',
      };
    }

    const studentUser: User = {
      id: localStudent.id,
      name: localStudent.name,
      email: localStudent.email || localStudent.registerNumber,
      role: 'STUDENT',
      registerNumber: localStudent.registerNumber,
    };

    setUser(studentUser);
    setMustChangePassword(Boolean(localStudent.mustChangePassword));
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
