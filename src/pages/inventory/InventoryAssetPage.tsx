import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, X, Edit2, Eye } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { InventoryAsset, Employee } from '../../types';

export default function InventoryAssetPage() {
  const { category } = useParams<{ category: string }>();
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status Filter State
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Terpakai' | 'Tidak Dipakai'>('Semua');
  
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
  const [detailAsset, setDetailAsset] = useState<InventoryAsset | null>(null);
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
  
  // Laptop Specific Form State
  const [productionYear, setProductionYear] = useState('');
  const [processor, setProcessor] = useState('');
  const [storage, setStorage] = useState('');
  const [ram, setRam] = useState('');
  const [lastUsed, setLastUsed] = useState('');

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
      supabase.from('employees').select('id, full_name').order('full_name')
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
      condition_notes: conditionNotes,
      ...(dbCategory === 'Asset Laptop / PC' && {
        production_year: productionYear,
        processor: processor,
        storage: storage,
        ram: ram,
        last_used: lastUsed || null
      })
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
    setProductionYear('');
    setProcessor('');
    setStorage('');
    setRam('');
    setLastUsed('');
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
    setProductionYear(asset.production_year || '');
    setProcessor(asset.processor || '');
    setStorage(asset.storage || '');
    setRam(asset.ram || '');
    setLastUsed(asset.last_used ? asset.last_used.split('T')[0] : '');
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

  const displayedAssets = assets.filter(asset => {
    if (statusFilter === 'Semua') return true;
    return asset.asset_status === statusFilter;
  });

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
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-emerald-800">Inventory {dbCategory}</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={statusFilter === 'Semua' ? 'default' : 'outline'} onClick={() => setStatusFilter('Semua')} className={statusFilter === 'Semua' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-200 text-emerald-700'}>
              Semua
            </Button>
            <Button size="sm" variant={statusFilter === 'Terpakai' ? 'default' : 'outline'} onClick={() => setStatusFilter('Terpakai')} className={statusFilter === 'Terpakai' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-200 text-emerald-700'}>
              Terpakai
            </Button>
            <Button size="sm" variant={statusFilter === 'Tidak Dipakai' ? 'default' : 'outline'} onClick={() => setStatusFilter('Tidak Dipakai')} className={statusFilter === 'Tidak Dipakai' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-200 text-emerald-700'}>
              Tidak Dipakai
            </Button>
          </div>
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
              ) : displayedAssets.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-500">Tidak ada data asset untuk status ini.</TableCell></TableRow>
              ) : displayedAssets.map(asset => (
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
                      <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 p-2 h-auto" onClick={() => setDetailAsset(asset)} title="Detail">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 p-2 h-auto" onClick={() => openEditModal(asset)} title="Edit">
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

                  {dbCategory === 'Asset Laptop / PC' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Tahun Produksi</label>
                        <input 
                          type="text" 
                          value={productionYear} 
                          onChange={e => setProductionYear(e.target.value)} 
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                          placeholder="Misal: 2023"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Processor</label>
                        <input 
                          type="text" 
                          value={processor} 
                          onChange={e => setProcessor(e.target.value)} 
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                          placeholder="Misal: Intel Core i5 Gen 12"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Penyimpanan (SSD/HDD)</label>
                        <input 
                          type="text" 
                          value={storage} 
                          onChange={e => setStorage(e.target.value)} 
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                          placeholder="Misal: 512GB SSD"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">RAM</label>
                        <input 
                          type="text" 
                          value={ram} 
                          onChange={e => setRam(e.target.value)} 
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                          placeholder="Misal: 16GB"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Terakhir Pakai</label>
                        <input 
                          type="date" 
                          value={lastUsed} 
                          onChange={e => setLastUsed(e.target.value)} 
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                    </>
                  )}
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

      {/* Detail Modal */}
      {detailAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-xl border-0 shadow-2xl bg-white rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
            <CardHeader className="bg-emerald-50 border-b border-emerald-100 flex flex-row justify-between items-center shrink-0 py-4 px-6">
              <CardTitle className="text-lg font-bold text-emerald-800">Detail Asset</CardTitle>
              <button onClick={() => setDetailAsset(null)} className="text-emerald-700 hover:text-emerald-900 bg-emerald-100/50 hover:bg-emerald-200 rounded-full p-1.5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="p-6">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold shrink-0">
                      {detailAsset.asset_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{detailAsset.asset_name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{detailAsset.brand || 'Tidak ada brand'} • {detailAsset.inventory_code || 'Tanpa Kode'}</p>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    <div className="grid grid-cols-2 p-4 text-sm gap-4">
                      <div>
                        <span className="block text-xs font-medium text-slate-500 mb-1">Status Asset</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${detailAsset.asset_status === 'Terpakai' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {detailAsset.asset_status || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-500 mb-1">Kondisi Asset</span>
                        <span className="font-medium text-slate-700">{detailAsset.asset_condition || '-'}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 p-4 text-sm gap-4">
                      <div>
                        <span className="block text-xs font-medium text-slate-500 mb-1">PIC Karyawan</span>
                        <span className="font-medium text-slate-700">{detailAsset.employees?.full_name || '-'}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-500 mb-1">Kategori</span>
                        <span className="font-medium text-slate-700">{detailAsset.category}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 p-4 text-sm gap-4">
                      <div>
                        <span className="block text-xs font-medium text-slate-500 mb-1">Tanggal Pembelian</span>
                        <span className="font-medium text-slate-700">{detailAsset.purchase_date ? new Date(detailAsset.purchase_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-500 mb-1">Harga Beli</span>
                        <span className="font-medium text-slate-700">{detailAsset.purchase_price ? formatRupiah(detailAsset.purchase_price) : '-'}</span>
                      </div>
                    </div>

                    {detailAsset.condition_notes && (
                      <div className="p-4 text-sm">
                        <span className="block text-xs font-medium text-slate-500 mb-1">Keterangan Kondisi</span>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg text-xs leading-relaxed border border-slate-100">{detailAsset.condition_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {detailAsset.category === 'Asset Laptop / PC' && (
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                      Spesifikasi Laptop / PC
                    </h4>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100 text-sm">
                      <div className="grid grid-cols-2 p-4 gap-4">
                        <div>
                          <span className="block text-xs font-medium text-slate-500 mb-1">Tahun Produksi</span>
                          <span className="font-medium text-slate-700">{detailAsset.production_year || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-slate-500 mb-1">Processor</span>
                          <span className="font-medium text-slate-700">{detailAsset.processor || '-'}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 p-4 gap-4">
                        <div>
                          <span className="block text-xs font-medium text-slate-500 mb-1">RAM</span>
                          <span className="font-medium text-slate-700">{detailAsset.ram || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-slate-500 mb-1">Penyimpanan (SSD/HDD)</span>
                          <span className="font-medium text-slate-700">{detailAsset.storage || '-'}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <span className="block text-xs font-medium text-slate-500 mb-1">Terakhir Dipakai</span>
                        <span className="font-medium text-slate-700">{detailAsset.last_used ? new Date(detailAsset.last_used).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <div className="bg-white border-t border-slate-100 p-4 flex justify-end shrink-0">
              <Button onClick={() => setDetailAsset(null)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
                Tutup Detail
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
