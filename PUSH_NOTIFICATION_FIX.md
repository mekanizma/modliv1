# Push Notification Production Build Düzeltmesi

## Sorun
Admin panel'den push notification gönderilince Expo Go'ya gidiyor, Play Store/App Store'dan yüklenmiş uygulamaya gitmiyor.

**Neden:** `getExpoPushTokenAsync()` Expo Go için ExponentPushToken veriyor. Production build'lerde native FCM (Android) / APNs (iOS) token'ları kullanılmalı.

## Çözüm Adımları

### 1. Notification Token Sistemi Güncellemesi

#### Dosya: `frontend/src/lib/notifications.ts`

**Satır 153-172 arasını değiştir:**

ESKİ KOD:
```typescript
export async function registerPushToken(userId: string) {
  try {
    const permission = await requestPermissionsIfNeeded();
    if (!permission) return;

    const projectId = 'e27cd1bb-7f64-44c3-89ec-1e7b0f9f5842';
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    if (!token) return;

    await supabase.from('push_tokens').upsert({
      user_id: userId,
      push_token: token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Push token register failed', error);
  }
}
```

YENİ KOD:
```typescript
export async function registerPushToken(userId: string) {
  try {
    const permission = await requestPermissionsIfNeeded();
    if (!permission) {
      console.log('❌ Push notification permission not granted');
      return;
    }

    let pushToken: string | null = null;

    // Production build'de (Play Store/App Store) native token al
    // Development build veya Expo Go'da Expo token al
    try {
      // Önce native device token'ı almayı dene (FCM/APNs)
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      if (deviceToken && deviceToken.data) {
        pushToken = deviceToken.data;
        console.log('✅ Native push token (FCM/APNs) registered:', pushToken.substring(0, 20) + '...');
      }
    } catch (deviceError) {
      console.log('ℹ️ Native token unavailable, trying Expo token...', deviceError);

      // Native token alınamazsa Expo token al (development/Expo Go için)
      try {
        const projectId = 'e27cd1bb-7f64-44c3-89ec-1e7b0f9f5842';
        const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
        if (expoToken && expoToken.data) {
          pushToken = expoToken.data;
          console.log('✅ Expo push token registered:', pushToken.substring(0, 20) + '...');
        }
      } catch (expoError) {
        console.error('❌ Failed to get Expo push token:', expoError);
      }
    }

    if (!pushToken) {
      console.warn('❌ No push token available');
      return;
    }

    // Token'ı Supabase'e kaydet
    const { error } = await supabase.from('push_tokens').upsert({
      user_id: userId,
      push_token: pushToken,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('❌ Failed to save push token:', error);
    } else {
      console.log('✅ Push token saved to database');
    }
  } catch (error) {
    console.error('❌ Push token register failed:', error);
  }
}
```

### 2. Firebase Cloud Messaging (FCM) Yapılandırması - Android

#### A. Firebase Console'da Proje Oluştur

