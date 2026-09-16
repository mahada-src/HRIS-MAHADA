-- Fix RLS for documents
DROP POLICY IF EXISTS "Anon Insert Documents" ON public.documents;
CREATE POLICY "Anon Insert Documents" ON public.documents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Update Documents" ON public.documents;
CREATE POLICY "Anon Update Documents" ON public.documents FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Delete Documents" ON public.documents;
CREATE POLICY "Anon Delete Documents" ON public.documents FOR DELETE USING (true);
