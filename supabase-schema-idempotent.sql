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
    menit_efektif INTEGER,
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

DROP TRIGGER IF EXISTS update_departments_modtime ON public.departments;
CREATE TRIGGER update_departments_modtime BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_positions_modtime ON public.positions;
CREATE TRIGGER update_positions_modtime BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_employees_modtime ON public.employees;
CREATE TRIGGER update_employees_modtime BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_attendance_modtime ON public.attendance;
CREATE TRIGGER update_attendance_modtime BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_sick_requests_modtime ON public.sick_requests;
CREATE TRIGGER update_sick_requests_modtime BEFORE UPDATE ON public.sick_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_permission_requests_modtime ON public.permission_requests;
CREATE TRIGGER update_permission_requests_modtime BEFORE UPDATE ON public.permission_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_late_requests_modtime ON public.late_requests;
CREATE TRIGGER update_late_requests_modtime BEFORE UPDATE ON public.late_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_half_day_requests_modtime ON public.half_day_requests;
CREATE TRIGGER update_half_day_requests_modtime BEFORE UPDATE ON public.half_day_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_leave_requests_modtime ON public.leave_requests;
CREATE TRIGGER update_leave_requests_modtime BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_wfh_requests_modtime ON public.wfh_requests;
CREATE TRIGGER update_wfh_requests_modtime BEFORE UPDATE ON public.wfh_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_overtime_requests_modtime ON public.overtime_requests;
CREATE TRIGGER update_overtime_requests_modtime BEFORE UPDATE ON public.overtime_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_benefits_modtime ON public.benefits;
CREATE TRIGGER update_benefits_modtime BEFORE UPDATE ON public.benefits FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_business_trip_bonds_modtime ON public.business_trip_bonds;
CREATE TRIGGER update_business_trip_bonds_modtime BEFORE UPDATE ON public.business_trip_bonds FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_violations_modtime ON public.violations;
CREATE TRIGGER update_violations_modtime BEFORE UPDATE ON public.violations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_notifications_modtime ON public.notifications;
CREATE TRIGGER update_notifications_modtime BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
DROP TRIGGER IF EXISTS update_activity_logs_modtime ON public.activity_logs;
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
DROP POLICY IF EXISTS "Public read departments" ON public.departments;
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write departments" ON public.departments;
CREATE POLICY "Admin write departments" ON public.departments FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

DROP POLICY IF EXISTS "Public read positions" ON public.positions;
CREATE POLICY "Public read positions" ON public.positions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write positions" ON public.positions;
CREATE POLICY "Admin write positions" ON public.positions FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

-- Employees
DROP POLICY IF EXISTS "Employee own data" ON public.employees;
CREATE POLICY "Employee own data" ON public.employees FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Manager view team" ON public.employees;
CREATE POLICY "Manager view team" ON public.employees FOR SELECT USING (
  get_user_role() = 'Manager' AND department_id IN (
    SELECT department_id FROM public.employees WHERE user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Admin HR full access employees" ON public.employees;
CREATE POLICY "Admin HR full access employees" ON public.employees FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

-- Attendance
DROP POLICY IF EXISTS "Employee own attendance" ON public.attendance;
CREATE POLICY "Employee own attendance" ON public.attendance FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Manager view team attendance" ON public.attendance;
CREATE POLICY "Manager view team attendance" ON public.attendance FOR SELECT USING (
  get_user_role() = 'Manager' AND employee_id IN (
    SELECT id FROM public.employees WHERE department_id IN (SELECT department_id FROM public.employees WHERE user_id = auth.uid())
  )
);
DROP POLICY IF EXISTS "Admin HR full access attendance" ON public.attendance;
CREATE POLICY "Admin HR full access attendance" ON public.attendance FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

-- Benefits, Bonds, Violations
-- Employee can read own
DROP POLICY IF EXISTS "Employee read own benefits" ON public.benefits;
CREATE POLICY "Employee read own benefits" ON public.benefits FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admin HR full benefits" ON public.benefits;
CREATE POLICY "Admin HR full benefits" ON public.benefits FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

DROP POLICY IF EXISTS "Employee read own bonds" ON public.business_trip_bonds;
CREATE POLICY "Employee read own bonds" ON public.business_trip_bonds FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admin HR full bonds" ON public.business_trip_bonds;
CREATE POLICY "Admin HR full bonds" ON public.business_trip_bonds FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

DROP POLICY IF EXISTS "Employee read own violations" ON public.violations;
CREATE POLICY "Employee read own violations" ON public.violations FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admin HR full violations" ON public.violations;
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
    EXECUTE format('DROP POLICY IF EXISTS "Emp read own %s" ON public.%s;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Emp read own %s" ON public.%s FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Emp insert own %s" ON public.%s;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Emp insert own %s" ON public.%s FOR INSERT WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Mgr view team %s" ON public.%s;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Mgr view team %s" ON public.%s FOR SELECT USING (get_user_role() = ''Manager'' AND employee_id IN (SELECT id FROM public.employees WHERE department_id IN (SELECT department_id FROM public.employees WHERE user_id = auth.uid())));', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Mgr update team %s" ON public.%s;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Mgr update team %s" ON public.%s FOR UPDATE USING (get_user_role() = ''Manager'' AND employee_id IN (SELECT id FROM public.employees WHERE department_id IN (SELECT department_id FROM public.employees WHERE user_id = auth.uid())));', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Admin HR full %s" ON public.%s;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Admin HR full %s" ON public.%s FOR ALL USING (get_user_role() IN (''Super Admin'', ''HR''));', tbl, tbl);
  END LOOP;
END $$;


-- 17. Documents (Administrasi )
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    category VARCHAR(100),
    access_role VARCHAR(100),
    position VARCHAR(255) DEFAULT 'Semua Jabatan',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS update_documents_modtime ON public.documents;
CREATE TRIGGER update_documents_modtime BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read documents" ON public.documents;
CREATE POLICY "Public read documents" ON public.documents FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write documents" ON public.documents;
CREATE POLICY "Admin write documents" ON public.documents FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

-- 18. Document Categories
CREATE TABLE IF NOT EXISTS public.document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS update_document_categories_modtime ON public.document_categories;
CREATE TRIGGER update_document_categories_modtime BEFORE UPDATE ON public.document_categories FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read doc categories" ON public.document_categories;
CREATE POLICY "Public read doc categories" ON public.document_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write doc categories" ON public.document_categories;
CREATE POLICY "Admin write doc categories" ON public.document_categories FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));

