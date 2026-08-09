import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Pengaturan() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Pengaturan Aplikasi</h1>
        <p className="text-sm text-slate-500">Konfigurasi pengaturan sistem HRIS.</p>
      </div>

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
  );
}
