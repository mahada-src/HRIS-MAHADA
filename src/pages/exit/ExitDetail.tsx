import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, Save, FileCheck, ShieldAlert, Monitor, DollarSign, Activity } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

export default function ExitDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { employee } = useAuth();
  
  const isNew = id === 'new';
  const queryEmployeeId = searchParams.get('employeeId');
  
  const [loading, setLoading] = useState(false);
  const [exitData, setExitData] = useState<any>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  
  // States for checklists
  const [handovers, setHandovers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [accesses, setAccesses] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [hrs, setHrs] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [approverNames, setApproverNames] = useState<Record<string, string>>({});
  
  // New Item states
  const [newAccess, setNewAccess] = useState({ system_name: '', username: '', action: 'Nonaktifkan Akun' });
  
  // Form state for New Exit
  const [exitType, setExitType] = useState('Resign');
  const [resignationDate, setResignationDate] = useState('');
  const [lastWorkingDate, setLastWorkingDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isNew && queryEmployeeId) {
      fetchEmployeeDetails(queryEmployeeId);
    } else if (id && !isNew) {
      fetchExitDetails(id);
    }
  }, [id, queryEmployeeId]);

  const fetchEmployeeDetails = async (empId: string) => {
    const { data } = await supabase
      .from('employees')
      .select('*, departments(name), positions(title)')
      .eq('id', empId)
      .single();
    if (data) setEmployeeData(data);
  };

  const fetchExitDetails = async (exitId: string) => {
    setLoading(true);
    // Fetch exit data
    const { data: exit } = await supabase
      .from('employee_exit')
      .select('*, employees(*, departments(name), positions(title))')
      .eq('id', exitId)
      .single();
      
    if (exit) {
      setExitData(exit);
      setEmployeeData(exit.employees);
      
      // Fetch related data
      await Promise.all([
        fetchHandovers(exitId),
        fetchAssets(exitId),
        fetchAccesses(exitId),
        fetchFinances(exitId),
        fetchHrs(exitId),
        fetchApprovals(exitId),
        fetchApproverNames(exit.employees)
      ]);
    }
    setLoading(false);
  };

  const fetchApproverNames = async (empData: any) => {
    const { data: allEmps } = await supabase.from('employees').select('id, full_name, role, employee_code, departments(name)');
    if(!allEmps) return;
    
    const names: Record<string, string> = {};
    
    // Atasan: Leader of the employee's department
    const leader = allEmps.find(e => e.role === 'Manager' && e.departments?.name === empData.departments?.name);
    names['Atasan'] = leader ? leader.full_name : 'Super Admin';
    
    // HR -> Elis Maidah
    const hr = allEmps.find(e => (e.full_name || '').toLowerCase().includes('elis maidah') || e.role === 'HR');
    names['HR'] = hr ? hr.full_name : 'Super Admin';
    
    // GA / Aset -> Di-handle oleh HR
    names['GA / Aset'] = names['HR'];
    
    // IT -> Yunus (19005)
    const it = allEmps.find(e => e.employee_code === '19005' || (e.full_name || '').toLowerCase().includes('yunus'));
    names['IT'] = it ? it.full_name : 'Super Admin';
    
    // Finance -> Leader Finance
    const finance = allEmps.find(e => e.role === 'Manager' && (e.departments?.name || '').toLowerCase().includes('finance'));
    names['Finance'] = finance ? finance.full_name : 'Super Admin';
    
    setApproverNames(names);
  };

  const fetchHandovers = async (exitId: string) => {
    const { data } = await supabase.from('exit_handover').select('*').eq('exit_id', exitId);
    if (data) setHandovers(data);
  };
  const fetchAssets = async (exitId: string) => {
    const { data } = await supabase.from('exit_assets').select('*').eq('exit_id', exitId);
    if (data) setAssets(data);
  };
  const fetchAccesses = async (exitId: string) => {
    const { data } = await supabase.from('exit_access').select('*').eq('exit_id', exitId);
    if (data) setAccesses(data);
  };
  const fetchFinances = async (exitId: string) => {
    const { data } = await supabase.from('exit_finance').select('*').eq('exit_id', exitId);
    if (data) setFinances(data);
  };
  const fetchHrs = async (exitId: string) => {
    const { data } = await supabase.from('exit_hr').select('*').eq('exit_id', exitId);
    if (data) setHrs(data);
  };
  const fetchApprovals = async (exitId: string) => {
    const { data } = await supabase.from('exit_approval').select('*').eq('exit_id', exitId);
    if (data) setApprovals(data);
  };

  const handleCreateExit = async () => {
    if (!employeeData) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('employee_exit')
      .insert({
        employee_id: employeeData.id,
        exit_type: exitType,
        resignation_date: resignationDate,
        last_working_date: lastWorkingDate,
        reason: reason,
        status: 'Dalam Proses',
        created_by: employee?.user_id || null
      })
      .select()
      .single();
      
    if (error) {
      alert('Gagal membuat pengajuan exit: ' + error.message);
      setLoading(false);
      return;
    }
    
    if (data) {
      // Auto-generate some checklist templates
      await generateChecklistTemplates(data.id);
      navigate(`/team-pamit/${data.id}`);
    }
  };

  const generateChecklistTemplates = async (exitId: string) => {
    // Basic Handovers
    await supabase.from('exit_handover').insert([
      { exit_id: exitId, item: 'Daftar pekerjaan yang sedang berjalan' },
      { exit_id: exitId, item: 'File/dokumen pekerjaan terkait' },
      { exit_id: exitId, item: 'SOP/informasi khusus pekerjaan' }
    ]);
    // Basic HR & Finance & Assets
    await supabase.from('exit_hr').insert([
      { exit_id: exitId, checklist_type: 'BPJS Kesehatan Dinonaktifkan' },
      { exit_id: exitId, checklist_type: 'Payroll Dinonaktifkan' },
      { exit_id: exitId, checklist_type: 'Hutang ke Perusahaan' },
      { exit_id: exitId, checklist_type: 'Perjalanan Dinas Aktif / Tidak' },
      { exit_id: exitId, checklist_type: 'Asset Laptop' },
      { exit_id: exitId, checklist_type: 'Asset Handphone' },
      { exit_id: exitId, checklist_type: 'Asset Pakaian' },
      { exit_id: exitId, checklist_type: 'Asset Id Card' },
      { exit_id: exitId, checklist_type: 'Asset inventaris lainnya' }
    ]);
    // Department Approvals
    await supabase.from('exit_approval').insert([
      { exit_id: exitId, department: 'Atasan' },
      { exit_id: exitId, department: 'GA / Aset' },
      { exit_id: exitId, department: 'IT' },
      { exit_id: exitId, department: 'Finance' },
      { exit_id: exitId, department: 'HR' }
    ]);
  };

  // Add Access
  const handleAddAccess = async () => {
    if (!newAccess.system_name || !id) return;
    const { error } = await supabase.from('exit_access').insert({
      exit_id: id,
      system_name: newAccess.system_name,
      username: newAccess.username,
      action: newAccess.action,
      status: 'Pending'
    });
    if (!error) {
      setNewAccess({ system_name: '', username: '', action: 'Nonaktifkan Akun' });
      fetchAccesses(id);
    }
  };
  
  const handleToggleStatus = async (table: string, itemId: string, currentStatus: string, pendingStatus: string, clearStatus: string) => {
    const newStatus = currentStatus === clearStatus ? pendingStatus : clearStatus;
    const payload: any = { status: newStatus };
    
    if (newStatus === clearStatus) {
        if (table === 'exit_approval') {
            payload.approved_at = new Date().toISOString();
            payload.approver = employee?.id;
        } else {
            payload.completed_at = new Date().toISOString();
            if (table === 'exit_access') payload.completed_by = employee?.id;
        }
    } else {
        if (table === 'exit_approval') {
            payload.approved_at = null;
            payload.approver = null;
        } else {
            payload.completed_at = null;
            if (table === 'exit_access') payload.completed_by = null;
        }
    }
    
    const { error } = await supabase.from(table).update(payload).eq('id', itemId);
    if (!error) {
      if(table === 'exit_handover') fetchHandovers(id!);
      if(table === 'exit_access') fetchAccesses(id!);
      if(table === 'exit_hr') fetchHrs(id!);
      if(table === 'exit_approval') fetchApprovals(id!);
    } else {
      alert("Gagal mengupdate status: " + error.message);
    }
  };

  const checkFinalClearance = () => {
      const allApproved = approvals.length > 0 && approvals.every(a => a.status === 'Clear');
      return allApproved;
  };
  
  const handleFinalClearance = async () => {
      if(!id) return;
      if(confirm('Apakah Anda yakin memberikan Final Clearance? Karyawan akan dinyatakan selesai keluar dari perusahaan.')) {
          await supabase.from('employee_exit').update({
              status: 'Clear',
              approved_by: employee?.user_id || null,
              approved_at: new Date().toISOString()
          }).eq('id', id);
          
          await supabase.from('employees').update({
              status_karyawan: exitData?.exit_type || 'Tidak Aktif'
          }).eq('id', employeeData.id);
          
          fetchExitDetails(id);
          alert('Final Clearance Berhasil!');
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data...</div>;

  if (isNew) {
    if (!employeeData) return <div className="p-8 text-center text-slate-500">Karyawan tidak ditemukan.</div>;
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Proses Team Pamit</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mulai Exit Clearance untuk {employeeData.full_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Jenis Exit</label>
              <select value={exitType} onChange={e => setExitType(e.target.value)} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                <option value="Resign">Resign</option>
                <option value="PHK">PHK</option>
                <option value="Kontrak Berakhir">Kontrak Berakhir</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Tanggal Surat Resign/Pemberitahuan</label>
              <input type="date" value={resignationDate} onChange={e => setResignationDate(e.target.value)} className="w-full rounded-md border border-slate-200 p-2 text-sm" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Last Working Date (Hari Terakhir Bekerja)</label>
              <input type="date" value={lastWorkingDate} onChange={e => setLastWorkingDate(e.target.value)} className="w-full rounded-md border border-slate-200 p-2 text-sm" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Alasan</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-md border border-slate-200 p-2 text-sm h-24" placeholder="Tuliskan alasan lengkap..." />
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateExit} disabled={!resignationDate || !lastWorkingDate}>
                Mulai Proses Clearance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exitData) return <div className="p-8 text-center text-slate-500">Data exit tidak ditemukan.</div>;

  const isFinalCleared = exitData.status === 'Clear' || exitData.status === 'Selesai';
  const allClear = checkFinalClearance();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/team-pamit')} className="mr-2 shrink-0">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Exit Clearance: {employeeData?.full_name}</h1>
            <p className="text-sm text-slate-500">{employeeData?.departments?.name} | {employeeData?.positions?.title} | LWD: {new Date(exitData.last_working_date).toLocaleDateString('id-ID')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
          <span className="text-sm font-semibold text-slate-700">Status:</span>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isFinalCleared ? 'bg-emerald-100 text-emerald-700' : 
            exitData.status === 'Not Clear' ? 'bg-red-100 text-red-700' : 
            'bg-amber-100 text-amber-700'
          }`}>{exitData.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* 1. Handover */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-500" /> Handover Pekerjaan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableBody>
                {handovers.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium text-slate-800">{h.item}</TableCell>
                    <TableCell className="w-[150px]">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${h.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {h.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right w-[150px]">
                      <Button variant="outline" size="sm" onClick={() => handleToggleStatus('exit_handover', h.id, h.status, 'Pending', 'Selesai')} disabled={isFinalCleared}
                        className={h.status === 'Selesai' ? 'text-amber-600 border-amber-200' : 'text-emerald-600 border-emerald-200'}
                      >
                         {h.status === 'Selesai' ? 'Batal Selesai' : 'Tandai Selesai'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 2. System Access (IT) */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-5 w-5 text-indigo-500" /> System Access Clearance (IT)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sistem / Aplikasi</TableHead>
                  <TableHead>Akun / Email</TableHead>
                  <TableHead>Tindakan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accesses.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-slate-800">{a.system_name}</TableCell>
                    <TableCell>{a.username || '-'}</TableCell>
                    <TableCell>{a.action}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${a.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {a.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleToggleStatus('exit_access', a.id, a.status, 'Pending', 'Selesai')} disabled={isFinalCleared}
                        className={a.status === 'Selesai' ? 'text-amber-600 border-amber-200' : 'text-emerald-600 border-emerald-200'}
                      >
                         {a.status === 'Selesai' ? 'Batal Selesai' : 'Tandai Selesai'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Add New Access */}
            {!isFinalCleared && (
              <div className="flex gap-2 items-end pt-2">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-slate-700">Nama Sistem (Misal: Google Workspace)</label>
                  <input type="text" value={newAccess.system_name} onChange={e=>setNewAccess({...newAccess, system_name: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-slate-700">Akun (Opsional)</label>
                  <input type="text" placeholder="Misal: email@perusahaan.com" value={newAccess.username} onChange={e=>setNewAccess({...newAccess, username: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm" />
                </div>
                <div className="w-48 space-y-1 shrink-0">
                  <label className="text-xs font-medium text-slate-700">Tindakan</label>
                  <select value={newAccess.action} onChange={e=>setNewAccess({...newAccess, action: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm">
                    <option value="Nonaktifkan Akun">Nonaktifkan Akun</option>
                    <option value="Hapus Akses">Hapus Akses</option>
                    <option value="Ubah Password">Ubah Password</option>
                  </select>
                </div>
                <Button onClick={handleAddAccess} className="bg-slate-800 text-white h-[38px] shrink-0 w-24">Tambah</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. HR / BPJS */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-500" /> HR & BPJS Clearance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
             <Table>
              <TableBody>
                {hrs.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium text-slate-800">{h.checklist_type}</TableCell>
                    <TableCell className="w-[150px]">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${h.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {h.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right w-[150px]">
                      <Button variant="outline" size="sm" onClick={() => handleToggleStatus('exit_hr', h.id, h.status, 'Pending', 'Selesai')} disabled={isFinalCleared}
                        className={h.status === 'Selesai' ? 'text-amber-600 border-amber-200' : 'text-emerald-600 border-emerald-200'}
                      >
                         {h.status === 'Selesai' ? 'Batal Selesai' : 'Tandai Selesai'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Department Approvals */}
        <Card className="border-slate-200 bg-slate-50/50 shadow-inner">
          <CardHeader className="pb-3 border-b border-slate-200">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-slate-600" /> Department Approval Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {approvals.map(app => (
                <div key={app.id} className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-1 shadow-sm flex flex-col items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-700">{app.department}</h4>
                    <p className="text-[10px] font-medium text-slate-500 uppercase pb-2">{approverNames[app.department] || 'Memuat...'}</p>
                    <div className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${app.status === 'Clear' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {app.status}
                    </div>
                  </div>
                  {!isFinalCleared && (employee?.role === 'Super Admin' || employee?.full_name === approverNames[app.department]) && (
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-xs h-8 border border-slate-100" onClick={() => handleToggleStatus('exit_approval', app.id, app.status, 'Pending', 'Clear')}>
                      Set {app.status === 'Clear' ? 'Pending' : 'Clear'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${isFinalCleared ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-200 bg-white'}`}>
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-emerald-800">Final Exit Clearance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
             {!isFinalCleared ? (
                <>
                  <p className="text-sm text-slate-500 mb-6 text-center max-w-lg">
                    Pastikan seluruh departemen telah memberikan approval CLEAR sebelum melakukan Final Clearance. Setelah Final Clearance diberikan, status karyawan akan otomatis diubah menjadi Resign/Inactive.
                  </p>
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white w-64" disabled={!allClear} onClick={handleFinalClearance}>
                    Approve Final Clearance
                  </Button>
                  {!allClear && <p className="text-xs text-amber-600 mt-2 font-medium">Masih ada departemen yang belum CLEAR.</p>}
                </>
             ) : (
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-800">Clearance Selesai</h3>
                  <p className="text-sm text-emerald-600 mt-1">Disetujui pada {new Date(exitData.approved_at).toLocaleDateString('id-ID')}</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
