import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('yunusmahada@gmail.com');
  const [password, setPassword] = useState('Alhamdulillah');
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
