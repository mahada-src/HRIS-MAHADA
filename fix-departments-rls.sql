-- Fix RLS for departments, positions, and document_categories in Supabase
-- Jalankan script ini di Supabase > SQL Editor

-- 1. Departments
DROP POLICY IF EXISTS "Admin write departments" ON public.departments;
DROP POLICY IF EXISTS "Public read departments" ON public.departments;
DROP POLICY IF EXISTS "Anon Select Departments" ON public.departments;
DROP POLICY IF EXISTS "Anon Insert Departments" ON public.departments;
DROP POLICY IF EXISTS "Anon Update Departments" ON public.departments;
DROP POLICY IF EXISTS "Anon Delete Departments" ON public.departments;

CREATE POLICY "Anon Select Departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Anon Insert Departments" ON public.departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon Update Departments" ON public.departments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anon Delete Departments" ON public.departments FOR DELETE USING (true);

-- 2. Positions (Jabatan)
DROP POLICY IF EXISTS "Admin write positions" ON public.positions;
DROP POLICY IF EXISTS "Public read positions" ON public.positions;
DROP POLICY IF EXISTS "Anon Select Positions" ON public.positions;
DROP POLICY IF EXISTS "Anon Insert Positions" ON public.positions;
DROP POLICY IF EXISTS "Anon Update Positions" ON public.positions;
DROP POLICY IF EXISTS "Anon Delete Positions" ON public.positions;

CREATE POLICY "Anon Select Positions" ON public.positions FOR SELECT USING (true);
CREATE POLICY "Anon Insert Positions" ON public.positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon Update Positions" ON public.positions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anon Delete Positions" ON public.positions FOR DELETE USING (true);

-- 3. Document Categories (Kategori Administrasi)
DROP POLICY IF EXISTS "Admin write doc categories" ON public.document_categories;
DROP POLICY IF EXISTS "Public read doc categories" ON public.document_categories;
DROP POLICY IF EXISTS "Anon Select Document Categories" ON public.document_categories;
DROP POLICY IF EXISTS "Anon Insert Document Categories" ON public.document_categories;
DROP POLICY IF EXISTS "Anon Update Document Categories" ON public.document_categories;
DROP POLICY IF EXISTS "Anon Delete Document Categories" ON public.document_categories;

CREATE POLICY "Anon Select Document Categories" ON public.document_categories FOR SELECT USING (true);
CREATE POLICY "Anon Insert Document Categories" ON public.document_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon Update Document Categories" ON public.document_categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anon Delete Document Categories" ON public.document_categories FOR DELETE USING (true);
