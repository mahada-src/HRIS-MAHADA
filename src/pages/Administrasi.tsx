import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

export default function Administrasi() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newDept, setNewDept] = useState('');
  const [newPos, setNewPos] = useState('');
  const [newPosLevel, setNewPosLevel] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [deptRes, posRes] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('positions').select('*, departments(name)').order('title')
    ]);
    
    if (deptRes.data) setDepartments(deptRes.data);
    if (posRes.data) setPositions(posRes.data);
    setLoading(false);
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('departments').insert([{ name: newDept }]);
    if (!error) {
      setNewDept('');
      fetchData();
    }
  };

  const handleAddPos = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('positions').insert([{ 
      title: newPos, 
      level: newPosLevel,
      department_id: selectedDeptId || null
    }]);
    if (!error) {
      setNewPos('');
      setNewPosLevel('');
      setSelectedDeptId('');
      fetchData();
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (window.confirm('Yakin ingin menghapus?')) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Administrasi Data Master</h1>
        <p className="text-sm text-slate-500">Kelola data master seperti departemen dan jabatan.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Departemen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDept} className="flex gap-2 mb-4">
              <input 
                required 
                value={newDept} 
                onChange={e => setNewDept(e.target.value)} 
                placeholder="Nama Departemen Baru" 
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
              />
              <Button type="submit"><Plus className="w-4 h-4" /></Button>
            </form>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Departemen</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4">Memuat...</TableCell></TableRow>
                ) : departments.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-slate-700">{d.name}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete('departments', d.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jabatan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPos} className="space-y-2 mb-4">
              <input 
                required 
                value={newPos} 
                onChange={e => setNewPos(e.target.value)} 
                placeholder="Nama Jabatan" 
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
              />
              <div className="flex gap-2">
                <input 
                  value={newPosLevel} 
                  onChange={e => setNewPosLevel(e.target.value)} 
                  placeholder="Level (Staff, Spv, Mgr)" 
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                />
                <select 
                  value={selectedDeptId} 
                  onChange={e => setSelectedDeptId(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Pilih Dept --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <Button type="submit"><Plus className="w-4 h-4" /></Button>
              </div>
            </form>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-4">Memuat...</TableCell></TableRow>
                ) : positions.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-slate-700">{p.title}</TableCell>
                    <TableCell>{p.level || '-'}</TableCell>
                    <TableCell>{p.departments?.name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete('positions', p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
