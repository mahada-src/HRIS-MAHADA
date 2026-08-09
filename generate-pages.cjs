const fs = require('fs');

const pages = [
  {
    name: 'BenefitKaryawan',
    title: 'Benefit Karyawan',
    desc: 'Kelola data benefit dan fasilitas untuk karyawan.',
    table: 'benefits',
    fields: [
      { name: 'benefit_type', label: 'Jenis Benefit', type: 'text' },
      { name: 'description', label: 'Deskripsi', type: 'textarea' },
      { name: 'amount', label: 'Nominal / Nilai (Rp)', type: 'number' }
    ],
    displayFields: [
      { name: 'benefit_type', label: 'Jenis' },
      { name: 'amount', label: 'Nilai (Rp)', isCurrency: true },
      { name: 'description', label: 'Deskripsi' }
    ]
  },
  {
    name: 'IkatanDinas',
    title: 'Ikatan Dinas',
    desc: 'Kelola data perjanjian ikatan dinas karyawan.',
    table: 'business_trip_bonds',
    fields: [
      { name: 'program_type', label: 'Program / Jenis', type: 'text' },
      { name: 'contract_number', label: 'No. Kontrak', type: 'text' },
      { name: 'start_date', label: 'Mulai', type: 'date' },
      { name: 'end_date', label: 'Selesai', type: 'date' }
    ],
    displayFields: [
      { name: 'program_type', label: 'Program' },
      { name: 'contract_number', label: 'No. Kontrak' },
      { name: 'start_date', label: 'Mulai', isDate: true },
      { name: 'end_date', label: 'Selesai', isDate: true }
    ]
  },
  {
    name: 'Pelanggaran',
    title: 'Pelanggaran & SP',
    desc: 'Kelola riwayat pelanggaran dan Surat Peringatan (SP) karyawan.',
    table: 'violations',
    fields: [
      { name: 'violation_type', label: 'Jenis SP / Pelanggaran', type: 'text' },
      { name: 'letter_number', label: 'No. Surat', type: 'text' },
      { name: 'date', label: 'Tanggal', type: 'date' },
      { name: 'reason', label: 'Keterangan', type: 'textarea' }
    ],
    displayFields: [
      { name: 'violation_type', label: 'Jenis' },
      { name: 'letter_number', label: 'No. Surat' },
      { name: 'date', label: 'Tanggal', isDate: true },
      { name: 'reason', label: 'Keterangan' }
    ]
  }
];

const template = (page) => `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { Plus, X, Trash2 } from 'lucide-react';

export default function ${page.name}() {
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
    
    const insertData: any = {
      employee_id: employeeId,
      status: '${page.name === 'Pelanggaran' ? 'Berlaku' : 'Active'}',
      ${page.fields.map(f => `${f.name}`).join(',\n      ')}
    };

    const { error } = await supabase.from('${page.table}').insert([insertData]);

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

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus data ini?')) {
      const { error } = await supabase.from('${page.table}').delete().eq('id', id);
      if (!error) fetchData();
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
          {showForm ? <><X className="w-4 h-4 mr-2" /> Batal</> : <><Plus className="w-4 h-4 mr-2" /> Tambah Data</>}
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
                  ? `<textarea ${f.name === 'description' ? '' : 'required'} rows={3} value={${f.name}} onChange={e => set${f.name.charAt(0).toUpperCase() + f.name.slice(1)}(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"></textarea>`
                  : `<input ${f.name === 'amount' || f.name === 'contract_number' || f.name === 'letter_number' ? '' : 'required'} type="${f.type}" value={${f.name}} onChange={e => set${f.name.charAt(0).toUpperCase() + f.name.slice(1)}(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />`
                }
              </div>
              `).join('')}

              <Button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">Simpan Data</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow><TableCell colSpan={${3 + page.displayFields.length}} className="text-center py-8 text-slate-500">Belum ada data.</TableCell></TableRow>
              ) : (
                data.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-slate-800">{item.employees?.full_name}</div>
                      <div className="text-xs text-slate-500">{item.employees?.employee_code}</div>
                    </TableCell>
                    ${page.displayFields.map(f => `
                    <TableCell>
                      {${f.isDate ? `item.${f.name} ? new Date(item.${f.name}).toLocaleDateString('id-ID') : '-'` : f.isCurrency ? `item.${f.name} ? 'Rp ' + parseInt(item.${f.name}).toLocaleString('id-ID') : '-'` : `item.${f.name} || '-'`}}
                    </TableCell>
                    `).join('')}
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
  fs.writeFileSync(`src/pages/${p.name}.tsx`, template(p));
  console.log('Generated ' + p.name);
});
