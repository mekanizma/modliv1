# App Store Connect - In-App Purchase Metadata Rehberi

## Eksik Metadata Sorunu Çözümü

App Store Connect'te in-app purchase'larınızın "Missing Metadata" uyarısı vermesinin nedeni, aşağıdaki zorunlu alanların eksik olmasıdır.

## Her In-App Purchase İçin Gerekli Metadata

### 1. Reference Name (Referans Adı)
- **Basic**: `Basic Plan - 18 Images`
- **Standard**: `Standard Plan - 40 Images`
- **Premium**: `Premium Plan - 100+10 Free Images`

### 2. Display Name (Görünen Ad) - Her Dil İçin

#### İngilizce (English - Primary Language)
- **Basic**: `Basic`
- **Standard**: `Standard`
- **Premium**: `Premium`

#### Türkçe (Turkish)
- **Basic**: `Temel`
- **Standard**: `Standart`
- **Premium**: `Premium`

### 3. Description (Açıklama) - Her Dil İçin

#### İngilizce (English)
- **Basic**: `Get 18 AI-generated try-on images. Perfect for trying out your first virtual outfits and discovering your style.`
- **Standard**: `Get 40 AI-generated try-on images. Plan your weekly outfits in seconds and end the "what should I wear" dilemma every morning.`
- **Premium**: `Get 100+10 free AI-generated try-on images. For style enthusiasts who push boundaries! Have your personal style consultant with you at all times.`

#### Türkçe (Turkish)
- **Basic**: `18 AI ile oluşturulmuş deneme görseli alın. İlk sanal kombinlerinizi denemek ve stilinizi keşfetmek için mükemmel.`
- **Standard**: `40 AI ile oluşturulmuş deneme görseli alın. Haftalık kombinlerinizi saniyeler içinde planlayın ve her sabah "ne giyeceğim" derdine son verin.`
- **Premium**: `100+10 bedava AI ile oluşturulmuş deneme görseli alın. Sınırları zorlayan stil tutkunları için! Kişisel stil danışmanınız her an yanınızda olsun.`

### 4. Price (Fiyat)
- **Basic**: `$4.99 USD` (Tier 5)
- **Standard**: `$8.99 USD` (Tier 9)
- **Premium**: `$14.99 USD` (Tier 15)

### 5. Review Information (İnceleme Bilgileri) - Opsiyonel ama Önerilir

Her ürün için bir ekran görüntüsü ve kısa bir açıklama ekleyin:

**Review Notes (İnceleme Notları):**
```
This is a one-time purchase that adds credits to the user's account. 
Users can use these credits to generate AI try-on images of clothing items.
```

**Screenshot Requirements:**
- Ekran görüntüsü: Uygulama içinde satın alma ekranının görüntüsü
- Format: PNG veya JPG
- Boyut: Minimum 640x1136 piksel (iPhone ekran boyutu)

### 6. Promotional Image (Promosyon Görseli) - Opsiyonel

Eğer in-app purchase'larınızı App Store'da tanıtmak istiyorsanız:
- **Boyut**: 1024 x 1024 piksel
- **Format**: PNG veya JPG
- **Çözünürlük**: 72 dpi
- **Renk Formatı**: RGB

## App Store Connect'te Doldurulacak Alanlar

### Adım 1: In-App Purchase Oluşturma
1. App Store Connect → Uygulamanızı seçin
2. Sol menüden **"Monetization"** → **"In-App Purchases"**
3. **"+"** butonuna tıklayın
4. **"Consumable"** seçin (tekrar satın alınabilir)

### Adım 2: Product ID Girişi
Her plan için Product ID'leri:
- `com.mekanizma.modli.basic`
- `com.mekanizma.modli.standard`
- `com.mekanizma.modli.premium`

### Adım 3: Reference Name
- Basic: `Basic Plan - 18 Images`
- Standard: `Standard Plan - 40 Images`
- Premium: `Premium Plan - 100+10 Free Images`

### Adım 4: Display Name ve Description
Her dil için (İngilizce ve Türkçe) yukarıdaki bilgileri girin.

### Adım 5: Price
Fiyat seviyesini seçin:
- Basic: Tier 5 ($4.99)
- Standard: Tier 9 ($8.99)
- Premium: Tier 15 ($14.99)

