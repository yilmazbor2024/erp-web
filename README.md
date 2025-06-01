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
- Gelişmiş döviz kuru entegrasyonu
  - TCMB ve SPYS kaynaklarından döviz kuru çekme
  - Tarih ve para birimine göre otomatik kur güncelleme
  - TL karşılığı hesaplama
- Barkod tarama ve ürün arama
  - Barkod modalı ile hızlı ürün ekleme
  - Stok bilgisi görüntüleme
  - Toplu fiyat güncelleme

## Son Güncellemeler

### 1 Haziran 2025
- **Fatura Formu Döviz Kuru İyileştirmeleri:**
  - Para birimi TRY olduğunda TL karşılığı otomatik olarak 1 olarak ayarlanıyor
  - Para birimi boş veya null olduğunda TL karşılığı 0 olarak ayarlanıyor
  - Döviz kuru kaynağı (TCMB/SPYS) seçimi için UI butonları kaldırıldı, arka planda mantık korundu
  - Kur değişikliklerini izleyen useEffect hookları eklendi ve optimize edildi
  - API hataları ve null/undefined yanıtlar için güvenli kontroller eklendi

- **Barkod Modal Entegrasyonu:**
  - Barkod Modal'dan faturaya satır eklerken güncel para birimi kontrolü eklendi
  - Satırlar eklendiğinde güncel döviz kuru kullanılarak TL karşılığı hesaplanıyor
  - Barkod Modal kapatıldığında tüm ilgili state'ler sıfırlanarak temiz bir başlangıç sağlanıyor
  - Toplamlar güncel para birimine göre doğru şekilde güncelleniyor

- **UI İyileştirmeleri:**
  - Para Birimi (Currency) seçici genişliği %100 olarak ayarlandı
  - Kur Kaynağı ve TL Karşılığı girdileri yan yana %50-%50 genişlikte yerleştirildi
  - TL Karşılığı giriş alanı genişliği %20 artırıldı ve metin sola hizalandı
  - Responsive tasarım için Ant Design grid sistemi kullanıldı

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
