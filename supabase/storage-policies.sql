-- Storage Policies for 'receipts' bucket
-- Bu SQL'i Supabase Dashboard → SQL Editor'da çalıştırın

-- 1. SELECT Policy (Public Read) - Zaten var olabilir
-- Herkes dosyaları okuyabilir
INSERT INTO storage.policies (name, bucket_id, definition, check_expression, command, roles)
SELECT 
  'Allow public read',
  id,
  'true',
  'true',
  'SELECT',
  ARRAY['public']
FROM storage.buckets
WHERE name = 'receipts'
ON CONFLICT DO NOTHING;

-- 2. INSERT Policy (Service Role Upload) - ÖNEMLİ!
-- Service role key ile upload yapabilmek için
INSERT INTO storage.policies (name, bucket_id, definition, check_expression, command, roles)
SELECT 
  'Allow service role upload',
  id,
  'true',
  'true',
  'INSERT',
  ARRAY['service_role']
FROM storage.buckets
WHERE name = 'receipts'
ON CONFLICT DO NOTHING;

-- 3. UPDATE Policy (Service Role Update) - Opsiyonel
INSERT INTO storage.policies (name, bucket_id, definition, check_expression, command, roles)
SELECT 
  'Allow service role update',
  id,
  'true',
  'true',
  'UPDATE',
  ARRAY['service_role']
FROM storage.buckets
WHERE name = 'receipts'
ON CONFLICT DO NOTHING;

-- 4. DELETE Policy (Service Role Delete) - Opsiyonel
INSERT INTO storage.policies (name, bucket_id, definition, check_expression, command, roles)
SELECT 
  'Allow service role delete',
  id,
  'true',
  'true',
  'DELETE',
  ARRAY['service_role']
FROM storage.buckets
WHERE name = 'receipts'
ON CONFLICT DO NOTHING;