1. https://console.firebase.google.com/ adresine git
2. Yeni proje oluştur veya mevcut projeyi seç
3. Project Settings → General
4. "Add app" → Android
5. Android package name: `com.mekanizma.modli` (app.json'daki package ile aynı olmalı)
6. `google-services.json` dosyasını indir
7. İndirilen dosyayı `frontend/` klasörüne koy

#### B. FCM Server Key Al

1. Firebase Console → Project Settings → Cloud Messaging
2. **Cloud Messaging API (Legacy)** sekmesine git
3. API'yi etkinleştir (disabled ise)
4. **Server key** kopyala (backend'de kullanılacak)

#### C. app.json Güncelle

`frontend/app.json` dosyasında `android` bölümüne ekle:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.mekanizma.modli"
    }
  }
}
```

### 3. Apple Push Notification Service (APNs) Yapılandırması - iOS

#### A. Apple Developer Portal

1. https://developer.apple.com/ → Certificates, Identifiers & Profiles
2. **Keys** → Create a new key
3. Key name: "Modli Push Notifications"
4. **Apple Push Notifications service (APNs)** seçeneğini işaretle
5. Key'i oluştur ve `.p8` dosyasını indir
6. **Key ID** ve **Team ID**'yi not al

#### B. EAS Credentials Yapılandırması

Terminal'de:

```bash
cd frontend
eas credentials
```

Menüden:
- iOS → Production → Push Notifications
- Upload edilmiş APNs key varsa güncelle, yoksa yeni ekle
- İndirdiğin `.p8` dosyasını, Key ID ve Team ID'yi gir

### 4. EAS Build Yapılandırması

#### Dosya: `frontend/eas.json`

Production build'e FCM yapılandırması ekle:

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildConfiguration": "Release"
      },
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://modli.mekanizma.com",
        "EXPO_PUBLIC_SUPABASE_URL": "https://cgbyhxployzpxwixgqzs.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnYnloeHBsb3l6cHh3aXhncXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTI4NjIsImV4cCI6MjA4MTQ2ODg2Mn0.oX3Xlf4niVoAUT5mreZ2sSm9wVUbiVJp2m2jzNnTrS8",
        "EXPO_PUBLIC_OPENWEATHER_API_KEY": "8eb7f79142dbe8f173e1c81e85853fbc"
      }
    }
  }
}
```

### 5. Production Build

#### Android (Play Store):

```bash
cd frontend
eas build --platform android --profile production
```

#### iOS (App Store):

```bash
cd frontend
eas build --platform ios --profile production
```

### 6. Backend Kontrol (Zaten Hazır)

Backend (`server.py:106-118`) zaten hem Expo token'larını hem FCM token'larını destekliyor:

```python
def is_expo_push_token(token: str) -> bool:
    return isinstance(token, str) and (
        token.startswith("ExponentPushToken") or token.startswith("ExpoPushToken")
    )

def is_fcm_token(token: str) -> bool:
    return isinstance(token, str) and len(token) > 20 and not token.startswith("ExponentPushToken")
```

Expo Push API hem Expo token'larını hem FCM token'larını kabul eder, bu yüzden backend değişikliği gerekmez.

## Test Adımları

### Development Test (Expo Go):

1. Expo Go ile uygulamayı aç
2. Giriş yap
3. Backend'den push notification gönder
4. **Expo Go uygulamasında** notification görünmeli

### Production Test (Play Store/App Store):

1. Production build yap: `eas build --platform android --profile production`
2. Build tamamlanınca download et ve cihaza yükle
3. Uygulamayı aç ve giriş yap
4. Console log'larında şunu görmeli: `✅ Native push token (FCM/APNs) registered:`
5. Backend'den push notification gönder
6. **Production uygulamasında** notification görünmeli

### Debug

Token'ların doğru alındığını kontrol etmek için:

1. Uygulamayı aç
2. Expo dev tools veya React Native debugger'da console'a bak
3. Şu log'ları görmeli:
   - `✅ Native push token (FCM/APNs) registered:` (production build'de)
   - `✅ Expo push token registered:` (Expo Go'da)
   - `✅ Push token saved to database`

4. Supabase dashboard → push_tokens tablosunu kontrol et:
   - Native token'lar 152+ karakter uzunluğunda ve random string
   - Expo token'lar `ExponentPushToken[...]` formatında

## Özet

1. ✅ **Kod değişikliği**: `notifications.ts` → Native token öncelikli, Expo token fallback
2. ⚙️ **Firebase**: google-services.json al ve app.json'a ekle
3. 🍎 **Apple**: APNs key oluştur ve EAS credentials'a ekle
4. 🏗️ **Build**: EAS ile production build yap
5. 🧪 **Test**: Production build'de push notification test et

## Önemli Notlar

- **Expo Go**: Development'ta Expo token'ı kullanır (normal)
- **Production Build**: Native FCM/APNs token'ı kullanır (olması gereken)
- **Backend**: Her iki token türünü de destekler (değişiklik gerekmez)
- **Test**: Her platform için ayrı test yapın (Android + iOS)
