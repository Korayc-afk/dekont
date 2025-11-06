# 🎯 Dekont Kontrol Sistemi - Proje Tanıtımı

## 📍 Erişim Linkleri

### 🌐 Ana Sayfa (Dekont Yükleme)
**URL:** https://dekont-ruby.vercel.app/

Kullanıcılar bu sayfadan dekont yükleyebilir ve işlemlerini takip edebilir.

---

### 🔐 Admin Paneli

#### Admin Giriş Sayfası
**URL:** https://dekont-ruby.vercel.app/yönetim-giriş-secure

**Şifre:** `Padisah2024!Secure`

#### Admin Panel
**URL:** https://dekont-ruby.vercel.app/yönetim-panel-2024-secure

**Not:** Admin giriş sayfasından şifre ile giriş yapıldıktan sonra erişilebilir.

---

### 🔍 Kullanıcı Sorgu Sayfası
**URL:** https://dekont-ruby.vercel.app/sorgu

Kullanıcılar bu sayfadan kendi User ID'leri ile dekont durumlarını sorgulayabilir.

---

## ✨ Sistem Özellikleri

### 👤 Kullanıcı Özellikleri

#### 1. **Dekont Yükleme Formu**
- ✅ Kullanıcı ID girişi (zorunlu)
- ✅ Alıcı bilgileri (İsim, IBAN)
- ✅ Yatırım bilgileri (Yöntem, Tutar)
- ✅ Tarih ve saat seçimi (geçmiş tarih kontrolü)
- ✅ Dekont dosyası yükleme (JPG, PNG, WEBP, PDF - max 5MB)
- ✅ Form validasyonu ve hata mesajları

#### 2. **Otomatik OCR (Optical Character Recognition)**
- ✅ Tesseract.js ile otomatik metin çıkarma
- ✅ IBAN, tutar, tarih, isim otomatik algılama
- ✅ Para birimi tespiti
- ✅ Manuel düzenleme imkanı

#### 3. **Sahte Dekont Analizi**
- ✅ Otomatik sahte dekont tespiti
- ✅ Risk skoru hesaplama (0-100)
- ✅ Güvenilirlik skoru (0-100)
- ✅ Detaylı analiz raporu
- ✅ Tutarlılık kontrolü

#### 4. **Dekont Durumu Sorgulama**
- ✅ User ID ile dekont sorgulama
- ✅ Durum takibi (Beklemede, Onaylandı, Reddedildi)
- ✅ Admin notlarını görüntüleme
- ✅ Tarih ve saat bilgisi

---

### 👨‍💼 Admin Özellikleri

#### 1. **Güvenli Admin Paneli**
- ✅ Gizli route (`/yönetim-panel-2024-secure`)
- ✅ Şifre koruması
- ✅ Session yönetimi (30 dakika timeout)
- ✅ Brute-force koruması (5 deneme sonrası 15 dakika kilit)
- ✅ Otomatik çıkış

#### 2. **Dekont Yönetimi**
- ✅ Tüm dekontları görüntüleme
- ✅ Durum filtreleme (Tümü, Beklemede, Onaylandı, Reddedildi)
- ✅ Arama özelliği (İsim, IBAN, Yöntem)
- ✅ Sayfalama (pagination)
- ✅ Detaylı dekont görüntüleme

#### 3. **Dekont İnceleme**
- ✅ Dekont görüntüleme (resim/PDF)
- ✅ OCR sonuçlarını görüntüleme
- ✅ Sahte dekont analiz sonuçlarını görüntüleme
- ✅ Kullanıcı bilgilerini görüntüleme
- ✅ Yatırım detaylarını görüntüleme

#### 4. **Dekont Onaylama/Reddetme**
- ✅ Onaylama butonu
- ✅ Reddetme butonu
- ✅ Admin notu ekleme/düzenleme
- ✅ Notlar kullanıcıya görünür
- ✅ Anlık durum güncelleme

#### 5. **Dekont Silme**
- ✅ Dekont silme özelliği
- ✅ Onay mesajı
- ✅ Dosya ve veritabanı kaydı silme

---

## 🛠️ Teknik Özellikler

### Frontend
- ✅ **React 18** - Modern UI framework
- ✅ **Vite** - Hızlı build tool
- ✅ **Tailwind CSS** - Responsive tasarım
- ✅ **React Router DOM** - Sayfa yönlendirme
- ✅ **Tesseract.js** - OCR işlemleri
- ✅ **Lucide React** - İkonlar
- ✅ **Responsive Design** - Mobil uyumlu

### Backend
- ✅ **Node.js** - Server runtime
- ✅ **Express.js** - API framework
- ✅ **Supabase** - PostgreSQL database
- ✅ **Supabase Storage** - Dosya depolama
- ✅ **Multer** - File upload handling
- ✅ **Vercel Serverless Functions** - Serverless deployment

