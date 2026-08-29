import React, { useState, useEffect } from 'react';
import { UserPlus, Download, Upload, Search, Edit2, Trash2, Eye, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Employee, Department, Position } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function TimKaryawan() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Aktif');
  const navigate = useNavigate();
  const { employee: currentUser } = useAuth();
  const role = currentUser?.role || 'Karyawan';
  const isManagerOrKaryawan = role === 'Manager' || role === 'Ass Super Admin' || role === 'Karyawan';

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ full_name: '', employee_code: '', email: '', department_id: '', position_id: '', employment_status: 'Karyawan Tetap', status_karyawan: 'Aktif' });
  const [editEmp, setEditEmp] = useState({ id: '', full_name: '', employee_code: '', email: '', department_id: '', position_id: '', employment_status: '', status_karyawan: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateLamaBekerja = (tglTetap?: string, tglProbation?: string) => {
    const startDateStr = tglTetap || tglProbation;
    if (!startDateStr) return '-';
    
    const startDate = new Date(startDateStr);
    const today = new Date();
    
    let years = today.getFullYear() - startDate.getFullYear();
    let months = today.getMonth() - startDate.getMonth();
    let days = today.getDate() - startDate.getDate();
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} Thn ${months} Bln ${days} Hr`;
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepsAndPos();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    let query = supabase
      .from('employees')
      .select(`
        *,
        departments (name),
        positions (title)
      `)
      .order('employee_code', { ascending: false });

    if (role === 'Karyawan') {
      query = query.eq('id', currentUser?.id);
    } else if (role === 'Manager' || role === 'Ass Super Admin') {
      query = query.eq('department_id', currentUser?.department_id);
    }

    const { data, error } = await query;
    
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
      employment_status: newEmp.employment_status || 'Karyawan Tetap',
      status_karyawan: newEmp.status_karyawan || 'Aktif'
    }]);

    setIsSubmitting(false);
    if (error) {
      alert('Gagal menambahkan karyawan: ' + error.message);
    } else {
      setIsAddModalOpen(false);
      setNewEmp({ full_name: '', employee_code: '', email: '', department_id: '', position_id: '', employment_status: 'Karyawan Tetap', status_karyawan: 'Aktif' });
      fetchEmployees();
    }
  };

  const openEditModal = (emp: Employee) => {
    setEditEmp({
      id: emp.id,
      full_name: emp.full_name,
      employee_code: emp.employee_code,
      email: emp.email || '',
      department_id: emp.department_id || '',
      position_id: emp.position_id || '',
      employment_status: emp.employment_status || 'Karyawan Tetap',
      status_karyawan: emp.status_karyawan || 'Aktif'
    });
    setIsEditModalOpen(true);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('employees').update({
      full_name: editEmp.full_name,
      employee_code: editEmp.employee_code,
      email: editEmp.email || null,
      department_id: editEmp.department_id || null,
      position_id: editEmp.position_id || null,
      employment_status: editEmp.employment_status || 'Karyawan Tetap',
      status_karyawan: editEmp.status_karyawan || 'Aktif'
    }).eq('id', editEmp.id);

    setIsSubmitting(false);
    if (error) {
      alert('Gagal mengupdate karyawan: ' + error.message);
    } else {
      setIsEditModalOpen(false);
      fetchEmployees();
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.full_name.toLowerCase().includes(search.toLowerCase()) || 
                        emp.employee_code.toLowerCase().includes(search.toLowerCase());
    
    const empStatus = emp.status_karyawan || 'Aktif';
    const matchStatus = filterStatus === 'Semua' || 
                       (filterStatus === 'Aktif' && empStatus === 'Aktif') ||
                       (filterStatus === 'Cuti' && empStatus === 'Cuti') ||
                       (filterStatus === 'Resign' && empStatus === 'Resign') ||
                       (filterStatus === 'PHK' && empStatus === 'PHK');
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Tim Karyawan</h1>
          <p className="text-sm text-slate-500">Kelola data seluruh karyawan perusahaan Anda.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama / NIK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 min-w-[200px]"
            />
          </div>
          {!isManagerOrKaryawan && (
            <>
              <Button variant="outline" className="text-slate-600">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" className="text-slate-600">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Tambah Karyawan
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {!isManagerOrKaryawan && (
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button 
                className={`px-4 py-2 text-sm font-semibold border-r border-slate-200 hover:bg-slate-50 transition-colors ${filterStatus === 'Aktif' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'}`}
                onClick={() => setFilterStatus('Aktif')}
              >
                Aktif
              </button>
              <button 
                className={`px-4 py-2 text-sm font-semibold border-r border-slate-200 hover:bg-slate-50 transition-colors ${filterStatus === 'Cuti' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'}`}
                onClick={() => setFilterStatus('Cuti')}
              >
                Cuti
              </button>
              <button 
                className={`px-4 py-2 text-sm font-semibold border-r border-slate-200 hover:bg-slate-50 transition-colors ${filterStatus === 'Resign' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'}`}
                onClick={() => setFilterStatus('Resign')}
              >
                Resign
              </button>
              <button 
                className={`px-4 py-2 text-sm font-semibold border-r border-slate-200 hover:bg-slate-50 transition-colors ${filterStatus === 'PHK' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'}`}
                onClick={() => setFilterStatus('PHK')}
              >
                PHK
              </button>
              <button 
                className={`px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors ${filterStatus === 'Semua' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'}`}
                onClick={() => setFilterStatus('Semua')}
              >
                Semua
              </button>
            </div>
          )}
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
                <TableHead>ID Karyawan</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Lama Bekerja</TableHead>
                <TableHead>Status Kepegawaian</TableHead>
                {!isManagerOrKaryawan && <TableHead className="text-center">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">Memuat data...</TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">Tidak ada data karyawan ditemukan.</TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium text-slate-800">{emp.employee_code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                          {emp.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{emp.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{/* @ts-ignore */}{emp.departments?.name || '-'}</TableCell>
                    <TableCell>{/* @ts-ignore */}{emp.positions?.title || '-'}</TableCell>
                    <TableCell>{calculateLamaBekerja(emp.tgl_tetap || emp.join_date, emp.tgl_probation)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200`}>
                        {emp.employment_status || 'Karyawan Tetap'}
                      </span>
                    </TableCell>
                    {!isManagerOrKaryawan && (
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="outline" className="text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/detail?id=${emp.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-amber-600 hover:bg-amber-50" onClick={() => openEditModal(emp)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(emp.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
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
                <label className="text-xs font-medium text-slate-700">ID Karyawan (Opsional)</label>
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
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Status Kepegawaian</label>
                <select value={newEmp.employment_status} onChange={e => setNewEmp({...newEmp, employment_status: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                  <option value="Karyawan Tetap">Karyawan Tetap</option>
                  <option value="Probation">Probation</option>
                  <option value="Kontrak">Kontrak</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Status Karyawan</label>
                <select value={newEmp.status_karyawan} onChange={e => setNewEmp({...newEmp, status_karyawan: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                  <option value="Aktif">Aktif</option>
                  <option value="Resign">Resign</option>
                  <option value="PHK">PHK</option>
                  <option value="Cuti">Cuti</option>
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

      {/* Modal Edit Karyawan */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Edit Karyawan</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditEmployee} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Nama Lengkap <span className="text-red-500">*</span></label>
                <input required type="text" value={editEmp.full_name} onChange={e => setEditEmp({...editEmp, full_name: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" placeholder="Contoh: Budi Santoso" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">ID Karyawan <span className="text-red-500">*</span></label>
                <input required type="text" value={editEmp.employee_code} onChange={e => setEditEmp({...editEmp, employee_code: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Email</label>
                <input type="email" value={editEmp.email} onChange={e => setEditEmp({...editEmp, email: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" placeholder="budi@contoh.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Departemen</label>
                <select value={editEmp.department_id} onChange={e => setEditEmp({...editEmp, department_id: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                  <option value="">-- Pilih Departemen --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Jabatan</label>
                <select value={editEmp.position_id} onChange={e => setEditEmp({...editEmp, position_id: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                  <option value="">-- Pilih Jabatan --</option>
                  {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Status Kepegawaian</label>
                <select value={editEmp.employment_status} onChange={e => setEditEmp({...editEmp, employment_status: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                  <option value="Karyawan Tetap">Karyawan Tetap</option>
                  <option value="Probation">Probation</option>
                  <option value="Kontrak">Kontrak</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Status Karyawan</label>
                <select value={editEmp.status_karyawan} onChange={e => setEditEmp({...editEmp, status_karyawan: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                  <option value="Aktif">Aktif</option>
                  <option value="Resign">Resign</option>
                  <option value="PHK">PHK</option>
                  <option value="Cuti">Cuti</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
