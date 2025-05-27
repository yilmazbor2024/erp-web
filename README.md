# ERP Mobile Web

ERP sisteminin mobil web uygulaması.

## Teknolojiler

- React 18
- TypeScript
- Material-UI
- Zustand (State yönetimi)
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
  ├── components/     # Yeniden kullanılabilir bileşenler
  ├── pages/         # Sayfa bileşenleri
  ├── services/      # API servisleri
  ├── stores/        # Zustand store'ları
  ├── styles/        # CSS stilleri
  └── utils/         # Yardımcı fonksiyonlar
```

## Özellikler

- Türkçe arayüz
- JWT tabanlı kimlik doğrulama
- Responsive tasarım
- Offline çalışabilme
- Push bildirimler
- Ürün yönetimi ve fiyat listesi görüntüleme
- Göreceli URL yapısı ile gelişmiş routing

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