### Güvenlik
- ✅ **Row Level Security (RLS)** - Database güvenliği
- ✅ **Service Role Key** - Backend authentication
- ✅ **Session Management** - Admin session yönetimi
- ✅ **Brute-force Protection** - Şifre koruması
- ✅ **Environment Variables** - Hassas bilgi koruması

---

## 📊 İş Akışı

### Kullanıcı Tarafı
1. **Dekont Yükleme:**
   - Kullanıcı ID girişi
   - Form doldurma
   - Dekont dosyası yükleme
   - Otomatik OCR işlemi
   - Sahte dekont analizi
   - Form gönderme

2. **Durum Sorgulama:**
   - User ID ile giriş
   - Dekont listesi görüntüleme
   - Durum ve admin notlarını görüntüleme

### Admin Tarafı
1. **Giriş:**
   - Admin giriş sayfasına git
   - Şifre ile giriş yap
   - Admin paneline yönlendiril

2. **Dekont İnceleme:**
   - Dekont listesini görüntüle
   - Filtreleme ve arama yap
   - Dekont detaylarını aç
   - OCR ve analiz sonuçlarını incele

3. **Karar Verme:**
   - Onayla veya Reddet
   - Admin notu ekle
   - Durumu güncelle

---

## 🎨 Kullanıcı Arayüzü

### Tasarım Özellikleri
- ✅ Modern ve şık tasarım
- ✅ Koyu tema (dark mode)
- ✅ Gradient efektler
- ✅ Animasyonlu arka plan
- ✅ Glassmorphism efektleri
- ✅ Responsive layout
- ✅ Mobil uyumlu

### Renk Paleti
- **Ana Renkler:** Mavi, Mor, Pembe tonları
- **Vurgu Renkleri:** Sarı (focus), Kırmızı (hata), Yeşil (başarı)
- **Arka Plan:** Koyu gri (#161d2c)

---

## 📱 Desteklenen Dosya Formatları

### Görüntü Formatları
- ✅ JPG / JPEG
- ✅ PNG
- ✅ WEBP

### Belge Formatları
- ✅ PDF

### Dosya Limitleri
- ✅ Maksimum dosya boyutu: **5MB**
- ✅ Minimum dosya boyutu: Yok

---

## 🔒 Güvenlik Önlemleri

### Admin Paneli
- ✅ Gizli route (public erişim yok)
- ✅ Şifre koruması
- ✅ Session timeout (30 dakika)
- ✅ Brute-force koruması (5 deneme → 15 dakika kilit)
- ✅ Otomatik çıkış

### Veritabanı
- ✅ Row Level Security (RLS)
- ✅ Service role key authentication
- ✅ Public read, service role write

### Dosya Yükleme
- ✅ Dosya tipi kontrolü
- ✅ Dosya boyutu limiti
- ✅ Güvenli dosya depolama (Supabase Storage)
- ✅ Public URL'ler

---

## 📞 Destek

### İletişim
- **E-posta:** destek@padisahbet.com
- **Web:** https://padisah.pro

### Sorun Bildirimi
İşleminizde hata olduğunu düşünüyorsanız veya sorularınız için destek e-posta adresine başvurabilirsiniz.

---

## 🚀 Deployment

### Production URL
**Ana Site:** https://dekont-ruby.vercel.app/

### Platform
- **Hosting:** Vercel
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **CDN:** Vercel Edge Network

### Performans
- ✅ Hızlı yükleme süreleri
- ✅ Serverless architecture
- ✅ Otomatik scaling
- ✅ Global CDN

---

## 📝 Notlar

### Kullanıcılar İçin
- ✅ User ID'nizi doğru yazın, yanlış ID talebinizin incelenmesini geciktirebilir
- ✅ Dekont dosyası net ve okunabilir olmalı
- ✅ Gelecek tarih ve saat seçilemez
- ✅ Sadece bugün ve geçmiş tarihler kabul edilir

### Adminler İçin
- ✅ Şifrenizi güvenli tutun
- ✅ Session timeout'a dikkat edin (30 dakika)
- ✅ Admin notlarını açıklayıcı yazın
- ✅ Dekontları dikkatli inceleyin

---

## 🎯 Özet

**Dekont Kontrol Sistemi**, kullanıcıların dekont yükleyebildiği, otomatik OCR ve sahte dekont analizi yapabilen, adminlerin dekontları inceleyip onaylayabildiği modern bir web uygulamasıdır.

### Ana Özellikler:
- ✅ Otomatik OCR ile veri çıkarma
- ✅ Sahte dekont analizi
- ✅ Güvenli admin paneli
- ✅ Kullanıcı sorgu sayfası
- ✅ Responsive tasarım
- ✅ Modern UI/UX

### Teknoloji Stack:
- ✅ React + Vite
- ✅ Node.js + Express
- ✅ Supabase (PostgreSQL + Storage)
- ✅ Vercel (Hosting)
- ✅ Tesseract.js (OCR)

---

**Son Güncelleme:** 2024
**Versiyon:** 1.0.0
**Durum:** Production Ready ✅

