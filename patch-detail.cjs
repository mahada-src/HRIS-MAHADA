const fs = require('fs');

let content = fs.readFileSync('src/pages/DetailData.tsx', 'utf8');

const importLines = `import { ArrowLeft, User, Briefcase, Phone, Mail, MapPin, Calendar, Clock, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';`;

const newImport = `import { ArrowLeft, User, Briefcase, Phone, Mail, MapPin, Calendar, Clock, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { Badge } from '../components/ui/Badge';`;

const states = `const [benefits, setBenefits] = useState<any[]>([]);`;
const newStates = `const [benefits, setBenefits] = useState<any[]>([]);
  const [activeRequests, setActiveRequests] = useState<any[]>([]);`;

const fetchLogic = `const ben = await supabase.from('benefits').select('*').eq('employee_id', employeeId);
        if (ben.data) setBenefits(ben.data);`;

const newFetchLogic = `const ben = await supabase.from('benefits').select('*').eq('employee_id', employeeId);
        if (ben.data) setBenefits(ben.data);

        // Fetch all active requests (Pending)
        const requestTables = [
          { table: 'sick_requests', type: 'Sakit', dateField: 'start_date' },
          { table: 'permission_requests', type: 'Izin', dateField: 'date' },
          { table: 'late_requests', type: 'Telat', dateField: 'date' },
          { table: 'half_day_requests', type: 'Izin Setengah Hari', dateField: 'date' },
          { table: 'leave_requests', type: 'Cuti', dateField: 'start_date' },
          { table: 'wfh_requests', type: 'WFH', dateField: 'date' },
          { table: 'overtime_requests', type: 'Lembur', dateField: 'date' }
        ];

        const reqPromises = requestTables.map(async (rt) => {
          const { data } = await supabase.from(rt.table).select('*').eq('employee_id', employeeId).eq('status', 'Menunggu Persetujuan');
          if (data && data.length > 0) {
            return data.map(d => ({ ...d, requestType: rt.type, requestDate: d[rt.dateField] }));
          }
          return [];
        });

        const reqResults = await Promise.all(reqPromises);
        const allRequests = reqResults.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setActiveRequests(allRequests);`;


const renderLogic = `<p className="text-sm text-slate-500 italic">Tidak ada pengajuan aktif saat ini.</p>`;

const newRenderLogic = `{activeRequests.length > 0 ? (
                <div className="space-y-4">
                  {activeRequests.map(r => (
                    <div key={r.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg border border-slate-100 bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-800">{r.requestType}</h4>
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Menunggu Persetujuan</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Tanggal: {r.requestDate ? new Date(r.requestDate).toLocaleDateString('id-ID') : '-'}
                        </p>
                        <p className="text-sm text-slate-700 mt-2">{r.reason || r.target_work}</p>
                      </div>
                      <div className="mt-3 sm:mt-0">
                        <span className="text-xs text-slate-400">ID: {r.id.substring(0,6).toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Tidak ada pengajuan aktif saat ini.</p>
              )}`;

content = content.replace(importLines, newImport);
content = content.replace(states, newStates);
content = content.replace(fetchLogic, newFetchLogic);
content = content.replace(renderLogic, newRenderLogic);

fs.writeFileSync('src/pages/DetailData.tsx', content);
