import React, { useState, useEffect, useMemo } from 'react';
import { Download, Filter, Search, Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function RekapAbsensi() {
  const { employee: currentUser } = useAuth();
  const role = currentUser?.role || 'Karyawan';
  const isManagerOrKaryawan = role === 'Manager' || role === 'Karyawan';
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [workingDays, setWorkingDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [search, setSearch] = useState('');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formEmployee, setFormEmployee] = useState('all');
  const [formMonth, setFormMonth] = useState(month);
  const [formYear, setFormYear] = useState(year);
  const [formDays, setFormDays] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Employees
    let empQuery = supabase.from('employees').select('id, full_name, employee_code, department_id').order('employee_code', { ascending: false });
    if (role === 'Karyawan') {
      empQuery = empQuery.eq('id', currentUser?.id);
    } else if (role === 'Manager') {
      empQuery = empQuery.eq('department_id', currentUser?.department_id);
    }
    const { data: empData } = await empQuery;
    if (empData) setEmployees(empData);
    
    // Calculate period: 21st of prev month to 20th of current month
    const m = parseInt(month);
    const y = parseInt(year);
    
    let prevMonth = m - 1;
    let prevYear = y;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    
    const startDate = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-21`;
    const endDate = `${y}-${m.toString().padStart(2, '0')}-20`;

    // Fetch Attendance within period
    const { data: attData } = await supabase
      .from('attendance')
      .select('employee_id, status, date')
      .gte('date', startDate)
      .lte('date', endDate);
    if (attData) setAttendances(attData);

    // Fetch Working Days
    const { data: wdData } = await supabase
      .from('working_days')
      .select('employee_id, working_days_count')
      .eq('period_month', month.padStart(2, '0'))
      .eq('period_year', year);
    if (wdData) setWorkingDays(wdData);

    setLoading(false);
  };

  const handleAddWorkingDays = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDays) return alert("Isi jumlah hari kerja");
    setIsSubmitting(true);
    
    let inserts = [];
    if (formEmployee === 'all') {
      inserts = employees.map(emp => ({
        employee_id: emp.id,
        period_month: formMonth.padStart(2, '0'),
        period_year: formYear,
        working_days_count: parseInt(formDays)
      }));
    } else {
      inserts = [{
        employee_id: formEmployee,
        period_month: formMonth.padStart(2, '0'),
        period_year: formYear,
        working_days_count: parseInt(formDays)
      }];
    }

    const { error } = await supabase.from('working_days').upsert(inserts, { onConflict: 'employee_id, period_month, period_year' });
    
    setIsSubmitting(false);
    if (!error) {
      setShowModal(false);
      setFormDays('');
      fetchData();
    } else {
      alert("Gagal menyimpan data: " + error.message);
    }
  };

  const summaryData = useMemo(() => {
    if (!employees.length) return [];

    return employees.map(emp => {
      // Find working days
      const wd = workingDays.find(w => w.employee_id === emp.id);
      const jmlHariKerja = wd ? wd.working_days_count : 0;

      // Filter attendance
      const empAtt = attendances.filter(a => a.employee_id === emp.id);
      
      let telat = 0, wfh = 0, sakit = 0, izin = 0, izinSetengah = 0, cuti = 0, izinSepertiga = 0;
      
      empAtt.forEach(a => {
        if (a.status === 'Telat') telat++;
        if (a.status === 'WFH') wfh++;
        if (a.status === 'Sakit') sakit++;
        if (a.status === 'Izin') izin++;
        if (a.status === 'Setengah Hari') izinSetengah++;
        if (a.status === 'Izin 1/3 Hari') izinSepertiga++;
        if (a.status === 'Cuti') cuti++;
      });

      // Based on formula: Hadir = Jml Hari Kerja - (Sakit + Izin Full)
      const totalAbsence = sakit + izin;
      const hadir = Math.max(0, jmlHariKerja - totalAbsence);

      return {
        ...emp,
        jmlHariKerja,
        hadir,
        telat,
        wfh,
        sakit,
        izin,
        izinSetengah,
        izinSepertiga,
        cuti
      };
    }).filter(emp => {
      return emp.full_name.toLowerCase().includes(search.toLowerCase()) || 
             emp.employee_code.toLowerCase().includes(search.toLowerCase());
    });
  }, [employees, attendances, workingDays, search]);

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-800">Rekap Absensi Bulanan</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-700">
            Total Semua Akumulasi
          </Button>
          <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-700">
            <Download className="mr-2 h-4 w-4 text-emerald-600" />
            Download
          </Button>
          {!isManagerOrKaryawan && (
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white" onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Hari Kerja
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm w-full lg:w-auto">
          <CalendarIcon className="h-4 w-4 text-emerald-600 ml-2" />
          <select 
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-transparent text-sm font-medium border-none focus:ring-0 cursor-pointer text-slate-700"
          >
            {monthNames.map((m, i) => (
              <option key={i+1} value={(i+1).toString()}>{m}</option>
            ))}
          </select>
          <select 
            value={year}
            onChange={e => setYear(e.target.value)}
            className="bg-transparent text-sm font-medium border-none focus:ring-0 cursor-pointer text-slate-700"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>
        </div>
        
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama/NIK..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="overflow-auto max-h-[600px]">
          <Table className="w-full text-sm text-left whitespace-nowrap">
            <TableHeader className="bg-[#cbf5e6] sticky top-0 z-10">
              <TableRow className="border-b-0 hover:bg-[#cbf5e6]">
                <TableHead className="px-4 py-3 font-bold text-emerald-800 uppercase text-[10px]">KARYAWAN</TableHead>
                <TableHead className="px-4 py-3 font-bold text-emerald-800 uppercase text-[10px] text-center">PERIODE</TableHead>
                <TableHead className="px-4 py-3 font-bold text-emerald-800 uppercase text-[10px] text-center">JML HARI KERJA</TableHead>
                <TableHead className="px-4 py-3 font-bold text-emerald-800 uppercase text-[10px] text-center">HADIR</TableHead>
                <TableHead className="px-4 py-3 font-bold text-amber-500 uppercase text-[10px] text-center">TELAT</TableHead>
                <TableHead className="px-4 py-3 font-bold text-emerald-600 uppercase text-[10px] text-center">WFH</TableHead>
                <TableHead className="px-4 py-3 font-bold text-red-500 uppercase text-[10px] text-center">SAKIT</TableHead>
                <TableHead className="px-4 py-3 font-bold text-blue-400 uppercase text-[10px] text-center">IZIN FULL</TableHead>
                <TableHead className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">IZIN 1/2</TableHead>
                <TableHead className="px-4 py-3 font-bold text-orange-500 uppercase text-[10px] text-center">IZIN 1/3</TableHead>
                <TableHead className="px-4 py-3 font-bold text-purple-500 uppercase text-[10px] text-center">CUTI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-slate-500">Memuat data...</TableCell>
                </TableRow>
              ) : summaryData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-slate-500">Tidak ada data absensi.</TableCell>
                </TableRow>
              ) : (
                summaryData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{row.full_name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{row.employee_code}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        21 {monthNames[parseInt(month) === 1 ? 11 : parseInt(month)-2]} - 20 {monthNames[parseInt(month)-1]}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold text-slate-800">{row.jmlHariKerja}</TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold text-emerald-600">{row.hadir}</TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold text-amber-500">{row.telat}</TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold text-emerald-600">{row.wfh}</TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold text-red-500">{row.sakit}</TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold text-blue-400">{row.izin}</TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold text-slate-500">{row.izinSetengah}</TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold text-orange-500">{row.izinSepertiga}</TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold text-purple-500">{row.cuti}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal Tambah Hari Kerja */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 shadow-lg bg-white">
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-bold text-slate-800">Tambah Hari Kerja</CardTitle>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddWorkingDays} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Karyawan</label>
                  <select 
                    value={formEmployee} 
                    onChange={e => setFormEmployee(e.target.value)} 
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="all">Semua Karyawan</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Periode Bulan</label>
                    <select 
                      value={formMonth} 
                      onChange={e => setFormMonth(e.target.value)} 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    >
                      {monthNames.map((m, i) => (
                        <option key={i+1} value={(i+1).toString()}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Tahun</label>
                    <select 
                      value={formYear} 
                      onChange={e => setFormYear(e.target.value)} 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    >
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Jumlah Hari Kerja</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={formDays} 
                    onChange={e => setFormDays(e.target.value)} 
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Contoh: 22"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
