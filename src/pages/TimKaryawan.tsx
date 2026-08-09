import React, { useState, useEffect } from 'react';
import { UserPlus, Download, Upload, Search, Edit2, Trash2, Eye, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Employee, Department, Position } from '../types';
import { useNavigate } from 'react-router-dom';

export default function TimKaryawan() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const navigate = useNavigate();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ full_name: '', employee_code: '', email: '', department_id: '', position_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDepsAndPos();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        departments (name),
        positions (title)
      `)
      .order('full_name', { ascending: true });
    
    if (error) console.error('Error fetching employees:', error);
    else setEmployees(data || []);
    setLoading(false);
  };

  const fetchDepsAndPos = async () => {
    const [depRes, posRes] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('positions').select('*')
    ]);
    if (depRes.data) setDepartments(depRes.data);
    if (posRes.data) setPositions(posRes.data);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus data karyawan ini?')) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) alert('Gagal menghapus: ' + error.message);
    else fetchEmployees();
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Generate NIK if empty
    const code = newEmp.employee_code.trim() || `EMP-${Date.now()}`;
    
    const { error } = await supabase.from('employees').insert([{
      full_name: newEmp.full_name,
      employee_code: code,
      email: newEmp.email || null,
      department_id: newEmp.department_id || null,
      position_id: newEmp.position_id || null,
      employment_status: 'Tetap'
    }]);

    setIsSubmitting(false);
    if (error) {
      alert('Gagal menambahkan karyawan: ' + error.message);
    } else {
      setIsAddModalOpen(false);
      setNewEmp({ full_name: '', employee_code: '', email: '', department_id: '', position_id: '' });
      fetchEmployees();
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.full_name.toLowerCase().includes(search.toLowerCase()) || 
                        emp.employee_code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'Semua' || 
                       (filterStatus === 'Aktif' && emp.employment_status !== 'Resign') ||
                       (filterStatus === 'Resign' && emp.employment_status === 'Resign');
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Tim Karyawan</h1>
          <p className="text-sm text-slate-500">Kelola data seluruh karyawan perusahaan Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => alert('Fitur Import belum tersedia.')}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => alert('Fitur Export belum tersedia.')}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Karyawan
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button 
              className={`px-4 py-2 text-sm font-semibold border-r border-slate-200 hover:bg-slate-50 transition-colors ${filterStatus === 'Semua' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'}`}
              onClick={() => setFilterStatus('Semua')}
            >
              Semua
            </button>
            <button 
              className={`px-4 py-2 text-sm font-semibold border-r border-slate-200 hover:bg-slate-50 transition-colors ${filterStatus === 'Aktif' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'}`}
              onClick={() => setFilterStatus('Aktif')}
            >
              Aktif
            </button>
            <button 
              className={`px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors ${filterStatus === 'Resign' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'}`}
              onClick={() => setFilterStatus('Resign')}
            >
              Resign
            </button>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden shadow-sm">
        <CardHeader className="border-b border-slate-100 p-4">
          <CardTitle className="text-sm font-bold text-slate-700">Daftar Karyawan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div className="flex-1 overflow-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">Memuat data...</TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">Tidak ada data karyawan ditemukan.</TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((karyawan) => (
                  <TableRow key={karyawan.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {karyawan.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{karyawan.full_name}</p>
                          <p className="text-xs text-slate-500">{karyawan.employee_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        {/* @ts-ignore */}
                        {karyawan.departments?.name || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{/* @ts-ignore */}{karyawan.positions?.title || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        karyawan.employment_status === 'Resign' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' :
                        'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10'
                      }`}>
                        {karyawan.employment_status || 'Aktif'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/detail?id=' + karyawan.id)} title="Lihat Detail">
                          <Eye className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => alert('Fitur Edit belum tersedia.')} title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(karyawan.id)} title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Tambah Karyawan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Tambah Karyawan Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Nama Lengkap <span className="text-red-500">*</span></label>
                <input required type="text" value={newEmp.full_name} onChange={e => setNewEmp({...newEmp, full_name: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" placeholder="Contoh: Budi Santoso" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">NIK (Opsional)</label>
                <input type="text" value={newEmp.employee_code} onChange={e => setNewEmp({...newEmp, employee_code: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" placeholder="Dikosongkan akan generate otomatis" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Email</label>
                <input type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" placeholder="budi@contoh.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Departemen</label>
                <select value={newEmp.department_id} onChange={e => setNewEmp({...newEmp, department_id: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                  <option value="">-- Pilih Departemen --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Jabatan</label>
                <select value={newEmp.position_id} onChange={e => setNewEmp({...newEmp, position_id: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                  <option value="">-- Pilih Jabatan --</option>
                  {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Karyawan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
