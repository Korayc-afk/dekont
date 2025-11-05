-- Supabase RLS Policies Düzeltmesi
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- Mevcut policies'leri sil
DROP POLICY IF EXISTS "Enable read access for all users" ON tickets;
DROP POLICY IF EXISTS "Enable insert for service role" ON tickets;
DROP POLICY IF EXISTS "Enable update for service role" ON tickets;
DROP POLICY IF EXISTS "Enable delete for service role" ON tickets;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON tickets;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON tickets;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON tickets;

-- Yeni policies oluştur (Service role key ile çalışır)
-- Service role key kullanıldığında RLS otomatik bypass edilir

-- Policy: Herkes okuyabilir
CREATE POLICY "Enable read access for all users" ON tickets
  FOR SELECT USING (true);

-- Policy: Insert için (service role key ile çalışır)
CREATE POLICY "Enable insert for service role" ON tickets
  FOR INSERT WITH CHECK (true);

-- Policy: Update için
CREATE POLICY "Enable update for service role" ON tickets
  FOR UPDATE USING (true);

-- Policy: Delete için
CREATE POLICY "Enable delete for service role" ON tickets
  FOR DELETE USING (true);

