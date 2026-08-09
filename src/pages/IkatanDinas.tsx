import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { Plus, X, Trash2 } from 'lucide-react';

export default function IkatanDinas() {
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [program_type, setProgram_type] = useState('');
  const [contract_number, setContract_number] = useState('');
  const [start_date, setStart_date] = useState('');
  const [end_date, setEnd_date] = useState('');

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('id, full_name, employee_code').order('full_name');
    if (data) setEmployees(data);
  };

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('business_trip_bonds')
      .select('*, employees(full_name, employee_code)')
      .order('created_at', { ascending: false });
      
    if (data) setData(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return alert('Pilih karyawan');
    
    const insertData: any = {
      employee_id: employeeId,
      status: 'Active',
      program_type,
      contract_number,
      start_date,
      end_date
    };

    const { error } = await supabase.from('business_trip_bonds').insert([insertData]);

    if (!error) {
      setShowForm(false);
      setEmployeeId('');
      setProgram_type('');
      setContract_number('');
      setStart_date('');
      setEnd_date('');
      fetchData();
    } else {
      alert('Gagal menyimpan data');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus data ini?')) {
      const { error } = await supabase.from('business_trip_bonds').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Ikatan Dinas</h1>
          <p className="text-sm text-slate-500">Kelola data perjanjian ikatan dinas karyawan.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="w-4 h-4 mr-2" /> Batal</> : <><Plus className="w-4 h-4 mr-2" /> Tambah Data</>}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Form Ikatan Dinas</CardTitle>
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
                <label className="text-sm font-medium text-slate-700">Program / Jenis</label>
                <input required type="text" value={program_type} onChange={e => setProgram_type(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">No. Kontrak</label>
                <input  type="text" value={contract_number} onChange={e => setContract_number(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Mulai</label>
                <input required type="date" value={start_date} onChange={e => setStart_date(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Selesai</label>
                <input required type="date" value={end_date} onChange={e => setEnd_date(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
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
                <TableHead>Program</TableHead>
                <TableHead>No. Kontrak</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead>Selesai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
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
                      {item.program_type || '-'}
                    </TableCell>
                    
                    <TableCell>
                      {item.contract_number || '-'}
                    </TableCell>
                    
                    <TableCell>
                      {item.start_date ? new Date(item.start_date).toLocaleDateString('id-ID') : '-'}
                    </TableCell>
                    
                    <TableCell>
                      {item.end_date ? new Date(item.end_date).toLocaleDateString('id-ID') : '-'}
                    </TableCell>
                    
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
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
