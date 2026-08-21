import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { Plus, X, Link as LinkIcon, Car } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function IkatanDinas() {
  const { employee: currentUser } = useAuth();
  const role = currentUser?.role || 'Karyawan';
  const isManagerOrKaryawan = role === 'Manager' || role === 'Ass Super Admin' || role === 'Karyawan';
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState('Semua Karyawan');
  
  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [program_type, setProgram_type] = useState('');
  const [contract_number, setContract_number] = useState('');
  const [start_date, setStart_date] = useState('');
  const [nominal, setNominal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    let query = supabase.from('employees').select('id, full_name, employee_code, department_id').order('full_name');
    if (role === 'Karyawan') {
      query = query.eq('id', currentUser?.id);
    } else if (role === 'Manager') {
      query = query.eq('department_id', currentUser?.department_id);
    }
    const { data } = await query;
    if (data) setEmployees(data);
  };

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from('business_trip_bonds')
      .select('*, employees!inner(full_name, employee_code, department_id)')
      .order('start_date', { ascending: true }); // Process chronologically for clusters
      
    if (role === 'Karyawan') {
      query = query.eq('employee_id', currentUser?.id);
    } else if (role === 'Manager') {
      query = query.eq('employees.department_id', currentUser?.department_id);
    }

    const { data, error } = await query;
      
    if (data) setData(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return alert('Pilih karyawan');
    setIsSubmitting(true);
    
    const insertData: any = {
      employee_id: employeeId,
      status: 'Active',
      program_type,
      contract_number,
      start_date,
      end_date: start_date,
      nominal: nominal || 0
    };

    const { error } = await supabase.from('business_trip_bonds').insert([insertData]);

    setIsSubmitting(false);
    if (!error) {
      setShowForm(false);
      setEmployeeId('');
      setProgram_type('');
      setContract_number('');
      setStart_date('');
      setNominal('');
      fetchData();
    } else {
      alert('Gagal menyimpan data: ' + error.message);
    }
  };

  // Logic Clustering
  const clusteredBonds = useMemo(() => {
    // Group by employee
    const byEmp: Record<string, any[]> = {};
    
    // Urutkan berdasarkan tanggal terlama ke terbaru
    const sortedData = [...data].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    sortedData.forEach(trip => {
      if (!byEmp[trip.employee_id]) byEmp[trip.employee_id] = [];
      byEmp[trip.employee_id].push(trip);
    });

    const results: any[] = [];

    const getDurationMonths = (nominal: number) => {
      if (nominal < 1000000) return 6;
      if (nominal < 3000000) return 12;
      if (nominal < 10000000) return 24;
      if (nominal < 20000000) return 36;
      return 48;
    };

    Object.keys(byEmp).forEach(empId => {
      const trips = byEmp[empId];
      let currentCluster: any = null;
      let clusterIndex = 1;

      trips.forEach(trip => {
        const tripDate = new Date(trip.start_date);
        
        if (!currentCluster) {
          const nominal = parseFloat(trip.nominal) || 0;
          currentCluster = { 
            id: `${empId}-${clusterIndex}`,
            employee: trip.employees,
            trips: [trip], 
            startDate: tripDate, 
            totalNominal: nominal,
            durationMonths: getDurationMonths(nominal),
            periodName: `Periode ${clusterIndex}`
          };
          
          const endDate = new Date(currentCluster.startDate);
          endDate.setMonth(endDate.getMonth() + currentCluster.durationMonths);
          currentCluster.bondEndDate = endDate;
        } else {
          // Batas akumulasi adalah 6 bulan dari pendidikan pertama
          const sixMonthsLimit = new Date(currentCluster.startDate);
          sixMonthsLimit.setMonth(sixMonthsLimit.getMonth() + 6);

          if (tripDate <= sixMonthsLimit) {
            // Gabungkan karena masih dalam kurun waktu 6 bulan
            currentCluster.trips.push(trip);
            currentCluster.totalNominal += (parseFloat(trip.nominal) || 0);
            
            // Hitung ulang masa aktif berdasarkan nominal terbaru
            currentCluster.durationMonths = getDurationMonths(currentCluster.totalNominal);
            
            // Tanggal berakhir SELALU dihitung dari tanggal perjalanan PERTAMA di cluster ini
            const newEndDate = new Date(currentCluster.startDate);
            newEndDate.setMonth(newEndDate.getMonth() + currentCluster.durationMonths);
            currentCluster.bondEndDate = newEndDate;
          } else {
            // Lebih dari 6 bulan -> total biaya tidak akumulasi dan masa waktu terpisah
            results.push(currentCluster);
            clusterIndex++;
            
            const nominal = parseFloat(trip.nominal) || 0;
            currentCluster = { 
              id: `${empId}-${clusterIndex}`,
              employee: trip.employees,
              trips: [trip], 
              startDate: tripDate, 
              totalNominal: nominal,
              durationMonths: getDurationMonths(nominal),
              periodName: `Periode ${clusterIndex}`
            };
            const endDate = new Date(currentCluster.startDate);
            endDate.setMonth(endDate.getMonth() + currentCluster.durationMonths);
            currentCluster.bondEndDate = endDate;
          }
        }
      });

      if (currentCluster) {
        results.push(currentCluster);
      }
    });

    const today = new Date();
    results.forEach(c => {
      c.isActive = c.bondEndDate > today;
    });

    return results.sort((a, b) => b.bondEndDate.getTime() - a.bondEndDate.getTime());
  }, [data]);

  const rawHistory = [...data].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-800">Ikatan & Perjalanan Dinas</h1>
        </div>
        {!isManagerOrKaryawan && (
          <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-700 hover:bg-emerald-800 text-white">
            {showForm ? <><X className="w-4 h-4 mr-2" /> Batal</> : <><Plus className="w-4 h-4 mr-2" /> Tambah Perjalanan</>}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-0 shadow-sm bg-white rounded-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Karyawan</label>
                  <select required value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                    <option value="">-- Pilih Karyawan --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Tanggal</label>
                  <input required type="date" value={start_date} onChange={e => setStart_date(e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">No. Surat</label>
                  <input type="text" value={contract_number} onChange={e => setContract_number(e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="011/HC-SPPD/V/2026" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Nama Kegiatan / Program</label>
                  <input required type="text" value={program_type} onChange={e => setProgram_type(e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="IDMC" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Nominal (Rp)</label>
                  <input required type="number" value={nominal} onChange={e => setNominal(e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="1500000" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kolom Kiri: Riwayat */}
        <Card className="border-0 shadow-sm rounded-xl overflow-hidden border-t-4 border-t-blue-500 bg-white flex flex-col h-[550px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div className="flex items-center text-sm font-semibold text-slate-700">
              <Car className="w-4 h-4 mr-2 text-blue-500" />
              Riwayat Perjalanan Dinas
            </div>
            <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="text-xs border-slate-200 rounded px-2 py-1">
              <option value="Semua Karyawan">Semua Karyawan</option>
              {employees.map(emp => <option key={emp.id} value={emp.full_name}>{emp.full_name}</option>)}
            </select>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] font-bold text-emerald-800 bg-[#cbf5e6] uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">TANGGAL</th>
                  <th className="px-4 py-3">KARYAWAN</th>
                  <th className="px-4 py-3">NO SURAT & KEGIATAN</th>
                  <th className="px-4 py-3 text-right">NOMINAL (RP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-500">Memuat data...</td></tr>
                ) : rawHistory.filter(h => filterEmployee === 'Semua Karyawan' || h.employees?.full_name === filterEmployee).length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-500">Belum ada riwayat.</td></tr>
                ) : (
                  rawHistory
                    .filter(h => filterEmployee === 'Semua Karyawan' || h.employees?.full_name === filterEmployee)
                    .map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600">
                        {item.start_date ? new Date(item.start_date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{item.employees?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{item.employees?.employee_code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 mb-1">
                          {item.contract_number || '-'}
                        </div>
                        <div className="text-slate-700">{item.program_type}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {item.nominal ? `Rp ${parseInt(item.nominal).toLocaleString('id-ID')}` : 'Rp 0'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Kolom Kanan: Status Ikatan */}
        <Card className="border-0 shadow-sm rounded-xl overflow-hidden border-t-4 border-t-amber-400 bg-white flex flex-col h-[550px]">
          <div className="p-4 border-b border-slate-100 flex items-center bg-white shrink-0 text-sm font-semibold text-slate-700">
            <LinkIcon className="w-4 h-4 mr-2 text-amber-500" />
            Status Masa Ikatan Dinas
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] font-bold text-emerald-800 bg-[#cbf5e6] uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">NAMA KARYAWAN</th>
                  <th className="px-4 py-3 text-right">TOTAL BIAYA</th>
                  <th className="px-4 py-3">MASA BERAKHIR IKATAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clusteredBonds.filter(c => filterEmployee === 'Semua Karyawan' || c.employee?.full_name === filterEmployee).length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-slate-500">Tidak ada ikatan dinas aktif/riwayat.</td></tr>
                ) : (
                  clusteredBonds
                  .filter(c => filterEmployee === 'Semua Karyawan' || c.employee?.full_name === filterEmployee)
                  .map((cluster, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800">
                          {cluster.employee?.full_name || 'Unknown'} 
                          <span className="ml-2 text-[10px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{cluster.periodName}</span>
                        </div>
                        <div className="text-xs text-slate-500">{cluster.employee?.employee_code}</div>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-800">
                        Rp {cluster.totalNominal.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-4">
                        <div className={`font-semibold ${cluster.isActive ? 'text-red-500' : 'text-slate-500'}`}>
                          {cluster.bondEndDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year:'numeric'})}
                        </div>
                        {cluster.isActive ? (
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white mt-1 shadow-sm">
                            Ikatan Dinas Aktif ({cluster.durationMonths} Bulan)
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600 mt-1">
                            Selesai ({cluster.durationMonths} Bulan)
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}
