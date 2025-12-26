# Google OAuth Debug Checklist

## 1. SHA-1 Fingerprint Kontrolü

### Debug Keystore SHA-1 (Şu an kullanılan):
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

### Google Console'da Kontrol:
1. Firebase Console → Project Settings → Your apps → Android app
2. SHA certificate fingerprints bölümüne git
3. Bu SHA-1'in ekli olduğundan emin ol:
   - `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

### Eğer SHA-1 Eksikse:
1. Firebase Console → Project Settings → Your apps → Android app
2. "Add fingerprint" butonuna tıkla
3. SHA-1'i ekle: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
4. `google-services.json` dosyasını yeniden indir
5. `frontend/android/app/google-services.json` dosyasını güncelle
6. APK'yı yeniden build et

## 2. Package Name Kontrolü

### Mevcut Package Name:
```
com.mekanizma.modli
```

### Google Console'da Kontrol:
1. Firebase Console → Project Settings → Your apps → Android app
2. Package name'in `com.mekanizma.modli` olduğundan emin ol

## 3. OAuth Redirect URL Kontrolü

### Mevcut Redirect URL:
```
https://modli.mekanizma.com/auth/callback
```

### Google Console'da Kontrol:
1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 Client ID'yi aç
3. "Authorized redirect URIs" bölümünde şu URL'in ekli olduğundan emin ol:
   - `https://modli.mekanizma.com/auth/callback`

## 4. Deep Link Handler Log Kontrolü

### Log'larda Aranacak Mesajlar:
- `🔗 Deep link received:` - Deep link geldiğinde
- `🔐 OAuth callback detected, setting session...` - OAuth callback algılandığında
- `✅ Session set successfully` - Session başarıyla set edildiğinde
- `❌ Session set error:` - Hata durumunda

### Log Kontrolü:
1. Android Studio → Logcat
2. Filtre: `🔗|🔐|✅|❌`
3. Google login yaparken bu log'ları kontrol et

## 5. Release Keystore (Opsiyonel - Production İçin)

### Şu An:
- Release build debug keystore kullanıyor (geliştirme için OK)
- Production için release keystore oluşturulmalı

### Production Release Keystore Oluşturma:
```bash
cd frontend/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias modli-release -keyalg RSA -keysize 2048 -validity 10000
```

### Release Keystore SHA-1 Çıkarma:
```bash
keytool -list -v -keystore release.keystore -alias modli-release
```

### Google Console'a Release SHA-1 Ekleme:
1. Release keystore'dan SHA-1'i çıkar
2. Firebase Console → Project Settings → Your apps → Android app
3. SHA certificate fingerprints → Add fingerprint
4. Release SHA-1'i ekle

## 6. Test Adımları

1. ✅ Google Console'da SHA-1 ekli mi? (Debug: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`)
2. ✅ Package name doğru mu? (`com.mekanizma.modli`)
3. ✅ OAuth redirect URL ekli mi? (`https://modli.mekanizma.com/auth/callback`)
4. ✅ `google-services.json` güncel mi?
5. ✅ APK yeniden build edildi mi?
6. ✅ Log'larda deep link handler çalışıyor mu?

## 7. Yaygın Sorunlar

### Sorun: "OAuth işlemi iptal edildi"
- **Sebep:** Deep link handler çalışmıyor veya token'lar parse edilemiyor
- **Çözüm:** Log'larda `🔗 Deep link received:` mesajını kontrol et

### Sorun: "Token'lar alınamadı"
- **Sebep:** Backend'den token'lar gelmiyor veya parse edilemiyor
- **Çözüm:** Backend log'larını kontrol et, deep link handler log'larını kontrol et

### Sorun: "Session set error"
- **Sebep:** Token'lar geçersiz veya süresi dolmuş
- **Çözüm:** Google Console'da OAuth ayarlarını kontrol et, token'ların doğru geldiğinden emin ol

