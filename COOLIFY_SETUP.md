# 🚀 Modli Coolify Deployment Guide

Bu rehber, Modli uygulamasını Coolify ile MongoDB dahil tam olarak deploy etmek için adım adım talimatlar içerir.

## 📋 Backend URL
**Production:** `https://modli.mekanizma.com`

---

## 🎯 Ön Hazırlık

### Gerekli Bilgiler

- [x] **GitHub Repo:** https://github.com/mekanizma/modliv1
- [x] **Backend URL:** https://modli.mekanizma.com
- [ ] **Sunucu IP Adresi:** _______________________
- [ ] **Domain DNS Ayarları:** Yapıldı ✅
- [ ] **API Keys:** Hazır ✅

### DNS Yapılandırması

Domain'inizin DNS ayarlarında aşağıdaki kaydı ekleyin:

```
Type: A Record
Name: modli.mekanizma.com (veya @ for root)
Value: SUNUCU_IP_ADRESI
TTL: 300
```

---

## 🐳 Coolify'da Deployment (Docker Compose ile)

### ✅ Önerilen Yöntem: Docker Compose ile Deploy

MongoDB ve Backend'i **birlikte** aynı deployment'ta çalıştırın.

#### 1️⃣ Yeni Application Oluştur

1. **Coolify Dashboard** → `+ New Resource` → `Application`

2. **Git Source:**
```
Repository: https://github.com/mekanizma/modliv1.git
Branch: main
Base Directory: /
```

3. **Build Pack Seç:**
```
Build Pack: Docker Compose
Docker Compose File: docker-compose.yml
```

⚠️ **ÖNEMLİ:** "Docker Compose" seçin, "Dockerfile" DEĞİL!

#### 2️⃣ Environment Variables (GEREKLİ)

Coolify'da aşağıdaki environment variable'ları ekleyin:

```env
# MongoDB Configuration (GEREKLİ)
MONGO_ROOT_USER=admin
MONGO_ROOT_PASS=SuperSecurePassword123!
DB_NAME=modli_prod

# API Keys (GEREKLİ)
FAL_KEY=your_fal_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Supabase Configuration (GEREKLİ)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key_here
```

**Önemli Notlar:**
- `MONGO_ROOT_PASS`: Güçlü bir şifre kullanın (en az 12 karakter, büyük/küçük harf, sayı, özel karakter)
- `FAL_KEY`: Virtual try-on için gerekli (fal.ai'dan alın)
- `OPENWEATHER_API_KEY`: Hava durumu özellikleri için (openweathermap.org'dan alın)
- `SUPABASE_URL` ve `SUPABASE_KEY`: Image upload için gerekli (supabase.com'dan alın)

#### 3️⃣ Port Ayarları

Coolify genelde otomatik ayarlar:
```
Backend Service Port: 3000 (host) → 8000 (container)
```

**Not:** Container içinde backend 8000 portunda çalışır, ancak dışarıdan 3000 portuyla erişilir.

#### 4️⃣ Domain Ayarları

```
Domain: modli.mekanizma.com
SSL: ✅ Enable (Let's Encrypt)
Force HTTPS: ✅ Enable
```

#### 5️⃣ Deploy

```
Deploy → Start
```

### Deployment Sonrası:
✅ MongoDB ve Backend aynı network'te (`modli-network`) çalışır  
✅ Backend `mongodb:27017` hostname üzerinden MongoDB'ye erişir  
✅ Health check otomatik çalışır ve başarılı olur  
✅ Her iki servis de otomatik restart yapar

---

## 🔄 Alternatif: Manuel MongoDB + Backend (Eski Yöntem)

Eğer Docker Compose çalışmazsa:

### 1️⃣ MongoDB Service Oluşturma

1. **Coolify Dashboard** → `+ New Resource` → `Database` → `MongoDB`
2. **Configuration:**

```yaml
Service Name: modli-mongodb
Version: 7
Port: 27017 (internal)

Environment Variables:
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_secure_password_123

Persistent Storage:
  /data/db
```

### 2️⃣ Backend Application Deploy

1. **Coolify Dashboard** → `+ New Resource` → `Application`
2. **Build Pack:** `Dockerfile`
3. **Dockerfile Location:** `backend/Dockerfile`
4. **Environment Variables:**

```env
MONGO_URL=mongodb://admin:your_secure_password_123@modli-mongodb:27017
DB_NAME=modli_prod
FAL_KEY=your_key
OPENWEATHER_API_KEY=your_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_key
```

5. **Network:** Same as MongoDB
6. **Depends On:** modli-mongodb

---

### 3️⃣ Domain & SSL Configuration

#### Domain Setup

1. **Application Settings** → **Domains**
2. **Add Domain:**

```
Domain: modli.mekanizma.com
Path: / (root)
Strip Prefix: ❌
```

3. **Enable HTTPS:**
```
SSL/TLS: ✅ Enable
Certificate: Let's Encrypt (Auto)
Force HTTPS: ✅ Enable
```

4. **Save** ve 5-10 dakika bekleyin (SSL sertifikası için)

#### Test

```bash
# Health check test
curl https://modli.mekanizma.com/health

# Beklenen çıktı:
{
  "status": "healthy",
  "timestamp": "2025-12-17T...",
  "services": {
    "mongodb": "connected",
    "fal_api": "configured"
  }
}
```

---

## 📱 Frontend Configuration

### EAS Build için Environment Variables

**`frontend/eas.json`** zaten güncellenmiş durumda:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://modli.mekanizma.com",
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your_anon_key",
        "EXPO_PUBLIC_OPENWEATHER_API_KEY": "your_weather_key"
      }
    }
  }
}
```

### Production Build

```bash
cd frontend

