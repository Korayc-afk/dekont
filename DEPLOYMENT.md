# Plesk Deployment Rehberi

Bu rehber, Dekont Ticket uygulamasını Plesk sunucusuna deploy etmek için adım adım talimatlar içerir.

## 📦 Dosya Yapısı (Plesk'te)

Deploy edildikten sonra dosyalar şu şekilde olmalı:

```
/httpdocs/                    # Plesk Document Root
├── index.html                # React build'den
├── assets/                   # React build'den (JS, CSS)
├── logo.png                  # Logo
├── favicon.ico               # Favicon
├── .htaccess                 # React Router için
│
├── server/                   # Backend API
│   ├── server.js
│   ├── package.json
│   ├── node_modules/         # npm install sonrası
│   ├── uploads/              # Otomatik oluşturulacak
│   ├── database.db           # Otomatik oluşturulacak
│   ├── .env                  # Manuel oluşturulacak
│   └── .htaccess             # Node.js routing için
│
└── api/                      # API endpoint'leri (.htaccess ile yönlendirilir)
```

## 🚀 Deployment Adımları

### 1. GitHub'dan Dosyaları İndir

**Seçenek 1: Git ile (Önerilen)**
```bash
cd /var/www/vhosts/yourdomain.com/httpdocs
git clone https://github.com/Korayc-afk/dekont.git .
```

**Seçenek 2: ZIP olarak indir**
- GitHub'dan ZIP indir
- Plesk File Manager ile `/httpdocs/` klasörüne yükle
- ZIP'i aç

### 2. Frontend Build

**Lokal bilgisayarda:**
```bash
npm install
npm run build
```

**Build dosyalarını yükle:**
- `dist/` klasöründeki tüm dosyaları `/httpdocs/` klasörüne kopyala
- `.htaccess` dosyasının `/httpdocs/` klasöründe olduğundan emin ol

### 3. Backend Kurulumu

**SSH ile sunucuya bağlan:**
```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/server
npm install --production
```

**Environment dosyası oluştur:**
```bash
nano .env
```

İçeriği:
```env
PORT=3001
NODE_ENV=production
```

### 4. Klasör İzinleri

```bash
chmod 755 server/uploads/
chmod 644 server/database.db  # (oluşturulduktan sonra)
```

### 5. Plesk'te Node.js Uygulaması Oluşturma

1. **Plesk Panel'e giriş yapın**
2. **"Node.js"** sekmesine gidin
3. **"Add Node.js App"** butonuna tıklayın
4. Ayarları yapın:
   - **App Root**: `/httpdocs/server` (veya tam yol: `/var/www/vhosts/yourdomain.com/httpdocs/server`)
   - **Application Mode**: `production`
   - **Application Startup File**: `server.js`
   - **Node.js Version**: En son LTS versiyonu (18.x veya 20.x)
   - **Port**: `3001` (veya Plesk'in verdiği port numarası)
   - **Document Root**: `/httpdocs` (React build için)

5. **"Enable Node.js"** butonuna tıklayın

### 6. Frontend Environment Variables

Plesk'te veya `.env` dosyasında:
```env
VITE_API_URL=/api
VITE_ADMIN_PASSWORD=Padisah2024!Secure
```

**Not:** Production'da mutlaka şifreyi değiştirin!

### 7. Test

1. **Backend test:**
   ```
   https://yourdomain.com/api/health
   ```
   Cevap: `{"status":"OK","message":"Server is running"}`

2. **Frontend test:**
   ```
   https://yourdomain.com
   ```
   Ana sayfa açılmalı.

3. **Admin giriş:**
   ```
   https://yourdomain.com/yönetim-giriş-secure
   ```

## 🔧 Sorun Giderme

### Backend çalışmıyor:
1. Plesk Node.js panelinde logları kontrol edin
2. Port numarasını kontrol edin
3. `server.js` dosyasının doğru yolda olduğundan emin olun
4. SSH ile `cd server && node server.js` çalıştırıp hata mesajlarını kontrol edin

### 404 hatası:
1. `.htaccess` dosyasının doğru yerde olduğundan emin olun
2. `mod_rewrite` modülünün aktif olduğundan emin olun
3. Plesk'te "Apache modules" kontrol edin

### Dosya yükleme hatası:
1. `server/uploads/` klasörünün yazılabilir olduğundan emin olun:
   ```bash
   chmod 755 server/uploads/
   chown -R httpdocs:httpdocs server/uploads/
   ```

### Database hatası:
1. `server/database.db` dosyasının yazılabilir olduğundan emin olun
2. SQLite3 modülünün yüklü olduğundan emin olun
3. İlk çalıştırmada otomatik oluşturulur

### API bağlantı hatası:
1. Backend'in çalıştığından emin olun
2. Port numarasını kontrol edin
3. `.htaccess` dosyasının doğru yapılandırıldığından emin olun

## 📁 Önemli Dosyalar

### Yüklenmesi Gerekenler:
- ✅ Tüm `src/` klasörü
- ✅ `server/` klasörü (node_modules hariç)
- ✅ `package.json` dosyaları
- ✅ `.htaccess` dosyaları
- ✅ `public/` klasörü
- ✅ Build sonrası `dist/` içeriği

### Yüklenmemesi Gerekenler (gitignore):
- ❌ `node_modules/`
- ❌ `dist/` (build sonrası oluşturulur)
- ❌ `.env` dosyaları
- ❌ `server/uploads/`
- ❌ `server/database.db`

## 🔄 Güncelleme

### Yeni değişiklikleri deploy etmek:

1. **Git ile:**
```bash
cd /var/www/vhosts/yourdomain.com/httpdocs
git pull origin main
cd server
npm install --production
```

2. **Frontend rebuild:**
```bash
# Lokal bilgisayarda
npm run build
# dist/ klasörünü sunucuya yükle
```

3. **Backend restart:**
- Plesk Node.js panelinde "Restart App" butonuna tıklayın

## 💾 Backup

### Önemli dosyalar:
- `server/database.db` - Veritabanı
- `server/uploads/` - Yüklenen dosyalar

### Backup komutu:
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz server/database.db server/uploads/
```

## 🔒 Güvenlik Notları

1. **Admin şifresini değiştirin:**
   - `.env` dosyasında `VITE_ADMIN_PASSWORD` değerini değiştirin
   - Frontend'i yeniden build edin

2. **HTTPS kullanın:**
   - Plesk'te SSL sertifikası aktif edin

3. **Dosya izinleri:**
   - `server/uploads/` klasörüne sadece backend erişebilmeli
   - `database.db` dosyası web erişiminden korunmalı

4. **Environment variables:**
   - `.env` dosyalarını asla commit etmeyin
   - Production'da güçlü şifreler kullanın

## 📞 Destek

Sorun yaşarsanız:
1. Plesk Node.js loglarını kontrol edin
2. Browser console'da hataları kontrol edin
3. Network tab'da API isteklerini kontrol edin
