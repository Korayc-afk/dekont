# Plesk Deployment Rehberi

Bu rehber, Dekont Ticket uygulamasını Plesk sunucusuna deploy etmek için adım adım talimatlar içerir.

## Ön Gereksinimler

1. Plesk panel erişimi
2. Node.js desteği (Plesk'te Node.js extension aktif olmalı)
3. SSH erişimi (önerilir)

## 1. Dosyaları Sunucuya Yükleme

### FTP/SFTP ile:
1. Tüm proje dosyalarını sunucuya yükleyin
2. Dosya yapısı:
   ```
   /httpdocs/
   ├── dist/              # React build dosyaları (build sonrası)
   ├── server/            # Backend API
   │   ├── server.js
   │   ├── package.json
   │   ├── uploads/       # Otomatik oluşturulacak
   │   └── database.db    # Otomatik oluşturulacak
   ├── .htaccess          # React Router için
   └── index.html         # React build'den gelecek
   ```

## 2. Backend Kurulumu

### SSH ile:
```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/server
npm install --production
```

### Klasör İzinleri:
```bash
chmod 755 uploads/
chmod 644 database.db  # (oluşturulduktan sonra)
```

## 3. Plesk'te Node.js Uygulaması Oluşturma

1. **Plesk Panel'e giriş yapın**
2. **"Node.js"** sekmesine gidin
3. **"Add Node.js App"** butonuna tıklayın
4. Ayarları yapın:
   - **App Root**: `/httpdocs/server` (veya tam yol)
   - **Application Mode**: `production`
   - **Application Startup File**: `server.js`
   - **Node.js Version**: En son LTS versiyonu (18.x veya 20.x)
   - **Port**: `3001` (veya Plesk'in verdiği port numarası)
   - **Document Root**: `/httpdocs` (React build için)

## 4. Environment Variables

Plesk Node.js panelinde veya `.env` dosyasında:
```
PORT=3001
NODE_ENV=production
```

## 5. Frontend Build

### Lokal bilgisayarda:
```bash
npm run build
```

### Build dosyalarını yükleme:
- `dist/` klasöründeki tüm dosyaları `/httpdocs/` klasörüne yükleyin
- `.htaccess` dosyasının `/httpdocs/` klasöründe olduğundan emin olun

## 6. API URL Konfigürasyonu

Frontend'de API URL'ini ayarlayın:

### `.env` dosyası oluşturun (root dizinde):
```
VITE_API_URL=/api
```

Veya build sırasında:
```bash
VITE_API_URL=/api npm run build
```

## 7. .htaccess Konfigürasyonu

### Root `.htaccess` (React Router için):
Zaten oluşturuldu, `/httpdocs/.htaccess` konumunda olmalı.

### Server `.htaccess`:
`/httpdocs/server/.htaccess` dosyası zaten oluşturuldu. Plesk Node.js modülü bunu otomatik kullanır.

## 8. Test

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

3. **API test:**
   ```
   https://yourdomain.com/api/tickets
   ```
   Boş array dönmeli: `[]`

## 9. Sorun Giderme

### Backend çalışmıyor:
1. Plesk Node.js panelinde logları kontrol edin
2. Port numarasını kontrol edin
3. `server.js` dosyasının doğru yolda olduğundan emin olun

### 404 hatası:
1. `.htaccess` dosyasının doğru yerde olduğundan emin olun
2. `mod_rewrite` modülünün aktif olduğundan emin olun

### Dosya yükleme hatası:
1. `uploads/` klasörünün yazılabilir olduğundan emin olun:
   ```bash
   chmod 755 uploads/
   ```

### Database hatası:
1. `database.db` dosyasının yazılabilir olduğundan emin olun
2. SQLite3 modülünün yüklü olduğundan emin olun

## 10. Güvenlik

### Önerilen ayarlar:
1. **uploads/** klasörüne doğrudan erişimi kısıtlayın (sadece API üzerinden)
2. **database.db** dosyasını web erişiminden koruyun
3. CORS ayarlarını production için optimize edin
4. Rate limiting ekleyin (opsiyonel)

## 11. Otomatik Restart

Plesk Node.js uygulaması otomatik olarak başlatılır. Manuel restart için:
- Plesk Node.js panelinde **"Restart App"** butonunu kullanın

## 12. Backup

### Önemli dosyalar:
- `server/database.db` - Veritabanı
- `server/uploads/` - Yüklenen dosyalar

### Backup komutu:
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz server/database.db server/uploads/
```

## Notlar

- İlk çalıştırmada `database.db` ve `uploads/` klasörü otomatik oluşturulur
- SQLite veritabanı tek dosya olarak saklanır, backup'ı kolaydır
- Dosya boyutu limiti: 5MB (backend'de ayarlanmış)
- İzin verilen dosya tipleri: JPG, PNG, WEBP, PDF

