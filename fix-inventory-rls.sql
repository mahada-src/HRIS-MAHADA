-- Fix RLS for inventory_assets
DROP POLICY IF EXISTS "Anon Select Inventory" ON public.inventory_assets;
CREATE POLICY "Anon Select Inventory" ON public.inventory_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon Insert Inventory" ON public.inventory_assets;
CREATE POLICY "Anon Insert Inventory" ON public.inventory_assets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Update Inventory" ON public.inventory_assets;
CREATE POLICY "Anon Update Inventory" ON public.inventory_assets FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Delete Inventory" ON public.inventory_assets;
CREATE POLICY "Anon Delete Inventory" ON public.inventory_assets FOR DELETE USING (true);
