# Google Login Debug - Detaylı Analiz

## Mevcut Durum
- redirectUrl: `modli://auth/callback` (native deep link)
- skipBrowserRedirect: true
- Platform: iOS -> openAuthSessionAsync, Android -> openBrowserAsync

## Sorun
Google'a basıyor → hesap seçiyor → uygulama açılıyor → giriş yapmıyor

## Kritik Kontroller

### 1. Supabase Dashboard Kontrolü

**ÖNEMLİ**: Supabase Dashboard'a gidin ve şunu kontrol edin:

1. https://supabase.com/dashboard → Projenizi seçin
2. Authentication → URL Configuration
3. **Redirect URLs** bölümüne bakın:
   - `modli://auth/callback` var mı?
   - `https://modli.mekanizma.com/auth/callback` var mı?

**Her iki URL de olmalı!**

### 2. Console Log Kontrolü

Uygulamayı development modda çalıştırın:

```bash
cd frontend
npx expo start
```

Google login'e bastıktan sonra **terminalde** şu log'ları arayın:

#### Beklenen Log Sırası:

```
🔐 OAuth redirect URL: modli://auth/callback Provider: google
🌐 Opening OAuth URL: https://...
📱 OAuth: waiting for deep link callback on Android... (veya iOS)
🔗 Deep link received: modli://auth/callback?...
🔗 Parsed tokens - access_token: found refresh_token: found
🔐 OAuth callback detected, setting session...
✅ Session set successfully
✅ User ID: abc123...
```

#### Eğer bu log'ları görmüyorsanız:

**Log eksikse ne yapmalı:**

1. `🔗 Deep link received` YOK → Deep link gelmemiş
2. `access_token: missing` → Token'lar parse edilememiş
3. `❌ Session set error` → Session set hatası

### 3. Supabase OAuth Callback URL Testi

Google OAuth, `modli://` deep link'ini **direkt desteklemiyor olabilir**. Test için:

**Geçici olarak AuthContext.tsx satır 343'ü değiştirin:**

```typescript
// ŞU ANKİ (çalışmıyor olabilir):
const redirectUrl = 'modli://auth/callback';

// BUNU DENEYİN:
const redirectUrl = 'https://modli.mekanizma.com/auth/callback';
```

Tekrar test edin. Eğer bu çalışırsa, sorun Supabase'in native deep link'i desteklememesi.

### 4. Deep Link Test

Deep link handler'ın çalışıp çalışmadığını test edin:

**Android:**
```bash
adb shell am start -W -a android.intent.action.VIEW -d "modli://auth/callback?access_token=test123&refresh_token=refresh456&type=oauth" com.mekanizma.modli
```

**iOS Simulator:**
```bash
xcrun simctl openurl booted "modli://auth/callback?access_token=test123&refresh_token=refresh456&type=oauth"
```

**Beklenen sonuç:**
- Uygulama açılmalı
- Terminalde `🔗 Deep link received: modli://auth/callback?...` görülmeli
- `🔗 Parsed tokens - access_token: found` görülmeli

Eğer bu test çalışıyorsa, sorun Supabase OAuth redirect'inde.

## Olası Sorunlar ve Çözümleri

### Sorun 1: Supabase native deep link'i desteklemiyor

**Belirti**: Backend callback sayfası açılmıyor, direkt uygulama açılıyor ama giriş yok

**Çözüm**: redirectUrl'i `https://modli.mekanizma.com/auth/callback` olarak değiştirin

### Sorun 2: Backend callback çalışıyor ama deep link gelmiyor

**Belirti**: "Giriş yapılıyor..." sayfası görünüyor ve kalıyor

**Çözüm**: Backend server.py'deki JavaScript redirect kodu çalışmıyor olabilir

### Sorun 3: Deep link geliyor ama token'lar yok

**Belirti**: `🔗 Deep link received` var ama `access_token: missing`

**Çözüm**: Supabase callback URL formatı yanlış - hash (#) vs query (?) parametresi

## Hızlı Düzeltme

Eğer yukarıdaki testlerden sonra sorun devam ederse, aşağıdaki değişikliği yapın:

### frontend/src/contexts/AuthContext.tsx

**Satır 343'ü değiştirin:**

```typescript
// ESKI (muhtemelen çalışmıyor):
const redirectUrl = 'modli://auth/callback';

// YENİ (backend callback kullan):
const redirectUrl = 'https://modli.mekanizma.com/auth/callback';
```

**Satır 351'i değiştirin:**

```typescript
// ESKI:
skipBrowserRedirect: true,

// YENİ:
skipBrowserRedirect: false,
```

**Satır 369-398 arası tümünü değiştirin:**

ESKI kodu sil, yerine:

```typescript
// Tüm platformlarda aynı yöntem: openAuthSessionAsync
const result = await WebBrowser.openAuthSessionAsync(
  data.url,
  redirectUrl
);

console.log(`📱 OAuth result (${Platform.OS}):`, result.type, result.url);

if (result.type === 'success' && result.url) {
  // URL'den token'ları parse et
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  try {
    const url = new URL(result.url);
    const hash = url.hash.substring(1);
    const params = new URLSearchParams(hash || url.search);

    accessToken = params.get('access_token');
    refreshToken = params.get('refresh_token');
  } catch (parseError) {
    console.error('URL parse error:', parseError);
    const accessTokenMatch = result.url.match(/access_token=([^&]*)/);
    const refreshTokenMatch = result.url.match(/refresh_token=([^&]*)/);
    accessToken = accessTokenMatch ? decodeURIComponent(accessTokenMatch[1]) : null;
    refreshToken = refreshTokenMatch ? decodeURIComponent(refreshTokenMatch[1]) : null;
  }

  if (accessToken && refreshToken) {
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      clearTimeout(oauthTimeout);
      oauthInProgressRef.current = false;
      setLoading(false);
      return { error: sessionError };
    }

    if (sessionData.session?.user) {
      await fetchProfile(sessionData.session.user.id);
      await requestNotificationPermission();
    }
    clearTimeout(oauthTimeout);
    oauthInProgressRef.current = false;
    setLoading(false);
    return { error: null };
  } else {
    clearTimeout(oauthTimeout);
    oauthInProgressRef.current = false;
    setLoading(false);
    return { error: { message: 'Token\'lar alınamadı. Lütfen tekrar deneyin.' } };
  }
} else if (result.type === 'cancel') {
  clearTimeout(oauthTimeout);
  oauthInProgressRef.current = false;
  setLoading(false);
  return { error: { message: 'OAuth işlemi iptal edildi.' } };
} else {
  // dismiss veya başka durum - deep link bekleniyor
  console.log('📱 OAuth result type:', result.type);
  console.log('📱 OAuth: waiting for deep link callback...');

  // 10 saniye timeout
  setTimeout(() => {
    if (oauthInProgressRef.current) {
      console.warn('⚠️ Deep link timeout');
      oauthInProgressRef.current = false;
      setLoading(false);
    }
  }, 10000);

  return { error: null };
}
```

## Test Sonuçlarını Paylaşın

Lütfen aşağıdaki bilgileri paylaşın:

1. Supabase Dashboard'da hangi Redirect URLs var?
2. Console log'larında hangi mesajları görüyorsunuz?
3. Deep link test komutu çalıştı mı?
4. Platform: iOS mu Android mi?
5. Expo Go mu yoksa Development Build mi kullanıyorsunuz?
