import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Sprout, 
  CalendarDays, 
  CheckCircle2, 
  TrendingUp, 
  Flame,
  Save,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MahadaGrowthRecord } from '../../types';

const ACTIVITIES = [
  "Daily Ibadah & Growth",
  "shalat dhuha",
  "jurnal syukur",
  "Shalat Tahajud",
  "Pembiasaan Baik",
  "Jejak Kebaikan",
  "Catatan Kebaikan Harian",
  "Spiritual & Personal Growth"
];

export default function Dashboard() {
  const { employee } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, Partial<MahadaGrowthRecord>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [stats, setStats] = useState({
    total: 0,
    percentage: 0,
    streak: 0,
    weekly: 0,
    weeklyTotal: 0
  });

  useEffect(() => {
    if (employee) {
      fetchData();
      fetchStats();
    }
  }, [employee, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mahada_growth_records')
        .select('*')
        .eq('employee_id', employee?.id)
        .eq('tanggal', selectedDate);

      if (error) throw error;

      const recordsMap: Record<string, Partial<MahadaGrowthRecord>> = {};
      ACTIVITIES.forEach(activity => {
        const existing = data?.find(d => d.jenis_aktivitas === activity);
        if (existing) {
          recordsMap[activity] = existing;
        } else {
          recordsMap[activity] = {
            jenis_aktivitas: activity,
            status: false,
            catatan: ''
          };
        }
      });
      setRecords(recordsMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate start and end of week
      const curr = new Date();
      const first = curr.getDate() - curr.getDay() + 1; // Monday
      const last = first + 6; // Sunday
      const firstDay = new Date(curr.setDate(first)).toISOString().split('T')[0];
      const lastDay = new Date(curr.setDate(last)).toISOString().split('T')[0];

      // Fetch all records for the employee to calculate streak and stats
      const { data: allRecords, error } = await supabase
        .from('mahada_growth_records')
        .select('*')
        .eq('employee_id', employee?.id)
        .eq('status', true);

      if (error) throw error;

      // Total activities done
      const total = allRecords?.length || 0;

      // Weekly stats
      const weeklyRecords = allRecords?.filter(r => r.tanggal >= firstDay && r.tanggal <= lastDay) || [];
      const weekly = weeklyRecords.length;
      const weeklyTotal = 30; // 4 activities * 7 days + 1 activity * 2 days (Mon, Thu)
      
      // Consistency percentage (based on all days since join date or first record)
      let percentage = 0;
      if (allRecords && allRecords.length > 0) {
          // simple approximation: max possible is total days since first record * 8
          const sorted = [...allRecords].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
          const firstDate = new Date(sorted[0].tanggal);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - firstDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          let maxPossible = 0;
          let tempDate = new Date(firstDate);
          while (tempDate <= today) {
              maxPossible += 4; // 4 daily activities
              if (tempDate.getDay() === 1 || tempDate.getDay() === 4) {
                  maxPossible += 1; // Shaum Senin Kamis
              }
              tempDate.setDate(tempDate.getDate() + 1);
          }
          percentage = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;
      }

      // Calculate streak
      let streak = 0;
      if (allRecords && allRecords.length > 0) {
        const uniqueDates = [...new Set(allRecords.map(r => r.tanggal))].sort().reverse();
        let currentDate = new Date().toISOString().split('T')[0];
        
        // If they haven't done anything today, check yesterday
        if (uniqueDates.length > 0 && uniqueDates[0] !== currentDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            currentDate = yesterday.toISOString().split('T')[0];
        }

        let tempStreak = 0;
        let checkDate = new Date(currentDate);

        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const hasActivity = uniqueDates.includes(dateStr);
            
            if (hasActivity) {
                tempStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        streak = tempStreak;
      }

      setStats({
        total,
        percentage: percentage > 100 ? 100 : percentage,
        streak,
        weekly,
        weeklyTotal
      });
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
  };

  const handleStatusChange = (activity: string, status: boolean) => {
    setRecords(prev => ({
      ...prev,
      [activity]: { ...prev[activity], status }
    }));
  };

  const handleNoteChange = (activity: string, catatan: string) => {
    setRecords(prev => ({
      ...prev,
      [activity]: { ...prev[activity], catatan }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      const recordsToUpsert = Object.values(records).map(record => ({
        employee_id: employee?.id,
        tanggal: selectedDate,
        jenis_aktivitas: record.jenis_aktivitas,
        status: record.status || false,
        catatan: record.catatan || '',
      }));

      // In supabase, we can use upsert with onConflict
      const { error } = await supabase
        .from('mahada_growth_records')
        .upsert(recordsToUpsert, { onConflict: 'employee_id, tanggal, jenis_aktivitas' });

      if (error) throw error;

      setMessage({ text: 'Data berhasil disimpan!', type: 'success' });
      fetchStats(); // Refresh stats
      
      setTimeout(() => {
          setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error: any) {
      console.error('Error saving records:', error);
      setMessage({ text: `Gagal menyimpan data: ${error.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mahada Growth</h1>
          <p className="text-sm text-slate-500">Catat, pantau, dan tumbuhkan kebaikan setiap hari.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <CalendarDays className="h-5 w-5 text-emerald-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-medium text-slate-700 outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Aktivitas</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Konsistensi</p>
            <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-slate-800">{stats.percentage}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Current Streak</p>
            <p className="text-2xl font-bold text-slate-800">{stats.streak} <span className="text-base font-normal text-slate-500">Hari</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <Sprout className="h-6 w-6 text-purple-500" />
          </div>
          <div className="w-full">
            <div className="flex justify-between items-end mb-1">
                <p className="text-sm text-slate-500 font-medium">Minggu Ini</p>
                <p className="text-sm font-bold text-slate-800">{stats.weekly} / {stats.weeklyTotal}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.weeklyTotal > 0 ? (stats.weekly / stats.weeklyTotal) * 100 : 0}%` }}
                ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h2 className="text-lg font-bold text-slate-800">Checklist Aktivitas</h2>
                <p className="text-sm text-slate-500">Pilih status aktivitas untuk tanggal {new Date(selectedDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            </div>
            <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">Simpan Data</span>
            </button>
        </div>

        {message.text && (
            <div className={cn("px-6 py-3 text-sm font-medium", message.type === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                {message.text}
            </div>
        )}

        {loading ? (
            <div className="p-12 flex justify-center items-center">
                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            </div>
        ) : (
            <div className="divide-y divide-slate-100">
                {ACTIVITIES.map((activity, index) => {
                    const isShaum = activity === "Shaum Senin Kamis";
                    const selDay = new Date(selectedDate).getDay();
                    const isAllowed = !isShaum || selDay === 1 || selDay === 4;

                    return (
                    <div key={index} className={cn("p-4 sm:p-6 transition-colors flex flex-col sm:flex-row gap-4 sm:items-start justify-between", isAllowed ? "hover:bg-slate-50/50" : "opacity-60 bg-slate-50")}>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-slate-500">{index + 1}</span>
                                </div>
                                <h3 className="font-semibold text-slate-800">{activity}</h3>
                                {!isAllowed && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">Hanya Senin & Kamis</span>}
                            </div>
                            <div className="sm:pl-11">
                                <textarea
                                    value={records[activity]?.catatan || ''}
                                    onChange={(e) => handleNoteChange(activity, e.target.value)}
                                    placeholder="Tambahkan catatan (opsional)..."
                                    className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                                    rows={2}
                                    disabled={!isAllowed}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:pl-0 pl-11 shrink-0">
                            <button
                                onClick={() => handleStatusChange(activity, true)}
                                disabled={!isAllowed}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-2 disabled:cursor-not-allowed",
                                    records[activity]?.status === true
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50"
                                )}
                            >
                                <span className={cn("h-4 w-4 rounded-full border-2", records[activity]?.status === true ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}></span>
                                Sudah
                            </button>
                            <button
                                onClick={() => handleStatusChange(activity, false)}
                                disabled={!isAllowed}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-2 disabled:cursor-not-allowed",
                                    records[activity]?.status === false
                                        ? "bg-red-50 border-red-200 text-red-700 shadow-sm"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50"
                                )}
                            >
                                <span className={cn("h-4 w-4 rounded-full border-2", records[activity]?.status === false ? "border-red-500 bg-red-500" : "border-slate-300")}></span>
                                Belum
                            </button>
                        </div>
                    </div>
                )})}
            </div>
        )}
      </div>
    </div>
  );
}