### Adım 6: Review Information
- Review Screenshot: Uygulama içi satın alma ekranının ekran görüntüsü
- Review Notes: Yukarıdaki açıklamayı ekleyin

### Adım 7: Kaydet (İlk IAP İçin Özel Adımlar)

⚠️ **ÖNEMLİ: İlk In-App Purchase Kurulumu**

Apple'ın kuralına göre, **ilk in-app purchase'ınız yeni bir app version ile birlikte gönderilmelidir**. Bu nedenle:

1. **"Save"** butonuna tıklayın (henüz "Submit for Review" yapmayın!)
2. In-app purchase'ı oluşturduktan sonra, aşağıdaki adımları takip edin:

### Adım 8: İlk IAP'ı App Version'a Ekleme

1. App Store Connect → Uygulamanızı seçin
2. Sol menüden **"App Store"** → **"iOS App"** sekmesine gidin
3. Yeni bir version oluşturun (örn: 1.1.0) veya mevcut bir version'ı seçin
4. Version sayfasında, **"In-App Purchases and Subscriptions"** bölümünü bulun
5. **"+"** butonuna tıklayın ve oluşturduğunuz in-app purchase'ı seçin
6. Tüm IAP'ları ekledikten sonra, version'ı **"Submit for Review"** ile gönderin

**Not:** İlk IAP'ı gönderdikten sonra, sonraki IAP'ları doğrudan "In-App Purchases" bölümünden gönderebilirsiniz.

### Adım 9: Sonraki IAP'lar İçin

İlk IAP'ı başarıyla gönderdikten sonra:
1. Yeni IAP'ları oluşturun (Adım 1-6)
2. **"Save"** butonuna tıklayın
3. **"Submit for Review"** butonuna tıklayın (artık version'a eklemenize gerek yok)

## Kontrol Listesi

Her in-app purchase için aşağıdakilerin tamamlandığından emin olun:

- [ ] Reference Name girildi
- [ ] Display Name (İngilizce) girildi
- [ ] Display Name (Türkçe) girildi
- [ ] Description (İngilizce) girildi
- [ ] Description (Türkçe) girildi
- [ ] Price seçildi
- [ ] Review Screenshot eklendi (opsiyonel ama önerilir)
- [ ] Review Notes eklendi (opsiyonel ama önerilir)
- [ ] Promotional Image eklendi (opsiyonel)

## Önemli Notlar

1. **Consumable vs Non-Consumable**: Bu ürünler tekrar satın alınabilir olduğu için **"Consumable"** olarak işaretlenmelidir.

2. **Subscription Değil**: Bu ürünler abonelik değil, tek seferlik kredi paketleridir.

3. **Localization**: Hem İngilizce hem de Türkçe için tüm bilgileri doldurmanız önerilir.

4. **Review Process**: İlk kez in-app purchase eklediğinizde, Apple bunları da inceleyecektir. Bu nedenle review screenshot ve notes eklemek süreci hızlandırabilir.

## Sorun Giderme

### "Your first in-app purchase must be submitted with a new app version" Hatası

Bu hata, ilk IAP'ınızı doğrudan "Submit for Review" ile göndermeye çalıştığınızda görünür.

**Çözüm:**
1. IAP'ı oluşturun ve **"Save"** yapın (henüz submit etmeyin)
2. **"App Store"** → **"iOS App"** → Yeni bir version oluşturun
3. Version sayfasında **"In-App Purchases and Subscriptions"** bölümüne gidin
4. IAP'ınızı bu bölüme ekleyin
5. Version'ı **"Submit for Review"** ile gönderin

### "Missing Metadata" Hatası

Eğer hala "Missing Metadata" hatası alıyorsanız:

1. Her dil için tüm alanların doldurulduğundan emin olun
2. Price seçildiğinden emin olun
3. Reference Name'in benzersiz olduğundan emin olun
4. Product ID formatının doğru olduğundan emin olun (örn: `com.mekanizma.modli.basic`)
5. Sayfayı yenileyin ve tekrar kontrol edin

## İletişim

Sorun devam ederse, App Store Connect Support ile iletişime geçebilirsiniz.

