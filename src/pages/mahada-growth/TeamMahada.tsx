import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import { Employee } from '../../types';
import { Users } from 'lucide-react';

export default function TeamMahada() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*, departments(name), positions(title)')
        .neq('status_karyawan', 'Resign')
        .neq('status_karyawan', 'PHK')
        .neq('status_karyawan', 'Inactive')
        .order('full_name', { ascending: true });

      if (error) throw error;
      if (data) {
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat data tim...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <Users className="h-6 w-6 text-emerald-600" />
          Team Mahada
        </h1>
        <p className="text-sm text-slate-500 mt-1">Mari saling mengenal dengan sesama anggota tim Mahada.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {employees.map((emp) => (
          <Card key={emp.id} className="hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
              <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border border-emerald-200 shrink-0 text-xl font-bold text-emerald-700">
                {emp.photo_url ? (
                  <img src={emp.photo_url} alt={emp.full_name} className="h-full w-full object-cover" />
                ) : (
                  emp.full_name?.substring(0, 2).toUpperCase() || 'US'
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 line-clamp-2">{emp.full_name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {/* @ts-ignore */}
                  {emp.positions?.title || emp.posisi || '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {employees.length === 0 && (
        <div className="text-center py-12 text-slate-500 border border-slate-200 rounded-xl border-dashed bg-slate-50">
          Belum ada data anggota tim.
        </div>
      )}
    </div>
  );
}
