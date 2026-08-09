const fs = require('fs');

// 1. Create AuthContext.tsx
const authContext = `import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Employee } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  employee: Employee | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  employee: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmployee(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmployee(session.user.id);
      } else {
        setEmployee(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchEmployee = async (userId: string) => {
    const { data } = await supabase.from('employees').select('*, departments(name), positions(title)').eq('user_id', userId).single();
    setEmployee(data);
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, employee, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
`;

fs.writeFileSync('src/lib/AuthContext.tsx', authContext);

// 2. Create Login.tsx
const login = `import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Email atau password salah.');
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl border border-slate-100 m-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 text-xl">M</div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">HRIS <span className="text-emerald-500">MAHADA</span></h1>
          <p className="text-sm text-slate-500 mt-2">Masuk ke sistem HRIS Mahada Indonesia</p>
        </div>
        
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" 
              placeholder="nama@mahada.co.id"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" 
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4 h-10" disabled={loading}>
            {loading ? 'Memproses...' : 'Login Ke Sistem'}
          </Button>
        </form>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/Login.tsx', login);

// 3. Patch App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');

const appImports = `import Layout from './components/layout/Layout';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Login from './pages/Login';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, employee, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 bg-slate-50">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && employee && !allowedRoles.includes(employee.role || 'Karyawan')) {
    return <div className="h-screen flex flex-col items-center justify-center text-slate-800 bg-slate-50">
      <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
      <p className="text-slate-500 mb-4">Anda tidak memiliki hak akses untuk halaman ini.</p>
      <a href="/" className="text-emerald-600 hover:underline">Kembali ke Dashboard</a>
    </div>;
  }
  return <>{children}</>;
};`;

app = app.replace(`import Layout from './components/layout/Layout';`, appImports);

app = app.replace(`<Router>`, `<AuthProvider>\n    <Router>`);
app = app.replace(`</Router>`, `</Router>\n    </AuthProvider>`);

app = app.replace(`<Routes>`, `<Routes>\n        <Route path="/login" element={<Login />} />`);

app = app.replace(`element={<Layout />}`, `element={<ProtectedRoute><Layout /></ProtectedRoute>}`);

// Add role based routes protection
const hrRoles = "['Super Admin', 'HR']";
app = app.replace(`path="tim" element={<TimKaryawan />}`, `path="tim" element={<ProtectedRoute allowedRoles={${hrRoles}}><TimKaryawan /></ProtectedRoute>}`);
app = app.replace(`path="administrasi" element={<Administrasi />}`, `path="administrasi" element={<ProtectedRoute allowedRoles={${hrRoles}}><Administrasi /></ProtectedRoute>}`);
app = app.replace(`path="pengaturan" element={<Pengaturan />}`, `path="pengaturan" element={<ProtectedRoute allowedRoles={${hrRoles}}><Pengaturan /></ProtectedRoute>}`);
app = app.replace(`path="ikatan-dinas" element={<IkatanDinas />}`, `path="ikatan-dinas" element={<ProtectedRoute allowedRoles={${hrRoles}}><IkatanDinas /></ProtectedRoute>}`);
app = app.replace(`path="pelanggaran" element={<Pelanggaran />}`, `path="pelanggaran" element={<ProtectedRoute allowedRoles={${hrRoles}}><Pelanggaran /></ProtectedRoute>}`);

fs.writeFileSync('src/App.tsx', app);
