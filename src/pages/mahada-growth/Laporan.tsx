import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Employee, Department, MahadaGrowthRecord } from '../../types';
import { Loader2, Search, Filter, Download, UserCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmployeeStat {
  employee: Employee;
  total: parseInt;
  percentage: number;
  streak: number;
}

export default function Laporan() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [records, setRecords] = useState<MahadaGrowthRecord[]>([]);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterDept, setFilterDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [filterMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Departments
      const { data: deptData } = await supabase.from('departments').select('*');
      if (deptData) setDepartments(deptData);

      // Fetch Employees with Departments (Only Active)
      const { data: empData } = await supabase.from('employees').select('*, departments(*)').neq('employment_status', 'Resign');
      if (empData) setEmployees(empData);

      // Fetch Records for the selected month
      const startOfMonth = `${filterMonth}-01`;
      const endOfMonthDate = new Date(new Date(startOfMonth).getFullYear(), new Date(startOfMonth).getMonth() + 1, 0);
      const endOfMonth = endOfMonthDate.toISOString().split('T')[0];

      const { data: recData } = await supabase
        .from('mahada_growth_records')
        .select('*')
        .gte('tanggal', startOfMonth)
        .lte('tanggal', endOfMonth)
        .eq('status', true); // Only count completed activities

      if (recData) setRecords(recData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for display
  const processedData = employees.map(emp => {
    const empRecords = records.filter(r => r.employee_id === emp.id);
    const total = empRecords.length;
    
    // Max possible per month = days in month * 8 activities
    const daysInMonth = new Date(new Date(`${filterMonth}-01`).getFullYear(), new Date(`${filterMonth}-01`).getMonth() + 1, 0).getDate();
    // But limit to days up to today if it's the current month
    const today = new Date();
    let daysToCount = daysInMonth;
    if (today.toISOString().slice(0, 7) === filterMonth) {
      daysToCount = today.getDate();
    }
    let maxPossible = 0;
    const year = new Date(`${filterMonth}-01`).getFullYear();
    const month = new Date(`${filterMonth}-01`).getMonth();
    for (let d = 1; d <= daysToCount; d++) {
        const tempDate = new Date(year, month, d);
        maxPossible += 4; // 4 daily activities
        if (tempDate.getDay() === 1 || tempDate.getDay() === 4) {
            maxPossible += 1; // Shaum Senin Kamis
        }
    }
    const percentage = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;

    // Simple streak calculation for the month
    let streak = 0;
    if (empRecords.length > 0) {
        const uniqueDates = [...new Set(empRecords.map(r => r.tanggal))].sort().reverse();
        let currentStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const date1 = new Date(uniqueDates[i]);
            const date2 = new Date(uniqueDates[i+1]);
            const diffDays = Math.ceil(Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
        streak = currentStreak;
    }

    return {
      employee: emp,
      total,
      percentage: percentage > 100 ? 100 : percentage,
      streak
    };
  });

  // Apply filters
  const filteredData = processedData.filter(item => {
    const matchesSearch = item.employee.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || item.employee.department_id === filterDept;
    return matchesSearch && matchesDept;
  }).sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Mahada Growth</h1>
          <p className="text-sm text-slate-500">Pantau perkembangan dan konsistensi kebaikan karyawan.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none bg-white"
              >
                <option value="all">Semua Departemen</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
          <h3 className="text-emerald-800 text-sm font-medium">Rata-rata Konsistensi</h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {filteredData.length > 0 ? Math.round(filteredData.reduce((acc, curr) => acc + curr.percentage, 0) / filteredData.length) : 0}%
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
          <h3 className="text-blue-800 text-sm font-medium">Total Aktivitas Tercatat</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {filteredData.reduce((acc, curr) => acc + curr.total, 0)}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl">
          <h3 className="text-purple-800 text-sm font-medium">Partisipasi Karyawan</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {filteredData.filter(d => d.total > 0).length} / {filteredData.length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <UserCheck className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Data tidak ditemukan</h3>
            <p className="mt-1 text-sm text-slate-500">Tidak ada data karyawan yang cocok dengan filter yang dipilih.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Departemen</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Aktivitas</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Konsistensi</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Streak Terbaik</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredData.map((data) => (
                  <tr key={data.employee.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {data.employee.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-900">{data.employee.full_name}</div>
                          <div className="text-xs text-slate-500">{data.employee.employee_code || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {data.employee.departments?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                      {data.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                            <div 
                                className={cn("h-2 rounded-full", data.percentage >= 80 ? "bg-emerald-500" : data.percentage >= 50 ? "bg-yellow-500" : "bg-red-500")} 
                                style={{ width: `${data.percentage}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700">{data.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {data.streak > 0 ? (
                        <span className="inline-flex items-center gap-1">
                            <span className="font-bold text-orange-500">{data.streak}</span> Hari
                        </span>
                      ) : '-'}
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
