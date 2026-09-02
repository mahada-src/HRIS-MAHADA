import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const [employees, setEmployees] = useState<{ id: string, full_name: string }[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [password, setPassword] = useState('');
  
  // Captcha State
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn } = useAuth();

  useEffect(() => {
    generateCaptcha();
    fetchEmployees();
  }, []);

  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaAnswer('');
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, employment_status, status_karyawan')
      .order('full_name', { ascending: true });
    
    if (data) {
      const activeEmployees = data.filter(emp => {
        const empStatus = (emp.employment_status || '').trim().toLowerCase();
        const statKaryawan = (emp.status_karyawan || '').trim().toLowerCase();
        return empStatus !== 'resign' && statKaryawan !== 'resign';
      });
      setEmployees(activeEmployees);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedId) {
      setError('Silakan pilih nama karyawan terlebih dahulu.');
      return;
    }

    if (parseInt(captchaAnswer) !== num1 + num2) {
      setError('Jawaban verifikasi matematika salah. Silakan coba lagi.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    
    // Cek password langsung di database
    const { data, error: queryError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', selectedId)
      .eq('password', password)
      .single();

    if (queryError || !data) {
      setError('Password salah. Silakan coba lagi.');
      generateCaptcha();
      setPassword('');
      setLoading(false);
    } else {
      await signIn(data.id);
      navigate('/');
    }
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
            <label className="text-sm font-medium text-slate-700">Nama Karyawan</label>
            <select 
              required
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="">-- Pilih Nama --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Verifikasi Keamanan</label>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-slate-100 rounded-lg border border-slate-200 font-mono font-bold text-slate-700">
                {num1} + {num2} = 
              </div>
              <input 
                type="number" 
                required
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                placeholder="Jawaban?"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4 h-10" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk Ke Sistem'}
          </Button>
        </form>
      </div>
    </div>
  );
}
