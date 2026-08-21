import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RekapPengajuan() {
  const { employee, user } = useAuth();
  const role = employee?.role || 'Karyawan';

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  
  const today = new Date();
  const [month, setMonth] = useState((today.getMonth() + 1).toString());
  const [year, setYear] = useState(today.getFullYear().toString());

  const [loading, setLoading] = useState(false);
  const [workingDays, setWorkingDays] = useState(0);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);

  const months = [
    { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
    { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    fetchEmployees();
  }, [role, user]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchData();
    } else {
      setAttendances([]);
      setAllRequests([]);
      setWorkingDays(0);
    }
  }, [selectedEmployee, month, year]);

  const fetchEmployees = async () => {
    let query = supabase.from('employees').select('id, full_name, employee_code, department_id, employment_status').neq('employment_status', 'Resign').order('full_name');
    if (role === 'Manager') {
      query = query.eq('department_id', employee?.department_id);
    } else if (role === 'Karyawan') {
      query = query.eq('id', employee?.id);
    }
    const { data } = await query;
    if (data) {
      setEmployees(data);
      if (role === 'Karyawan' && employee?.id) {
        setSelectedEmployee(employee.id);
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    let startD = new Date(Number(year), Number(month) - 2, 21);
    let endD = new Date(Number(year), Number(month) - 1, 20);
    const startStr = startD.toISOString().split('T')[0];
    const endStr = endD.toISOString().split('T')[0];

    // 1. Fetch Attendances for summary
    const [
      attRes, sickRes, leaveRes, permRes, halfRes, thirdRes, wfhRes, lateRes, overtimeRes, wdRes
    ] = await Promise.all([
      supabase.from('attendance').select('status, date').eq('employee_id', selectedEmployee).gte('date', startStr).lte('date', endStr),
      supabase.from('sick_requests').select('*, id, start_date, end_date, status').eq('employee_id', selectedEmployee).gte('start_date', startStr).lte('start_date', endStr).eq('status', 'Disetujui'),
      supabase.from('leave_requests').select('*, id, start_date, end_date, status, reason').eq('employee_id', selectedEmployee).gte('start_date', startStr).lte('start_date', endStr).eq('status', 'Disetujui'),
      supabase.from('permission_requests').select('*, id, date, status, reason').eq('employee_id', selectedEmployee).gte('date', startStr).lte('date', endStr).eq('status', 'Disetujui'),
      supabase.from('half_day_requests').select('*, id, date, status, reason').eq('employee_id', selectedEmployee).gte('date', startStr).lte('date', endStr).eq('status', 'Disetujui'),
      supabase.from('one_third_day_requests').select('*, id, date, status, reason').eq('employee_id', selectedEmployee).gte('date', startStr).lte('date', endStr).eq('status', 'Disetujui'),
      supabase.from('wfh_requests').select('*, id, date, status, reason').eq('employee_id', selectedEmployee).gte('date', startStr).lte('date', endStr).eq('status', 'Disetujui'),
      supabase.from('late_requests').select('*, id, date, status, reason').eq('employee_id', selectedEmployee).gte('date', startStr).lte('date', endStr).eq('status', 'Disetujui'),
      supabase.from('overtime_requests').select('*, id, date, status, notes').eq('employee_id', selectedEmployee).gte('date', startStr).lte('date', endStr).eq('status', 'Disetujui'),
      supabase.from('working_days').select('working_days_count').eq('employee_id', selectedEmployee).eq('period_month', month.padStart(2, '0')).eq('period_year', year).maybeSingle()
    ]);

    // Build Rekap Absensi 
    let mergedAttendances = (attRes.data || []).map(a => ({ status: a.status, date: a.date }));
    
    const countDays = (start: string, end: string) => {
      const s = new Date(start); const e = new Date(end);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const addDaysToMerged = (requests: any[], statusName: string, isDateCol = false) => {
      if (!requests) return;
      requests.forEach(req => {
        if (isDateCol) {
          mergedAttendances.push({ status: statusName, date: req.date });
        } else {
          const days = countDays(req.start_date, req.end_date);
          for(let i=0; i<days; i++) mergedAttendances.push({ status: statusName, date: req.start_date });
        }
      });
    };

    addDaysToMerged(sickRes.data || [], 'Sakit', false);
    addDaysToMerged(leaveRes.data || [], 'Cuti', false);
    addDaysToMerged(permRes.data || [], 'Izin', true);
    addDaysToMerged(halfRes.data || [], 'Setengah Hari', true);
    addDaysToMerged(thirdRes.data || [], 'Izin 1/3 Hari', true);

    setAttendances(mergedAttendances);
    setWorkingDays(wdRes.data ? wdRes.data.working_days_count : 0);

    // Build Table Seluruh Pengajuan
    let combined: any[] = [];
    const mapRequest = (data: any[], type: string, dateCol: string, reasonCol: string) => {
      if (!data) return;
      data.forEach(item => {
        let dateDisplay = item[dateCol];
        if (dateCol === 'start_date' && item.end_date && item.start_date !== item.end_date) {
           dateDisplay = `${new Date(item.start_date).toLocaleDateString('id-ID')} - ${new Date(item.end_date).toLocaleDateString('id-ID')}`;
        } else {
           dateDisplay = new Date(dateDisplay).toLocaleDateString('id-ID');
        }
        
        combined.push({
          id: item.id,
          type: type,
          dateRaw: item[dateCol],
          dateDisplay,
          reason: item[reasonCol] || item.reason || item.notes || type,
          status: item.status
        });
      });
    };

    mapRequest(sickRes.data || [], 'Sakit', 'start_date', 'notes'); // sick uses notes usually but maybe reason
    mapRequest(leaveRes.data || [], 'Cuti', 'start_date', 'reason');
    mapRequest(permRes.data || [], 'Izin Full', 'date', 'reason');
    mapRequest(halfRes.data || [], 'Izin 1/2 Hari', 'date', 'reason');
    mapRequest(thirdRes.data || [], 'Izin 1/3 Hari', 'date', 'reason');
    mapRequest(wfhRes.data || [], 'WFH', 'date', 'reason');
    mapRequest(lateRes.data || [], 'Terlambat', 'date', 'reason');
    mapRequest(overtimeRes.data || [], 'Lembur', 'date', 'notes');

    combined.sort((a, b) => new Date(a.dateRaw).getTime() - new Date(b.dateRaw).getTime());
    setAllRequests(combined);
    
    setLoading(false);
  };

  const getSummaryLine = () => {
    if (!selectedEmployee) return null;
    const hadir = attendances.filter(a => a.status === 'Hadir').length;
    const telat = attendances.filter(a => a.status === 'Telat').length;
    const alpa = attendances.filter(a => a.status === 'Alpa').length;
    const sakit = attendances.filter(a => a.status === 'Sakit').length;
    const izin = attendances.filter(a => a.status === 'Izin').length;
    const setengah = attendances.filter(a => a.status === 'Setengah Hari').length;
    const sepertiga = attendances.filter(a => a.status === 'Izin 1/3 Hari').length;
    const cuti = attendances.filter(a => a.status === 'Cuti').length;
    
    return { hadir, telat, alpa, sakit, izin, setengah, sepertiga, cuti, workingDays };
  };

  const selectedEmpName = useMemo(() => {
    return employees.find(e => e.id === selectedEmployee)?.full_name || '';
  }, [selectedEmployee, employees]);

  const handleDownloadPDF = () => {
    if (!selectedEmployee) {
        alert("Silakan pilih karyawan terlebih dahulu!");
        return;
    }
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REKAP PENGAJUAN KARYAWAN', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(selectedEmpName, pageWidth / 2, 28, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    const monthName = months.find(m => m.value === month)?.label || '';
    doc.text(`Periode: ${monthName} ${year}`, pageWidth / 2, 34, { align: 'center' });

    let currentY = 45;
    
    // Table 1: Rekap Absensi
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Rekap Absensi', 14, currentY);
    currentY += 5;
    
    const sum = getSummaryLine();
    if (sum) {
      autoTable(doc, {
        startY: currentY,
        head: [['Hari Kerja', 'Hadir', 'Sakit', 'Izin', 'Izin 1/2', 'Izin 1/3', 'Cuti', 'Alpa', 'Telat']],
        body: [[
            sum.workingDays, sum.hadir, sum.sakit, sum.izin, sum.setengah, sum.sepertiga, sum.cuti, sum.alpa, sum.telat
        ]],
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Table 2: Seluruh Pengajuan
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Tabel Seluruh Pengajuan', 14, currentY);
    currentY += 5;

    if (allRequests.length > 0) {
        const tableBody = allRequests.map((req, index) => [
            index + 1,
            req.type,
            req.dateDisplay,
            req.reason || '-',
            req.status
        ]);
        
        autoTable(doc, {
            startY: currentY,
            head: [['No', 'Jenis Pengajuan', 'Tanggal', 'Keterangan', 'Status']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [51, 65, 85] },
            margin: { left: 14 },
            styles: { cellPadding: 3 }
        });
    } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text('Tidak ada data pengajuan pada periode ini.', 14, currentY + 5);
    }

    doc.save(`Rekap_Pengajuan_${selectedEmpName.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`);
  };

  const summary = getSummaryLine();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Rekap Pengajuan</h1>
        <Button onClick={handleDownloadPDF} disabled={!selectedEmployee || loading} className="bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2">
          <Download className="h-4 w-4" /> Download PDF
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-700">Pilih Karyawan</label>
              <select 
                value={selectedEmployee} 
                onChange={e => setSelectedEmployee(e.target.value)}
                disabled={role === 'Karyawan'}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
              >
                <option value="">-- Pilih Karyawan --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.employee_code} - {emp.full_name}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-48">
              <label className="mb-2 block text-sm font-medium text-slate-700">Bulan</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-32">
              <label className="mb-2 block text-sm font-medium text-slate-700">Tahun</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee && !loading && summary && (
        <Card>
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              1. Rekap Absensi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-center">
                 <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Hari Kerja</th>
                      <th className="px-4 py-3 font-medium">Hadir</th>
                      <th className="px-4 py-3 font-medium">Sakit</th>
                      <th className="px-4 py-3 font-medium">Izin Full</th>
                      <th className="px-4 py-3 font-medium">Izin 1/2</th>
                      <th className="px-4 py-3 font-medium">Izin 1/3</th>
                      <th className="px-4 py-3 font-medium">Cuti</th>
                      <th className="px-4 py-3 font-medium">Alpa</th>
                      <th className="px-4 py-3 font-medium">Telat</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-4 font-semibold text-slate-800">{summary.workingDays}</td>
                      <td className="px-4 py-4 text-emerald-600 font-medium">{summary.hadir}</td>
                      <td className="px-4 py-4 text-blue-600 font-medium">{summary.sakit}</td>
                      <td className="px-4 py-4 text-amber-600 font-medium">{summary.izin}</td>
                      <td className="px-4 py-4 text-amber-600 font-medium">{summary.setengah}</td>
                      <td className="px-4 py-4 text-amber-600 font-medium">{summary.sepertiga}</td>
                      <td className="px-4 py-4 text-purple-600 font-medium">{summary.cuti}</td>
                      <td className="px-4 py-4 text-red-600 font-medium">{summary.alpa}</td>
                      <td className="px-4 py-4 text-red-600 font-medium">{summary.telat}</td>
                    </tr>
                 </tbody>
               </table>
             </div>
          </CardContent>
        </Card>
      )}

      {selectedEmployee && !loading && (
        <Card>
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              2. Tabel Seluruh Pengajuan Disetujui
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {allRequests.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-medium w-16">No</th>
                        <th className="px-4 py-3 font-medium">Jenis Pengajuan</th>
                        <th className="px-4 py-3 font-medium">Tanggal</th>
                        <th className="px-4 py-3 font-medium">Keterangan</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {allRequests.map((req, index) => (
                        <tr key={`${req.id}-${index}`} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{req.type}</td>
                          <td className="px-4 py-3 text-slate-600">{req.dateDisplay}</td>
                          <td className="px-4 py-3 text-slate-600">{req.reason || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="p-8 text-center text-slate-500">
                 Tidak ada data pengajuan pada periode ini.
               </div>
             )}
          </CardContent>
        </Card>
      )}

      {loading && (
         <div className="py-12 text-center text-slate-500 animate-pulse">Memuat data...</div>
      )}

    </div>
  );
}
