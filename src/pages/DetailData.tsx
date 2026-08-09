import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { ArrowLeft, User, Briefcase, Phone, Mail, MapPin, Calendar, Clock, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export default function DetailData() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // We can fetch related data as well
  const [attendance, setAttendance] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [activeRequests, setActiveRequests] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchEmployeeData(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchEmployeeData = async (employeeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments (name),
          positions (title)
        `)
        .eq('id', employeeId)
        .single();
      
      if (data) {
        setEmployee(data);
        // fetch related
        const att = await supabase.from('attendance').select('*').eq('employee_id', employeeId).limit(5).order('date', { ascending: false });
        if (att.data) setAttendance(att.data);
        
        const viol = await supabase.from('violations').select('*').eq('employee_id', employeeId);
        if (viol.data) setViolations(viol.data);
        
        const ben = await supabase.from('benefits').select('*').eq('employee_id', employeeId);
        if (ben.data) setBenefits(ben.data);

        // Fetch all active requests (Pending)
        const requestTables = [
          { table: 'sick_requests', type: 'Sakit', dateField: 'start_date' },
          { table: 'permission_requests', type: 'Izin', dateField: 'date' },
          { table: 'late_requests', type: 'Telat', dateField: 'date' },
          { table: 'half_day_requests', type: 'Izin Setengah Hari', dateField: 'date' },
          { table: 'leave_requests', type: 'Cuti', dateField: 'start_date' },
          { table: 'wfh_requests', type: 'WFH', dateField: 'date' },
          { table: 'overtime_requests', type: 'Lembur', dateField: 'date' }
        ];

        const reqPromises = requestTables.map(async (rt) => {
          const { data } = await supabase.from(rt.table).select('*').eq('employee_id', employeeId).eq('status', 'Menunggu Persetujuan');
          if (data && data.length > 0) {
            return data.map(d => ({ ...d, requestType: rt.type, requestDate: d[rt.dateField] }));
          }
          return [];
        });

        const reqResults = await Promise.all(reqPromises);
        const allRequests = reqResults.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setActiveRequests(allRequests);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data karyawan...</div>;
  if (!employee) return <div className="p-8 text-center text-slate-500">Data karyawan tidak ditemukan. Silakan pilih karyawan dari menu Tim Karyawan.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Detail Data Karyawan</h1>
          <p className="text-sm text-slate-500">Informasi lengkap karyawan, absensi, dan riwayat.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Kolom Kiri: Info Utama */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-3xl">
                  {employee.full_name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{employee.full_name}</h2>
                  <p className="text-sm font-medium text-slate-500">{employee.employee_code}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  employee.employment_status === 'Resign' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' :
                  'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10'
                }`}>
                  {employee.employment_status || 'Aktif'}
                </span>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{employee.email || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{employee.phone_number || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{/* @ts-ignore */}{employee.departments?.name || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{/* @ts-ignore */}{employee.positions?.title || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">Masuk: {employee.join_date ? new Date(employee.join_date).toLocaleDateString('id-ID') : '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Benefit & Fasilitas</CardTitle>
            </CardHeader>
            <CardContent>
              {benefits.length > 0 ? (
                <ul className="space-y-3">
                  {benefits.map(b => (
                    <li key={b.id} className="text-sm flex justify-between border-b border-slate-50 pb-2">
                      <span className="font-medium text-slate-700">{b.benefit_type}</span>
                      <span className="text-slate-500">{b.amount ? `Rp ${b.amount.toLocaleString('id-ID')}` : '-'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">Belum ada data benefit</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Detail & Riwayat */}
        <div className="space-y-6 md:col-span-2">
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Riwayat Absensi Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                      <tr>
                        <th className="px-4 py-2 rounded-l-lg">Tanggal</th>
                        <th className="px-4 py-2">Check In</th>
                        <th className="px-4 py-2">Check Out</th>
                        <th className="px-4 py-2 rounded-r-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map(a => (
                        <tr key={a.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-3 font-medium text-slate-800">{new Date(a.date).toLocaleDateString('id-ID')}</td>
                          <td className="px-4 py-3">{a.check_in ? new Date(a.check_in).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                          <td className="px-4 py-3">{a.check_out ? new Date(a.check_out).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Belum ada riwayat absensi</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Riwayat Pelanggaran</CardTitle>
            </CardHeader>
            <CardContent>
              {violations.length > 0 ? (
                <div className="space-y-4">
                  {violations.map(v => (
                    <div key={v.id} className="flex gap-4 p-4 rounded-lg border border-red-100 bg-red-50/50">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{v.violation_type} <span className="text-slate-500 font-normal">({v.letter_number})</span></h4>
                        <p className="text-xs text-slate-500 mt-1">{new Date(v.date).toLocaleDateString('id-ID')}</p>
                        <p className="text-sm text-slate-700 mt-2">{v.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Bersih, tidak ada riwayat pelanggaran.</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Pengajuan Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              {activeRequests.length > 0 ? (
                <div className="space-y-4">
                  {activeRequests.map(r => (
                    <div key={r.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg border border-slate-100 bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-800">{r.requestType}</h4>
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Menunggu Persetujuan</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Tanggal: {r.requestDate ? new Date(r.requestDate).toLocaleDateString('id-ID') : '-'}
                        </p>
                        <p className="text-sm text-slate-700 mt-2">{r.reason || r.target_work}</p>
                      </div>
                      <div className="mt-3 sm:mt-0">
                        <span className="text-xs text-slate-400">ID: {r.id.substring(0,6).toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Tidak ada pengajuan aktif saat ini.</p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
