const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const newImports = `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';`;

content = content.replace(`import React from 'react';\nimport { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';\nimport { Users, UserCheck, UserX, Clock } from 'lucide-react';`, newImports);

const newComponent = `export default function Dashboard() {
  const [stats, setStats] = useState([
    { title: 'Total Karyawan', value: '-', subtitle: 'Memuat...', subtitleColor: 'text-slate-500' },
    { title: 'Hadir Hari Ini', value: '-', subtitle: 'Memuat...', subtitleColor: 'text-slate-500' },
    { title: 'Menunggu Persetujuan', value: '-', subtitle: 'Total Pengajuan', subtitleColor: 'text-amber-600' },
    { title: 'Terlambat', value: '-', subtitle: 'Hari ini', subtitleColor: 'text-red-600' },
  ]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Karyawan
    const emp = await supabase.from('employees').select('id', { count: 'exact' });
    const empCount = emp.count || 0;

    // Hadir & Terlambat hari ini
    const today = new Date().toISOString().split('T')[0];
    const att = await supabase.from('attendance').select('status').eq('date', today);
    const hadirCount = att.data?.filter(a => a.status === 'Hadir').length || 0;
    const telatCount = att.data?.filter(a => a.status === 'Telat').length || 0;

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
      const { data } = await supabase.from(rt.table).select('*, employees(full_name)').eq('status', 'Menunggu Persetujuan').limit(5);
      return (data || []).map(d => ({ ...d, requestType: rt.type }));
    });

    const reqResults = await Promise.all(reqPromises);
    const allPending = reqResults.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const pendingCount = allPending.length;

    setStats([
      { title: 'Total Karyawan', value: empCount.toString(), subtitle: 'Data Aktif', subtitleColor: 'text-emerald-600' },
      { title: 'Hadir Hari Ini', value: hadirCount.toString(), subtitle: 'Sesuai Jadwal', subtitleColor: 'text-emerald-600' },
      { title: 'Perlu Persetujuan', value: pendingCount.toString(), subtitle: 'Pengajuan Aktif', subtitleColor: 'text-amber-600' },
      { title: 'Terlambat', value: telatCount.toString(), subtitle: 'Hari Ini', subtitleColor: 'text-red-600' },
    ]);

    setRecentRequests(allPending.slice(0, 10));
  };
`;

content = content.replace(`export default function Dashboard() {
  const stats = [
    { title: 'Total Karyawan', value: '150', subtitle: '+2 bulan ini', subtitleColor: 'text-emerald-600' },
    { title: 'Hadir Hari Ini', value: '142', subtitle: '142 Hadir', subtitleColor: 'text-emerald-600' },
    { title: 'Cuti / Izin', value: '5', subtitle: '2 Menunggu Approval', subtitleColor: 'text-amber-600' },
    { title: 'Terlambat', value: '3', subtitle: '1 Tanpa Keterangan', subtitleColor: 'text-red-600' },
  ];`, newComponent);

const newRecent = `<div className="space-y-4">
              {recentRequests.length > 0 ? recentRequests.map((r, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-10 w-1 rounded-full bg-amber-500"></div>
                  <div>
                    <p className="text-xs font-medium text-slate-800">Pengajuan {r.requestType}</p>
                    <span className="text-[10px] text-slate-500">{r.employees?.full_name} - {new Date(r.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 italic">Tidak ada pengajuan baru.</p>
              )}
            </div>`;

content = content.replace(`<div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-10 w-1 rounded-full bg-emerald-500"></div>
                  <div>
                    <p className="text-xs font-medium text-slate-800">Pengajuan Cuti Disetujui</p>
                    <span className="text-[10px] text-slate-400">Budi Santoso - 2 hari lalu</span>
                  </div>
                </div>
              ))}
            </div>`, newRecent);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
