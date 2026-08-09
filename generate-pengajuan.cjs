const fs = require('fs');

const pages = [
  {
    name: 'Sakit',
    title: 'Pengajuan Sakit',
    desc: 'Kelola pengajuan izin sakit dan lampiran surat dokter.',
    table: 'sick_requests',
    fields: [
      { name: 'start_date', label: 'Tanggal Mulai', type: 'date' },
      { name: 'end_date', label: 'Tanggal Selesai', type: 'date' },
      { name: 'reason', label: 'Alasan / Gejala', type: 'textarea' },
      { name: 'medical_certificate_url', label: 'Lampiran URL', type: 'text' }
    ],
    displayFields: [
      { name: 'start_date', label: 'Mulai', isDate: true },
      { name: 'end_date', label: 'Selesai', isDate: true },
      { name: 'reason', label: 'Alasan' }
    ],
    statusMap: 'Sakit'
  },
  {
    name: 'Izin',
    title: 'Pengajuan Izin',
    desc: 'Kelola pengajuan izin ketidakhadiran kerja.',
    table: 'permission_requests',
    fields: [
      { name: 'permission_type', label: 'Jenis Izin', type: 'text' },
      { name: 'date', label: 'Tanggal Izin', type: 'date' },
      { name: 'reason', label: 'Alasan Izin', type: 'textarea' }
    ],
    displayFields: [
      { name: 'permission_type', label: 'Jenis' },
      { name: 'date', label: 'Tanggal', isDate: true },
      { name: 'reason', label: 'Alasan' }
    ],
    statusMap: 'Izin'
  },
  {
    name: 'Telat',
    title: 'Pengajuan Telat',
    desc: 'Kelola pemberitahuan dan pengajuan keterlambatan.',
    table: 'late_requests',
    fields: [
      { name: 'date', label: 'Tanggal', type: 'date' },
      { name: 'estimated_arrival', label: 'Estimasi Kedatangan', type: 'time' },
      { name: 'reason', label: 'Alasan', type: 'textarea' }
    ],
    displayFields: [
      { name: 'date', label: 'Tanggal', isDate: true },
      { name: 'estimated_arrival', label: 'Estimasi Tiba' },
      { name: 'reason', label: 'Alasan' }
    ],
    statusMap: 'Telat'
  },
  {
    name: 'IzinSetengahHari',
    title: 'Izin Setengah Hari',
    desc: 'Kelola pengajuan izin meninggalkan pekerjaan di pertengahan jam kerja.',
    table: 'half_day_requests',
    fields: [
      { name: 'date', label: 'Tanggal', type: 'date' },
      { name: 'start_time', label: 'Jam Mulai', type: 'time' },
      { name: 'end_time', label: 'Jam Selesai', type: 'time' },
      { name: 'reason', label: 'Alasan', type: 'textarea' }
    ],
    displayFields: [
      { name: 'date', label: 'Tanggal', isDate: true },
      { name: 'start_time', label: 'Mulai' },
      { name: 'end_time', label: 'Selesai' },
      { name: 'reason', label: 'Alasan' }
    ],
    statusMap: 'Setengah Hari'
  },
  {
    name: 'Cuti',
    title: 'Pengajuan Cuti',
    desc: 'Kelola pengajuan cuti tahunan atau khusus.',
    table: 'leave_requests',
    fields: [
      { name: 'leave_type', label: 'Jenis Cuti', type: 'text' },
      { name: 'start_date', label: 'Tanggal Mulai', type: 'date' },
      { name: 'end_date', label: 'Tanggal Selesai', type: 'date' },
      { name: 'reason', label: 'Alasan Cuti', type: 'textarea' }
    ],
    displayFields: [
      { name: 'leave_type', label: 'Jenis' },
      { name: 'start_date', label: 'Mulai', isDate: true },
      { name: 'end_date', label: 'Selesai', isDate: true },
      { name: 'reason', label: 'Alasan' }
    ],
    statusMap: 'Cuti'
  },
  {
    name: 'Wfh',
    title: 'Pengajuan WFH',
    desc: 'Kelola pengajuan Work From Home (WFH).',
    table: 'wfh_requests',
    fields: [
      { name: 'date', label: 'Tanggal', type: 'date' },
      { name: 'reason', label: 'Alasan', type: 'textarea' },
      { name: 'todo_list', label: 'To-Do List Pekerjaan', type: 'textarea' }
    ],
    displayFields: [
      { name: 'date', label: 'Tanggal', isDate: true },
      { name: 'reason', label: 'Alasan' },
      { name: 'todo_list', label: 'To Do' }
    ],
    statusMap: 'WFH'
  },
  {
    name: 'Lembur',
    title: 'Pengajuan Lembur',
    desc: 'Kelola pengajuan jam lembur kerja ekstra.',
    table: 'overtime_requests',
    fields: [
      { name: 'date', label: 'Tanggal Lembur', type: 'date' },
      { name: 'start_time', label: 'Jam Mulai', type: 'time' },
      { name: 'end_time', label: 'Jam Selesai', type: 'time' },
      { name: 'target_work', label: 'Target Pekerjaan / Alasan', type: 'textarea' }
    ],
    displayFields: [
      { name: 'date', label: 'Tanggal', isDate: true },
      { name: 'start_time', label: 'Mulai' },
      { name: 'end_time', label: 'Selesai' },
      { name: 'target_work', label: 'Pekerjaan' }
    ],
    statusMap: 'Lembur'
  }
];

