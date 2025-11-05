# Dekont Ticket Backend API

Node.js + Express.js + SQLite backend API for Dekont Ticket System.

## Kurulum

1. **Bağımlılıkları yükle:**
```bash
cd server
npm install
```

2. **Environment dosyasını oluştur:**
```bash
cp .env.example .env
```

3. **Server'ı başlat:**
```bash
# Production
npm start

# Development (nodemon ile)
npm run dev
```

## Plesk Deployment

### 1. Node.js Uygulaması Oluşturma

1. Plesk panelinde **"Node.js"** sekmesine gidin
2. **"Add Node.js App"** butonuna tıklayın
3. Ayarlar:
   - **App Root**: `/server` (veya tam yol)
   - **Application Mode**: `production`
   - **Application Startup File**: `server.js`
   - **Node.js Version**: En son LTS versiyonu seçin
   - **Port**: `3001` (veya Plesk'in verdiği port)

### 2. Bağımlılıkları Yükleme

SSH ile sunucuya bağlanın:
```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/server
npm install --production
```

### 3. Klasör İzinleri

```bash
chmod 755 uploads/
chmod 644 database.db
```

### 4. .htaccess Konfigürasyonu

`server/.htaccess` dosyası zaten oluşturuldu. Plesk'te Node.js modülü aktifse otomatik çalışır.

## API Endpoints

### Health Check
```
GET /api/health
```

### Tickets

- **Get all tickets**
  ```
  GET /api/tickets
  Query params: status, search, userId
  ```

- **Get ticket by ID**
  ```
  GET /api/tickets/:id
  ```

- **Get tickets by user ID**
  ```
  GET /api/tickets/user/:userId
  ```

- **Create ticket**
  ```
  POST /api/tickets
  Content-Type: multipart/form-data
  Body: userId, recipientName, recipientIban, investmentMethod, investmentAmount, investmentDateTime, receipt (file)
  ```

- **Update ticket**
  ```
  PATCH /api/tickets/:id
  Body: { status?, adminNote? }
  ```

- **Delete ticket**
  ```
  DELETE /api/tickets/:id
  ```

## Dosya Yapısı

```
server/
├── server.js          # Main server file
├── package.json       # Dependencies
├── .env              # Environment variables
├── .htaccess         # Plesk configuration
├── uploads/          # Uploaded receipt files
└── database.db       # SQLite database
```

## Notlar

- SQLite veritabanı `database.db` dosyası olarak saklanır
- Yüklenen dosyalar `uploads/` klasöründe saklanır
- Maksimum dosya boyutu: 5MB
- İzin verilen dosya tipleri: JPG, PNG, WEBP, PDF

