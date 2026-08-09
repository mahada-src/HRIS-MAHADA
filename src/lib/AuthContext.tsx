import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Employee } from '../types';

interface AuthContextType {
  user: { id: string } | null;
  employee: Employee | null;
  loading: boolean;
  signIn: (employeeId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  employee: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek apakah ada sesi tersimpan di localStorage
    const savedUserId = localStorage.getItem('hris_session_user_id');
    if (savedUserId) {
      setUser({ id: savedUserId });
      fetchEmployee(savedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchEmployee = async (employeeId: string) => {
    const { data } = await supabase
      .from('employees')
      .select('*, departments(name), positions(title)')
      .eq('id', employeeId)
      .single();
    
    if (data) {
      setEmployee(data);
    } else {
      // Jika data tidak ditemukan, hapus sesi
      localStorage.removeItem('hris_session_user_id');
      setUser(null);
      setEmployee(null);
    }
    setLoading(false);
  };

  const signIn = async (employeeId: string) => {
    localStorage.setItem('hris_session_user_id', employeeId);
    setUser({ id: employeeId });
    setLoading(true);
    await fetchEmployee(employeeId);
  };

  const signOut = async () => {
    localStorage.removeItem('hris_session_user_id');
    setUser(null);
    setEmployee(null);
  };

  return (
    <AuthContext.Provider value={{ user, employee, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