-- 19. Inventory Assets
CREATE TABLE IF NOT EXISTS public.inventory_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    inventory_code VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(15, 2),
    asset_status VARCHAR(50), -- Terpakai, Tidak Dipakai
    asset_condition VARCHAR(100), -- Baik, Rusak, dll
    condition_notes TEXT,
    production_year VARCHAR(50),
    processor VARCHAR(255),
    storage VARCHAR(100),
    ram VARCHAR(100),
    last_used DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS update_inventory_assets_modtime ON public.inventory_assets;
CREATE TRIGGER update_inventory_assets_modtime BEFORE UPDATE ON public.inventory_assets FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
ALTER TABLE public.inventory_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admin full access inventory" ON public.inventory_assets;
CREATE POLICY "Super Admin full access inventory" ON public.inventory_assets FOR ALL USING (get_user_role() IN ('Super Admin', 'Ass Super Admin'));

-- Menambahkan kolom spesifikasi laptop (Jalankan query ini jika tabel sudah pernah dibuat sebelumnya)
ALTER TABLE public.inventory_assets 
ADD COLUMN IF NOT EXISTS production_year VARCHAR(50),
ADD COLUMN IF NOT EXISTS processor VARCHAR(255),
ADD COLUMN IF NOT EXISTS storage VARCHAR(100),
ADD COLUMN IF NOT EXISTS ram VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_used DATE;

-- 20. Mahada Growth Records
CREATE TABLE IF NOT EXISTS public.mahada_growth_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    tanggal DATE NOT NULL,
    jenis_aktivitas VARCHAR(255) NOT NULL,
    status BOOLEAN DEFAULT false,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(employee_id, tanggal, jenis_aktivitas)
);

DROP TRIGGER IF EXISTS update_mahada_growth_records_modtime ON public.mahada_growth_records;
CREATE TRIGGER update_mahada_growth_records_modtime BEFORE UPDATE ON public.mahada_growth_records FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

ALTER TABLE public.mahada_growth_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Emp read own growth" ON public.mahada_growth_records;
CREATE POLICY "Emp read own growth" ON public.mahada_growth_records FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Emp insert own growth" ON public.mahada_growth_records;
CREATE POLICY "Emp insert own growth" ON public.mahada_growth_records FOR INSERT WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Emp update own growth" ON public.mahada_growth_records;
CREATE POLICY "Emp update own growth" ON public.mahada_growth_records FOR UPDATE USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Emp delete own growth" ON public.mahada_growth_records;
CREATE POLICY "Emp delete own growth" ON public.mahada_growth_records FOR DELETE USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admin HR full growth" ON public.mahada_growth_records;
CREATE POLICY "Admin HR full growth" ON public.mahada_growth_records FOR ALL USING (get_user_role() IN ('Super Admin', 'HR'));
