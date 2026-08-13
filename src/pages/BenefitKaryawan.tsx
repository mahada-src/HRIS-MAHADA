import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { useAuth } from '../lib/AuthContext';

export default function BenefitKaryawan() {
  const { employee: currentUser } = useAuth();
  const role = currentUser?.role || 'Karyawan';
  const isManagerOrKaryawan = role === 'Manager' || role === 'Karyawan';
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    let query = supabase
      .from('employees')
      .select('*, departments(name)')
      .order('employee_code', { ascending: false });
      
    if (role === 'Karyawan') {
      query = query.eq('id', currentUser?.id);
    } else if (role === 'Manager') {
      query = query.eq('department_id', currentUser?.department_id);
    }
      
    const { data, error } = await query;
      
    if (data) setEmployees(data);
    setLoading(false);
  };

  const handleUpdate = async (id: string, field: string, value: string) => {
    // Optimistic UI update
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, [field]: value } : emp));

    const { error } = await supabase
      .from('employees')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      alert('Gagal menyimpan perubahan: ' + error.message);
      fetchEmployees(); // Revert
    }
  };

  const getLamaBekerjaDetail = (tglTetap?: string, tglProbation?: string) => {
    const startDateStr = tglTetap || tglProbation;
    if (!startDateStr) return { years: 0, months: 0, days: 0, formatted: '-' };
    
    const startDate = new Date(startDateStr);
    const today = new Date();
    
    let years = today.getFullYear() - startDate.getFullYear();
    let months = today.getMonth() - startDate.getMonth();
    let days = today.getDate() - startDate.getDate();
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days, formatted: `${years} Thn ${months} Bln ${days} Hr` };
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-emerald-800">Benefit Karyawan</h1>
        <p className="text-sm text-emerald-600/80">Pantau program khusus, BPJS, dan benefit jangka panjang karyawan.</p>
      </div>

      <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs font-semibold text-emerald-800 bg-[#cbf5e6] uppercase">
              <tr>
                <th className="px-4 py-4 rounded-tl-xl">KARYAWAN</th>
                <th className="px-4 py-4">LAMA BEKERJA</th>
                <th className="px-4 py-4">STATUS UMROH</th>
                <th className="px-4 py-4">AKSI UMROH</th>
                <th className="px-4 py-4">STATUS BPJS</th>
                <th className="px-4 py-4">AKSI BPJS</th>
                <th className="px-4 py-4 rounded-tr-xl">PROGRAM QURBAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">Memuat data...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">Tidak ada data karyawan ditemukan.</td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const lamaKerja = getLamaBekerjaDetail(emp.tgl_tetap || emp.join_date, emp.tgl_probation);
                  
                  const isUmrohEligible = lamaKerja.years >= 5;
                  const isBPJSEligible = lamaKerja.years >= 2;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{emp.full_name}</div>
                        <div className="text-xs text-slate-500 font-medium">{emp.id_karyawan || emp.employee_code || 'undefined'}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {lamaKerja.formatted}
                      </td>
                      <td className="px-4 py-3">
                        {lamaKerja.formatted === '-' ? (
                          <span className="text-slate-400 text-xs italic">Data tgl belum diisi</span>
                        ) : isUmrohEligible ? (
                          <span className="inline-flex items-center rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                            Memenuhi Syarat
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center rounded bg-slate-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                              Belum Memenuhi
                            </span>
                            <span className="text-[10px] text-red-500 font-medium">*Min 5 Tahun</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={emp.aksi_umroh || ''} 
                          onChange={(e) => handleUpdate(emp.id, 'aksi_umroh', e.target.value)}
                          disabled={isManagerOrKaryawan}
                          className="w-32 rounded border border-blue-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                        >
                          <option value="">- Pilih -</option>
                          <option value="Berangkat">Berangkat</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Cancel">Cancel</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {lamaKerja.formatted === '-' ? (
                          <span className="text-slate-400 text-xs italic">-</span>
                        ) : isBPJSEligible ? (
                          <span className="inline-flex items-center rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                            Memenuhi Syarat
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center rounded bg-slate-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                              Belum Memenuhi
                            </span>
                            <span className="text-[10px] text-red-500 font-medium">*Min 2 Tahun</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={emp.aksi_bpjs || ''} 
                          onChange={(e) => handleUpdate(emp.id, 'aksi_bpjs', e.target.value)}
                          disabled={isManagerOrKaryawan}
                          className="w-32 rounded border border-blue-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                        >
                          <option value="">- Pilih -</option>
                          <option value="Terdaftar">Terdaftar</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Cancel">Cancel</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={emp.program_qurban || ''} 
                          onChange={(e) => handleUpdate(emp.id, 'program_qurban', e.target.value)}
                          disabled={isManagerOrKaryawan}
                          className="w-32 rounded border border-blue-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                        >
                          <option value="">- Pilih -</option>
                          <option value="Antrian">Antrian</option>
                          <option value="Berqurban">Berqurban</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="text"
                          placeholder="Merek/Tipe..."
                          value={emp.detail_kendaraan || ''}
                          onChange={(e) => handleUpdate(emp.id, 'detail_kendaraan', e.target.value)}
                          disabled={isManagerOrKaryawan}
                          className="w-32 rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
