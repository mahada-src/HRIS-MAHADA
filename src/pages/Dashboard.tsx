import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function Dashboard() {
  const { employee: currentUser } = useAuth();
  const role = currentUser?.role || 'Karyawan';
  const isManager = role === 'Manager' || role === 'Ass Super Admin';
  const [stats, setStats] = useState([
    { title: 'Total Karyawan', value: '-', subtitle: 'Memuat...', subtitleColor: 'text-slate-500' },
    { title: 'Hadir Hari Ini', value: '-', subtitle: 'Memuat...', subtitleColor: 'text-slate-500' },
    { title: 'Perlu Persetujuan', value: '-', subtitle: 'Pengajuan Aktif', subtitleColor: 'text-amber-600' },
    { title: 'Terlambat', value: '-', subtitle: 'Hari Ini', subtitleColor: 'text-red-600' },
  ]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [probationEvaluations, setProbationEvaluations] = useState<any[]>([]);
  const [internshipEvaluations, setInternshipEvaluations] = useState<any[]>([]);
  const [deptLemburData, setDeptLemburData] = useState<any[]>([]);
  const [personLemburData, setPersonLemburData] = useState<any[]>([]);
  
  // Filter state
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [departmentId, setDepartmentId] = useState('all');
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    if (isManager && currentUser?.department_id) {
      setDepartmentId(currentUser.department_id);
    }
  }, [isManager, currentUser]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (isManager && departmentId === 'all') return;
    fetchDashboardData();
  }, [month, year, departmentId, isManager]);

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('id, name');
    if (data) setDepartments(data);
  };

  const fetchDashboardData = async () => {
    // Karyawan
    let empQuery = supabase.from('employees').select('id, department_id, employment_status');
    if (role === 'Karyawan') {
      empQuery = empQuery.eq('id', currentUser?.id);
    } else if (departmentId !== 'all') {
      empQuery = empQuery.eq('department_id', departmentId);
    }
    // Tanggal untuk filter chart (Periode 21 bulan sebelumnya sd 20 bulan ini)
    const m = parseInt(month);
    const y = parseInt(year);
    
    let prevMonth = m - 1;
    let prevYear = y;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    
    const startDate = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-21`;
    const endDate = `${y}-${month.padStart(2, '0')}-20`;

    // Hadir & Terlambat hari ini
    const today = new Date().toISOString().split('T')[0];
    let attQuery = supabase.from('attendance').select('status, date, employees!inner(department_id)').gte('date', startDate).lte('date', endDate);
    if (role === 'Karyawan') {
      attQuery = attQuery.eq('employee_id', currentUser?.id);
    } else if (departmentId !== 'all') {
      attQuery = attQuery.eq('employees.department_id', departmentId);
    }

    // Menunggu persetujuan dan Data pengajuan untuk chart
    const requestTablesConfig = [
      { table: 'sick_requests', type: 'Sakit', label: 'Sakit', dateCol: 'start_date' },
      { table: 'permission_requests', type: 'Izin', label: 'Izin Full', dateCol: 'date' },
      { table: 'half_day_requests', type: 'Izin Setengah Hari', label: 'Izin 1/2', dateCol: 'date' },
      { table: 'one_third_day_requests', type: 'Izin Sepertiga Hari', label: 'Izin 1/3', dateCol: 'date' },
      { table: 'late_requests', type: 'Telat', label: 'Telat', dateCol: 'date' },
      { table: 'wfh_requests', type: 'WFH', label: 'WFH', dateCol: 'date' },
      { table: 'leave_requests', type: 'Cuti', label: 'Cuti', dateCol: 'start_date' },
      { table: 'overtime_requests', type: 'Lembur', label: 'Lembur', dateCol: 'date' }
    ];

    // Investasi Ikatan Dinas
    let invQuery = supabase.from('business_trip_bonds').select('nominal, employees!inner(department_id)');
    if (role === 'Karyawan') {
      invQuery = invQuery.eq('employee_id', currentUser?.id);
    } else if (departmentId !== 'all') {
      invQuery = invQuery.eq('employees.department_id', departmentId);
    }

    // Pelanggaran Aktif
    let violQuery = supabase.from('violations').select('date, employees!inner(department_id)');
    if (role === 'Karyawan') {
      violQuery = violQuery.eq('employee_id', currentUser?.id);
    } else if (departmentId !== 'all') {
      violQuery = violQuery.eq('employees.department_id', departmentId);
    }

    const [emp, att, invResult, violResult, ...reqResults] = await Promise.all([
      empQuery,
      attQuery,
      invQuery,
      violQuery,
      ...requestTablesConfig.map(async (rt) => {
        let qPending = supabase.from(rt.table).select('*, employees!inner(full_name, department_id)').eq('status', 'Menunggu Persetujuan');
        let qPeriod = supabase.from(rt.table).select('*, employees!inner(full_name, department_id)').gte(rt.dateCol, startDate).lte(rt.dateCol, endDate);
        
        if (role === 'Karyawan') {
          qPending = qPending.eq('employee_id', currentUser?.id);
          qPeriod = qPeriod.eq('employee_id', currentUser?.id);
        } else if (departmentId !== 'all') {
          qPending = qPending.eq('employees.department_id', departmentId);
          qPeriod = qPeriod.eq('employees.department_id', departmentId);
        }
        
        const [resPending, resPeriod] = await Promise.all([qPending, qPeriod]);
        return { config: rt, pendingData: resPending.data || [], periodData: resPeriod.data || [] };
      })
    ]);

    const allEmps = emp.data || [];
    const empCount = allEmps.length;
    const activeEmpCount = allEmps.filter(e => e.status_karyawan === 'Aktif' || !e.status_karyawan).length;

    // Distribusi Departemen
    if (departmentId === 'all') {
      const { data: depts } = await supabase.from('departments').select('id, name');
      if (depts) {
        const dData = depts.map(d => ({
          name: d.name,
          value: allEmps.filter(e => e.department_id === d.id && (e.status_karyawan === 'Aktif' || !e.status_karyawan)).length
        })).filter(d => d.value > 0);
        setDeptData(dData);
      }
    }

    const allAtt = att.data || [];
    
    const todayAtt = allAtt.filter(a => a.date === today);
    const hadirCount = todayAtt.filter(a => a.status === 'Hadir').length;
    const telatCount = todayAtt.filter(a => a.status === 'Telat').length;

    // Rekap Absensi Chart (Berdasarkan Pengajuan)
    const statusCounts: Record<string, number> = {
      'Sakit': 0, 'Izin Full': 0, 'Izin 1/2': 0, 'Izin 1/3': 0, 'Telat': 0, 'WFH': 0, 'Cuti': 0, 'Lembur': 0
    };

    let allPending: any[] = [];
    
    reqResults.forEach(res => {
      // Add to pending list
      const pendingItems = res.pendingData.map((d: any) => ({ ...d, requestType: res.config.type }));
      allPending = allPending.concat(pendingItems);
      
      // Count for period chart
      statusCounts[res.config.label] += res.periodData.length;
    });

    const chartData = Object.keys(statusCounts).map(key => ({
      name: key,
      total: statusCounts[key]
    })).filter(item => item.total > 0);
    setAttendanceData(chartData);

    allPending.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const pendingCount = allPending.length;

    const invData = invResult.data || [];
    const totalInvestasi = invData.reduce((acc: number, curr: any) => acc + (parseFloat(curr.nominal) || 0), 0);
    const formatRupiah = (angka: number) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    const violData = violResult.data || [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const activeViolationsCount = violData.filter((v: any) => new Date(v.date) >= sixMonthsAgo).length;

    const overtimeData = reqResults.find(r => r.config.table === 'overtime_requests')?.periodData || [];
    const totalMenitEfektif = overtimeData.reduce((acc: number, curr: any) => acc + (curr.menit_efektif || 0), 0);
    const biayaLembur = Math.floor(totalMenitEfektif * (15000 / 60));

    const { data: deptsList } = await supabase.from('departments').select('id, name');
    const depts = deptsList || [];
    const deptLemburMap: Record<string, number> = {};
    const personLemburMap: Record<string, { total: number, name: string, fullName: string }> = {};

    overtimeData.forEach((req: any) => {
        const nominal = (req.menit_efektif || 0) * (15000 / 60);
        if (nominal > 0) {
            const deptId = req.employees?.department_id;
            const deptName = depts.find(d => d.id === deptId)?.name || 'Unknown';
            const fullName = req.employees?.full_name || 'Unknown';

            deptLemburMap[deptName] = (deptLemburMap[deptName] || 0) + nominal;
            
            if (!personLemburMap[fullName]) {
                personLemburMap[fullName] = { 
                    total: 0, 
                    name: fullName.split(' ')[0], 
                    fullName 
                };
            }
            personLemburMap[fullName].total += nominal;
        }
    });

    setDeptLemburData(Object.entries(deptLemburMap).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total));
    setPersonLemburData(Object.values(personLemburMap).sort((a, b) => b.total - a.total));

    setStats([
      { title: 'Total Karyawan', value: activeEmpCount.toString(), subtitle: 'Karyawan Aktif', subtitleColor: 'text-emerald-600' },
      { title: 'Perlu Persetujuan', value: pendingCount.toString(), subtitle: 'Pengajuan Aktif', subtitleColor: 'text-amber-600' },
      { title: 'Total Pelanggaran', value: activeViolationsCount.toString(), subtitle: 'Pelanggaran Aktif', subtitleColor: 'text-red-600' },
      { title: 'Biaya Lembur', value: formatRupiah(biayaLembur), subtitle: 'Bulan Ini', subtitleColor: 'text-purple-600' },
      { title: 'Investasi', value: formatRupiah(totalInvestasi), subtitle: role === 'Super Admin' && departmentId === 'all' ? 'Total Seluruh' : 'Total Departemen', subtitleColor: 'text-blue-600' },
    ]);

    setRecentRequests(allPending.slice(0, 10));

    // Evaluasi Probation & Internship
    let evalQuery = supabase.from('employees').select('id, full_name, employee_code, tgl_probation, employment_status, departments(name), positions(title)').in('employment_status', ['Probation', 'Internship', 'Kontrak']);
    if (role === 'Karyawan') {
      evalQuery = evalQuery.eq('id', currentUser?.id);
    } else if (departmentId !== 'all') {
      evalQuery = evalQuery.eq('department_id', departmentId);
    }
    const { data: evalEmps } = await evalQuery;
    
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);
    const probList: any[] = [];
    const internList: any[] = [];

    (evalEmps || []).forEach(emp => {
      if (!emp.tgl_probation) return;
      const probDate = new Date(emp.tgl_probation);
      probDate.setHours(0,0,0,0);
      
      const targetDate = new Date(probDate);
      targetDate.setMonth(targetDate.getMonth() + 3);
      
      const warningDate = new Date(targetDate);
      warningDate.setDate(warningDate.getDate() - 7);
      
      if (todayDate >= warningDate) {
        if (emp.employment_status === 'Probation') {
          probList.push(emp);
        } else {
          internList.push(emp);
        }
      }
    });

    setProbationEvaluations(probList);
    setInternshipEvaluations(internList);
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
            disabled={isManager}
            className="bg-transparent text-sm font-medium border-none focus:ring-0 cursor-pointer text-slate-700 disabled:opacity-50"
          >
            <option value="all">Semua Departemen</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card 
            key={stat.title}
            className={stat.title === 'Perlu Persetujuan' ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""}
            onClick={() => {
              if (stat.title === 'Perlu Persetujuan') {
                document.getElementById('pending-requests-section')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="border-b border-slate-100 p-4">
            <CardTitle className="text-sm font-bold text-slate-700">Nominal Lembur per Departemen</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[300px] w-full">
              {deptLemburData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptLemburData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `Rp${value / 1000}k`} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)} />
                    <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">Belum ada data lembur</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card id="pending-requests-section" className="flex flex-col">
          <CardHeader className="border-b border-slate-100 p-4">
            <CardTitle className="text-sm font-bold text-slate-700">Pengajuan Menunggu Persetujuan</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-auto max-h-[332px]">
            <div className="grid sm:grid-cols-1 gap-4">
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
                <p className="text-sm text-slate-500 italic">Tidak ada pengajuan yang menunggu persetujuan.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-col">
        <CardHeader className="border-b border-slate-100 p-4">
          <CardTitle className="text-sm font-bold text-slate-700">Nominal Lembur per Orang</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[300px] w-full">
            {personLemburData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personLemburData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `Rp${value / 1000}k`} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)} labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label} />
                  <Bar dataKey="total" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Belum ada data lembur</div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="flex flex-col shadow-sm border-0 bg-white">
          <CardHeader className="border-b border-slate-100 p-4 bg-emerald-50/50">
            <CardTitle className="text-sm font-bold text-emerald-800">Evaluasi Probation</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto max-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium">Karyawan</th>
                  <th className="px-4 py-3 font-medium">Tgl Probation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {probationEvaluations.length > 0 ? probationEvaluations.map((emp, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-700">{emp.full_name}</p>
                      <p className="text-xs text-slate-500">{emp.departments?.name || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">
                        {new Date(emp.tgl_probation).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-slate-500 italic">Tidak ada evaluasi probation saat ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="flex flex-col shadow-sm border-0 bg-white">
          <CardHeader className="border-b border-slate-100 p-4 bg-blue-50/50">
            <CardTitle className="text-sm font-bold text-blue-800">Evaluasi Internship / Kontrak</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto max-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium">Karyawan</th>
                  <th className="px-4 py-3 font-medium">Tgl Masuk/Kontrak</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {internshipEvaluations.length > 0 ? internshipEvaluations.map((emp, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-700">{emp.full_name}</p>
                      <p className="text-xs text-slate-500">{emp.departments?.name || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                        {new Date(emp.tgl_probation).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {emp.employment_status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500 italic">Tidak ada evaluasi internship/kontrak saat ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
