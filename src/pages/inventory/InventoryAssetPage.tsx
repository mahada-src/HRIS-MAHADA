import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, X, Edit2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { InventoryAsset, Employee } from '../../types';

export default function InventoryAssetPage() {
  const { category } = useParams<{ category: string }>();
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { employee } = useAuth();
  const role = employee?.role || 'Karyawan';
  
  // Format category string for display
  const displayCategory = category?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
  // Convert URL param to DB category mapping
  const categoryMap: Record<string, string> = {
    'laptop-pc': 'Asset Laptop / PC',
    'handphone': 'Asset Handphone',
    'conten': 'Asset Conten',
    'mesin': 'Asset Mesin',
    'kendaraan': 'Asset Kendaraan',
    'sapras': 'Asset Sapras'
  };
  const dbCategory = category ? categoryMap[category] : '';

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [assetName, setAssetName] = useState('');
  const [brand, setBrand] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [inventoryCode, setInventoryCode] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [assetStatus, setAssetStatus] = useState('Terpakai');
  const [assetCondition, setAssetCondition] = useState('Baik');
  const [conditionNotes, setConditionNotes] = useState('');

  useEffect(() => {
    if (dbCategory) {
      fetchData();
    }
  }, [dbCategory]);

  const fetchData = async () => {
    setLoading(true);
    const [assetsRes, empRes] = await Promise.all([
      supabase.from('inventory_assets')
        .select('*, employees(id, full_name, role)')
        .eq('category', dbCategory)
        .order('created_at', { ascending: false }),
      supabase.from('employees').select('*').order('full_name')
    ]);
    
    if (assetsRes.data) {
      setAssets(assetsRes.data as InventoryAsset[]);
    }
    if (empRes.data) {
      setEmployees(empRes.data as Employee[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      category: dbCategory,
      asset_name: assetName,
      brand: brand,
      employee_id: employeeId || null,
      inventory_code: inventoryCode,
      purchase_date: purchaseDate || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      asset_status: assetStatus,
      asset_condition: assetCondition,
      condition_notes: conditionNotes
    };

    let error;
    if (editId) {
      const res = await supabase.from('inventory_assets').update(payload).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('inventory_assets').insert([payload]);
      error = res.error;
    }

    setIsSubmitting(false);

    if (!error) {
      resetForm();
      fetchData();
    } else {
      alert("Gagal menyimpan data asset: " + error.message);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setAssetName('');
    setBrand('');
    setEmployeeId('');
    setInventoryCode('');
    setPurchaseDate('');
    setPurchasePrice('');
    setAssetStatus('Terpakai');
    setAssetCondition('Baik');
    setConditionNotes('');
    setShowModal(false);
  };

  const openEditModal = (asset: InventoryAsset) => {
    setEditId(asset.id);
    setAssetName(asset.asset_name || '');
    setBrand(asset.brand || '');
    setEmployeeId(asset.employee_id || '');
    setInventoryCode(asset.inventory_code || '');
    setPurchaseDate(asset.purchase_date ? asset.purchase_date.split('T')[0] : '');
    setPurchasePrice(asset.purchase_price ? asset.purchase_price.toString() : '');
    setAssetStatus(asset.asset_status || 'Terpakai');
    setAssetCondition(asset.asset_condition || 'Baik');
    setConditionNotes(asset.condition_notes || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus data asset ini?')) {
      const { error } = await supabase.from('inventory_assets').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  };

  if (role !== 'Super Admin' && role !== 'Ass Super Admin') {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center text-slate-800">
        <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
        <p className="text-slate-500">Anda tidak memiliki hak akses untuk halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#eafff5] p-6 rounded-t-xl -mx-6 -mt-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-800">Inventory {dbCategory}</h1>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowModal(true);
        }} className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Tambah Asset
        </Button>
      </div>

      <Card className="border-0 shadow-sm mt-0 rounded-t-none">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#cbf5e6]">
              <TableRow className="border-b-0 hover:bg-[#cbf5e6]">
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">NAMA ASSET</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">BRAND</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">PIC KARYAWAN</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">KODE INV</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">TGL BELI</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">HARGA</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">STATUS</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">KONDISI</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap text-center w-24">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-500">Memuat data...</TableCell></TableRow>
              ) : assets.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-500">Tidak ada data asset untuk kategori ini.</TableCell></TableRow>
              ) : assets.map(asset => (
                <TableRow key={asset.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-800 whitespace-nowrap">{asset.asset_name}</TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap">{asset.brand || '-'}</TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap">{asset.employees?.full_name || '-'}</TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap">{asset.inventory_code || '-'}</TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap">{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('id-ID') : '-'}</TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap">{asset.purchase_price ? formatRupiah(asset.purchase_price) : '-'}</TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${asset.asset_status === 'Terpakai' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {asset.asset_status || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>{asset.asset_condition || '-'}</span>
                      {asset.condition_notes && <span className="text-[10px] text-slate-400 max-w-[120px] truncate">{asset.condition_notes}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <div className="flex justify-center gap-2">
                      <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 p-2 h-auto" onClick={() => openEditModal(asset)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 p-2 h-auto" onClick={() => handleDelete(asset.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
          <Card className="w-full max-w-2xl border-0 shadow-2xl bg-white rounded-xl max-h-[90vh] flex flex-col">
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row justify-between items-center shrink-0">
              <CardTitle className="text-xl font-bold text-emerald-800">{editId ? 'Edit Data Asset' : 'Tambah Data Asset'}</CardTitle>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1">
              <form id="asset-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Nama Asset *</label>
                    <input 
                      type="text" 
                      required 
                      value={assetName} 
                      onChange={e => setAssetName(e.target.value)} 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Brand</label>
                    <input 
                      type="text" 
                      value={brand} 
                      onChange={e => setBrand(e.target.value)} 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">PIC Karyawan</label>
                    <select
                      value={employeeId}
                      onChange={e => setEmployeeId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all bg-white"
                    >
                      <option value="">-- Pilih PIC --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Kode Inventaris</label>
                    <input 
                      type="text" 
                      value={inventoryCode} 
                      onChange={e => setInventoryCode(e.target.value)} 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Tanggal Pembelian</label>
                    <input 
                      type="date" 
                      value={purchaseDate} 
                      onChange={e => setPurchaseDate(e.target.value)} 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Harga Beli</label>
                    <input 
                      type="number" 
                      value={purchasePrice} 
                      onChange={e => setPurchasePrice(e.target.value)} 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Status Asset</label>
                    <select
                      value={assetStatus}
                      onChange={e => setAssetStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all bg-white"
                    >
                      <option value="Terpakai">Terpakai</option>
                      <option value="Tidak Dipakai">Tidak Dipakai</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Kondisi Asset</label>
                    <select
                      value={assetCondition}
                      onChange={e => setAssetCondition(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all bg-white"
                    >
                      <option value="Baik">Baik</option>
                      <option value="Kurang Baik">Kurang Baik</option>
                      <option value="Rusak Ringan">Rusak Ringan</option>
                      <option value="Rusak Berat">Rusak Berat</option>
                      <option value="Hilang">Hilang</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Keterangan Kondisi</label>
                  <textarea 
                    rows={3}
                    value={conditionNotes} 
                    onChange={e => setConditionNotes(e.target.value)} 
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </form>
            </CardContent>
            <div className="border-t border-slate-100 p-4 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button type="submit" form="asset-form" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm">
                {isSubmitting ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Tambahkan Data')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
