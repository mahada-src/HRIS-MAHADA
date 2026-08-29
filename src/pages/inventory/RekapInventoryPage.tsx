import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { InventoryAsset } from '../../types';
import { Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function RekapInventoryPage() {
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { employee } = useAuth();
  const role = employee?.role || 'Karyawan';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory_assets')
      .select('*, employees(id, full_name, role)')
      .order('category')
      .order('created_at', { ascending: false });
    
    if (data) {
      setAssets(data as InventoryAsset[]);
    }
    setLoading(false);
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
          <h1 className="text-2xl font-bold tracking-tight text-emerald-800">Rekap Semua Asset</h1>
        </div>
        <Button onClick={() => window.print()} className="bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 shadow-sm">
          <Download className="w-4 h-4 mr-2" /> Export / Print
        </Button>
      </div>

      <Card className="border-0 shadow-sm mt-0 rounded-t-none">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#cbf5e6]">
              <TableRow className="border-b-0 hover:bg-[#cbf5e6]">
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">KATEGORI</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">NAMA ASSET</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">BRAND</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">PIC KARYAWAN</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">KODE INV</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">TGL BELI</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">HARGA</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">STATUS</TableHead>
                <TableHead className="font-bold text-emerald-800 uppercase text-xs py-4 whitespace-nowrap">KONDISI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-500">Memuat data rekap...</TableCell></TableRow>
              ) : assets.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-500">Tidak ada data asset.</TableCell></TableRow>
              ) : assets.map(asset => (
                <TableRow key={asset.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-emerald-700 whitespace-nowrap">{asset.category}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
