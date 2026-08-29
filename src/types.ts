export interface Department {
  id: string;
  user_id?: string;
  role?: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Position {
  id: string;
  user_id?: string;
  role?: string;
  title: string;
  level?: string;
  department_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: string;
  user_id?: string;
  role?: string;
  id_karyawan?: string;
  employee_code?: string;
  full_name: string;
  level?: string;
  brand?: string;
  divisi?: string;
  posisi?: string;
  status_karyawan?: string;
  status_kepegawaian?: string;
  tgl_probation?: string;
  tgl_tetap?: string;
  stifin?: string;
  nik?: string;
  tgl_lahir?: string;
  no_tlpn?: string;
  phone_number?: string;
  alamat?: string;
  nama_keluarga_terdekat?: string;
  no_keluarga_terdekat?: string;
  no_keluarga?: string;
  pendidikan?: string;
  department_id?: string;
  position_id?: string;
  employment_status?: string;
  join_date?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  departments?: Department;
  positions?: Position;
}

export interface Attendance {
  id: string;
  user_id?: string;
  role?: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface SickRequest {
  id: string;
  user_id?: string;
  role?: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  medical_certificate_url?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface PermissionRequest {
  id: string;
  user_id?: string;
  role?: string;
  employee_id: string;
  permission_type: string;
  date: string;
  reason: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface LateRequest {
  id: string;
  user_id?: string;
  role?: string;
  employee_id: string;
  date: string;
  estimated_arrival: string;
  reason: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface HalfDayRequest {
  id: string;
  user_id?: string;
  role?: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface LeaveRequest {
  id: string;
  user_id?: string;
  role?: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface WfhRequest {
  id: string;
  user_id?: string;
  role?: string;
  employee_id: string;
  date: string;
  reason: string;
  todo_list?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface OvertimeRequest {
  id: string;
  user_id?: string;
  role?: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  target_work: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface Benefit {
  id: string;
  user_id?: string;
  role?: string;
  employee_id: string;
  benefit_type: string;
  description?: string;
  amount?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface BusinessTripBond {
  id: string;
  user_id?: string;
  role?: string;
  employee_id: string;
  program_type: string;
  contract_number?: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface Violation {
  id: string;
  user_id?: string;
  role?: string;
  employee_id: string;
  violation_type: string;
  letter_number?: string;
  date: string;
  reason: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

export interface InventoryAsset {
  id: string;
  category: string;
  asset_name: string;
  brand?: string;
  employee_id?: string;
  inventory_code?: string;
  purchase_date?: string;
  purchase_price?: number;
  asset_status?: string;
  asset_condition?: string;
  condition_notes?: string;
  // Laptop specific fields
  production_year?: string;
  processor?: string;
  storage?: string;
  ram?: string;
  last_used?: string;
  created_at: string;
  updated_at?: string;
  employees?: Employee;
}
