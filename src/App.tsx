import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Layout from './components/layout/Layout';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Login from './pages/Login';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, employee, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 bg-slate-50">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && employee && !allowedRoles.includes(employee.role || 'Karyawan')) {
    return <div className="h-screen flex flex-col items-center justify-center text-slate-800 bg-slate-50">
      <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
      <p className="text-slate-500 mb-4">Anda tidak memiliki hak akses untuk halaman ini.</p>
      <a href="/tim" className="text-emerald-600 hover:underline">Kembali ke Beranda</a>
    </div>;
  }
  return <>{children}</>;
};

const IndexRoute = () => {
  const { employee } = useAuth();
  if (employee?.role === 'Karyawan') {
    return <Navigate to="/tim" replace />;
  }
  return <Dashboard />;
};
import Dashboard from './pages/Dashboard';
import TimKaryawan from './pages/TimKaryawan';
import DetailData from './pages/DetailData';
import RekapAbsensi from './pages/RekapAbsensi';
import BenefitKaryawan from './pages/BenefitKaryawan';
import IkatanDinas from './pages/IkatanDinas';
import Pelanggaran from './pages/Pelanggaran';
import Pengaturan from './pages/Pengaturan';
import Administrasi from './pages/Administrasi';
import ManajemenUser from './pages/ManajemenUser';
import ExitDashboard from './pages/exit/ExitDashboard';
import ExitDetail from './pages/exit/ExitDetail';

// Pengajuan pages
import PengajuanSakit from './pages/pengajuan/Sakit';
import PengajuanIzin from './pages/pengajuan/Izin';
import PengajuanTelat from './pages/pengajuan/Telat';
import PengajuanIzinSetengahHari from './pages/pengajuan/IzinSetengahHari';
import PengajuanIzinSepertigaHari from './pages/pengajuan/IzinSepertigaHari';
import PengajuanCuti from './pages/pengajuan/Cuti';
import PengajuanWfh from './pages/pengajuan/Wfh';
import PengajuanLembur from './pages/pengajuan/Lembur';
import RekapPengajuan from './pages/RekapPengajuan';

// Inventory pages
import InventoryAssetPage from './pages/inventory/InventoryAssetPage';
import RekapInventoryPage from './pages/inventory/RekapInventoryPage';

export default function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<IndexRoute />} />
          <Route path="tim" element={<TimKaryawan />} />
          <Route path="detail" element={<DetailData />} />
          <Route path="absensi" element={<RekapAbsensi />} />
          <Route path="benefit" element={<BenefitKaryawan />} />
          <Route path="ikatan-dinas" element={<IkatanDinas />} />
          <Route path="pelanggaran" element={<Pelanggaran />} />
          <Route path="pengaturan" element={<ProtectedRoute allowedRoles={['Super Admin', 'HR']}><Pengaturan /></ProtectedRoute>} />
          <Route path="administrasi" element={<ProtectedRoute><Administrasi /></ProtectedRoute>} />
          <Route path="manajemen-user" element={<ProtectedRoute allowedRoles={['Super Admin']}><ManajemenUser /></ProtectedRoute>} />
          
          <Route path="team-pamit" element={<ProtectedRoute><ExitDashboard /></ProtectedRoute>} />
          <Route path="team-pamit/:id" element={<ProtectedRoute><ExitDetail /></ProtectedRoute>} />
          
          <Route path="pengajuan">
            <Route path="sakit" element={<PengajuanSakit />} />
            <Route path="izin" element={<PengajuanIzin />} />
            <Route path="izin-setengah-hari" element={<PengajuanIzinSetengahHari />} />
            <Route path="izin-sepertiga-hari" element={<PengajuanIzinSepertigaHari />} />
            <Route path="telat" element={<PengajuanTelat />} />
            <Route path="wfh" element={<PengajuanWfh />} />
            <Route path="cuti" element={<PengajuanCuti />} />
            <Route path="lembur" element={<PengajuanLembur />} />
            <Route path="rekap" element={<RekapPengajuan />} />
          </Route>
          
          <Route path="inventory">
            <Route path="rekap" element={<ProtectedRoute allowedRoles={['Super Admin', 'Ass Super Admin']}><RekapInventoryPage /></ProtectedRoute>} />
            <Route path=":category" element={<ProtectedRoute allowedRoles={['Super Admin', 'Ass Super Admin']}><InventoryAssetPage /></ProtectedRoute>} />
          </Route>
        </Route>
      </Routes>
    </Router>
    </AuthProvider>
  );
}