# iOS production build
eas build --platform ios --profile production

# Android production build
eas build --platform android --profile production
```

---

## 🔄 Docker Compose ile Local Test

Deploy etmeden önce local'de test edebilirsiniz:

```bash
# Repo'yu klonlayın
git clone https://github.com/mekanizma/modliv1.git
cd modliv1

# .env dosyası oluşturun
cp .env.example .env

# .env'yi düzenleyin:
nano .env
```

**`.env` içeriği:**
```env
MONGO_ROOT_USER=admin
MONGO_ROOT_PASS=test123
DB_NAME=modli_prod
FAL_KEY=your_key
OPENWEATHER_API_KEY=your_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_key
```

```bash
# Docker Compose ile başlat
docker-compose up -d

# Logs
docker-compose logs -f

# Test
curl http://localhost:3000/health

# Durdur
docker-compose down
```

---

## 🔍 Monitoring & Debugging

### Coolify Logs

1. **Application** → **Logs** sekmesi
2. Real-time log akışını izleyin
3. Filtreler: Error, Warning, Info

### Container'a Bağlanma

```bash
# Backend container
docker exec -it modli-backend bash

# MongoDB container
docker exec -it modli-mongodb mongosh -u admin -p your_password

# Python ortamını test et
python -c "import pymongo; print('MongoDB library OK')"
python -c "import motor; print('Motor library OK')"
```

### Common Issues

#### 1. MongoDB Bağlantı Hatası

```
Error: MongoServerError: Authentication failed
```

**Çözüm:**
- MongoDB service'inin running olduğunu kontrol edin
- MONGO_URL'deki username/password'ü kontrol edin
- Network ayarlarını kontrol edin (aynı network'te olmalı)

```bash
# MongoDB status
docker ps | grep modli-mongodb

# Network kontrol
docker network ls
docker network inspect modli-network
```

#### 2. Backend Health Check Failed

```
Health check failed: connection refused
```

**Çözüm:**
- Backend container'ın başladığını kontrol edin
- MongoDB'nin hazır olduğunu bekleyin (depends_on)
- Environment variables'ı kontrol edin

```bash
# Backend logs
docker logs modli-backend -f

