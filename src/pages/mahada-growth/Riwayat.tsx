import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { MahadaGrowthRecord } from '../../types';
import { Calendar, Search, Filter, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Riwayat() {
  const { employee } = useAuth();
  const [records, setRecords] = useState<MahadaGrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, today, week, month
  const [filterActivity, setFilterActivity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (employee) {
      fetchHistory();
    }
  }, [employee]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mahada_growth_records')
        .select('*')
        .eq('employee_id', employee?.id)
        .order('tanggal', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredRecords = records.filter(record => {
    // Search filter
    const matchesSearch = record.catatan?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          record.jenis_aktivitas.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Activity filter
    const matchesActivity = filterActivity === 'all' || record.jenis_aktivitas === filterActivity;
    
    // Date filter
    let matchesDate = true;
    const recordDate = new Date(record.tanggal);
    const today = new Date();
    
    if (filterPeriod === 'today') {
      matchesDate = record.tanggal === today.toISOString().split('T')[0];
    } else if (filterPeriod === 'week') {
      const first = today.getDate() - today.getDay() + 1;
      const firstDay = new Date(today.setDate(first));
      matchesDate = recordDate >= firstDay;
    } else if (filterPeriod === 'month') {
      matchesDate = recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear();
    }

    return matchesSearch && matchesActivity && matchesDate;
  });

  const uniqueActivities = [...new Set(records.map(r => r.jenis_aktivitas))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Riwayat Mahada Growth</h1>
        <p className="text-sm text-slate-500">Lihat seluruh riwayat catatan kebaikan Anda.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aktivitas atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={filterActivity}
                onChange={(e) => setFilterActivity(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none bg-white"
              >
                <option value="all">Semua Aktivitas</option>
                {uniqueActivities.map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none bg-white"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Belum ada catatan</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery || filterActivity !== 'all' || filterPeriod !== 'all' 
                ? 'Tidak ada data yang cocok dengan filter Anda.' 
                : 'Anda belum mencatat aktivitas Mahada Growth.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aktivitas</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Catatan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {new Date(record.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {record.jenis_aktivitas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.status ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3.5 w-3.5" />
                          Belum
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={record.catatan}>
                      {record.catatan || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
