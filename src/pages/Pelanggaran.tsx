import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { Plus, X, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function Pelanggaran() {
  const { employee: currentUser } = useAuth();
  const role = currentUser?.role || 'Karyawan';
  const isManagerOrKaryawan = role === 'Manager' || role === 'Ass Super Admin' || role === 'Karyawan';
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [violation_type, setViolation_type] = useState('');
  const [letter_number, setLetter_number] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    let query = supabase.from('employees').select('id, full_name, employee_code, department_id').order('full_name');
    if (role === 'Karyawan') {
      query = query.eq('id', currentUser?.id);
    } else if (role === 'Manager') {
      query = query.eq('department_id', currentUser?.department_id);
    }
    const { data } = await query;
    if (data) setEmployees(data);
  };

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from('violations')
      .select('*, employees!inner(full_name, employee_code, department_id)')
      .order('created_at', { ascending: false });
      
    if (role === 'Karyawan') {
      query = query.eq('employee_id', currentUser?.id);
    } else if (role === 'Manager') {
      query = query.eq('employees.department_id', currentUser?.department_id);
    }

    const { data, error } = await query;
      
    if (data) setData(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return alert('Pilih karyawan');
    
    const insertData: any = {
      employee_id: employeeId,
      status: 'Berlaku',
      violation_type,
      letter_number,
      date,
      reason
    };

    const { error } = await supabase.from('violations').insert([insertData]);

    if (!error) {
      setShowForm(false);
      setEmployeeId('');
      setViolation_type('');
      setLetter_number('');
      setDate('');
      setReason('');
      fetchData();
    } else {
      alert('Gagal menyimpan data');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus data ini?')) {
      const { error } = await supabase.from('violations').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-800">Pelanggaran (SP)</h1>
        </div>
        {!isManagerOrKaryawan && (
          <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-700 hover:bg-emerald-800 text-white">
            {showForm ? <><X className="w-4 h-4 mr-2" /> Batal</> : <><Plus className="w-4 h-4 mr-2" /> Tambah SP</>}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Form Pelanggaran & SP</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Karyawan</label>
                <select 
                  required
                  value={employeeId} 
                  onChange={e => setEmployeeId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.employee_code} - {emp.full_name}</option>
                  ))}
                </select>
              </div>
              
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Jenis SP / Pelanggaran</label>
                <input required type="text" value={violation_type} onChange={e => setViolation_type(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">No. Surat</label>
                <input  type="text" value={letter_number} onChange={e => setLetter_number(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tanggal</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Keterangan</label>
                <textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"></textarea>
              </div>
              

              <Button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">Simpan Data</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>No. Surat</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Masa Berlaku</TableHead>
                <TableHead>Status</TableHead>
                {!isManagerOrKaryawan && <TableHead className="text-center w-[100px]">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Memuat data...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Belum ada data.</TableCell></TableRow>
              ) : (
                data.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-slate-800">{item.employees?.full_name}</div>
                      <div className="text-xs text-slate-500">{item.employees?.employee_code}</div>
                    </TableCell>
                    
                    <TableCell>
                      {item.violation_type || '-'}
                    </TableCell>
                    
                    <TableCell>
                      {item.letter_number || '-'}
                    </TableCell>
                    
                    <TableCell>
                      {item.date ? new Date(item.date).toLocaleDateString('id-ID') : '-'}
                    </TableCell>
                    
                    <TableCell>
                      {item.reason || '-'}
                    </TableCell>
                    
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                        {item.status}
                      </span>
                    </TableCell>
                    {!isManagerOrKaryawan && (
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
