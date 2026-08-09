const fs = require('fs');

// Patch Sidebar
let sidebar = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

sidebar = sidebar.replace(`import { NavLink, useLocation } from 'react-router-dom';`, `import { NavLink, useLocation } from 'react-router-dom';\nimport { useAuth } from '../../lib/AuthContext';\nimport { supabase } from '../../lib/supabase';`);

sidebar = sidebar.replace(`import {\n  LayoutDashboard,`, `import {\n  LogOut,\n  LayoutDashboard,`);

sidebar = sidebar.replace(`const location = useLocation();`, `const location = useLocation();\n  const { employee } = useAuth();\n  const role = employee?.role || 'Karyawan';\n\n  const filteredNavigation = navigation.filter(item => {\n    if (role === 'Super Admin' || role === 'HR') return true;\n    if (role === 'Manager') return ['Dashboard', 'Tim Karyawan', 'Detail Data', 'Rekap Absensi', 'Pengajuan'].includes(item.name);\n    return ['Dashboard', 'Detail Data', 'Rekap Absensi', 'Benefit Karyawan', 'Pengajuan'].includes(item.name);\n  });`);

sidebar = sidebar.replace(`{navigation.map((item) => {`, `{filteredNavigation.map((item) => {`);

// Update user profile at bottom
sidebar = sidebar.replace(
  `<span className="text-xs font-semibold text-white">Admin Utama</span>`, 
  `<span className="text-xs font-semibold text-white">{employee?.full_name || 'User'}</span>`
);
sidebar = sidebar.replace(
  `<span className="text-[10px] text-slate-500">Superadmin</span>`, 
  `<span className="text-[10px] text-slate-500">{employee?.role || 'Karyawan'}</span>`
);
sidebar = sidebar.replace(
  `<div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">AD</div>`, 
  `<div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white uppercase">{employee?.full_name?.substring(0,2) || 'US'}</div>`
);

sidebar = sidebar.replace(`</nav>`, `</nav>\n\n      <div className="px-2 mt-4">\n        <button onClick={() => supabase.auth.signOut()} className="flex w-full items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">\n          <LogOut className="h-5 w-5 shrink-0" />\n          Keluar\n        </button>\n      </div>`);

fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebar);


// Patch Pengajuan Pages
const reqFiles = [
  'Sakit.tsx', 'Izin.tsx', 'Telat.tsx', 'IzinSetengahHari.tsx', 'Cuti.tsx', 'Wfh.tsx', 'Lembur.tsx'
];

reqFiles.forEach(file => {
  const path = `src/pages/pengajuan/${file}`;
  let content = fs.readFileSync(path, 'utf8');

  // Import useAuth
  content = content.replace(`import { Plus, X`, `import { useAuth } from '../../lib/AuthContext';\nimport { Plus, X`);
  
  // Add useAuth hook
  content = content.replace(`const [employeeId, setEmployeeId] = useState('');`, `const [employeeId, setEmployeeId] = useState('');\n  const { employee: currentEmployee } = useAuth();\n  const isAdmin = currentEmployee?.role === 'HR' || currentEmployee?.role === 'Super Admin';\n\n  useEffect(() => {\n    if (currentEmployee && !isAdmin) {\n      setEmployeeId(currentEmployee.id);\n    }\n  }, [currentEmployee, isAdmin]);`);

  // Replace select dropdown
  const selectRegex = /<label className="text-sm font-medium text-slate-700">Karyawan<\/label>[\s\S]*?<\/select>/m;
  
  content = content.replace(selectRegex, `<label className="text-sm font-medium text-slate-700">Karyawan</label>
                {isAdmin ? (
                  <select 
                    required
                    value={employeeId} 
                    onChange={e => setEmployeeId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- Pilih Karyawan --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.employee_code} - {emp.full_name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600">
                    {currentEmployee?.full_name} ({currentEmployee?.employee_code})
                  </div>
                )}`);

  // Restrict approval to Admin/Manager
  content = content.replace(`{item.status === 'Menunggu Persetujuan' && (`, `{item.status === 'Menunggu Persetujuan' && (isAdmin || currentEmployee?.role === 'Manager') && (`);

  fs.writeFileSync(path, content);
});

