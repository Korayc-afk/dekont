# Vercel Deployment Rehberi

Bu rehber, Dekont Ticket uygulamasını Vercel'e deploy etmek için adım adım talimatlar içerir.

## 🚀 Hızlı Deployment

### Yöntem 1: Vercel CLI ile (Önerilen)

1. **Vercel CLI'yi yükleyin:**
```bash
npm i -g vercel
```

2. **Vercel'e giriş yapın:**
```bash
vercel login
```

3. **Projeyi deploy edin:**
```bash
vercel
```

4. **Production'a deploy edin:**
```bash
vercel --prod
```

### Yöntem 2: GitHub Entegrasyonu

1. **Vercel Dashboard'a gidin:**
   - https://vercel.com/dashboard
   - "Add New Project" butonuna tıklayın

2. **GitHub repository'yi seçin:**
   - "Import Git Repository" seçin
   - `Korayc-afk/dekont` repository'sini seçin

3. **Project Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables ekleyin:**
   ```
   VITE_API_URL=/api
   VITE_ADMIN_PASSWORD=Padisah2024!Secure
   ```

5. **Deploy butonuna tıklayın!**

## ⚙️ Vercel Konfigürasyonu

### vercel.json

Proje root'unda `vercel.json` dosyası var. Bu dosya:
- Frontend build'ini yapılandırır
- API routes'ları `/api/*` altına yönlendirir
- React Router için SPA routing'i ayarlar

### API Routes

Backend API'ler `api/index.js` dosyasında serverless function olarak çalışır.

**Önemli:** Vercel'de SQLite ve file uploads geçici olarak `/tmp` klasöründe saklanır. Bu nedenle:
- Veritabanı her deployment'ta sıfırlanır (kalıcı storage için Vercel Blob veya external DB kullanın)
- Upload edilen dosyalar her deployment'ta silinir (kalıcı storage için Vercel Blob kullanın)

## 📝 Environment Variables

Vercel Dashboard'da şu environment variables'ları ekleyin:

```
VITE_API_URL=/api
VITE_ADMIN_PASSWORD=Padisah2024!Secure
```

## 🔧 Kalıcı Storage İçin Alternatifler

### 1. Vercel Blob (Önerilen)

Dosyaları kalıcı olarak saklamak için:

```bash
npm install @vercel/blob
```

### 2. External Database

SQLite yerine:
- **Vercel Postgres** (ücretsiz tier var)
- **Supabase** (PostgreSQL, ücretsiz)
- **PlanetScale** (MySQL, ücretsiz)

### 3. External File Storage

- **Vercel Blob**
- **Cloudinary**
- **AWS S3**

## 🐛 Sorun Giderme

### Build hatası:
- `vercel.json` dosyasının doğru yapılandırıldığından emin olun
- Build loglarını kontrol edin

### API çalışmıyor:
- `api/index.js` dosyasının doğru export ettiğinden emin olun
- Vercel Functions loglarını kontrol edin

### Database hatası:
- Vercel'de SQLite `/tmp` klasöründe çalışır (geçici)
- Kalıcı storage için external database kullanın

### File upload hatası:
- Vercel'de uploads `/tmp` klasöründe saklanır (geçici)
- Kalıcı storage için Vercel Blob kullanın

## 📊 Vercel Limitleri

- **Serverless Functions:** 10 saniye timeout (Hobby plan)
- **File Size:** 4.5MB (Hobby plan)
- **Storage:** `/tmp` klasörü geçici (her invocation'ta sıfırlanır)

## ✅ Deployment Sonrası

1. **Domain kontrolü:**
   - Vercel otomatik domain verir: `your-project.vercel.app`
   - Custom domain ekleyebilirsiniz

2. **SSL sertifikası:**
   - Vercel otomatik HTTPS sağlar

3. **Test:**
   - Frontend: `https://your-project.vercel.app`
   - API: `https://your-project.vercel.app/api/health`
   - Admin: `https://your-project.vercel.app/yönetim-giriş-secure`

## 🔄 Güncelleme

Her `git push` sonrası otomatik deploy olur (GitHub entegrasyonu ile).

Manuel deploy için:
```bash
vercel --prod
```

## 💡 İpuçları

1. **Environment Variables:** Production ve Preview için ayrı ayarlayabilirsiniz
2. **Custom Domain:** Vercel Dashboard'dan domain ekleyebilirsiniz
3. **Analytics:** Vercel Analytics'i aktif edebilirsiniz
4. **Logs:** Vercel Dashboard'dan real-time logları görebilirsiniz

## 🎯 Sonraki Adımlar

Kalıcı storage için:
1. Vercel Blob ekleyin (dosyalar için)
2. Vercel Postgres veya Supabase ekleyin (veritabanı için)

Veya Plesk'e deploy edin (daha fazla kontrol için).

