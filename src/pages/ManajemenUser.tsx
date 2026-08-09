import React, { useState, useEffect } from 'react';
import { Shield, Key, ShieldAlert, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';

export default function ManajemenUser() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Karyawan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    // Kita juga ambil kolom password untuk mengecek apakah user sudah punya password atau belum
    const { data, error } = await supabase
      .from('employees')
      .select(`id, full_name, email, role, password`)
      .order('full_name', { ascending: true });
    
    if (error) console.error('Error fetching employees:', error);
    else setEmployees(data || []);
    setLoading(false);
  };

  const handleOpenModal = (emp: any) => {
    setSelectedEmp(emp);
    setRole(emp.role || 'Karyawan');
    setPassword(emp.password || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    if (password.length < 4) {
      setErrorMsg('Password minimal 4 karakter');
      setIsSubmitting(false);
      return;
    }

    // Update tabel employees dengan password dan role
    const { error: updateError } = await supabase
      .from('employees')
      .update({ role, password })
      .eq('id', selectedEmp.id);

    setIsSubmitting(false);

    if (updateError) {
      setErrorMsg(updateError.message);
    } else {
      setIsModalOpen(false);
      fetchEmployees();
      alert('Akses dan Password berhasil disimpan!');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Manajemen Akses User</h1>
          <p className="text-sm text-slate-500">Berikan akses login dan atur role (Karyawan/Management) untuk tim Anda.</p>
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden shadow-sm">
        <CardHeader className="border-b border-slate-100 p-4">
          <CardTitle className="text-sm font-bold text-slate-700">Daftar Akun Karyawan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div className="flex-1 overflow-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status Akses</TableHead>
                <TableHead>Role / Hak Akses</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">Memuat data...</TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">Tidak ada data karyawan.</TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-semibold text-slate-800">{emp.full_name}</TableCell>
                    <TableCell>{emp.email || <span className="text-slate-400 italic">-</span>}</TableCell>
                    <TableCell>
                      {emp.password ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                          <Shield className="h-3 w-3" /> Memiliki Password
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          <ShieldAlert className="h-3 w-3" /> Belum Diatur
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${emp.role === 'Super Admin' || emp.role === 'HR' || emp.role === 'Manager' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-700'}`}>
                        {emp.role || 'Karyawan'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant={emp.password ? "outline" : "default"} className={emp.password ? "" : "bg-emerald-600 hover:bg-emerald-700 text-white"} onClick={() => handleOpenModal(emp)}>
                        <Key className="mr-2 h-4 w-4" />
                        {emp.password ? 'Ubah Akses' : 'Buat Akses'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Buat Akun / Ubah Role */}
      {isModalOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                Atur Akses & Password
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-100">
                <p><span className="text-slate-500">Karyawan:</span> <strong className="text-slate-800">{selectedEmp.full_name}</strong></p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{errorMsg}</div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Password Login <span className="text-red-500">*</span></label>
                <input 
                  required 
                  type="text" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full rounded-md border border-slate-200 p-2 text-sm" 
                  placeholder="Masukkan password" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Role / Hak Akses <span className="text-red-500">*</span></label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value)} 
                  className="w-full rounded-md border border-slate-200 p-2 text-sm"
                >
                  <option value="Karyawan">Karyawan (Hanya lihat data sendiri)</option>
                  <option value="Manager">Manager (Bisa lihat data timnya)</option>
                  <option value="HR">HR (Akses penuh HRIS)</option>
                  <option value="Super Admin">Super Admin (Akses penuh & Pengaturan)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
                  {isSubmitting ? 'Memproses...' : 'Simpan Akses'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
