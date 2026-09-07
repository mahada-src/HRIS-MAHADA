import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Settings, Database, FolderKey, Link as LinkIcon, Info } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function Pengaturan() {
  const { employee } = useAuth();
  const [activeTab, setActiveTab] = useState<'system' | 'master' | 'kategori' | 'ikatan_dinas'>('system');

  // Master Data State
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [docCategories, setDocCategories] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [newDept, setNewDept] = useState('');
  const [newPos, setNewPos] = useState('');
  const [newPosLevel, setNewPosLevel] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (activeTab === 'master') {
      fetchMasterData();
    } else if (activeTab === 'kategori') {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchMasterData = async () => {
    setLoading(true);
    const [deptRes, posRes] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('positions').select('*, departments(name)').order('title')
    ]);
    
    if (deptRes.data) setDepartments(deptRes.data);
    if (posRes.data) setPositions(posRes.data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from('document_categories').select('*').order('name');
    if (data) setDocCategories(data);
    setLoading(false);
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('departments').insert([{ 
      name: newDept
    }]);
    if (!error) {
      setNewDept('');
      fetchMasterData();
    } else {
      alert("Gagal menambahkan departemen: " + error.message);
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
      fetchMasterData();
    } else {
      alert("Gagal menambahkan jabatan: " + error.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('document_categories').insert([{ 
      name: newCategory
    }]);
    if (!error) {
      setNewCategory('');
      fetchCategories();
    } else {
      alert("Gagal menambahkan kategori: " + error.message);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (window.confirm('Yakin ingin menghapus?')) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) {
        if (table === 'document_categories') fetchCategories();
        else fetchMasterData();
      } else {
        alert("Gagal menghapus data: " + error.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Pengaturan</h1>
        <p className="text-sm text-slate-500">Konfigurasi sistem dan manajemen data master HRIS.</p>
      </div>

      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center justify-center w-1/4 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
            ${activeTab === 'system' ? 'bg-white text-emerald-700 shadow' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'}`}
        >
          <Settings className="w-4 h-4 mr-2" />
          Sistem & Profil
        </button>
        <button
          onClick={() => setActiveTab('master')}
          className={`flex items-center justify-center w-1/4 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
            ${activeTab === 'master' ? 'bg-white text-emerald-700 shadow' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'}`}
        >
          <Database className="w-4 h-4 mr-2" />
          Data Master (Jabatan & Divisi)
        </button>
        <button
          onClick={() => setActiveTab('kategori')}
          className={`flex items-center justify-center w-1/4 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
            ${activeTab === 'kategori' ? 'bg-white text-emerald-700 shadow' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'}`}
        >
          <FolderKey className="w-4 h-4 mr-2" />
          Kategori Administrasi
        </button>
        <button
          onClick={() => setActiveTab('ikatan_dinas')}
          className={`flex items-center justify-center w-1/4 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
            ${activeTab === 'ikatan_dinas' ? 'bg-white text-emerald-700 shadow' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'}`}
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          Ketentuan Ikatan Dinas
        </button>
      </div>

      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil Perusahaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nama Perusahaan</label>
                  <input type="text" defaultValue="MAHADA Indonesia" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Perusahaan</label>
                  <input type="email" defaultValue="hrd@mahada.co.id" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Alamat Lengkap</label>
                <textarea rows={3} defaultValue="Jl. Sudirman No. 123, Jakarta" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"></textarea>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700">Simpan Perubahan</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Jam Kerja Default</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Jam Masuk</label>
                  <input type="time" defaultValue="08:00" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Jam Keluar</label>
                  <input type="time" defaultValue="17:00" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <Button variant="outline">Simpan Jam Kerja</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'master' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Departemen / Divisi</CardTitle>
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
                    <TableRow><TableCell colSpan={2} className="text-center py-4 text-slate-500">Memuat...</TableCell></TableRow>
                  ) : departments.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-slate-700">{d.name}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete('departments', d.id)}>
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
              <form onSubmit={handleAddPos} className="space-y-3 mb-4">
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
                    placeholder="Level (Staff, Spv, dll)" 
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
                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-slate-500">Memuat...</TableCell></TableRow>
                  ) : positions.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-slate-700">{p.title}</TableCell>
                      <TableCell>{p.level || '-'}</TableCell>
                      <TableCell>{p.departments?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete('positions', p.id)}>
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
      )}

      {activeTab === 'kategori' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Kategori Administrasi Dokumen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input 
                required 
                value={newCategory} 
                onChange={e => setNewCategory(e.target.value)} 
                placeholder="Nama Kategori Baru (mis. SOP, Aturan)" 
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
              />
              <Button type="submit"><Plus className="w-4 h-4" /></Button>
            </form>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-slate-500">Memuat...</TableCell></TableRow>
                ) : docCategories.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-slate-500">Belum ada kategori.</TableCell></TableRow>
                ) : docCategories.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-slate-700">{c.name}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete('document_categories', c.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {activeTab === 'ikatan_dinas' && (
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-800">
              <Info className="w-5 h-5 mr-2 text-emerald-600" />
              Ketentuan Perhitungan Ikatan Dinas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-slate-700">
            <div className="space-y-4">
              <p className="leading-relaxed">
                Aplikasi menerapkan logika otomatis untuk menghitung masa berlaku ikatan dinas berdasarkan nominal biaya perjalanan dinas/pendidikan. Berikut adalah ketentuan perhitungan durasi ikatan dinas yang berlaku di sistem:
              </p>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-3">1. Durasi Berdasarkan Nominal (Biaya)</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white">
                      <TableHead className="font-semibold text-slate-700">Rentang Nominal Biaya</TableHead>
                      <TableHead className="font-semibold text-slate-700">Durasi Ikatan Dinas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{'<'} Rp 1.000.000</TableCell>
                      <TableCell className="font-medium text-emerald-600">6 Bulan</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Rp 1.000.000 - Rp 2.999.999</TableCell>
                      <TableCell className="font-medium text-emerald-600">12 Bulan (1 Tahun)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Rp 3.000.000 - Rp 9.999.999</TableCell>
                      <TableCell className="font-medium text-emerald-600">24 Bulan (2 Tahun)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Rp 10.000.000 - Rp 19.999.999</TableCell>
                      <TableCell className="font-medium text-emerald-600">36 Bulan (3 Tahun)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{'>='} Rp 20.000.000</TableCell>
                      <TableCell className="font-medium text-emerald-600">48 Bulan (4 Tahun)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-2">2. Ketentuan Akumulasi (Periode 6 Bulan)</h3>
                <ul className="list-disc list-inside space-y-2 text-amber-900/80">
                  <li>
                    <strong>Penggabungan Biaya:</strong> Jika seorang karyawan melakukan perjalanan dinas/pendidikan kembali dalam kurun waktu <strong>kurang dari atau sama dengan 6 bulan</strong> dari pendidikan pertama di suatu periode, maka biaya akan diakumulasikan.
                  </li>
                  <li>
                    <strong>Pembaruan Durasi:</strong> Setelah biaya diakumulasikan, masa durasi ikatan dinas akan dihitung ulang berdasarkan total biaya baru sesuai dengan tabel durasi di atas.
                  </li>
                  <li>
                    <strong>Titik Awal Perhitungan (Start Date):</strong> Tanggal berakhirnya ikatan dinas selalu dihitung dari tanggal perjalanan dinas <strong>pertama</strong> dalam periode akumulasi tersebut, ditambah dengan durasi bulan yang baru.
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">3. Ketentuan Pemisahan Periode Baru</h3>
                <p className="text-blue-900/80">
                  Jika karyawan mengikuti perjalanan dinas/pendidikan yang baru setelah melewati batas <strong>6 bulan</strong> dari pendidikan pertama sebelumnya, maka biaya tidak akan diakumulasikan. Kegiatan ini akan membentuk <strong>Periode Ikatan Dinas Baru</strong> yang memiliki perhitungan nominal dan masa berlakunya sendiri secara terpisah dari periode sebelumnya.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
