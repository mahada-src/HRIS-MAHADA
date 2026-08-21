import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import { Employee } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import { Plus, X, Check, XCircle, Edit2, Eye, Download, Trash2 } from 'lucide-react';

const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const totalMins1 = h1 * 60 + m1;
  let totalMins2 = h2 * 60 + m2;
  if (totalMins2 < totalMins1) totalMins2 += 24 * 60; // cross midnight
  return totalMins2 - totalMins1;
};

export default function PengajuanLembur() {
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  
  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const { employee: currentEmployee } = useAuth();
  const isAdmin = currentEmployee?.role === 'HR' || currentEmployee?.role === 'Super Admin';
  const role = currentEmployee?.role || 'Karyawan';
  const isManager = role === 'Manager' || role === 'Ass Super Admin';
  const isKaryawan = role === 'Karyawan';

  // Preview Pekerjaan Modal
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState('');

  // Edit Menit Efektif State
  const [editEfektifId, setEditEfektifId] = useState<string | null>(null);
  const [efektifMins, setEfektifMins] = useState<string>('');

  useEffect(() => {
    if (currentEmployee && !isAdmin) {
      setEmployeeId(currentEmployee.id);
    }
  }, [currentEmployee, isAdmin]);
  const [date, setDate] = useState('');
  const [start_time, setStart_time] = useState('');
  const [end_time, setEnd_time] = useState('');
  const [target_work, setTarget_work] = useState('');

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    let query = supabase.from('employees').select('id, full_name, employee_code, department_id, employment_status').order('full_name');
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
      .from('overtime_requests')
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
    
    const { error } = await supabase.from('overtime_requests').insert([{
      employee_id: employeeId,
      status: 'Menunggu Persetujuan',
      date,
      start_time,
      end_time,
      target_work
    }]);

    if (!error) {
      setShowForm(false);
      setEmployeeId('');
      setDate('');
      setStart_time('');
      setEnd_time('');
      setTarget_work('');
      fetchData();
    } else {
      alert('Gagal menyimpan data');
      console.error(error);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, empId: string, date: string) => {
    const { error } = await supabase.from('overtime_requests').update({ status: newStatus }).eq('id', id);
    if (!error) {
      // Jika disetujui, update attendance
      if (newStatus === 'Disetujui') {
        const check = await supabase.from('attendance').select('id').eq('employee_id', empId).eq('date', date).single();
        if (check.data) {
          await supabase.from('attendance').update({ status: 'Lembur', notes: 'Disetujui sistem' }).eq('id', check.data.id);
        } else {
          await supabase.from('attendance').insert([{
            employee_id: empId,
            date: date,
            status: 'Lembur',
            notes: 'Disetujui sistem'
          }]);
        }
      }
      if (notifError) console.error(notifError);
      fetchData();
    }
  };

  const handleDelete = async (id: string, empId: string, date: string) => {
    if (!window.confirm('Yakin ingin menghapus pengajuan ini?')) return;
    
    const { error } = await supabase.from('overtime_requests').delete().eq('id', id);
    if (!error) {
      await supabase.from('attendance').delete().eq('employee_id', empId).eq('date', date);
      fetchData();
    } else {
      alert('Gagal menghapus pengajuan');
    }
  };

  const handleUpdateEfektif = async (id: string) => {
    if (isKaryawan) return; // Karyawan tidak boleh edit

    const { error } = await supabase.from('overtime_requests').update({
      menit_efektif: parseInt(efektifMins) || null
    }).eq('id', id);

    if (!error) {
      setEditEfektifId(null);
      fetchData();
    } else {
      alert("Gagal memperbarui menit efektif: " + error.message);
    }
  };

  const filteredData = data.filter(item => {
    const matchEmployee = filterEmployeeId === '' || item.employee_id === filterEmployeeId;
    const itemDate = new Date(item.date);
    const matchMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
    const matchYear = itemDate.getFullYear().toString() === filterYear;
    return matchEmployee && matchMonth && matchYear;
  }).sort((a, b) => {
    const dateA = new Date(a.date || a.start_date || 0).getTime();
    const dateB = new Date(b.date || b.start_date || 0).getTime();
    return dateB - dateA;
  });

  const totalHariLembur = new Set(filteredData.map(item => `${item.employee_id}_${item.date}`)).size;
  const totalDurasiMenit = filteredData.reduce((total, item) => total + calculateDuration(item.start_time, item.end_time), 0);
  const totalMenitEfektif = filteredData.reduce((total, item) => total + (item.menit_efektif || 0), 0);

  const handleDownload = () => {
    const headers = ['No. Ref', 'NIK', 'Nama Karyawan', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Durasi (Menit)', 'Target Pekerjaan', 'Menit Efektif', 'Status'];
    const csvData = filteredData.map(item => [
      `REQ-${item.id.substring(0, 6).toUpperCase()}`,
      item.employees?.employee_code || '',
      `"${item.employees?.full_name || ''}"`,
      new Date(item.date).toLocaleDateString('id-ID'),
      item.start_time,
      item.end_time,
      calculateDuration(item.start_time, item.end_time),
      `"${(item.target_work || '').replace(/"/g, '""')}"`,
      item.menit_efektif || 0,
      item.status
    ]);
    
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const monthName = new Date(0, parseInt(filterMonth) - 1).toLocaleString('id-ID', { month: 'long' });
    let empName = "Semua Karyawan";
    if (filterEmployeeId) {
       const emp = employees.find(e => e.id === filterEmployeeId);
       if (emp) empName = emp.full_name;
    }
    link.download = `Rekapan Lembur - ${empName} - ${monthName} ${filterYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Pengajuan Lembur</h1>
          <p className="text-sm text-slate-500">Kelola pengajuan jam lembur kerja ekstra.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="w-4 h-4 mr-2" /> Batal</> : <><Plus className="w-4 h-4 mr-2" /> Tambah Pengajuan</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-2">
        <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-sm text-emerald-600 font-medium">Jumlah Hari Lembur</div>
            <div className="text-2xl font-bold text-emerald-800">{totalHariLembur} <span className="text-sm font-normal text-emerald-600">Hari</span></div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-sm text-blue-600 font-medium">Jumlah Durasi Menit</div>
            <div className="text-2xl font-bold text-blue-800">{totalDurasiMenit} <span className="text-sm font-normal text-blue-600">Menit</span></div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-sm text-amber-600 font-medium">Jumlah Menit Efektif</div>
            <div className="text-2xl font-bold text-amber-800">{totalMenitEfektif} <span className="text-sm font-normal text-amber-600">Menit</span></div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-sm text-purple-600 font-medium">Biaya Lembur</div>
            <div className="text-2xl font-bold text-purple-800">
              <span className="text-sm font-normal text-purple-600 mr-1">Rp</span>
              {new Intl.NumberFormat('id-ID').format(Math.floor(totalMenitEfektif * (15000 / 60)))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
            {Array.from({ length: 12 }, (_, i) => {
              const month = (i + 1).toString().padStart(2, '0');
              return <option key={month} value={month}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>;
            })}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
            {Array.from({ length: 5 }, (_, i) => {
              const year = (new Date().getFullYear() - i).toString();
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
          <select value={filterEmployeeId} onChange={(e) => setFilterEmployeeId(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white min-w-[200px]">
            <option value="">Semua Karyawan</option>
            {employees.filter(emp => emp.employment_status !== 'Resign').map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download Rekapan
          </Button>
          <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-lg font-semibold text-sm flex items-center border border-emerald-100">
            Total Pengajuan: {filteredData.length}
          </div>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Form Pengajuan Lembur</CardTitle>
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
                <label className="text-sm font-medium text-slate-700">Tanggal Lembur</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Jam Mulai</label>
                <input required type="time" value={start_time} onChange={e => setStart_time(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Jam Selesai</label>
                <input required type="time" value={end_time} onChange={e => setEnd_time(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Target Pekerjaan / Alasan</label>
                <textarea required rows={3} value={target_work} onChange={e => setTarget_work(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"></textarea>
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
                <TableHead>Tanggal</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead>Selesai</TableHead>
                <TableHead>Durasi (Mnt)</TableHead>
                <TableHead>Pekerjaan</TableHead>
                <TableHead>Menit Efektif</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Memuat data...</TableCell></TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Belum ada pengajuan.</TableCell></TableRow>
              ) : (
                filteredData.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">REQ-{item.id.substring(0,6).toUpperCase()}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{item.employees?.full_name}</div>
                      <div className="text-xs text-slate-500">{item.employees?.employee_code}</div>
                    </TableCell>
                    
                    <TableCell>
                      {new Date(item.date).toLocaleDateString('id-ID')}
                    </TableCell>
                    
                    <TableCell>
                      {item.start_time}
                    </TableCell>
                    
                    <TableCell>
                      {item.end_time}
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-semibold text-slate-700">{calculateDuration(item.start_time, item.end_time)}</span>
                    </TableCell>

                    <TableCell className="max-w-[200px]">
                      <div className="truncate whitespace-nowrap overflow-hidden text-sm text-slate-600">
                        {item.target_work}
                      </div>
                      <button onClick={() => { setSelectedWork(item.target_work); setShowWorkModal(true); }} className="text-[10px] text-emerald-600 font-medium mt-0.5 hover:underline flex items-center">
                        <Eye className="w-3 h-3 mr-1" /> Preview
                      </button>
                    </TableCell>
                    
                    <TableCell>
                      {editEfektifId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 text-xs border border-emerald-300 rounded focus:outline-none" 
                            value={efektifMins} 
                            onChange={(e) => setEfektifMins(e.target.value)} 
                          />
                          <button onClick={() => handleUpdateEfektif(item.id)} className="text-emerald-600 hover:text-emerald-700">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditEfektifId(null)} className="text-red-500 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{item.menit_efektif !== null ? item.menit_efektif : '-'}</span>
                          {item.status === 'Disetujui' && !isKaryawan && (
                            <button onClick={() => { setEditEfektifId(item.id); setEfektifMins(item.menit_efektif?.toString() || ''); }} className="text-slate-400 hover:text-emerald-600">
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
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
                      <div className="flex justify-end gap-2">
                        {item.status === 'Menunggu Persetujuan' && (isAdmin || currentEmployee?.role === 'Manager') ? (
                          <>
                            <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700 border-emerald-200" onClick={() => handleUpdateStatus(item.id, 'Disetujui', item.employee_id, item.date)}><Check className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 border-red-200" onClick={() => handleUpdateStatus(item.id, 'Ditolak', item.employee_id, item.date)}><XCircle className="w-4 h-4" /></Button>
                          </>
                        ) : (
                          !isAdmin && <span className="text-slate-400 text-xs">-</span>
                        )}
                        {isAdmin && (
                          <Button size="sm" variant="outline" className="text-pink-600 hover:text-pink-700 border-pink-200 hover:bg-pink-50" onClick={() => handleDelete(item.id, item.employee_id, item.date)}><Trash2 className="w-4 h-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Preview Pekerjaan */}
      {showWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl bg-white rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-bold text-slate-800">Detail Pekerjaan Lembur</CardTitle>
              <button onClick={() => setShowWorkModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                {selectedWork}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
