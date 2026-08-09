import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState([
    { title: 'Total Karyawan', value: '-', subtitle: 'Memuat...', subtitleColor: 'text-slate-500' },
    { title: 'Hadir Hari Ini', value: '-', subtitle: 'Memuat...', subtitleColor: 'text-slate-500' },
    { title: 'Perlu Persetujuan', value: '-', subtitle: 'Pengajuan Aktif', subtitleColor: 'text-amber-600' },
    { title: 'Terlambat', value: '-', subtitle: 'Hari Ini', subtitleColor: 'text-red-600' },
  ]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  
  // Filter state
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [departmentId, setDepartmentId] = useState('all');
  const [departments, setDepartments] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [month, year, departmentId]);

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('id, name');
    if (data) setDepartments(data);
  };

  const fetchDashboardData = async () => {
    // Karyawan
    let empQuery = supabase.from('employees').select('id, department_id, employment_status');
    if (departmentId !== 'all') {
      empQuery = empQuery.eq('department_id', departmentId);
    }
    const emp = await empQuery;
    const allEmps = emp.data || [];
    const empCount = allEmps.length;
    const activeEmpCount = allEmps.filter(e => e.employment_status !== 'Resign').length;

    // Distribusi Departemen
    if (departmentId === 'all') {
      const { data: depts } = await supabase.from('departments').select('id, name');
      if (depts) {
        const dData = depts.map(d => ({
          name: d.name,
          value: allEmps.filter(e => e.department_id === d.id).length
        })).filter(d => d.value > 0);
        setDeptData(dData);
      }
    }

    // Tanggal untuk filter chart
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

    // Hadir & Terlambat hari ini
    const today = new Date().toISOString().split('T')[0];
    let attQuery = supabase.from('attendance').select('status, date, employees!inner(department_id)').gte('date', startDate).lt('date', endDate);
    if (departmentId !== 'all') {
      attQuery = attQuery.eq('employees.department_id', departmentId);
    }
    const att = await attQuery;
    const allAtt = att.data || [];
    
    const todayAtt = allAtt.filter(a => a.date === today);
    const hadirCount = todayAtt.filter(a => a.status === 'Hadir').length;
    const telatCount = todayAtt.filter(a => a.status === 'Telat').length;

    // Rekap Absensi Chart
    const statusCounts: Record<string, number> = {
      'Hadir': 0, 'Sakit': 0, 'Izin': 0, 'Telat': 0, 'Cuti': 0, 'Lembur': 0, 'Setengah Hari': 0, 'WFH': 0
    };
    allAtt.forEach(a => {
      if (statusCounts[a.status] !== undefined) {
        statusCounts[a.status]++;
      }
    });

    const chartData = Object.keys(statusCounts).map(key => ({
      name: key,
      total: statusCounts[key]
    })).filter(item => item.total > 0);
    setAttendanceData(chartData);

    // Menunggu persetujuan
    const requestTables = [
      { table: 'sick_requests', type: 'Sakit' },
      { table: 'permission_requests', type: 'Izin' },
      { table: 'late_requests', type: 'Telat' },
      { table: 'half_day_requests', type: 'Izin Setengah Hari' },
      { table: 'leave_requests', type: 'Cuti' },
      { table: 'wfh_requests', type: 'WFH' },
      { table: 'overtime_requests', type: 'Lembur' }
    ];

    const reqPromises = requestTables.map(async (rt) => {
      let query = supabase.from(rt.table).select('*, employees!inner(full_name, department_id)').eq('status', 'Menunggu Persetujuan');
      if (departmentId !== 'all') {
        query = query.eq('employees.department_id', departmentId);
      }
      const { data } = await query;
      return (data || []).map(d => ({ ...d, requestType: rt.type }));
    });

    const reqResults = await Promise.all(reqPromises);
    const allPending = reqResults.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const pendingCount = allPending.length;

    setStats([
      { title: 'Total Karyawan', value: activeEmpCount.toString(), subtitle: 'Karyawan Aktif', subtitleColor: 'text-emerald-600' },
      { title: 'Hadir Hari Ini', value: hadirCount.toString(), subtitle: 'Sesuai Jadwal', subtitleColor: 'text-emerald-600' },
      { title: 'Perlu Persetujuan', value: pendingCount.toString(), subtitle: 'Pengajuan Aktif', subtitleColor: 'text-amber-600' },
      { title: 'Terlambat', value: telatCount.toString(), subtitle: 'Hari Ini', subtitleColor: 'text-red-600' },
    ]);

    setRecentRequests(allPending.slice(0, 10));
  };

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Ringkasan aktivitas HRIS Anda.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm w-full lg:w-auto">
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
            className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Departemen</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <p className="mb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase">{stat.title}</p>
              <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
              <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${stat.subtitleColor}`}>
                <span>{stat.subtitle}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 flex flex-col">
          <CardHeader className="border-b border-slate-100 p-4">
            <CardTitle className="text-sm font-bold text-slate-700">Rekap Absensi (Bulan Ini)</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[300px] w-full">
              {attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">Belum ada data absensi</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 flex flex-col">
          <CardHeader className="border-b border-slate-100 p-4">
            <CardTitle className="text-sm font-bold text-slate-700">Distribusi Departemen</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            <div className="h-[300px] w-full">
              {deptData.length > 0 && departmentId === 'all' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400 text-center">
                  {departmentId !== 'all' ? 'Pilih Semua Departemen untuk melihat distribusi' : 'Belum ada data departemen'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="border-b border-slate-100 p-4">
          <CardTitle className="text-sm font-bold text-slate-700">Pengajuan Menunggu Persetujuan</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentRequests.length > 0 ? recentRequests.map((r, i) => (
              <div key={i} className="flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    {r.requestType}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">{new Date(r.created_at).toLocaleDateString('id-ID')}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{r.employees?.full_name}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.reason || r.target_work || '-'}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic col-span-3">Tidak ada pengajuan yang menunggu persetujuan.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
