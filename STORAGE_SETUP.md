# Supabase Storage Setup - Receipts Bucket

## 🔧 Storage Bucket Oluşturma (Zaten Yapıldı ✅)

Bucket adı: `receipts` (küçük harf)
- ✅ Public bucket: Açık
- ✅ File size limit: 5 MB
- ✅ Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp, application/pdf`

## 🔐 Storage Policies Ekleme (ÖNEMLİ!)

### Yöntem 1: Supabase Dashboard'dan (Önerilen)

1. **Supabase Dashboard → Storage → Policies** sekmesine gidin
2. **`receipts` bucket'ını seçin**
3. **"New policy"** butonuna tıklayın

#### Policy 1: INSERT (Upload) - ZORUNLU!

- **Policy name:** `Allow service role upload`
- **Allowed operation:** `INSERT`
- **Target roles:** `service_role` (veya boş bırakın, tüm rollere uygulanır)
- **USING expression:** `true`
- **WITH CHECK expression:** `true`
- **Review** → **Save policy**

#### Policy 2: UPDATE (Opsiyonel)

- **Policy name:** `Allow service role update`
- **Allowed operation:** `UPDATE`
- **Target roles:** `service_role`
- **USING expression:** `true`
- **WITH CHECK expression:** `true`
- **Review** → **Save policy**

#### Policy 3: DELETE (Opsiyonel)

- **Policy name:** `Allow service role delete`
- **Allowed operation:** `DELETE`
- **Target roles:** `service_role`
- **USING expression:** `true`
- **Review** → **Save policy**

### Yöntem 2: SQL Editor'dan

1. **Supabase Dashboard → SQL Editor**
2. Aşağıdaki SQL'i çalıştırın:

```sql
-- Storage Policies for 'receipts' bucket

-- INSERT Policy (Service Role Upload) - ZORUNLU!
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

-- UPDATE Policy (Opsiyonel)
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

-- DELETE Policy (Opsiyonel)
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
```

## ✅ Kontrol

1. **Storage → Policies** sekmesinde `receipts` bucket'ı için şu policies'ler olmalı:
   - ✅ `Allow public read` (SELECT) - Zaten var
   - ✅ `Allow service role upload` (INSERT) - **YENİ EKLENMELİ**
   - ✅ `Allow service role update` (UPDATE) - Opsiyonel
   - ✅ `Allow service role delete` (DELETE) - Opsiyonel

2. **Test:**
   - Form'dan bir dekont yükleyin
   - Başarılı olmalı
   - Storage → `receipts` bucket'ında dosya görünmeli

## 🐛 Sorun Giderme

### "File upload failed" hatası alıyorsanız:

1. ✅ Bucket adı `receipts` (küçük harf) mi?
2. ✅ Bucket Public mi?
3. ✅ INSERT policy eklendi mi? (En önemli!)
4. ✅ Service role key doğru mu? (Vercel environment variables)

### "Storage bucket not found" hatası:

- Bucket adını kontrol edin: `receipts` (küçük harf)
- Bucket'ın oluşturulduğundan emin olun

### "Permission denied" hatası:

- INSERT policy'nin eklendiğinden emin olun
- Service role key'in doğru olduğundan emin olun

