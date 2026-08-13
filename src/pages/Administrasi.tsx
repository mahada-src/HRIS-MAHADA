import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, X, ExternalLink } from 'lucide-react';

export default function Administrasi() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [accessRole, setAccessRole] = useState('Semua Karyawan');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setDocuments(data);
    setLoading(false);
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('documents').insert([{ 
      title,
      url,
      category,
      access_role: accessRole
    }]);

    setIsSubmitting(false);

    if (!error) {
      setTitle('');
      setUrl('');
      setCategory('');
      setAccessRole('Semua Karyawan');
      setShowModal(false);
      fetchDocuments();
    } else {
      alert("Gagal menambahkan dokumen: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus dokumen ini?')) {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (!error) fetchDocuments();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#eafff5] p-6 rounded-t-xl -mx-6 -mt-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-800">Administrasi Dokumen</h1>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Tambah Dokumen
        </Button>
      </div>

      <Card className="border-0 shadow-sm mt-0 rounded-t-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#cbf5e6]">
              <TableRow className="border-b-0 hover:bg-[#cbf5e6]">
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4">JUDUL DOKUMEN</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4">KATEGORI</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4">HAK AKSES</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4">LINK GOOGLE DOC</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 text-center w-24">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Memuat data...</TableCell></TableRow>
              ) : documents.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Tidak ada dokumen.</TableCell></TableRow>
              ) : documents.map(doc => (
                <TableRow key={doc.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-800">{doc.title}</TableCell>
                  <TableCell className="text-slate-600">{doc.category || '-'}</TableCell>
                  <TableCell className="text-slate-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                      {doc.access_role || 'Semua'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Buka Dokumen
                    </a>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 p-2 h-auto" onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
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
              <CardTitle className="text-xl font-bold text-emerald-800">Form Administrasi</CardTitle>
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
                  <label className="text-sm font-semibold text-slate-700">Kategori</label>
                  <input 
                    type="text" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    placeholder="Contoh: SOP, Peraturan, Panduan"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Akses *</label>
                  <select 
                    required
                    value={accessRole} 
                    onChange={e => setAccessRole(e.target.value)} 
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all bg-white"
                  >
                    <option value="Semua Karyawan">Semua Karyawan</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="HR">HR</option>
                    <option value="Manager">Manager</option>
                  </select>
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
                    {isSubmitting ? 'Menyimpan...' : 'Tambahkan Data'}
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
