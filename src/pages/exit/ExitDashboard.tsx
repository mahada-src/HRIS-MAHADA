import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../components/ui/Table';
import { Users, FileCheck, FileWarning, Calendar, Search, ArrowRight } from 'lucide-react';

export default function ExitDashboard() {
  const [exits, setExits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Semua');
  const navigate = useNavigate();
  const { employee } = useAuth();

  useEffect(() => {
    fetchExits();
  }, []);

  const fetchExits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_exit')
        .select(`
          *,
          employees (id, full_name, employee_code, departments(name), positions(title))
        `)
        .order('created_at', { ascending: false });

      if (data) setExits(data);
    } catch (err) {
      console.error('Error fetching exits:', err);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Clear' || status === 'Selesai') return 'bg-emerald-100 text-emerald-700';
    if (status === 'Draft' || status === 'Belum Diproses') return 'bg-slate-100 text-slate-700';
    if (status === 'Not Clear') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  // Stats calculation
  const totalExits = exits.length;
  const inProgress = exits.filter(e => !['Clear', 'Selesai', 'Draft'].includes(e.status)).length;
  const cleared = exits.filter(e => e.status === 'Clear' || e.status === 'Selesai').length;
  const drafts = exits.filter(e => e.status === 'Draft').length;

  const filteredExits = exits.filter(e => {
    if (statusFilter === 'Semua') return true;
    if (statusFilter === 'In Progress') return !['Clear', 'Selesai', 'Draft'].includes(e.status);
    return e.status === statusFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Team Pamit (Exit Clearance)</h1>
          <p className="text-sm text-slate-500">Kelola proses handover, pengembalian aset, dan clearance untuk karyawan keluar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Pengajuan</p>
                <h3 className="text-2xl font-bold text-slate-800">{totalExits}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileWarning className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Dalam Proses</p>
                <h3 className="text-2xl font-bold text-slate-800">{inProgress}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Sudah Clear</p>
                <h3 className="text-2xl font-bold text-slate-800">{cleared}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Drafts</p>
                <h3 className="text-2xl font-bold text-slate-800">{drafts}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-800">Daftar Exit Clearance</CardTitle>
          <div className="flex gap-2">
            {['Semua', 'Draft', 'In Progress', 'Clear'].map(filter => (
              <Button
                key={filter}
                variant={statusFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter)}
                className={statusFilter === filter ? 'bg-emerald-600 text-white' : ''}
              >
                {filter}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Karyawan</TableHead>
                  <TableHead>Departemen / Jabatan</TableHead>
                  <TableHead>Jenis Exit</TableHead>
                  <TableHead>Last Working Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">Memuat data...</TableCell>
                  </TableRow>
                ) : filteredExits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">Tidak ada data Exit Clearance ditemukan.</TableCell>
                  </TableRow>
                ) : (
                  filteredExits.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/team-pamit/${item.id}`)}>
                      <TableCell>
                        <div className="font-semibold text-slate-800">{item.employees?.full_name}</div>
                        <div className="text-xs text-slate-500">{item.employees?.employee_code || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700">{item.employees?.departments?.name || '-'}</div>
                        <div className="text-xs text-slate-500">{item.employees?.positions?.title || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{item.exit_type}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-800">{new Date(item.last_working_date).toLocaleDateString('id-ID')}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/team-pamit/${item.id}`); }}>
                          Detail <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
