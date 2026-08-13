-- Set up database schema untuk HRIS MAHADA

-- Enable pgcrypto for UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Positions
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    level VARCHAR(50), -- e.g., Staff, Supervisor, Manager
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Employees (Data Utama Karyawan)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(50) UNIQUE NOT NULL, -- NIK Karyawan
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    employment_status VARCHAR(50), -- Tetap, Kontrak, Resign
    join_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL, -- Hadir, Terlambat, Alpha
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Sick Requests
CREATE TABLE IF NOT EXISTS public.sick_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    medical_certificate_url TEXT,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Permission Requests (Izin)
CREATE TABLE IF NOT EXISTS public.permission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    permission_type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Late Requests (Keterlambatan)
CREATE TABLE IF NOT EXISTS public.late_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    estimated_arrival TIME NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Half Day Requests (Izin Setengah Hari)
CREATE TABLE IF NOT EXISTS public.half_day_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Leave Requests (Cuti)
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    leave_type VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. WFH Requests
CREATE TABLE IF NOT EXISTS public.wfh_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    todo_list TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Overtime Requests
CREATE TABLE IF NOT EXISTS public.overtime_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    target_work TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Benefits
CREATE TABLE IF NOT EXISTS public.benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    benefit_type VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Business Trip Bonds (Ikatan Dinas)
CREATE TABLE IF NOT EXISTS public.business_trip_bonds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    program_type VARCHAR(100) NOT NULL,
    contract_number VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Violations
CREATE TABLE IF NOT EXISTS public.violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    violation_type VARCHAR(100) NOT NULL, -- e.g., SP 1, SP 2, SP 3, Teguran
    letter_number VARCHAR(100),
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Berlaku',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE, -- Bisa NULL untuk notifikasi broadcast
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL, -- Siapa yang melakukan aktivitas
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Functions and Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_modtime BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_positions_modtime BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_employees_modtime BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_attendance_modtime BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_sick_requests_modtime BEFORE UPDATE ON public.sick_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_permission_requests_modtime BEFORE UPDATE ON public.permission_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_late_requests_modtime BEFORE UPDATE ON public.late_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_half_day_requests_modtime BEFORE UPDATE ON public.half_day_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_leave_requests_modtime BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_wfh_requests_modtime BEFORE UPDATE ON public.wfh_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_overtime_requests_modtime BEFORE UPDATE ON public.overtime_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_benefits_modtime BEFORE UPDATE ON public.benefits FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_business_trip_bonds_modtime BEFORE UPDATE ON public.business_trip_bonds FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_violations_modtime BEFORE UPDATE ON public.violations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_notifications_modtime BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_activity_logs_modtime BEFORE UPDATE ON public.activity_logs FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ==========================================
-- AUTHENTICATION & ROW LEVEL SECURITY (RLS)
-- ==========================================

-- 1. Add Auth User Link & Role to Employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Karyawan';

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_trip_bonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sick_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.late_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.half_day_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wfh_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_requests ENABLE ROW LEVEL SECURITY;

-- 2. Create function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role() RETURNS text AS $$
  SELECT role FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Setup RLS Policies

-- Master Data (Departments & Positions)
-- Everyone can read, only Admin/HR can write
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admin write departments" ON public.departments FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

CREATE POLICY "Public read positions" ON public.positions FOR SELECT USING (true);
CREATE POLICY "Admin write positions" ON public.positions FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

-- Employees
CREATE POLICY "Employee own data" ON public.employees FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Manager view team" ON public.employees FOR SELECT USING (
  get_user_role() = 'Manager' AND department_id IN (
    SELECT department_id FROM public.employees WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Admin HR full access employees" ON public.employees FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

-- Attendance
CREATE POLICY "Employee own attendance" ON public.attendance FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Manager view team attendance" ON public.attendance FOR SELECT USING (
  get_user_role() = 'Manager' AND employee_id IN (
    SELECT id FROM public.employees WHERE department_id IN (SELECT department_id FROM public.employees WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Admin HR full access attendance" ON public.attendance FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

-- Benefits, Bonds, Violations
-- Employee can read own
CREATE POLICY "Employee read own benefits" ON public.benefits FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
CREATE POLICY "Admin HR full benefits" ON public.benefits FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

CREATE POLICY "Employee read own bonds" ON public.business_trip_bonds FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
CREATE POLICY "Admin HR full bonds" ON public.business_trip_bonds FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

CREATE POLICY "Employee read own violations" ON public.violations FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
CREATE POLICY "Admin HR full violations" ON public.violations FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));


-- Pengajuan (Requests)
-- A generic macro approach is to apply this pattern to all request tables.
-- For brevity, applying to sick_requests as example, do the same for others:

DO $$ 
DECLARE
  tables text[] := ARRAY['sick_requests', 'permission_requests', 'late_requests', 'half_day_requests', 'leave_requests', 'wfh_requests', 'overtime_requests'];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('CREATE POLICY "Emp read own %s" ON public.%s FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));', tbl, tbl);
    EXECUTE format('CREATE POLICY "Emp insert own %s" ON public.%s FOR INSERT WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));', tbl, tbl);
    EXECUTE format('CREATE POLICY "Mgr view team %s" ON public.%s FOR SELECT USING (get_user_role() = ''Manager'' AND employee_id IN (SELECT id FROM public.employees WHERE department_id IN (SELECT department_id FROM public.employees WHERE user_id = auth.uid())));', tbl, tbl);
    EXECUTE format('CREATE POLICY "Mgr update team %s" ON public.%s FOR UPDATE USING (get_user_role() = ''Manager'' AND employee_id IN (SELECT id FROM public.employees WHERE department_id IN (SELECT department_id FROM public.employees WHERE user_id = auth.uid())));', tbl, tbl);
    EXECUTE format('CREATE POLICY "Admin HR full %s" ON public.%s FOR ALL USING (get_user_role() IN (''Super Admin'', ''HR''));', tbl, tbl);
  END LOOP;
END $$;


-- 17. Documents (Administrasi)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    category VARCHAR(100),
    access_role VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_documents_modtime BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Admin write documents" ON public.documents FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

-- 18. Document Categories
CREATE TABLE IF NOT EXISTS public.document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_document_categories_modtime BEFORE UPDATE ON public.document_categories FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read doc categories" ON public.document_categories FOR SELECT USING (true);
CREATE POLICY "Admin write doc categories" ON public.document_categories FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));
