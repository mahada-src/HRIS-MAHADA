-- 1. Tambahkan kolom photo_url ke tabel employees jika belum ada
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Buat bucket storage untuk avatars jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Hapus policy storage lama (jika ada) untuk menghindari error duplikat
DROP POLICY IF EXISTS "Avatar Read All" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Insert Authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Authenticated" ON storage.objects;

-- 4. Buat policy agar semua orang bisa melihat avatar (Public Read)
CREATE POLICY "Avatar Read All"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 5. Buat policy agar user yang sudah login bisa mengunggah avatar
CREATE POLICY "Avatar Insert Authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Avatar Update Authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );

-- 6. Buat RPC function (Secure) agar user hanya bisa mengubah photo_url miliknya sendiri
CREATE OR REPLACE FUNCTION update_profile_photo(new_photo_url TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.employees
  SET photo_url = new_photo_url,
      updated_at = now()
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
