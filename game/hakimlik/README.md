# 🏛️ Hukuk Sınav Takip Sistemi

Modern ve kullanıcı dostu bir hukuk sınav sonuç takip uygulaması. PWA (Progressive Web App) özellikleri ile mobil cihazlarda uygulama gibi çalışır.

## ✨ Özellikler

- 📊 **Sınav Sonuç Takibi**: Her ders için doğru/yanlış sayısı girişi
- 📈 **Detaylı Analiz**: Ders bazında ve genel başarı oranları
- 💾 **Veri Saklama**: LocalStorage ile güvenli veri saklama
- 📱 **Mobil Uyumlu**: Responsive tasarım ile tüm cihazlarda mükemmel görünüm
- 🔧 **PWA Desteği**: Ana ekrana eklenebilir, offline çalışabilir

## 🚀 Kurulum

### Gereksinimler
- Modern web tarayıcısı (Chrome, Firefox, Safari, Edge)
- HTTPS bağlantısı (PWA özellikleri için)

### Adımlar
1. Dosyaları web sunucunuza yükleyin
2. `manifest.json` dosyasındaki URL'leri güncelleyin
3. `sw.js` dosyasındaki cache URL'lerini kontrol edin
4. Icons klasörünü oluşturun ve gerekli ikonları ekleyin

## 📱 PWA Özellikleri

### Ana Ekrana Ekleme
- **Android**: Chrome'da "Ana ekrana ekle" seçeneği
- **iOS**: Safari'de "Paylaş" > "Ana ekrana ekle"
- **Desktop**: Chrome'da adres çubuğundaki kurulum ikonu

### Offline Çalışma
- Service Worker ile cache desteği
- Temel dosyalar offline'da erişilebilir
- Veriler LocalStorage'da saklanır

## 🎨 Icons Gereksinimleri

Aşağıdaki boyutlarda PNG ikonlar gerekli:

```
icons/
├── icon-16x16.png
├── icon-32x32.png
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-180x180.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

## 🔧 Teknik Detaylar

### Dosya Yapısı
```
/
├── index.html          # Ana HTML dosyası
├── style.css           # CSS stilleri
├── script.js           # JavaScript mantığı
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── browserconfig.xml   # Windows tile config
├── icons/             # Uygulama ikonları
└── README.md          # Bu dosya
```

### PWA Gereksinimleri
- ✅ Manifest dosyası
- ✅ Service Worker
- ✅ HTTPS bağlantısı
- ✅ Responsive tasarım
- ✅ App-like deneyim

## 📊 Kullanım

1. **Sınav Başlat**: Sınav adı, tarih ve toplam soru sayısını girin
2. **Sonuç Girişi**: Her ders için doğru/yanlış sayılarını girin
3. **Analiz**: Otomatik hesaplanan başarı oranlarını görün
4. **Kaydet**: Sınav sonuçlarını güvenle saklayın
5. **Takip**: Geçmiş sınavları ve gelişiminizi analiz edin

## 🌐 Tarayıcı Desteği

- **Chrome**: Tam PWA desteği
- **Firefox**: Tam PWA desteği
- **Safari**: Temel PWA desteği
- **Edge**: Tam PWA desteği

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📞 İletişim

Sorularınız için issue açabilir veya pull request gönderebilirsiniz.

---

**Not**: PWA özelliklerinin tam olarak çalışması için HTTPS bağlantısı gereklidir. Localhost'ta test ederken bazı özellikler çalışmayabilir.
