# 📱 Icon (Görsel) Gereksinimleri - Süre Takip Uygulaması

## Klasör Yapısı
Önce proje kök dizininde `icons` adında bir klasör oluşturun:
```
Süre/
  ├── icons/
  ├── index.html
  ├── manifest.json
  └── service-worker.js
```

## Gerekli Icon Dosyaları ve Boyutları

### 1. Android için (manifest.json'da kullanılacak)

#### `icon-192x192.png`
- **Boyut**: 192x192 piksel
- **Format**: PNG
- **Kullanım**: Android uygulama simgesi (düşük çözünürlük)
- **Not**: Maskable icon olabilir (kenarlarda güvenli alan bırakın)

#### `icon-512x512.png`
- **Boyut**: 512x512 piksel
- **Format**: PNG
- **Kullanım**: Android uygulama simgesi (yüksek çözünürlük)
- **Not**: Maskable icon olabilir (kenarlarda güvenli alan bırakın)

### 2. iOS için

#### `apple-touch-icon.png`
- **Boyut**: 180x180 piksel
- **Format**: PNG
- **Kullanım**: iOS home screen icon
- **Not**: iOS cihazlarda ana ekrana eklerken kullanılır

### 3. Favicon için (Tarayıcı sekmesi simgesi)

#### `favicon-32x32.png`
- **Boyut**: 32x32 piksel
- **Format**: PNG
- **Kullanım**: Modern tarayıcılar için favicon (sekme simgesi)
- **Not**: Tarayıcı sekmesinde görünen küçük icon

#### `favicon-16x16.png`
- **Boyut**: 16x16 piksel
- **Format**: PNG
- **Kullanım**: Eski tarayıcılar ve düşük çözünürlük ekranlar için
- **Not**: En küçük favicon boyutu

#### `favicon.ico`
- **Boyut**: 16x16, 32x32, 48x48 piksel (multi-size ICO)
- **Format**: ICO
- **Kullanım**: Eski tarayıcılar ve varsayılan favicon
- **Not**: Tüm boyutları içeren tek ICO dosyası (önerilir) veya 32x32 tek boyut
- **Oluşturma**: PNG'den ICO'ya dönüştürme araçları kullanılabilir (favicon.io, realfavicongenerator.net)

## Icon Tasarım Önerileri

### Renkler (Uygulamanızın renk paletinden)
- **Arka plan tonu**: #0b4251 (koyu)
- **Orta ton**: #87bbd7 (açık mavi)
- **Vurgu rengi**: #f2c864 (sarı-altın)

### Tasarım İpuçları
1. **Basit ve tanınabilir olmalı**: Küçük boyutlarda da net görünmeli
2. **Saat/Timer simgesi**: ⏱️ emoji'sinden esinlenebilir veya saat ikonu kullanabilirsiniz
3. **Kenar boşlukları**: Icon'un kenarlarından %10-15 güvenli alan bırakın (özellikle maskable icon için)
4. **Kontrast**: Koyu arka plan üzerinde açık renkli bir icon daha iyi görünür

## Icon Hazırlama Adımları

1. **Tasarım Programı**: Photoshop, Figma, GIMP veya online araçlar (Canva, etc.)
2. **Her boyut için ayrı dosya oluşturun**:
   - 192x192 px → `icon-192x192.png`
   - 512x512 px → `icon-512x512.png`
   - 180x180 px → `apple-touch-icon.png`
   - 32x32 px → `favicon-32x32.png`
   - 16x16 px → `favicon-16x16.png`
   - 16x16/32x32/48x48 px → `favicon.ico` (multi-size ICO dosyası)

3. **Export ayarları**:
   - PNG formatı
   - Saydam arka plan (transparent background) önerilir
   - Yüksek kalite (quality: 100)

4. **Dosyaları `icons/` klasörüne koyun**:
   ```
   icons/
     ├── icon-192x192.png          (Android - düşük çözünürlük)
     ├── icon-512x512.png          (Android - yüksek çözünürlük)
     ├── apple-touch-icon.png      (iOS home screen)
     ├── favicon-32x32.png         (Tarayıcı sekmesi - orta)
     ├── favicon-16x16.png         (Tarayıcı sekmesi - küçük)
     └── favicon.ico               (Tarayıcı sekmesi - varsayılan)
   ```

## Test Etme

### Favicon Testi:
1. **Tarayıcı sekmesinde görünümü kontrol edin**:
   - Siteyi tarayıcıda açın (Chrome, Firefox, Safari, Edge)
   - Sekme sekmesinde favicon'un göründüğünü kontrol edin
   - Eğer görünmüyorsa, tarayıcıyı hard refresh yapın (Ctrl+F5 veya Cmd+Shift+R)

2. **Favicon görünmüyorsa**:
   - `icons/` klasöründe dosyaların olduğundan emin olun
   - Dosya isimlerinin tamamen doğru olduğunu kontrol edin
   - Tarayıcı cache'ini temizleyip tekrar deneyin

### Android'de test:
1. Chrome'da uygulamayı açın
2. Menü > "Ana ekrana ekle" veya "Add to Home Screen"
3. Icon'un doğru göründüğünü kontrol edin

### iOS'ta test:
1. Safari'de uygulamayı açın
2. Paylaş butonu (kare içinde ok) > "Ana Ekrana Ekle"
3. Icon'un doğru göründüğünü kontrol edin

## Örnek Icon Tasarım Fikirleri

- ⏱️ Saat ikonu (analog veya dijital)
- ⏰ Timer ikonu
- 📊 Grafik + saat kombinasyonu
- 🎯 Hedef + zaman kombinasyonu

---

## 📋 Özet - Gerekli Tüm Dosyalar

Toplam **6 icon dosyası** hazırlamanız gerekiyor:

1. ✅ `icon-192x192.png` (192x192 px) - Android
2. ✅ `icon-512x512.png` (512x512 px) - Android  
3. ✅ `apple-touch-icon.png` (180x180 px) - iOS
4. ✅ `favicon-32x32.png` (32x32 px) - Tarayıcı sekmesi
5. ✅ `favicon-16x16.png` (16x16 px) - Tarayıcı sekmesi
6. ✅ `favicon.ico` (multi-size ICO) - Tarayıcı sekmesi (varsayılan)

**Not**: 
- Icon'ları hazırladıktan sonra `icons/` klasörüne ekleyin ve uygulamayı yenileyin!
- Favicon.ico dosyası için PNG dosyalarınızı ICO formatına dönüştürebilirsiniz (favicon.io, realfavicongenerator.net)

