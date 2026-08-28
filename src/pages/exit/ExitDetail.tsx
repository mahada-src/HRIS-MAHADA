import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, Save } from 'lucide-react';

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
      // Fetch related checklists here later
    }
    setLoading(false);
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
        created_by: employee?.id
      })
      .select()
      .single();
      
    if (error) {
      alert('Gagal membuat pengajuan exit: ' + error.message);
      setLoading(false);
      return;
    }
    
    if (data) {
      // Trigger email logic here in the future
      navigate(`/team-pamit/${data.id}`);
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/team-pamit')} className="mr-2">
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
            exitData.status === 'Clear' ? 'bg-emerald-100 text-emerald-700' : 
            exitData.status === 'Not Clear' ? 'bg-red-100 text-red-700' : 
            'bg-amber-100 text-amber-700'
          }`}>{exitData.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Placeholder for Checklists */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Handover Pekerjaan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Modul checklist sedang dalam pengembangan lanjutan. Data base sudah siap.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Asset Clearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Modul checklist sedang dalam pengembangan lanjutan.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Data Security & System Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Modul checklist sedang dalam pengembangan lanjutan.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Finance & HR Clearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Modul checklist sedang dalam pengembangan lanjutan.</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-800">Final Exit Clearance</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-slate-500 mb-4">Pastikan seluruh departemen telah memberikan approval CLEAR sebelum melakukan Final Clearance.</p>
             <Button disabled className="bg-emerald-600">Approve Final Clearance</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
