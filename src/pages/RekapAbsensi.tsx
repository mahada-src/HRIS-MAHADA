import React, { useState, useEffect } from 'react';
import { Download, Filter, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Attendance } from '../types';

export default function RekapAbsensi() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [departmentId, setDepartmentId] = useState('all');
  const [search, setSearch] = useState('');

  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchDepartments();
    fetchData();
  }, [month, year, departmentId]);

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('id, name');
    if (data) setDepartments(data);
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Construct date range for the selected month and year
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

    let query = supabase
      .from('attendance')
      .select(`
        *,
        employees!inner (
          full_name,
          employee_code,
          department_id
        )
      `)
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date', { ascending: false });

    if (departmentId !== 'all') {
      query = query.eq('employees.department_id', departmentId);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
    } else {
      setAttendances(data || []);
    }
    setLoading(false);
  };

  const filteredAttendances = attendances.filter(a => {
    const matchSearch = a.employees.full_name.toLowerCase().includes(search.toLowerCase()) || 
                        a.employees.employee_code.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Rekap Absensi</h1>
          <p className="text-sm text-slate-500">Pantau dan kelola data kehadiran karyawan.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm w-full lg:w-auto">
          <CalendarIcon className="h-4 w-4 text-slate-400 ml-2" />
          <select 
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-transparent text-sm font-medium border-none focus:ring-0 cursor-pointer"
          >
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
          <select 
            value={year}
            onChange={e => setYear(e.target.value)}
            className="bg-transparent text-sm font-medium border-none focus:ring-0 cursor-pointer"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        <select 
          value={departmentId}
          onChange={e => setDepartmentId(e.target.value)}
          className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="all">Semua Departemen</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama/NIK..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden shadow-sm">
        <CardHeader className="border-b border-slate-100 p-4">
          <CardTitle className="text-sm font-bold text-slate-700">Data Kehadiran</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div className="flex-1 overflow-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">Memuat data absensi...</TableCell>
                </TableRow>
              ) : filteredAttendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">Tidak ada data absensi pada periode ini.</TableCell>
                </TableRow>
              ) : (
                filteredAttendances.map((absen) => (
                  <TableRow key={absen.id}>
                    <TableCell className="whitespace-nowrap font-medium text-slate-700">
                      {new Date(absen.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800">{absen.employees.full_name}</p>
                      <p className="text-xs text-slate-500">{absen.employees.employee_code}</p>
                    </TableCell>
                    <TableCell>{absen.check_in ? new Date(absen.check_in).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'}</TableCell>
                    <TableCell>{absen.check_out ? new Date(absen.check_out).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        absen.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' :
                        absen.status === 'Telat' ? 'bg-amber-50 text-amber-700 ring-amber-600/10' :
                        absen.status === 'Sakit' || absen.status === 'Izin' ? 'bg-blue-50 text-blue-700 ring-blue-600/10' :
                        'bg-red-50 text-red-700 ring-red-600/10'
                      }`}>
                        {absen.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 max-w-[200px] truncate" title={absen.notes || ''}>
                      {absen.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-white p-4">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-medium text-slate-900">{filteredAttendances.length}</span> data absensi
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
