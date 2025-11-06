# Storage Upload Debug Rehberi

## ✅ Policies Kontrolü

Policies doğru görünüyor:
- ✅ SELECT (public read) - Var
- ✅ INSERT (service_role upload) - Var

## 🔍 Sorun Tespiti

### 1. Policy Expression Kontrolü

Supabase Dashboard → Storage → Policies → `receipts` bucket'ı → Her policy'yi açın:

**INSERT Policy için:**
- **USING expression:** `true` olmalı
- **WITH CHECK expression:** `true` olmalı

Eğer farklı bir expression varsa, şunu kullanın:
```sql
-- USING expression
true

-- WITH CHECK expression  
true
```

### 2. Vercel Log Kontrolü

**Vercel Dashboard → Deployments → Son deployment → Functions → `/api/index.js` → Logs**

Form gönderdiğinizde şunları görmelisiniz:
- `🔵 [POST] /api/tickets - Request received`
- `📥 POST /tickets route handler called`
- `📤 Attempting upload to bucket: "receipts"`

**Eğer hiçbir log görünmüyorsa:**
- İstek handler'a ulaşmıyor demektir
- Vercel routing sorunu olabilir
- CORS preflight (OPTIONS) başarısız olabilir

### 3. Browser Console Kontrolü

Browser console'da şunları kontrol edin:
- Network tab → `/api/tickets` isteği
- Request headers (Content-Type: multipart/form-data olmalı)
- Response status (500 mı, yoksa başka bir hata mı?)

### 4. Service Role Key Kontrolü

**Vercel Dashboard → Settings → Environment Variables:**
- `SUPABASE_URL` var mı?
- `SUPABASE_SERVICE_ROLE_KEY` var mı? (service_role key, anon key değil!)

**Service Role Key nereden alınır:**
- Supabase Dashboard → Settings → API
- **service_role** key'i kopyalayın (anon key değil!)

### 5. Bucket Adı Kontrolü

Bucket adı tam olarak `receipts` (küçük harf) olmalı.

Kod şu bucket adlarını deniyor:
- `receipts` (küçük harf)
- `RECEIPTS` (büyük harf)
- `Receipts` (title case)

## 🧪 Test Adımları

1. **Health Check:**
   ```
   GET https://dekont-ruby.vercel.app/api/health
   ```
   Cevap: `{"status":"OK","supabase":true}` olmalı

2. **Form Gönderme:**
   - Küçük bir resim yükleyin (100KB altı)
   - Tüm alanları doldurun
   - Gönder butonuna tıklayın

3. **Log Kontrolü:**
   - Vercel logs'u açık tutun
   - Form gönderin
   - Logları kontrol edin

## 🐛 Yaygın Hatalar

### "File upload failed" ama log yok
- İstek handler'a ulaşmıyor
- Vercel routing sorunu
- CORS sorunu

### "Storage bucket not found"
- Bucket adı yanlış
- Bucket oluşturulmamış

### "Permission denied" veya "RLS policy violation"
- INSERT policy eksik veya yanlış
- Service role key yanlış
- Policy expression'ları yanlış

### "File size exceeds limit"
- Dosya 5MB'dan büyük
- Vercel function limit'i aşılmış

## 📝 Policy SQL (Manuel Ekleme)

Eğer Dashboard'dan ekleyemiyorsanız, SQL Editor'dan:

```sql
-- INSERT Policy
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
```

