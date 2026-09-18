import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, X, ExternalLink, Edit2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function SaprasHr() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { employee } = useAuth();
  const role = employee?.role || 'Karyawan';
  
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Kita gunakan fallback ke array kosong jika tabel belum ada untuk mencegah aplikasi crash
    const [itemsRes, categoriesRes] = await Promise.all([
      supabase.from('sapras_hr').select('*').order('created_at', { ascending: false }),
      supabase.from('sapras_hr_categories').select('*').order('name')
    ]);
    
    if (itemsRes.data) {
      setItems(itemsRes.data);
    } else if (itemsRes.error) {
      console.error('Error fetching sapras_hr:', itemsRes.error);
      setItems([]);
    }

    if (categoriesRes.data) {
      setCategories(categoriesRes.data);
    }
    
    setLoading(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let uploadedPhotoUrl = photoUrl;

    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sapras')
        .upload(filePath, photoFile);

      if (uploadError) {
        alert("Gagal mengunggah foto: " + uploadError.message);
        setIsSubmitting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('sapras')
        .getPublicUrl(filePath);

      uploadedPhotoUrl = publicUrl;
    }

    let error;
    if (editId) {
      const res = await supabase.from('sapras_hr').update({
        name,
        category,
        photo_url: uploadedPhotoUrl,
        link
      }).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('sapras_hr').insert([{ 
        name,
        category,
        photo_url: uploadedPhotoUrl,
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
    setCategory('');
    setPhotoUrl('');
    setPhotoFile(null);
    setPhotoPreview('');
    setLink('');
    setEditId(null);
    setShowModal(false);
  };

  const openEditModal = (item: any) => {
    setEditId(item.id);
    setName(item.name);
    setCategory(item.category || '');
    setPhotoUrl(item.photo_url || '');
    setPhotoPreview(item.photo_url || '');
    setPhotoFile(null);
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

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mr-2"></div>
          Memuat data...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-800">Tidak ada produk</h3>
          <p className="text-sm text-slate-500 mt-1">Belum ada data produk Sapras HR yang ditambahkan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-lg transition-all duration-200 group relative flex flex-col transform hover:-translate-y-1">
              
              {/* Image Area */}
              <a href={item.link || '#'} target={item.link ? "_blank" : "_self"} rel="noreferrer" className="block relative aspect-square bg-[#e2e8f0] p-6 overflow-hidden">
                {item.photo_url ? (
                  <img 
                    src={item.photo_url} 
                    alt={item.name} 
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-slate-400/50 group-hover:scale-110 transition-transform duration-300">
                    {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
              </a>

              {/* Action overlay on hover */}
              {['Super Admin', 'HR'].includes(role) && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={(e) => { e.preventDefault(); openEditModal(item); }} className="p-1.5 bg-white/90 backdrop-blur-sm hover:bg-emerald-50 text-emerald-600 rounded-md shadow-sm transition-colors border border-slate-200/50">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); handleDelete(item.id); }} className="p-1.5 bg-white/90 backdrop-blur-sm hover:bg-red-50 text-red-600 rounded-md shadow-sm transition-colors border border-slate-200/50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Footer Area */}
              <div className="p-4 border-t border-slate-100 mt-auto bg-white flex flex-col justify-end">
                <a href={item.link || '#'} target={item.link ? "_blank" : "_self"} rel="noreferrer" className="block">
                  <h3 className="font-bold text-sm text-slate-800 leading-tight mb-1.5 group-hover:text-emerald-600 line-clamp-2 transition-colors">{item.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.category || '-'}</p>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  <label className="text-sm font-semibold text-slate-700">Kategori</label>
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
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Photo Produk</label>
                  <div className="flex items-center gap-4">
                    {photoPreview && (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200 shrink-0">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setPhotoPreview(''); setPhotoFile(null); setPhotoUrl(''); }} className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-bl-md transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setPhotoFile(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                      }} 
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Pilih file gambar untuk produk ini.</p>
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