const template = (page) => `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import { Employee } from '../../types';
import { Plus, X, Check, XCircle } from 'lucide-react';

export default function Pengajuan${page.name}() {
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [employeeId, setEmployeeId] = useState('');
  ${page.fields.map(f => `const [${f.name}, set${f.name.charAt(0).toUpperCase() + f.name.slice(1)}] = useState('');`).join('\n  ')}

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('id, full_name, employee_code').order('full_name');
    if (data) setEmployees(data);
  };

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('${page.table}')
      .select('*, employees(full_name, employee_code)')
      .order('created_at', { ascending: false });
      
    if (data) setData(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return alert('Pilih karyawan');
    
    const { error } = await supabase.from('${page.table}').insert([{
      employee_id: employeeId,
      status: 'Menunggu Persetujuan',
      ${page.fields.map(f => `${f.name}`).join(',\n      ')}
    }]);

    if (!error) {
      setShowForm(false);
      setEmployeeId('');
      ${page.fields.map(f => `set${f.name.charAt(0).toUpperCase() + f.name.slice(1)}('');`).join('\n      ')}
      fetchData();
    } else {
      alert('Gagal menyimpan data');
      console.error(error);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, empId: string, date: string) => {
    const { error } = await supabase.from('${page.table}').update({ status: newStatus }).eq('id', id);
    if (!error) {
      // Jika disetujui, update attendance
      if (newStatus === 'Disetujui') {
        const check = await supabase.from('attendance').select('id').eq('employee_id', empId).eq('date', date).single();
        if (check.data) {
          await supabase.from('attendance').update({ status: '${page.statusMap}', notes: 'Disetujui sistem' }).eq('id', check.data.id);
        } else {
          await supabase.from('attendance').insert([{
            employee_id: empId,
            date: date,
            status: '${page.statusMap}',
            notes: 'Disetujui sistem'
          }]);
        }
      }
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">${page.title}</h1>
          <p className="text-sm text-slate-500">${page.desc}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="w-4 h-4 mr-2" /> Batal</> : <><Plus className="w-4 h-4 mr-2" /> Tambah Pengajuan</>}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Form ${page.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Karyawan</label>
                <select 
                  required
                  value={employeeId} 
                  onChange={e => setEmployeeId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.employee_code} - {emp.full_name}</option>
                  ))}
                </select>
              </div>
              
              ${page.fields.map(f => `
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">${f.label}</label>
                ${f.type === 'textarea' 
                  ? `<textarea required rows={3} value={${f.name}} onChange={e => set${f.name.charAt(0).toUpperCase() + f.name.slice(1)}(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"></textarea>`
                  : `<input required type="${f.type}" value={${f.name}} onChange={e => set${f.name.charAt(0).toUpperCase() + f.name.slice(1)}(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />`
                }
              </div>
              `).join('')}

              <Button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">Kirim Pengajuan</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Ref</TableHead>
                <TableHead>Karyawan</TableHead>
                ${page.displayFields.map(f => `<TableHead>${f.label}</TableHead>`).join('\n                ')}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={${3 + page.displayFields.length}} className="text-center py-8 text-slate-500">Memuat data...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={${3 + page.displayFields.length}} className="text-center py-8 text-slate-500">Belum ada pengajuan.</TableCell></TableRow>
              ) : (
                data.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">REQ-{item.id.substring(0,6).toUpperCase()}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{item.employees?.full_name}</div>
                      <div className="text-xs text-slate-500">{item.employees?.employee_code}</div>
                    </TableCell>
                    ${page.displayFields.map(f => `
                    <TableCell>
                      {${f.isDate ? `new Date(item.${f.name}).toLocaleDateString('id-ID')` : `item.${f.name}`}}
                    </TableCell>
                    `).join('')}
                    <TableCell>
                      <span className={\`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium \${
                        item.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10' :
                        item.status === 'Ditolak' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' :
                        'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10'
                      }\`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === 'Menunggu Persetujuan' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700 border-emerald-200" onClick={() => handleUpdateStatus(item.id, 'Disetujui', item.employee_id, item.${page.displayFields.find(f => f.isDate)?.name || 'date'})}><Check className="w-4 h-4" /></Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 border-red-200" onClick={() => handleUpdateStatus(item.id, 'Ditolak', item.employee_id, item.${page.displayFields.find(f => f.isDate)?.name || 'date'})}><XCircle className="w-4 h-4" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
`;

pages.forEach(p => {
  fs.writeFileSync(`src/pages/pengajuan/${p.name}.tsx`, template(p));
  console.log('Generated ' + p.name);
});
