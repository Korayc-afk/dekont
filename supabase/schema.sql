-- Supabase Database Schema
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- Tickets tablosu
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "recipientIban" TEXT NOT NULL,
  "investmentMethod" TEXT NOT NULL,
  "investmentAmount" REAL NOT NULL,
  "investmentDateTime" TEXT NOT NULL,
  "receiptFileName" TEXT NOT NULL,
  "receiptOriginalName" TEXT NOT NULL,
  "receiptMimeType" TEXT NOT NULL,
  "receiptUrl" TEXT,
  status TEXT DEFAULT 'pending',
  "adminNote" TEXT DEFAULT '',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets("userId");
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets("createdAt");

-- updatedAt trigger (otomatik güncelleme için)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Service role key ile bypass edilir
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Herkes okuyabilir (anon key ile)
CREATE POLICY "Enable read access for all users" ON tickets
  FOR SELECT USING (true);

-- Policy: Herkes yazabilir (service role key ile çalışır, RLS bypass edilir)
-- Service role key kullanıldığında RLS otomatik bypass edilir
CREATE POLICY "Enable insert for authenticated users" ON tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON tickets
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON tickets
  FOR DELETE USING (true);