# Health check manuel test
docker exec -it modli-backend curl http://localhost:8000/health
```

#### 3. CORS Error

```
Access-Control-Allow-Origin error
```

**Çözüm:**
- ALLOWED_ORIGINS environment variable'ını kontrol edin
- Frontend URL'sinin ALLOWED_ORIGINS'te olduğundan emin olun

```env
ALLOWED_ORIGINS=https://modli.mekanizma.com,http://localhost:8081
```

#### 4. SSL Certificate Issues

**Çözüm:**
- DNS propagation'ı bekleyin (1-24 saat)
- Domain'in sunucu IP'sine işaret ettiğini kontrol edin
- Coolify'da "Regenerate Certificate" deneyin

```bash
# DNS kontrol
nslookup modli.mekanizma.com
dig modli.mekanizma.com
```

---

## 📊 Resource Usage

### Minimum Requirements

| Service | CPU | RAM | Disk |
|---------|-----|-----|------|
| MongoDB | 0.5 CPU | 512MB | 5GB |
| Backend | 0.5 CPU | 512MB | 1GB |
| **TOTAL** | **1 CPU** | **1GB** | **6GB** |

### Recommended for Production

| Service | CPU | RAM | Disk |
|---------|-----|-----|------|
| MongoDB | 1 CPU | 1GB | 20GB |
| Backend | 1 CPU | 1GB | 5GB |
| **TOTAL** | **2 CPU** | **2GB** | **25GB** |

---

## 🔄 Update & Maintenance

### Backend Code Update

```bash
# Git'e push edin
git add .
git commit -m "Update: bug fixes"
git push origin main

# Coolify otomatik deploy eder (Git integration aktifse)
# Veya manuel:
# Coolify Dashboard → Application → Deploy → Redeploy
```

### MongoDB Backup

```bash
# Backup oluştur
docker exec modli-mongodb mongodump \
  --username admin \
  --password your_password \
  --authenticationDatabase admin \
  --db modli_prod \
  --out /data/backup/$(date +%Y%m%d)

# Backup'ı local'e çek
docker cp modli-mongodb:/data/backup ./backup

# Restore
docker exec modli-mongodb mongorestore \
  --username admin \
  --password your_password \
  --authenticationDatabase admin \
  --db modli_prod \
  /data/backup/20251217/modli_prod
```

### MongoDB Upgrade

```bash
# Backup al
docker exec modli-mongodb mongodump --out /backup

# MongoDB version değiştir
# Coolify: Service → Configuration → Version → 8

# Redeploy
```

---

## ✅ Production Checklist

### Pre-Deployment
- [ ] GitHub repo güncel
- [ ] DNS ayarları yapıldı (A record)
- [ ] API keys hazır
- [ ] Supabase production projesi hazır
- [ ] .env.example değerleri dolduruldu

### MongoDB Setup
- [ ] MongoDB service oluşturuldu
- [ ] Root user credentials ayarlandı
- [ ] Persistent storage yapılandırıldı
- [ ] Health check çalışıyor
- [ ] Network oluşturuldu (modli-network)

### Backend Setup
- [ ] Application oluşturuldu
- [ ] Dockerfile build başarılı
- [ ] Environment variables eklendi
- [ ] MongoDB bağlantısı test edildi
- [ ] Health check endpoint test edildi
- [ ] Domain bağlandı (modli.mekanizma.com)
- [ ] SSL sertifikası aktif
- [ ] CORS ayarları doğru

### Frontend Setup
- [ ] eas.json yapılandırıldı
- [ ] Production build tamamlandı
- [ ] Backend URL doğru (https://modli.mekanizma.com)
- [ ] Test build çalışıyor

### Security
- [ ] MongoDB strong password
- [ ] API keys güvenli
- [ ] CORS sadece allowed origins
- [ ] HTTPS forced
- [ ] Environment secrets Coolify'da

---

## 📞 Support

**Coolify Documentation:** https://coolify.io/docs

**Common Commands:**
```bash
# Container status
docker ps

# Logs
docker logs modli-backend -f
docker logs modli-mongodb -f

# Resource usage
docker stats

# Network
docker network inspect modli-network

# Remove and recreate (careful!)
docker-compose down -v
docker-compose up -d
```

---

## 🎉 Deployment Complete!

Backend URL: **https://modli.mekanizma.com**

Test endpoints:
- Health: `https://modli.mekanizma.com/health`
- API docs: `https://modli.mekanizma.com/docs`

**🚀 Artık production'dasınız!**

Made with ❤️ by Mekanizma Team

