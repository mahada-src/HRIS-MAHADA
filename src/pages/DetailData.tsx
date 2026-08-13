import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, User, Briefcase, Phone, Mail, MapPin, Calendar, Clock, AlertTriangle, ShieldCheck, FileText, Eye, Edit } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';

export default function DetailData() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const { employee: loggedInEmployee } = useAuth();
  const role = loggedInEmployee?.role || 'Karyawan';
  const isManagerOrKaryawan = role === 'Manager' || role === 'Karyawan';
  
  // State for List View
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // State for Detail View
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Related data
  const [attendance, setAttendance] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [activeRequests, setActiveRequests] = useState<any[]>([]);

  // Master Data
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Employee>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEmployeeData(id);
    } else {
      fetchAllEmployees();
    }
    fetchMasterData();
  }, [id]);

  const fetchMasterData = async () => {
    const [depRes, posRes] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('positions').select('*')
    ]);
    if (depRes.data) setDepartments(depRes.data);
    if (posRes.data) setPositions(posRes.data);
  };

  const fetchAllEmployees = async () => {
    setLoadingList(true);
    try {
      let query = supabase
        .from('employees')
        .select('*')
        .order('employee_code', { ascending: false });
        
      if (role === 'Karyawan') {
        query = query.eq('id', loggedInEmployee?.id);
      } else if (role === 'Manager') {
        query = query.eq('department_id', loggedInEmployee?.department_id);
      }
      
      const { data, error } = await query;
      if (data) setAllEmployees(data);
    } catch (err) {
      console.error(err);
    }
    setLoadingList(false);
  };

  const fetchEmployeeData = async (employeeId: string) => {
    setLoadingDetail(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*, departments(name), positions(title)')
        .eq('id', employeeId)
        .maybeSingle();
      
      if (data) {
        setEmployee(data);
        setEditData(data); // Init edit data
        // fetch related
        const att = await supabase.from('attendance').select('*').eq('employee_id', employeeId).limit(5).order('date', { ascending: false });
        if (att.data) setAttendance(att.data);
        
        const viol = await supabase.from('violations').select('*').eq('employee_id', employeeId);
        if (viol.data) setViolations(viol.data);
        
        const ben = await supabase.from('benefits').select('*').eq('employee_id', employeeId);
        if (ben.data) setBenefits(ben.data);

        // Fetch all active requests
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
      console.error("Error in fetchEmployeeData:", err);
    }
    setLoadingDetail(false);
  };

  const handleSaveEdit = async () => {
    if (!employee?.id) return;
    setIsSaving(true);
    try {
      const { departments, positions, ...updatePayload } = editData;
      
      const { error } = await supabase
        .from('employees')
        .update(updatePayload)
        .eq('id', employee.id);
      
      if (error) throw error;
      
      setIsEditModalOpen(false);
      fetchEmployeeData(employee.id); // Reload data
    } catch (error: any) {
      alert('Gagal menyimpan data: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------------------------------------
  // LIST VIEW
  // -----------------------------------------------------------
  if (!id) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Detail Data Karyawan</h1>
          <p className="text-sm text-slate-500">Pilih karyawan di bawah ini untuk melihat detail lengkap profil dan riwayat mereka.</p>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {loadingList ? (
              <div className="p-8 text-center text-slate-500">Memuat daftar karyawan...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Karyawan</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>Divisi</TableHead>
                      <TableHead>Posisi</TableHead>
                      <TableHead>Status Karyawan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          Tidak ada data karyawan ditemukan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      allEmployees.map((emp) => (
                        <TableRow key={emp.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate('/detail?id=' + emp.id)}>
                          <TableCell className="font-medium text-slate-800">
                            {emp.id_karyawan || emp.employee_code || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-xs">
                                {emp.full_name?.substring(0, 2).toUpperCase() || 'EMP'}
                              </div>
                              <span className="font-semibold text-slate-800">{emp.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{emp.divisi || '-'}</TableCell>
                          <TableCell>{emp.posisi || '-'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                              emp.status_karyawan === 'Resign' ? 'bg-red-100 text-red-700' : 
                              emp.status_karyawan === 'PHK' ? 'bg-red-100 text-red-800' : 
                              emp.status_karyawan === 'Cuti' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {emp.status_karyawan || 'Aktif'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate('/detail?id=' + emp.id); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // -----------------------------------------------------------
  // DETAIL VIEW
  // -----------------------------------------------------------
  if (loadingDetail) return <div className="p-8 text-center text-slate-500">Memuat data karyawan...</div>;
  if (!employee) return <div className="p-8 text-center text-slate-500">Data karyawan tidak ditemukan.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/detail')} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Profil: {employee.full_name}</h1>
          <p className="text-sm text-slate-500">Informasi lengkap karyawan, absensi, dan riwayat.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Kolom Kiri: Info Utama */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold">Informasi Karyawan</CardTitle>
              {!isManagerOrKaryawan && (
                <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Data
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-3xl shadow-sm">
                  {employee.full_name?.substring(0, 2).toUpperCase() || 'EMP'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{employee.full_name}</h2>
                  <p className="text-sm font-medium text-slate-500">{employee.id_karyawan || employee.employee_code || '-'}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  (employee.status_kepegawaian || employee.employment_status) === 'Resign' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' :
                  'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10'
                }`}>
                  {employee.status_kepegawaian || employee.employment_status || 'Aktif'}
                </span>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">ID Karyawan / NIK</span>
                  <span className="text-slate-800 font-medium">{employee.id_karyawan || employee.employee_code || '-'} / {employee.nik || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-800 font-medium break-all">{employee.email || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">No. Telepon</span>
                  <span className="text-slate-800 font-medium">{employee.no_tlpn || employee.phone_number || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Level</span>
                  <span className="text-slate-800 font-medium">{employee.level || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Brand</span>
                  <span className="text-slate-800 font-medium">{employee.brand || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Divisi / Dept</span>
                  <span className="text-slate-800 font-medium">{/* @ts-ignore */ employee.departments?.name || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Posisi / Jabatan</span>
                  <span className="text-slate-800 font-medium">{/* @ts-ignore */ employee.positions?.title || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Status Karyawan</span>
                  <span className="text-slate-800 font-medium">{employee.status_karyawan || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Tgl Probation</span>
                  <span className="text-slate-800 font-medium">{employee.tgl_probation ? new Date(employee.tgl_probation).toLocaleDateString('id-ID') : '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Tgl Tetap / Masuk</span>
                  <span className="text-slate-800 font-medium">{employee.tgl_tetap ? new Date(employee.tgl_tetap).toLocaleDateString('id-ID') : (employee.join_date ? new Date(employee.join_date).toLocaleDateString('id-ID') : '-')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Stifin</span>
                  <span className="text-slate-800 font-medium">{employee.stifin || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Tgl Lahir</span>
                  <span className="text-slate-800 font-medium">{employee.tgl_lahir ? new Date(employee.tgl_lahir).toLocaleDateString('id-ID') : '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Alamat</span>
                  <span className="text-slate-800 font-medium">{employee.alamat || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Pendidikan</span>
                  <span className="text-slate-800 font-medium">{employee.pendidikan || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Keluarga Terdekat</span>
                  <span className="text-slate-800 font-medium">{employee.nama_keluarga_terdekat || '-'} ({employee.no_keluarga_terdekat || '-'})</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">No. KK / Keluarga</span>
                  <span className="text-slate-800 font-medium">{employee.no_keluarga || '-'}</span>
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

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold text-slate-800">Edit Detail Karyawan</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ID & Basic */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">ID Karyawan</label>
                  <input type="text" value={editData.id_karyawan || editData.employee_code || ''} onChange={e => setEditData({...editData, id_karyawan: e.target.value, employee_code: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">NIK</label>
                  <input type="text" value={editData.nik || ''} onChange={e => setEditData({...editData, nik: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Nama Lengkap</label>
                  <input type="text" value={editData.full_name || ''} onChange={e => setEditData({...editData, full_name: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Email</label>
                  <input type="email" value={editData.email || ''} onChange={e => setEditData({...editData, email: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">No. Telepon</label>
                  <input type="text" value={editData.no_tlpn || editData.phone_number || ''} onChange={e => setEditData({...editData, no_tlpn: e.target.value, phone_number: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                
                {/* Work Details */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Level</label>
                  <input type="text" value={editData.level || ''} onChange={e => setEditData({...editData, level: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Brand</label>
                  <input type="text" value={editData.brand || ''} onChange={e => setEditData({...editData, brand: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Divisi / Dept</label>
                  <select 
                    value={editData.department_id || ''} 
                    onChange={e => setEditData({...editData, department_id: e.target.value})} 
                    className="w-full rounded-md border border-slate-200 p-2 text-sm"
                  >
                    <option value="">- Pilih Divisi -</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Posisi / Jabatan</label>
                  <select 
                    value={editData.position_id || ''} 
                    onChange={e => setEditData({...editData, position_id: e.target.value})} 
                    className="w-full rounded-md border border-slate-200 p-2 text-sm"
                  >
                    <option value="">- Pilih Posisi -</option>
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Status Kepegawaian</label>
                  <select value={editData.status_kepegawaian || editData.employment_status || ''} onChange={e => setEditData({...editData, status_kepegawaian: e.target.value, employment_status: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                    <option value="">- Pilih Status Kepegawaian -</option>
                    <option value="Karyawan Tetap">Karyawan Tetap</option>
                    <option value="Probation">Probation</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Status Karyawan</label>
                  <select value={editData.status_karyawan || ''} onChange={e => setEditData({...editData, status_karyawan: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                    <option value="">- Pilih Status Karyawan -</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Resign">Resign</option>
                    <option value="PHK">PHK</option>
                    <option value="Cuti">Cuti</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Tgl Probation</label>
                  <input type="date" value={editData.tgl_probation ? new Date(editData.tgl_probation).toISOString().split('T')[0] : ''} onChange={e => setEditData({...editData, tgl_probation: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Tgl Tetap / Masuk</label>
                  <input type="date" value={editData.tgl_tetap ? new Date(editData.tgl_tetap).toISOString().split('T')[0] : (editData.join_date ? new Date(editData.join_date).toISOString().split('T')[0] : '')} onChange={e => setEditData({...editData, tgl_tetap: e.target.value, join_date: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>

                {/* Personal Details */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Stifin</label>
                  <input type="text" value={editData.stifin || ''} onChange={e => setEditData({...editData, stifin: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Tgl Lahir</label>
                  <input type="date" value={editData.tgl_lahir ? new Date(editData.tgl_lahir).toISOString().split('T')[0] : ''} onChange={e => setEditData({...editData, tgl_lahir: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Alamat Lengkap</label>
                  <input type="text" value={editData.alamat || ''} onChange={e => setEditData({...editData, alamat: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Pendidikan Terakhir</label>
                  <input type="text" value={editData.pendidikan || ''} onChange={e => setEditData({...editData, pendidikan: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>

                {/* Family Details */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Nama Keluarga Terdekat</label>
                  <input type="text" value={editData.nama_keluarga_terdekat || ''} onChange={e => setEditData({...editData, nama_keluarga_terdekat: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">No. Keluarga Terdekat</label>
                  <input type="text" value={editData.no_keluarga_terdekat || ''} onChange={e => setEditData({...editData, no_keluarga_terdekat: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-slate-700">No. Kartu Keluarga (KK)</label>
                  <input type="text" value={editData.no_keluarga || ''} onChange={e => setEditData({...editData, no_keluarga: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>

              </div>
            </div>
            
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 shrink-0 bg-slate-50 rounded-b-xl">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Batal</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
