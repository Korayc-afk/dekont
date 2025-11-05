# Dekont Ticket Sistemi

Dekont yükleme, kontrol ve sorgulama sistemi. React + Node.js + SQLite ile geliştirilmiştir.

## 🚀 Özellikler

- ✅ Kullanıcı dekont yükleme formu
- ✅ Admin paneli (gizli route + şifre koruması)
- ✅ Kullanıcı sorgu sayfası (kullanıcı ID ile)
- ✅ OCR (Optical Character Recognition) - Tesseract.js ile
- ✅ Sahte dekont analizi
- ✅ Dosya yükleme (JPG, PNG, WEBP, PDF - max 5MB)
- ✅ Responsive tasarım
- ✅ Plesk deployment desteği

## 📋 Teknolojiler

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Tesseract.js (OCR)
- Lucide React (Icons)

### Backend
- Node.js
- Express.js
- SQLite (Database)
- Multer (File Upload)

## 🛠️ Kurulum

### Geliştirme Ortamı

1. **Repository'yi klonlayın:**
```bash
git clone https://github.com/Korayc-afk/dekont.git
cd dekont
```

2. **Frontend bağımlılıklarını yükleyin:**
```bash
npm install
```

3. **Backend bağımlılıklarını yükleyin:**
```bash
cd server
npm install
```

4. **Environment dosyalarını oluşturun:**

Root dizinde `.env`:
```env
VITE_API_URL=/api
VITE_ADMIN_PASSWORD=Padisah2024!Secure
```

`server/` dizininde `.env`:
```env
PORT=3001
NODE_ENV=production
```

5. **Backend'i başlatın:**
```bash
cd server
npm start
# veya development için:
npm run dev
```

6. **Frontend'i başlatın:**
```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışacaktır.

### Production Build

```bash
# Frontend build
npm run build

# Build dosyaları dist/ klasöründe oluşturulur
```

## 🔐 Admin Erişimi

- **Giriş Sayfası:** `/yönetim-giriş-secure`
- **Admin Panel:** `/yönetim-panel-2024-secure`
- **Varsayılan Şifre:** `Padisah2024!Secure` (Production'da mutlaka değiştirin!)

## 📁 Klasör Yapısı

```
dekont/
├── src/                    # Frontend kaynak kodları
│   ├── components/         # React bileşenleri
│   ├── services/           # API servisleri
│   ├── utils/              # Utility fonksiyonları
│   └── ...
├── server/                 # Backend API
│   ├── server.js           # Express server
│   ├── uploads/            # Yüklenen dosyalar (gitignore)
│   ├── database.db         # SQLite veritabanı (gitignore)
│   └── ...
├── dist/                   # Frontend build çıktısı (gitignore)
├── public/                 # Public dosyalar
└── ...
```

## 🌐 Plesk Deployment

Detaylı deployment rehberi için `DEPLOYMENT.md` dosyasına bakın.

### Hızlı Deployment:

1. Dosyaları sunucuya yükleyin
2. `server/` klasöründe `npm install --production` çalıştırın
3. Plesk'te Node.js uygulaması oluşturun
4. Frontend build dosyalarını `/httpdocs/` klasörüne yükleyin

## 🔒 Güvenlik

- Admin paneli şifre korumalı
- Brute force koruması (5 deneme + 15 dakika kilit)
- Session timeout (30 dakika)
- Dosya boyutu limiti: 5MB
- İzin verilen dosya tipleri: JPG, PNG, WEBP, PDF
- SQLite veritabanı (tek dosya, backup kolay)

## 📝 API Endpoints

### Health Check
```
GET /api/health
```

### Tickets

- `GET /api/tickets` - Tüm dekontları getir
- `GET /api/tickets/:id` - ID'ye göre dekont getir
- `GET /api/tickets/user/:userId` - Kullanıcı ID'ye göre dekontları getir
- `POST /api/tickets` - Yeni dekont oluştur
- `PATCH /api/tickets/:id` - Dekont güncelle
- `DELETE /api/tickets/:id` - Dekont sil

## 📄 Lisans

ISC

## 👤 Yazar

Korayc-afk
