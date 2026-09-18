import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, X, ExternalLink, Edit2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function SaprasHr() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { employee } = useAuth();
  const role = employee?.role || 'Karyawan';
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Kita gunakan fallback ke array kosong jika tabel belum ada untuk mencegah aplikasi crash
    const { data, error } = await supabase.from('sapras_hr').select('*').order('created_at', { ascending: false });
    
    if (data) {
      setItems(data);
    } else if (error) {
      console.error('Error fetching sapras_hr:', error);
      // Jika tabel belum ada, biarkan kosong
      setItems([]);
    }
    setLoading(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let error;
    if (editId) {
      const res = await supabase.from('sapras_hr').update({
        name,
        photo_url: photoUrl,
        link
      }).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('sapras_hr').insert([{ 
        name,
        photo_url: photoUrl,
        link
      }]);
      error = res.error;
    }

    setIsSubmitting(false);

    if (!error) {
      resetForm();
      fetchData();
    } else {
      alert("Gagal menyimpan data: " + error.message);
    }
  };

  const resetForm = () => {
    setName('');
    setPhotoUrl('');
    setLink('');
    setEditId(null);
    setShowModal(false);
  };

  const openEditModal = (item: any) => {
    setEditId(item.id);
    setName(item.name);
    setPhotoUrl(item.photo_url || '');
    setLink(item.link || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus data ini?')) {
      const { error } = await supabase.from('sapras_hr').delete().eq('id', id);
      if (!error) fetchData();
      else alert('Gagal menghapus data: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#eafff5] p-6 rounded-t-xl -mx-6 -mt-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-800">Sapras HR</h1>
        </div>
        {['Super Admin', 'HR'].includes(role) && (
          <Button onClick={() => {
            resetForm();
            setShowModal(true);
          }} className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Tambah Produk
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm mt-0 rounded-t-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#cbf5e6]">
              <TableRow className="border-b-0 hover:bg-[#cbf5e6]">
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 w-24 text-center">PHOTO</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4">NAMA PRODUK</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4">LINK</TableHead>
                {['Super Admin', 'HR'].includes(role) && <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 text-center w-24">AKSI</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow><TableCell colSpan={['Super Admin', 'HR'].includes(role) ? 4 : 3} className="text-center py-8 text-slate-500">Memuat data...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={['Super Admin', 'HR'].includes(role) ? 4 : 3} className="text-center py-8 text-slate-500">Tidak ada data produk Sapras HR.</TableCell></TableRow>
              ) : items.map(item => (
                <TableRow key={item.id} className="hover:bg-slate-50">
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      {item.photo_url ? (
                        <img 
                          src={item.photo_url} 
                          alt={item.name} 
                          className="w-12 h-12 object-cover rounded-md shadow-sm border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold shadow-sm border border-emerald-200">
                          {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-800">
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer" className="hover:text-emerald-600 hover:underline transition-colors">
                        {item.name}
                      </a>
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell>
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        Buka Link
                      </a>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </TableCell>
                  {['Super Admin', 'HR'].includes(role) && (
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 p-2 h-auto" onClick={() => openEditModal(item)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 p-2 h-auto" onClick={() => handleDelete(item.id)}>
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
          <Card className="w-full max-w-md border-0 shadow-2xl bg-white rounded-xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row justify-between items-center bg-slate-50/50">
              <CardTitle className="text-xl font-bold text-emerald-800">{editId ? 'Edit Produk Sapras' : 'Tambah Produk Sapras'}</CardTitle>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Nama Produk *</label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Contoh: Laptop Dell"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Photo URL</label>
                  <input 
                    type="url" 
                    value={photoUrl} 
                    onChange={e => setPhotoUrl(e.target.value)} 
                    placeholder="https://example.com/photo.jpg"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-500">Kosongkan jika tidak ada foto.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Link Tujuan *</label>
                  <input 
                    type="url" 
                    required 
                    value={link} 
                    onChange={e => setLink(e.target.value)} 
                    placeholder="https://tokopedia.com/..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-500">Link yang akan dibuka saat nama produk diklik.</p>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <Button type="button" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium" onClick={() => setShowModal(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm">
                    {isSubmitting ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Tambahkan Produk')}
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
