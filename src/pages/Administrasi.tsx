import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, X, ExternalLink, Edit2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function Administrasi() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { employee } = useAuth();
  const role = employee?.role || 'Karyawan';
  const positionTitle = (employee as any)?.positions?.title || employee?.posisi || '';
  const departmentName = (employee as any)?.departments?.name || '';
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [accessRole, setAccessRole] = useState('Semua Karyawan');
  const [position, setPosition] = useState('Semua Jabatan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [docsRes, catRes, posRes] = await Promise.all([
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
      supabase.from('document_categories').select('*').order('name'),
      supabase.from('positions').select('title, departments(name)').order('title')
    ]);
    
    if (docsRes.data) {
      let filteredDocs = docsRes.data;
      if (role !== 'Super Admin' && role !== 'HR') {
        filteredDocs = filteredDocs.filter(doc => {
          const isRoleMatch = doc.access_role === 'Semua Karyawan' || 
                              doc.access_role === role || 
                              (role === 'Manager' && doc.access_role === 'Karyawan');
                              
          let isPositionMatch = doc.position === 'Semua Jabatan' || 
                                doc.position === positionTitle;

          if (role === 'Manager' && !isPositionMatch && doc.position !== 'Semua Jabatan') {
            const docPos = posRes.data?.find((p: any) => p.title === doc.position);
            if (docPos && (docPos as any).departments?.name === departmentName) {
              isPositionMatch = true;
            }
          }

          return isRoleMatch && isPositionMatch;
        });
      }

      filteredDocs.sort((a, b) => {
        if (a.access_role === 'Semua Karyawan' && b.access_role !== 'Semua Karyawan') return -1;
        if (a.access_role !== 'Semua Karyawan' && b.access_role === 'Semua Karyawan') return 1;
        return 0;
      });

      setDocuments(filteredDocs);
    }
    if (catRes.data) setCategories(catRes.data);
    if (posRes.data) setPositions(posRes.data);
    setLoading(false);
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let error;
    if (editId) {
      const res = await supabase.from('documents').update({
        title,
        url,
        category,
        access_role: accessRole,
        position: position
      }).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('documents').insert([{ 
        title,
        url,
        category,
        access_role: accessRole,
        position: position
      }]);
      error = res.error;
    }

    setIsSubmitting(false);

    if (!error) {
      setTitle('');
      setUrl('');
      setCategory('');
      setAccessRole('Semua Karyawan');
      setPosition('Semua Jabatan');
      setEditId(null);
      setShowModal(false);
      fetchData();
    } else {
      alert("Gagal menyimpan dokumen: " + error.message);
    }
  };

  const openEditModal = (doc: any) => {
    setEditId(doc.id);
    setTitle(doc.title);
    setUrl(doc.url);
    setCategory(doc.category || '');
    setAccessRole(doc.access_role || 'Semua Karyawan');
    setPosition(doc.position || 'Semua Jabatan');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus dokumen ini?')) {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#eafff5] p-6 rounded-t-xl -mx-6 -mt-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-800">Administrasi Dokumen</h1>
        </div>
        {role === 'Super Admin' && (
          <Button onClick={() => {
            setEditId(null);
            setTitle('');
            setUrl('');
            setCategory('');
            setAccessRole('Semua Karyawan');
            setPosition('Semua Jabatan');
            setShowModal(true);
          }} className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Tambah Dokumen
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm mt-0 rounded-t-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#cbf5e6]">
              <TableRow className="border-b-0 hover:bg-[#cbf5e6]">
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4">JUDUL DOKUMEN</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4">KATEGORI ADMINISTRASI</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4">HAK AKSES</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4">JABATAN</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4">LINK GOOGLE DOC</TableHead>
                {role === 'Super Admin' && <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 text-center w-24">AKSI</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow><TableCell colSpan={role === 'Super Admin' ? 6 : 5} className="text-center py-8 text-slate-500">Memuat data...</TableCell></TableRow>
              ) : documents.length === 0 ? (
                <TableRow><TableCell colSpan={role === 'Super Admin' ? 6 : 5} className="text-center py-8 text-slate-500">Tidak ada dokumen.</TableCell></TableRow>
              ) : documents.map(doc => (
                <TableRow key={doc.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-800">{doc.title}</TableCell>
                  <TableCell className="text-slate-600">{doc.category || '-'}</TableCell>
                  <TableCell className="text-slate-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                      {doc.access_role || 'Semua'}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                      {doc.position || 'Semua Jabatan'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Buka Dokumen
                    </a>
                  </TableCell>
                  {role === 'Super Admin' && (
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 p-2 h-auto" onClick={() => openEditModal(doc)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 p-2 h-auto" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl bg-white rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-xl font-bold text-emerald-800">{editId ? 'Edit Dokumen' : 'Form Administrasi'}</CardTitle>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddDocument} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Judul Dokumen *</label>
                  <input 
                    type="text" 
                    required 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Kategori Administrasi</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all bg-white"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Akses Role *</label>
                    <select 
                      required
                      value={accessRole} 
                      onChange={e => setAccessRole(e.target.value)} 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all bg-white"
                    >
                      <option value="Semua Karyawan">Semua Karyawan</option>
                      <option value="Karyawan">Karyawan</option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="HR">HR</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Jabatan *</label>
                    <select 
                      required
                      value={position} 
                      onChange={e => setPosition(e.target.value)} 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all bg-white"
                    >
                      <option value="Semua Jabatan">Semua Jabatan</option>
                      {positions.map((p, i) => (
                        <option key={i} value={p.title}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Link Google Doc *</label>
                  <input 
                    type="url" 
                    required 
                    value={url} 
                    onChange={e => setUrl(e.target.value)} 
                    placeholder="https://docs.google.com/..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium" onClick={() => setShowModal(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm">
                    {isSubmitting ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Tambahkan Data')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
