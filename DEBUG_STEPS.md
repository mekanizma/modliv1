# Google Login Debug Adımları

## Sorun: Google login sonrası giriş ekranına atıyor ama giriş yapmıyor

### 1. Console Log Kontrol

Expo development modunda çalıştırırken terminalde şu log'ları kontrol edin:

```bash
npx expo start
```

Google login'e bastıktan sonra terminalde şu log'ları arayın:

- `🔗 Deep link received:` - Deep link geldi mi?
- `🔗 Parsed tokens - access_token: found/missing` - Token'lar parse edildi mi?
- `🔐 OAuth callback detected, setting session...` - Session set ediliyor mu?
- `✅ Session set successfully` - Session başarılı set edildi mi?
- `❌ Session set error:` - Session set hatası var mı?

### 2. Backend Log Kontrol

Backend container log'larına bakın:

```bash
docker logs <backend-container-name> --tail 50 -f
```

OAuth callback geldiğinde log'larda `/auth/callback` endpoint'ine istek geldiğini görmeli.

### 3. Supabase Dashboard Kontrol

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Authentication > URL Configuration
3. **Redirect URLs** kısmına `modli://auth/callback` eklenmiş mi kontrol edin
4. Eğer yoksa ekleyin ve kaydedin

### 4. Test Senaryosu

1. Uygulamayı tamamen kapatın (kill edin)
2. Terminalde Expo dev server'ı başlatın: `npx expo start`
3. Uygulamayı açın
4. Google login'e basın
5. Hesap seçin
6. Terminal log'larını izleyin
7. Log'ları buraya yapıştırın

### 5. Alternatif Test - Browser Console

Google login yaptıktan sonra backend callback sayfası açılıyorsa:

1. Mobil cihazda Chrome kullanıyorsanız: chrome://inspect
2. Web sayfasının console'unda şu mesajları arayın:
   - `Redirecting to: modli://auth/callback?access_token=...`
   - Token'ların olup olmadığını kontrol edin

### 6. Deep Link Test

Uygulamanın deep link'i doğru yakalayıp yakalamadığını test edin:

Terminal'de (iOS için):
```bash
xcrun simctl openurl booted "modli://auth/callback?access_token=test&refresh_token=test&type=oauth"
```

Terminal'de (Android için):
```bash
adb shell am start -W -a android.intent.action.VIEW -d "modli://auth/callback?access_token=test\&refresh_token=test\&type=oauth" com.mekanizma.modli
```

Uygulama açılmalı ve terminalde log görmelisiniz.

## Olası Sorunlar ve Çözümleri

### Sorun 1: Token'lar parse edilemiyor

**Belirti**: `access_token: missing, refresh_token: missing` log'u
**Çözüm**: Backend callback URL formatını kontrol edin

### Sorun 2: Deep link hiç gelmiyor

**Belirti**: `🔗 Deep link received:` log'u yok
**Çözüm**:
- app.json'da `scheme: "modli"` var mı kontrol edin
- Android: `npx expo prebuild` çalıştırın
- iOS: `cd ios && pod install`

### Sorun 3: Session set ediliyor ama kullanıcı giriş yapmıyor

**Belirti**: `✅ Session set successfully` var ama giriş ekranı hala görünüyor
**Çözüm**: AuthContext'teki `onAuthStateChange` listener'ı çalışmıyor olabilir

### Sorun 4: Supabase redirect URL ayarı yanlış

**Belirti**: OAuth callback sayfası "Token'lar bulunamadı" hatası veriyor
**Çözüm**: Supabase Dashboard > Authentication > URL Configuration > Redirect URLs'e `https://modli.mekanizma.com/auth/callback` ekleyin

## Hızlı Düzeltme (Eğer yukarıdakiler çalışmazsa)

Aşağıdaki değişiklikleri yapın:

### frontend/src/contexts/AuthContext.tsx (satır 433-440)

Değiştirin:
```typescript
} else {
  // Callback endpoint modli:// deep link ile dönecek; deep link listener yakalayacak
  console.log('📱 OAuth result type:', result.type);
  console.log('📱 OAuth: waiting for deep link callback...');
  return { error: null };
}
```

Şununla:
```typescript
} else {
  // Dismiss veya başka durum - timeout bekle
  console.log('📱 OAuth result type:', result.type);
  console.log('📱 OAuth: waiting for deep link callback...');

  // 5 saniye sonra loading'i false yap, deep link gelmezse
  setTimeout(() => {
    if (oauthInProgressRef.current) {
      console.warn('⚠️ Deep link timeout - no callback received');
      clearTimeout(oauthTimeout);
      oauthInProgressRef.current = false;
      setLoading(false);
    }
  }, 5000);

  return { error: null };
}
```
