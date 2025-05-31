# ERP Mobile Web

ERP sisteminin mobil web uygulaması.

## Teknolojiler

- React 18
- TypeScript
- Ant Design (antd)
- Axios
- React Router
- PWA desteği

## Başlangıç

1. Gereksinimleri yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm start
```

Uygulama varsayılan olarak http://localhost:3000 adresinde çalışacaktır.

## Proje Yapısı

```
src/
  ├─ components/     # Yeniden kullanılabilir bileşenler
  ├─ pages/         # Sayfa bileşenleri
  ├─ services/      # API servisleri
  ├─ stores/        # State yönetimi
  ├─ styles/        # CSS stilleri
  └─ utils/         # Yardımcı fonksiyonlar
```

## Özellikler

- Türkçe arayüz
- JWT tabanlı kimlik doğrulama
- Responsive tasarım
- Offline çalışabilme
- Ürün yönetimi ve fiyat listesi görüntüleme
- Fatura oluşturma ve yönetimi
- Barkod tarama ve ürün arama

## Son Güncellemeler

### 31 Mayıs 2025
- Barkod arama input alanı arama yapıldıktan sonra otomatik olarak temizleniyor
- "Tüm Varyantları Ekle" butonu form içine alındı ve taşma sorunu giderildi
- Butonlar daha kompakt hale getirildi

### Önceki Güncellemeler
- Ürün varyantları tablosunda "Ekle" butonu en başa alındı
- "Ürün Açıklaması" sütunu %20 daraltıldı
- Form bağlantı hataları giderildi

## Build

Production build için:
```bash
npm run build
```

## Test

Unit testleri çalıştırmak için:
```bash
npm test
```
