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
      <a href="/" className="text-emerald-600 hover:underline">Kembali ke Dashboard</a>
    </div>;
  }
  return <>{children}</>;
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

// Pengajuan pages
import PengajuanSakit from './pages/pengajuan/Sakit';
import PengajuanIzin from './pages/pengajuan/Izin';
import PengajuanTelat from './pages/pengajuan/Telat';
import PengajuanIzinSetengahHari from './pages/pengajuan/IzinSetengahHari';
import PengajuanCuti from './pages/pengajuan/Cuti';
import PengajuanWfh from './pages/pengajuan/Wfh';
import PengajuanLembur from './pages/pengajuan/Lembur';

export default function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="tim" element={<ProtectedRoute allowedRoles={['Super Admin', 'HR', 'Manager']}><TimKaryawan /></ProtectedRoute>} />
          <Route path="detail" element={<DetailData />} />
          <Route path="absensi" element={<RekapAbsensi />} />
          <Route path="benefit" element={<BenefitKaryawan />} />
          <Route path="ikatan-dinas" element={<ProtectedRoute allowedRoles={['Super Admin', 'HR']}><IkatanDinas /></ProtectedRoute>} />
          <Route path="pelanggaran" element={<ProtectedRoute allowedRoles={['Super Admin', 'HR']}><Pelanggaran /></ProtectedRoute>} />
          <Route path="pengaturan" element={<ProtectedRoute allowedRoles={['Super Admin', 'HR']}><Pengaturan /></ProtectedRoute>} />
          <Route path="administrasi" element={<ProtectedRoute allowedRoles={['Super Admin', 'HR']}><Administrasi /></ProtectedRoute>} />
          <Route path="manajemen-user" element={<ProtectedRoute allowedRoles={['Super Admin', 'HR']}><ManajemenUser /></ProtectedRoute>} />
          
          <Route path="pengajuan">
            <Route path="sakit" element={<PengajuanSakit />} />
            <Route path="izin" element={<PengajuanIzin />} />
            <Route path="telat" element={<PengajuanTelat />} />
            <Route path="izin-setengah-hari" element={<PengajuanIzinSetengahHari />} />
            <Route path="cuti" element={<PengajuanCuti />} />
            <Route path="wfh" element={<PengajuanWfh />} />
            <Route path="lembur" element={<PengajuanLembur />} />
          </Route>
        </Route>
      </Routes>
    </Router>
    </AuthProvider>
  );
}
