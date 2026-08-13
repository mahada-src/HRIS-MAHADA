import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import { Employee } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import { Plus, X, Check, XCircle } from 'lucide-react';

export default function PengajuanIzin() {
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [searchName, setSearchName] = useState('');
  
  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const { employee: currentEmployee } = useAuth();
  const isAdmin = currentEmployee?.role === 'HR' || currentEmployee?.role === 'Super Admin';
  const role = currentEmployee?.role || 'Karyawan';
  const isManager = role === 'Manager';
  const isKaryawan = role === 'Karyawan';

  useEffect(() => {
    if (currentEmployee && !isAdmin) {
      setEmployeeId(currentEmployee.id);
    }
  }, [currentEmployee, isAdmin]);
  const [permission_type, setPermission_type] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    let query = supabase.from('employees').select('id, full_name, employee_code, department_id').order('full_name');
    if (isKaryawan) {
      query = query.eq('id', currentEmployee?.id);
    } else if (isManager) {
      query = query.eq('department_id', currentEmployee?.department_id);
    }
    const { data } = await query;
    if (data) setEmployees(data);
  };

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from('permission_requests')
      .select('*, employees!inner(full_name, employee_code, department_id)')
      .order('created_at', { ascending: false });
      
    if (isKaryawan) {
      query = query.eq('employee_id', currentEmployee?.id);
    } else if (isManager) {
      query = query.eq('employees.department_id', currentEmployee?.department_id);
    }

    const { data, error } = await query;
      
    if (data) setData(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return alert('Pilih karyawan');
    
    const { error } = await supabase.from('permission_requests').insert([{
      employee_id: employeeId,
      status: 'Menunggu Persetujuan',
      permission_type,
      date,
      reason
    }]);

    if (!error) {
      setShowForm(false);
      setEmployeeId('');
      setPermission_type('');
      setDate('');
      setReason('');
      fetchData();
    } else {
      alert('Gagal menyimpan data');
      console.error(error);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, empId: string, date: string) => {
    const { error } = await supabase.from('permission_requests').update({ status: newStatus }).eq('id', id);
    if (!error) {
      // Jika disetujui, update attendance
      if (newStatus === 'Disetujui') {
        const check = await supabase.from('attendance').select('id').eq('employee_id', empId).eq('date', date).single();
        if (check.data) {
          await supabase.from('attendance').update({ status: 'Izin', notes: 'Disetujui sistem' }).eq('id', check.data.id);
        } else {
          await supabase.from('attendance').insert([{
            employee_id: empId,
            date: date,
            status: 'Izin',
            notes: 'Disetujui sistem'
          }]);
        }
      }
      fetchData();
    }
  };

  const filteredData = data.filter(item => {
    const matchName = item.employees?.full_name?.toLowerCase().includes(searchName.toLowerCase());
    
    const m = parseInt(filterMonth);
    const y = parseInt(filterYear);
    
    let prevMonth = m - 1;
    let prevYear = y;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    
    const startDateStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-21`;
    const endDateStr = `${y}-${m.toString().padStart(2, '0')}-20`;
    
    const dateField = item.date || item.start_date;
    const isWithinPeriod = dateField >= startDateStr && dateField <= endDateStr;

    return matchName && isWithinPeriod;
  }).sort((a, b) => {
    const dateA = new Date(a.date || a.start_date || 0).getTime();
    const dateB = new Date(b.date || b.start_date || 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Izin Full</h1>
          <p className="text-sm text-slate-500">Kelola pengajuan izin tidak masuk kerja.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="w-4 h-4 mr-2" /> Batal</> : <><Plus className="w-4 h-4 mr-2" /> Tambah Pengajuan</>}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
            {Array.from({ length: 12 }, (_, i) => {
              const month = (i + 1).toString().padStart(2, '0');
              return <option key={month} value={month}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>;
            })}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
            {Array.from({ length: 5 }, (_, i) => {
              const year = (new Date().getFullYear() - i).toString();
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
          <input type="text" placeholder="Cari Nama Karyawan..." value={searchName} onChange={(e) => setSearchName(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-[200px]" />
        </div>
        <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-lg font-semibold text-sm flex items-center border border-emerald-100">
          Total Pengajuan: {filteredData.length}
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Form Izin Full</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Karyawan</label>
                {!isKaryawan ? (
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
                ) : (
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600">
                    {currentEmployee?.full_name} ({currentEmployee?.employee_code})
                  </div>
                )}
              </div>
              
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Jenis Izin</label>
                <input required type="text" value={permission_type} onChange={e => setPermission_type(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tanggal Izin</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Alasan Izin</label>
                <textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"></textarea>
              </div>
              

              <Button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">Kirim Pengajuan</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Ref</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Memuat data...</TableCell></TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Belum ada pengajuan.</TableCell></TableRow>
              ) : (
                filteredData.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">REQ-{item.id.substring(0,6).toUpperCase()}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{item.employees?.full_name}</div>
                      <div className="text-xs text-slate-500">{item.employees?.employee_code}</div>
                    </TableCell>
                    
                    <TableCell>
                      {item.permission_type}
                    </TableCell>
                    
                    <TableCell>
                      {new Date(item.date).toLocaleDateString('id-ID')}
                    </TableCell>
                    
                    <TableCell>
                      {item.reason}
                    </TableCell>
                    
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        item.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10' :
                        item.status === 'Ditolak' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' :
                        'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10'
                      }`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === 'Menunggu Persetujuan' && (isAdmin || currentEmployee?.role === 'Manager') && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700 border-emerald-200" onClick={() => handleUpdateStatus(item.id, 'Disetujui', item.employee_id, item.date)}><Check className="w-4 h-4" /></Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 border-red-200" onClick={() => handleUpdateStatus(item.id, 'Ditolak', item.employee_id, item.date)}><XCircle className="w-4 h-4" /></Button>
                        </div>
                      )}
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
