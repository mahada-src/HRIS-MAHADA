import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import {
  LogOut,
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  Gift,
  Briefcase,
  AlertTriangle,
  Settings,
  FolderOpen,
  FileSignature,
  X,
  ChevronDown,
  ChevronRight,
  Shield,
  UserMinus,
  Database,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tim Karyawan', href: '/tim', icon: Users },
  { name: 'Detail Data', href: '/detail', icon: FileText },
  { name: 'Rekap Absensi', href: '/absensi', icon: CalendarDays },
  { name: 'Benefit Karyawan', href: '/benefit', icon: Gift },
  { name: 'Ikatan Dinas', href: '/ikatan-dinas', icon: Briefcase },
  { name: 'Pelanggaran (SP)', href: '/pelanggaran', icon: AlertTriangle },
  {
    name: 'Pengajuan',
    icon: FileSignature,
    children: [
      { name: 'Sakit', href: '/pengajuan/sakit' },
      { name: 'Izin Full', href: '/pengajuan/izin' },
      { name: 'Izin 1/2', href: '/pengajuan/izin-setengah-hari' },
      { name: 'Izin 1/3', href: '/pengajuan/izin-sepertiga-hari' },
      { name: 'Telat', href: '/pengajuan/telat' },
      { name: 'WFH', href: '/pengajuan/wfh' },
      { name: 'Cuti', href: '/pengajuan/cuti' },
      { name: 'Lembur', href: '/pengajuan/lembur' },
      { name: 'Rekap Pengajuan', href: '/pengajuan/rekap' },
    ],
  },
  { name: 'Pengaturan', href: '/pengaturan', icon: Settings },
  { name: 'Administrasi', href: '/administrasi', icon: FolderOpen },
  {
    name: 'Inventory Asset',
    icon: Database,
    children: [
      { name: 'Asset Laptop / PC', href: '/inventory/laptop-pc' },
      { name: 'Asset Handphone', href: '/inventory/handphone' },
      { name: 'Asset Conten', href: '/inventory/conten' },
      { name: 'Asset Mesin', href: '/inventory/mesin' },
      { name: 'Asset Kendaraan', href: '/inventory/kendaraan' },
      { name: 'Asset Sapras', href: '/inventory/sapras' },
      { name: 'Rekap Asset', href: '/inventory/rekap' },
    ],
  },
  { name: 'Team Pamit', href: '/team-pamit', icon: UserMinus },
  { name: 'Manajemen User', href: '/manajemen-user', icon: Shield },
];

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation();
  const { employee, signOut } = useAuth();
  const role = employee?.role || 'Karyawan';

  const filteredNavigation = navigation.filter(item => {
    if (item.name === 'Inventory Asset') {
      return role === 'Super Admin' || role === 'Ass Super Admin';
    }
    if (role === 'Super Admin') return true;
    if (role === 'HR') return item.name !== 'Manajemen User';
    if (role === 'Manager' || role === 'Ass Super Admin') return !['Pengaturan', 'Manajemen User'].includes(item.name);
    return ['Tim Karyawan', 'Detail Data', 'Rekap Absensi', 'Benefit Karyawan', 'Ikatan Dinas', 'Pelanggaran (SP)', 'Pengajuan', 'Administrasi'].includes(item.name);
  });
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Pengajuan: location.pathname.startsWith('/pengajuan'),
    'Inventory Asset': location.pathname.startsWith('/inventory'),
  });

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#0f172a] px-3 pb-4">
      <div className="flex h-16 shrink-0 items-center border-b border-slate-800 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20">M</div>
          <span className="text-lg font-bold tracking-tight text-white">HRIS <span className="text-emerald-400">MAHADA</span></span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = item.href === location.pathname;
                const isChildActive = item.children?.some(
                  (child) => child.href === location.pathname
                );
                
                return (
                  <li key={item.name}>
                    {!item.children ? (
                      <NavLink
                        to={item.href}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            isActive
                              ? 'border-l-4 border-emerald-500 bg-slate-800/50 text-emerald-400'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                            'group flex gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-all'
                          )
                        }
                      >
                        <item.icon
                          className={cn(
                            isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white',
                            'h-5 w-5 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </NavLink>
                    ) : (
                      <div>
                        <button
                          onClick={() => toggleMenu(item.name)}
                          className={cn(
                            isChildActive
                              ? 'border-l-4 border-emerald-500 bg-slate-800/50 text-emerald-400'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                            'flex w-full items-center justify-between gap-x-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-all'
                          )}
                        >
                          <div className="flex items-center gap-x-3">
                            <item.icon
                              className={cn(
                                isChildActive ? 'text-emerald-400' : 'text-slate-400',
                                'h-5 w-5 shrink-0'
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </div>
                          {openMenus[item.name] ? (
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                        {openMenus[item.name] && (
                          <ul className="mt-1 space-y-1 pl-8">
                            {item.children.map((subItem) => (
                              <li key={subItem.name}>
                                <NavLink
                                  to={subItem.href}
                                  onClick={() => setOpen(false)}
                                  className={({ isActive }) =>
                                    cn(
                                      isActive
                                        ? 'text-emerald-400'
                                        : 'text-slate-500 hover:text-emerald-400',
                                      'block py-1 text-xs transition-colors'
                                    )
                                  }
                                >
                                  {subItem.name}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>

      <div className="px-2 mt-4">
        <button onClick={() => signOut()} className="flex w-full items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
          <LogOut className="h-5 w-5 shrink-0" />
          Keluar
        </button>
      </div>
      <div className="mt-auto border-t border-slate-800 bg-slate-900/50 p-4 -mx-3 -mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white uppercase">{employee?.full_name?.substring(0,2) || 'US'}</div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white">{employee?.full_name || 'User'}</span>
            <span className="text-[10px] text-slate-500">{employee?.role || 'Karyawan'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/80 transition-opacity lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-[#0f172a] transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className={cn("absolute left-full top-0 flex w-16 justify-center pt-5 transition-opacity duration-300 ease-in-out", open ? "opacity-100" : "opacity-0 pointer-events-none")}>
          <button type="button" className="-m-2.5 p-2.5" onClick={() => setOpen(false)}>
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6 text-white" aria-hidden="true" />
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </div>
      
      {/* Spacer for desktop layout */}
      <div className="hidden lg:block lg:w-64 shrink-0"></div>
    </>
  );
}
