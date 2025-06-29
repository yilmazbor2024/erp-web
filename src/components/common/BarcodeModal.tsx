import React, { useRef, useEffect, ReactNode, useState } from 'react';
import { Modal, Input, Button, Table, InputNumber, Row, Col, Space, Typography, Spin, Empty, message, Tag, Switch, Tooltip } from 'antd';
import { ScanOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, EditOutlined, CameraOutlined, CloseOutlined } from '@ant-design/icons';
import BarcodeScanner from './BarcodeScanner';
import BarcodePerformanceMetrics from './BarcodePerformanceMetrics';
import { ProductVariant } from '../../services/productApi';
import { InventoryStock, InventorySearchParams } from '../../services/inventoryApi';
import inventoryApi from '../../services/inventoryApi';
import type { InputRef } from 'antd/lib/input';
import type { ColumnsType } from 'antd/lib/table';

const { Title, Text } = Typography;

interface ScannedItem {
  variant: ProductVariant;
  quantity: number;
}

interface BarcodeModalProps {
  open: boolean;
  onClose: () => void;
  barcodeInput: string;
  setBarcodeInput: (value: string) => void;
  onSearch: (barcode: string) => void;
  onSearchByProductCodeOrDescription?: (searchText: string) => void; // Ürün kodu veya açıklaması ile arama için yeni prop
  loading: boolean;
  productVariants: ProductVariant[];
  setProductVariants: (variants: ProductVariant[]) => void;
  inputRef: React.RefObject<InputRef>;
  scannedItems: ScannedItem[];
  setScannedItems: (items: ScannedItem[]) => void; // ScannedItems state'ini güncellemek için eklendi
  addAllToInvoice: () => void;
  isPriceIncludeVat: boolean;
  getProductPrice: (variant: ProductVariant) => Promise<void>;
  inventoryStock: InventoryStock[] | null;
  loadingInventory: boolean;
  removeScannedItem: (index: number) => void;
  removeAllScannedItems: () => void;
  updateScannedItemQuantity: (index: number, quantity: number) => void;
  updateScannedItemPrice: (index: number, price: number) => void;
  currencyCode?: string; // Para birimi kodu
  taxTypeMode?: string; // Vergi tipi modu (vergili/vergisiz)
}

const BarcodeModal: React.FC<BarcodeModalProps> = ({
  open,
  onClose,
  barcodeInput,
  setBarcodeInput,
  onSearch,
  onSearchByProductCodeOrDescription,
  loading,
  productVariants,
  setProductVariants,
  inputRef,
  scannedItems,
  setScannedItems,
  addAllToInvoice,
  isPriceIncludeVat,
  getProductPrice,
  inventoryStock,
  loadingInventory,
  removeScannedItem,
  removeAllScannedItems,
  updateScannedItemQuantity,
  updateScannedItemPrice,
  currencyCode,
  taxTypeMode = 'vergili',
}) => {
  // Kamera tarama modunu kontrol etmek için state
  const [isScannerActive, setIsScannerActive] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'barcode' | 'qr'>('barcode');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [bulkVatRate, setBulkVatRate] = useState<number>(taxTypeMode === 'vergisiz' ? 0 : 10); // Vergi tipine göre varsayılan KDV oranı
  
  // Mobil cihaz kontrolü için state
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  
  // Son taranan barkodu takip etmek için ref
  const lastScannedBarcode = useRef<{ barcode: string; timestamp: number } | null>(null);
  
  // Vergi tipi değiştiğinde KDV oranını güncelle
  useEffect(() => {
    if (taxTypeMode === 'vergisiz') {
      setBulkVatRate(0);
      
      // Tüm taranan ürünlerin KDV oranını 0 yap
      if (scannedItems.length > 0) {
        const updatedItems = scannedItems.map(item => ({
          ...item,
          variant: {
            ...item.variant,
            vatRate: 0
          }
        }));
        setScannedItems(updatedItems);
      }
      
      // Bulunan ürünlerin KDV oranını 0 yap
      if (productVariants.length > 0) {
        const updatedVariants = productVariants.map(variant => ({
          ...variant,
          vatRate: 0
        }));
        setProductVariants(updatedVariants);
      }
    }
  }, [taxTypeMode]);
  const [searchByProduct, setSearchByProduct] = useState<boolean>(false); // false: barkod/varyant ile arama, true: ürün kodu/açıklaması ile arama
  const [localInventoryStock, setLocalInventoryStock] = useState<InventoryStock[]>([]);
  const [localLoadingInventory, setLocalLoadingInventory] = useState<boolean>(false);
  const [fetchStock, setFetchStock] = useState<boolean>(false); // Stok bilgisi getirme seçeneği - varsayılan kapalı
  const [fetchPrice, setFetchPrice] = useState<boolean>(false); // Fiyat bilgisi getirme seçeneği - varsayılan kapalı
  
  // Ekran boyutunu izle
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Modal kapatıldığında kamera taramayı durdur
  useEffect(() => {
    if (!open && isScannerActive) {
      setIsScannerActive(false);
    }
  }, [open, isScannerActive]);
  
  // Performans metrikleri için state'ler
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [scanCount, setScanCount] = useState<number>(0);
  const [averageScanTime, setAverageScanTime] = useState<number>(0);
  const [scanTimes, setScanTimes] = useState<number[]>([]);
  const [dbFetchTimes, setDbFetchTimes] = useState<number[]>([]);
  const [uiRenderTimes, setUiRenderTimes] = useState<number[]>([]);
  const [scansPerSecond, setScansPerSecond] = useState<number>(0);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState<boolean>(false);
  
  // Toplu fiyat güncelleme fonksiyonu
  const updateAllPrices = () => {
    if (bulkPrice === null) {
      message.error('Lütfen geçerli bir fiyat girin');
      return;
    }

    // KDV dahil fiyat girilmişse, KDV hariç fiyata çevir
    let newPrice = bulkPrice;
    if (isPriceIncludeVat) {
      newPrice = bulkPrice / (1 + (bulkVatRate / 100));
    }

    // 1. Tüm taranan ürünlerin yeni fiyat ve KDV oranlarını içeren bir kopya oluştur
    const updatedScannedItems = scannedItems.map(item => ({
      ...item,
      variant: {
        ...item.variant,
        salesPrice1: newPrice,
        vatRate: bulkVatRate
      }
    }));
    
    // Yeni oluşturulan listeyi state'e kaydet
    setScannedItems(updatedScannedItems);
    
    // 2. Bulunan ürün tablosundaki satırların (productVariants) fiyatını güncelle
    const updatedVariants = productVariants.map(variant => ({
      ...variant,
      salesPrice1: newPrice,
      vatRate: bulkVatRate
    }));
    
    // Güncellenmiş varyantları state'e kaydet
    setProductVariants([...updatedVariants]);

    // console.log('Toplu fiyat güncelleme yapıldı:', updatedScannedItems);
    message.success('Tüm ürünlerin fiyatları güncellendi');
  };
  // Modal açıldığında input'a odaklan
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, inputRef]);
  
  // Ürün varyantları değiştiğinde stok verilerini yükle
  useEffect(() => {
    if (productVariants.length > 0) {
      const firstVariant = productVariants[0];
      // console.log("productVariants değişti, stok verilerini yükleniyor:", firstVariant.productCode);
      
      // Ürün kodu ile stok verilerini yükle
      loadInventoryStock({
        productCode: firstVariant.productCode,
        showOnlyPositiveStock: true
      }).then(stockData => {
        // console.log("Stok verileri yüklendi ve state güncellendi:", stockData);
        // Stok verileri yüklendi, forceUpdate yerine doğrudan render edilmesini bekliyoruz
      });
    }
  }, [productVariants]);

  // Enter tuşuna basıldığında arama yap
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Stok verilerini yükle
  const loadInventoryStock = async (params: {
    barcode?: string;
    productCode?: string;
    colorCode?: string;
    itemDim1Code?: string;
    showOnlyPositiveStock?: boolean;
  }) => {
    // Eğer stok getirme seçeneği işaretli değilse, boş dizi döndür
    if (!fetchStock) {
      // console.log('Stok getirme seçeneği kapalı, stok verileri yüklenmeyecek');
      return [];
    }
    
    setLocalLoadingInventory(true);
    // console.log('Stok verileri yükleniyor:', params);
    
    try {
      const stockData = await inventoryApi.getInventoryStock(params);
      // console.log('Yüklenen stok verileri:', stockData);
      
      // Stok verilerini state'e kaydet
      setLocalInventoryStock(stockData);
      
      return stockData;
    } catch (error) {
      console.error('Stok verileri yüklenirken hata oluştu:', error);
      message.error('Stok verileri yüklenirken bir hata oluştu');
      return [];
    } finally {
      setLocalLoadingInventory(false);
    }
  };

  // Performans metriklerini sıfırla
  const resetPerformanceMetrics = () => {
    setScanStartTime(null);
    setLastScanTime(null);
    setScanCount(0);
    setAverageScanTime(0);
    setScanTimes([]);
    setDbFetchTimes([]);
    setUiRenderTimes([]);
    setScansPerSecond(0);
  };
  
  // Performans metriklerini güncelle
  const updatePerformanceMetrics = (dbFetchTime: number, uiRenderTime: number) => {
    const now = performance.now();
    const newScanCount = scanCount + 1;
    setScanCount(newScanCount);
    
    // İlk tarama ise başlangıç zamanını ayarla
    if (scanStartTime === null) {
      setScanStartTime(now);
    }
    
    // Son tarama zamanından bu yana geçen süre
    if (lastScanTime !== null) {
      const timeBetweenScans = now - lastScanTime;
      const newScanTimes = [...scanTimes, timeBetweenScans];
      setScanTimes(newScanTimes);
      
      // Ortalama tarama süresini hesapla
      const avgTime = newScanTimes.reduce((sum, time) => sum + time, 0) / newScanTimes.length;
      setAverageScanTime(avgTime);
      
      // Saniyedeki tarama sayısını hesapla
      if (scanStartTime !== null) {
        const totalElapsedTime = (now - scanStartTime) / 1000; // saniye cinsinden
        const scansPerSec = newScanCount / totalElapsedTime;
        setScansPerSecond(scansPerSec);
      }
    }
    
    // Veritabanı ve UI render sürelerini kaydet
    setDbFetchTimes([...dbFetchTimes, dbFetchTime]);
    setUiRenderTimes([...uiRenderTimes, uiRenderTime]);
    
    // Son tarama zamanını güncelle
    setLastScanTime(now);
  };

  // Arama işlemini gerçekleştir
  const handleSearch = async () => {
    if (isSearching) return; // Zaten arama yapılıyorsa çık
    
    setIsSearching(true);
    
    if (!barcodeInput.trim()) {
      setIsSearching(false);
      return;
    }
    
    const searchStartTime = performance.now(); // Arama başlangıç zamanı
    
    try {
      // Doğrudan seçilen moda göre arama yap
      if (searchByProduct) {
        // Ürün kodu veya açıklaması ile arama
        
        const dbStartTime = performance.now();
        // Ürün kodu ile stok verilerini yükle
        const stockData = await loadInventoryStock({ 
          productCode: barcodeInput.trim(),
          showOnlyPositiveStock: true 
        });
        const dbEndTime = performance.now();
        const dbFetchTime = dbEndTime - dbStartTime;
        
        // State güncellemesinin tamamlanması için küçük bir gecikme
        const uiStartTime = performance.now();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (onSearchByProductCodeOrDescription) {
          onSearchByProductCodeOrDescription(barcodeInput);
        }
        const uiEndTime = performance.now();
        const uiRenderTime = uiEndTime - uiStartTime;
        
        // Performans metriklerini güncelle
        updatePerformanceMetrics(dbFetchTime, uiRenderTime);
      } else {
        // Barkod ile arama - Barkod formatını kontrol et
        
        // Barkod formatını kontrol et - daha esnek bir format kontrolü
        const cleanBarcode = barcodeInput.trim();
        const isNumeric = /^\d+$/.test(cleanBarcode);
        // Özel durumlar için 8-14 karakterli barkodlar geçerli olmalı
        const isValidBarcode = isNumeric && (cleanBarcode.length >= 8 && cleanBarcode.length <= 14);
        
        if (isValidBarcode || cleanBarcode.includes('-')) {
          // Geçerli barkod formatı - önce stok verilerini yükle
          if (fetchStock) {
            setLocalLoadingInventory(true);
            const dbStartTime = performance.now();
            
            let stockData;
            if (isValidBarcode) {
              // Barkod ile stok verilerini yükle
              stockData = await loadInventoryStock({ barcode: cleanBarcode });
            } else {
              // Varyant kodu olabilir - Format: URUNCODE-RENKKODU-BEDENKODU
              const parts = cleanBarcode.split('-');
              const productCode = parts[0].trim();
              const colorCode = parts.length >= 2 ? parts[1].trim() : '';
              const itemDim1Code = parts.length >= 3 ? parts[2].trim() : '';
              
              // Varyant parametreleri ile stok verilerini yükle
              stockData = await loadInventoryStock({
                productCode: productCode,
                colorCode: colorCode || undefined,
                itemDim1Code: itemDim1Code || undefined,
                showOnlyPositiveStock: true
              });
            }
            
            const dbEndTime = performance.now();
            const dbFetchTime = dbEndTime - dbStartTime;
            
            setLocalLoadingInventory(false);
            
            const uiStartTime = performance.now();
            // UI güncelleme işlemleri
            const uiEndTime = performance.now();
            const uiRenderTime = uiEndTime - uiStartTime;
            
            // Performans metriklerini güncelle
            updatePerformanceMetrics(dbFetchTime, uiRenderTime);
          }
          
          // State güncellemesinin tamamlanması için küçük bir gecikme
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Ürün varyantlarını ara ve ekle
          if (onSearch) {
            onSearch(cleanBarcode);
            
            // onSearch fonksiyonu çağrıldıktan sonra kısa bir süre bekle
            // Bu, productVariants state'inin güncellenmesi için zaman tanır
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Eğer ürün varyantları bulunduysa ve eklenen ürünler listesinde yoksa ekle
            if (productVariants.length > 0) {
              const foundVariant = productVariants.find(variant => 
                variant.barcode === cleanBarcode || 
                variant.productCode === cleanBarcode.split('-')[0]
              );
              
              if (foundVariant) {
                // Ürün zaten eklenen ürünler listesinde var mı kontrol et
                const existingItemIndex = scannedItems.findIndex(item => 
                  item.variant.barcode === foundVariant.barcode || 
                  item.variant.productCode === foundVariant.productCode
                );
                
                if (existingItemIndex !== -1) {
                  // Zaten eklenen ürün varsa miktarını artır
                  const updatedItems = [...scannedItems];
                  updatedItems[existingItemIndex].quantity += 1;
                  setScannedItems(updatedItems);
                } else {
                  // Yeni ürün ekle
                  const newItem: ScannedItem = {
                    variant: foundVariant,
                    quantity: 1
                  };
                  setScannedItems([...scannedItems, newItem]);
                }
              }
            }
          }
        } else {
          // Geçersiz barkod formatı
          setIsSearching(false);
        }
      }
    } catch (error) {
      console.error('Arama sırasında hata oluştu:', error);
    } finally {
      setIsSearching(false);
      // Input alanını temizle
      setBarcodeInput('');
    }
  };
  
  // Kamera ile barkod tarama işlemi
  const handleBarcodeScan = (barcode: string) => {
    if (!barcode || barcode.trim() === '') return;
    
    // Zaten arama yapılıyorsa veya işlem devam ediyorsa çık
    if (isSearching) return;
    
    const cleanBarcode = barcode.trim();
    
    // Barkod format kontrolü - daha esnek bir yaklaşım
    const isNumeric = /^\d+$/.test(cleanBarcode);
    const isValidLength = cleanBarcode.length >= 8 && cleanBarcode.length <= 14;
    
    // Geçersiz barkod formatı ise işlemi sonlandır
    if (!isNumeric && !cleanBarcode.includes('-')) {
      return;
    }
    
    const now = Date.now();
    const lastScan = lastScannedBarcode.current;
    
    // Aynı barkodu kısa süre içinde tekrar taramayı önle (300ms - daha hızlı tarama için)
    if (!lastScan || lastScan.barcode !== cleanBarcode || (now - lastScan.timestamp) > 300) {
      lastScannedBarcode.current = { barcode: cleanBarcode, timestamp: now };
      
      // 1. Öncelikle eklenen ürünler tablosunda kontrol et
      const existingItemIndex = scannedItems.findIndex(item => 
        item.variant.barcode === cleanBarcode || 
        item.variant.productCode === cleanBarcode.split('-')[0]
      );
      
      if (existingItemIndex !== -1) {
        // Zaten eklenen ürün varsa miktarını artır
        const updatedItems = [...scannedItems];
        updatedItems[existingItemIndex].quantity += 1;
        setScannedItems(updatedItems);
        return; // İşlem tamamlandı
      }
      
      // 2. Bulunan ürünler tablosunda kontrol et
      const existingVariant = productVariants.find(variant => 
        variant.barcode === cleanBarcode || 
        variant.productCode === cleanBarcode.split('-')[0]
      );
      
      if (existingVariant) {
        // Bulunan ürünler tablosunda varsa, eklenen ürünlere ekle
        const newItem: ScannedItem = {
          variant: existingVariant,
          quantity: 1
        };
        setScannedItems([...scannedItems, newItem]);
        return; // İşlem tamamlandı
      }
      
      // 3. Hiçbir yerde yoksa, yeni barkod olarak ara
      setBarcodeInput(cleanBarcode);
      // Önceki arama tamamlanmadan yeni arama başlatma
      if (!isSearching) {
        handleSearch();
      }
    }
  };
  
  // Kamera tarama işlemi tamamlandığında
  const handleScanComplete = () => {
    // Tarama tamamlandı, ancak kamerayı açık tut
    setIsSearching(false);
    
    // Barkod tarama işlemi tamamlandığında, son taranan barkod bilgisini güncelle
    // Böylece arka arkaya aynı barkod okunduğunda, önceki işlem tamamlanmadan yeni işlem başlamaz
    if (lastScannedBarcode.current && lastScannedBarcode.current.barcode) {
      lastScannedBarcode.current.timestamp = Date.now();
    }
  };
  
  // Kaynakları temizleme fonksiyonu
  const cleanupResources = () => {
    setIsScannerActive(false);
    setIsSearching(false);
    setBarcodeInput('');
    resetPerformanceMetrics();
  };

  // Force update için özel hook
  const useForceUpdate = () => {
    const [, setValue] = useState(0);
    return () => setValue(value => value + 1);
  };
  
  // Force update fonksiyonu
  const forceUpdate = useForceUpdate();
  
  // Stok verilerini izle ve değiştiğinde yeniden render et
  useEffect(() => {
    if (localInventoryStock && localInventoryStock.length > 0) {
      // console.log('Stok verileri değişti, yeniden render ediliyor');
      forceUpdate();
    }
  }, [localInventoryStock]);
  
  // Stok miktarını bul - düzeltilmiş implementasyon
  const getStockQuantity = (variant: ProductVariant): ReactNode => {
    // Yükleme durumunda spinner göster
    if (localLoadingInventory || loadingInventory) {
      return <Spin size="small" />;
    }
    
    // Hem local hem de props'tan gelen stok verilerini birleştir
    const stockData = [...(localInventoryStock || []), ...(inventoryStock || [])];
    

    
    // Önce barkod ile eşleşme ara
    let stock = variant.barcode && stockData.find(s => 
      s.usedBarcode === variant.barcode
    );
    
    // Barkod ile eşleşme yoksa, tam varyant bilgileri ile ara
    if (!stock) {
      stock = stockData.find(s => 
        s.itemCode === variant.productCode && 
        s.colorCode === variant.colorCode && 
        s.itemDim1Code === variant.itemDim1Code
      );
    }
    
    // Hala eşleşme yoksa, sadece ürün kodu ile ara
    if (!stock) {
      stock = stockData.find(s => 
        s.itemCode === variant.productCode
      );
    }
    
    // console.log('getStockQuantity - Bulunan stok:', stock);
    
    // Stok miktarını göster
    return (
      <Tag color={stock && stock.qty > 0 ? 'green' : 'red'}>
        {stock ? stock.qty.toFixed(2) : '0.00'}
      </Tag>
    );
  };
  
  // Bulunan tüm varyantları listeye ekle
  const addAllVariantsToList = async () => {
    if (productVariants.length === 0) return;
    
    try {
      // Tüm varyantları sırayla ekle
      for (const variant of productVariants) {
        // Fiyat getirme seçeneği işaretliyse fiyat bilgisini getir
        if (fetchPrice) {
          await getProductPrice(variant);
        }
      }
      // Ürün eklendi mesajı kaldırıldı
    } catch (error) {
      console.error('Varyantlar eklenirken hata oluştu:', error);
      // message.error('Ürünler eklenirken bir hata oluştu.');
    }
  };

  return (
    <Modal
      title=" "
      closeIcon={<CloseOutlined />}
      open={open}
      onCancel={onClose}
      width={isMobile ? '100%' : 1000}
      style={{ 
        top: isMobile ? 0 : 100,
      }}
      styles={{
        body: { 
          padding: isMobile ? '0 8px 8px' : '0 24px 24px',
          maxHeight: isMobile ? 'calc(100vh - 120px)' : 'auto',
          overflowY: 'auto',
          background: '#fff'
        },
        content: {
          padding: '20px 0px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
        },
        mask: {
          backdropFilter: 'blur(4px)'
        }
      }}
      footer={null}
      destroyOnClose
      maskClosable={false}
      afterOpenChange={(visible) => {
        if (visible && inputRef.current) {
          // Modal açıldığında input'a odaklan
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        } else {
          // Modal kapandığında kaynakları temizle
          cleanupResources();
        }
      }}
    >
      {/* Kamera Kontrol Bölümü */}
      <div style={{
        border: '2px solid #fa8c16',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '16px',
        marginBottom: '16px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
      }}>
        <div style={{
          borderBottom: '2px solid #fa8c16',
          marginBottom: '16px',
          paddingBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fff7e6'
        }}>
          <Title level={5} style={{ margin: 0, color: '#fa8c16', fontWeight: 'bold' }}>Kamera Kontrolleri</Title>
          
          <Space>
            <Tooltip title={isScannerActive ? "Kamerayı kapat" : "Kamera ile barkod okut"}>
              <Button
                type={isScannerActive ? "primary" : "default"}
                icon={<CameraOutlined />}
                onClick={() => setIsScannerActive(!isScannerActive)}
                disabled={loading || isSearching}
              >
                {!isMobile && (isScannerActive ? "Kamerayı Kapat" : "Barkod Tara")}
              </Button>
            </Tooltip>
            <Tooltip title="Tarama Modu Değiştir">
              <Button
                icon={scanMode === 'barcode' ? <ScanOutlined /> : <SearchOutlined />}
                onClick={() => {
                  setScanMode(scanMode === 'barcode' ? 'qr' : 'barcode');
                  if (isScannerActive) {
                    setIsScannerActive(false);
                    setTimeout(() => setIsScannerActive(true), 100);
                  }
                }}
              >
                {!isMobile && (scanMode === 'barcode' ? "Barkod" : "QR Kod")}
              </Button>
            </Tooltip>
            
            <Switch
              checked={searchByProduct}
              onChange={(checked) => setSearchByProduct(checked)}
              checkedChildren="Ürün Kodu/Açıklaması"
              unCheckedChildren="Barkod/Varyant"
              style={{ width: isMobile ? 140 : 180 }}
            />
            {!isMobile && (
              <Text>{searchByProduct ? "Ürün Kodu/Açıklaması ile Ara" : "Barkod ile Ara"}</Text>
            )}
          </Space>
        </div>
        
        {/* Kamera tarama alanı */}
        {isScannerActive && (
          <div style={{ marginBottom: 8 }}>
            <BarcodeScanner
              onScan={handleBarcodeScan}
              isScanning={isScannerActive}
              onScanComplete={handleScanComplete}
              initialScanMode={scanMode}
              height={isMobile ? '200px' : '250px'}
              clearInput={true}
            />
          </div>
        )}
      </div>

      {!isMobile && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Space>
              <Switch
                checked={fetchStock}
                onChange={setFetchStock}
              />
              <Text>Stok Bilgisi Getir</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <Switch
                checked={fetchPrice}
                onChange={setFetchPrice}
              />
              <Text>Fiyat Bilgisi Getir</Text>
            </Space>
          </Col>
        </Row>
      )}

      {/* Performans metrikleri butonu */}
      {scanCount > 0 && !searchByProduct && (
        <div style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            size="small"
            icon={<ScanOutlined />}
            onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
            style={{ marginBottom: 8 }}
          >
            {showPerformanceMetrics ? "Performans Metriklerini Gizle" : "Performans Metriklerini Göster"}
          </Button>
          
          {showPerformanceMetrics && (
            <BarcodePerformanceMetrics
              scanCount={scanCount}
              averageScanTime={averageScanTime}
              scansPerSecond={scansPerSecond}
              dbFetchTimes={dbFetchTimes}
              uiRenderTimes={uiRenderTimes}
            />
          )}
        </div>
      )}
      
      
      
      {/* Barkod Arama Bölümü */}
      <div style={{
        border: '2px solid #722ed1',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '16px',
        marginBottom: '16px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
      }}>
        <div style={{
          borderBottom: '2px solid #722ed1',
          marginBottom: '16px',
          paddingBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9f0ff'
        }}>
          <Title level={5} style={{ margin: 0, color: '#722ed1', fontWeight: 'bold' }}>Barkod Arama</Title>
        </div>
        
        <Row gutter={isMobile ? 8 : 16} style={{ marginBottom: isMobile ? 8 : 0 }}>
          <Col span={24}>
            <div style={{ display: 'flex', width: '100%', gap: '8px', position: 'relative' }}>
              <Input
                ref={inputRef}
                placeholder="Barkod girin veya okutun"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={handleKeyPress}
              style={{ width: '80%', flex: 4 }}
              prefix={<ScanOutlined />}
              disabled={loading || isScannerActive}
              autoFocus
              size={isMobile ? "large" : "middle"}
            />
            <Button 
              type="primary" 
              onClick={handleSearch}
              loading={loading}
              icon={<SearchOutlined />}
              style={{ width: '10%', flex: 1, padding: '0 8px' }}
              size={isMobile ? "large" : "middle"}
            />
            <Button 
              onClick={() => {
                setBarcodeInput('');
                setProductVariants([]);
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              icon={<DeleteOutlined />}
              style={{ width: '10%', flex: 1, padding: '0 8px' }}
              size={isMobile ? "large" : "middle"}
            />
          </div>
        </Col>
      </Row>
      </div>
      
      {/* Taranan Ürünler Başlığı - Kaldırıldı */}

      {/* Bulunan Ürünler Bölümü */}
      <div style={{ marginTop: 16 }}>
        {productVariants.length === 0 ? (
          <Empty description="Ürün bulunamadı" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{
            border: '2px solid #1890ff',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
          }}>
            <div style={{
              borderBottom: '2px solid #1890ff',
              marginBottom: '16px',
              paddingBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f0f7ff'
            }}>
              <Title level={5} style={{ margin: 0, color: '#1890ff', fontWeight: 'bold' }}>Bulunan Ürünler ({productVariants.length})</Title>
              <Space>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => {
                    // Tüm varyantları sırayla ekle
                    const addAllVariants = async () => {
                      for (const variant of productVariants) {
                        await getProductPrice(variant);
                      }
                      // Ürün eklendi mesajı kaldırıldı
                    };
                    addAllVariants();
                  }}
                  icon={<PlusOutlined />}
                  title="Tüm ürünleri ekle"
                />
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => setProductVariants([])} 
                  icon={<DeleteOutlined />}
                  title="Listeyi temizle"
                />
              </Space>
            </div>
            
            <Table
              dataSource={productVariants}
              rowKey={(record) => record.barcode || record.productCode + record.colorCode + record.itemDim1Code}
              size={isMobile ? "middle" : "small"}
              pagination={false}
              className="compact-table"
              scroll={{ y: isMobile ? 150 : 200 }}
              style={{ fontSize: isMobile ? '14px' : '12px' }}
              columns={isMobile ? [
              {
                title: 'İşlem',
                key: 'action',
                width: 60,
                render: (_: any, record: ProductVariant): ReactNode => (
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<PlusOutlined />}
                    loading={loading}
                    onClick={async () => {
                      try {
                        // Fiyat getirme seçeneği işaretliyse fiyat bilgisini getir
                        if (fetchPrice) {
                          await getProductPrice(record);
                        }
                        
                        // Ürünü taranan ürünler listesine ekle
                        const existingItemIndex = scannedItems.findIndex(
                          item => item.variant.barcode === record.barcode || 
                          (item.variant.productCode === record.productCode && 
                           item.variant.colorCode === record.colorCode && 
                           item.variant.itemDim1Code === record.itemDim1Code)
                        );
                        
                        if (existingItemIndex !== -1) {
                          // Eğer ürün zaten listede varsa, miktarını artır
                          const updatedItems = [...scannedItems];
                          updatedItems[existingItemIndex].quantity += 1;
                          setScannedItems(updatedItems);
                          message.success('Ürün miktarı güncellendi');
                        } else {
                          // Yeni ürün ekle
                          setScannedItems([...scannedItems, { variant: record, quantity: 1 }]);
                          message.success('Ürün listeye eklendi');
                        }
                      } catch (error) {
                        console.error('Ürün eklenirken hata:', error);
                        message.error('Ürün eklenirken bir hata oluştu.');
                      }
                    }}
                  />
                )
              },
              {
                title: 'Ürün Bilgileri',
                key: 'productInfo',
                render: (_, record: ProductVariant): ReactNode => (
                  <div>
                    <div><strong>{record.productCode}</strong> {record.barcode ? `(${record.barcode})` : ''}</div>
                    <div style={{fontSize: '13px'}}>{record.productDescription}</div>
                    <div style={{fontSize: '12px', color: '#666'}}>
                      {record.colorDescription ? `${record.colorDescription} / ` : ''}
                      {record.itemDim1Code || '-'}
                    </div>
                  </div>
                )
              },
              {
                title: 'Stok',
                key: 'stock',
                width: 60,
                render: (_, record: ProductVariant) => getStockQuantity(record)
              }
            ] : [
              {
                title: 'Ürün Kodu',
                dataIndex: 'productCode',
                key: 'productCode',
                width: 100
              },
              {
                title: 'Barkod',
                dataIndex: 'barcode',
                key: 'barcode',
                width: 120,
                render: (text): ReactNode => text || '-'
              },
              {
                title: 'Ürün Açıklaması',
                dataIndex: 'productDescription',
                key: 'productDescription',
                width: 200,
                ellipsis: true
              },
              {
                title: 'Renk',
                dataIndex: 'colorDescription',
                key: 'colorDescription',
                width: 80,
                render: (text): ReactNode => text || '-'
              },
              {
                title: 'Beden',
                dataIndex: 'itemDim1Code',
                key: 'itemDim1Code',
                width: 60,
                render: (text): ReactNode => text || '-'
              },
              {
                title: 'Stok',
                key: 'stock',
                width: 80,
                render: (_, record: ProductVariant) => getStockQuantity(record)
              },
              {
                title: 'İşlem',
                key: 'action',
                width: 80,
                render: (_: any, record: ProductVariant): ReactNode => (
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<PlusOutlined />}
                    loading={loading}
                    onClick={async () => {
                      try {
                        // Fiyat getirme seçeneği işaretliyse fiyat bilgisini getir
                        if (fetchPrice) {
                          await getProductPrice(record);
                        }
                        
                        // Ürünü taranan ürünler listesine ekle
                        const existingItemIndex = scannedItems.findIndex(
                          item => item.variant.barcode === record.barcode || 
                          (item.variant.productCode === record.productCode && 
                           item.variant.colorCode === record.colorCode && 
                           item.variant.itemDim1Code === record.itemDim1Code)
                        );
                        
                        if (existingItemIndex !== -1) {
                          // Eğer ürün zaten listede varsa, miktarını artır
                          const updatedItems = [...scannedItems];
                          updatedItems[existingItemIndex].quantity += 1;
                          setScannedItems(updatedItems);
                          message.success('Ürün miktarı güncellendi');
                        } else {
                          // Yeni ürün ekle
                          setScannedItems([...scannedItems, { variant: record, quantity: 1 }]);
                          message.success('Ürün listeye eklendi');
                        }
                        
                      } catch (error) {
                        console.error('Ürün eklenirken hata:', error);
                        message.error('Ürün eklenirken bir hata oluştu.');
                      }
                    }}
                  >
                    Ekle
                  </Button>
                )
              }
            ] as ColumnsType<ProductVariant>}
          />
        </div>
        )}
      </div>

      {/* Eklenen Ürünler Bölümü */}
      {scannedItems.length > 0 && (
        <div style={{
          border: '2px solid #52c41a',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '16px',
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
        }}>
          <div style={{
            borderBottom: '2px solid #52c41a',
            marginBottom: '16px',
            paddingBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f6ffed'
          }}>
            <Title level={5} style={{ margin: 0, color: '#52c41a', fontWeight: 'bold' }}>Eklenen Ürünler</Title>
            <Tag color="blue" style={{ 
              fontSize: isMobile ? '14px' : '12px',
              padding: '4px 8px',
              margin: 0
            }}>
              Toplam: {scannedItems.length} ürün | {scannedItems.reduce((sum, item) => sum + item.quantity, 0)} adet | {scannedItems.reduce((sum, item) => sum + (item.variant.salesPrice1 || 0) * item.quantity, 0).toFixed(2)} {currencyCode}
            </Tag>
          </div>
          
          {/* Toplu Fiyat Güncelleme Grubu */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button 
              style={{ width: 60,backgroundColor: '#f5222d', color: 'white' }}
              icon={<DeleteOutlined />} 
              onClick={removeAllScannedItems}
              title="Tüm ürünleri sil"
            />
            <Space>
              <InputNumber
                placeholder="Toplu fiyat"
                value={bulkPrice}
                onChange={(value) => setBulkPrice(value)}
                min={0}
                style={{ width: 120 }}
                addonAfter={currencyCode || "TL"}
              />
              <InputNumber
                placeholder="KDV oranı"
                value={bulkVatRate}
                onChange={(value) => setBulkVatRate(value || 0)}
                min={0}
                max={100}
                style={{ width: 100 }}
                addonAfter="%"
              />
              <Button 
                style={{ 
                  width: 60,
                  backgroundColor: '#1890ff', 
                  color: 'white',
                  boxShadow: '0 2px 0 rgba(0, 0, 0, 0.045)',
                  borderRadius: '4px'
                }}
                icon={<EditOutlined />}
                onClick={updateAllPrices}
                disabled={bulkPrice === null}
                title="Fiyatları güncelle"
              />
            </Space>
          </div>
          
          <Table
            dataSource={scannedItems}
            rowKey={(item) => item.variant.barcode || item.variant.productCode + item.variant.colorCode + item.variant.itemDim1Code}
            size={isMobile ? "middle" : "small"}
            pagination={false}
            className="compact-table"
            scroll={{ y: isMobile ? 150 : 200 }}
            style={{ fontSize: isMobile ? '14px' : '12px' }}
            columns={isMobile ? [
              {
                title: 'Ürün Bilgileri',
                key: 'productInfo',
                render: (_, record: ScannedItem): ReactNode => (
                  <div>
                    <div><strong>{record.variant.productCode}</strong> {record.variant.barcode ? `(${record.variant.barcode})` : ''}</div>
                    <div style={{fontSize: '13px'}}>{record.variant.productDescription}</div>
                    <div style={{fontSize: '12px', color: '#666'}}>
                      {record.variant.colorDescription ? `${record.variant.colorDescription} / ` : ''}
                      {record.variant.itemDim1Code || '-'}
                    </div>
                  </div>
                )
              },
              {
                title: 'Miktar',
                dataIndex: 'quantity',
                key: 'quantity',
                width: 80,
                render: (quantity, record, index): ReactNode => (
                  <InputNumber
                    value={quantity}
                    min={1}
                    max={9999}
                    step={1}
                    precision={0}
                    style={{ width: '100%' }}
                    onChange={(value) => updateScannedItemQuantity(index, value as number)}
                  />
                )
              },
              {
                title: 'Birim Fiyat',
                dataIndex: ['variant', 'salesPrice1'],
                key: 'salesPrice1',
                width: 100,
                render: (price, record, index): ReactNode => (
                  <InputNumber
                    value={price}
                    min={0.01}
                    max={999999}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    onChange={(value) => updateScannedItemPrice(index, value as number)}
                  />
                )
              },
              {
                title: 'İşlem',
                key: 'action',
                width: 50,
                render: (_: any, record: ScannedItem, index: number): ReactNode => (
                  <Button 
                    type="link" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => removeScannedItem(index)}
                  />
                )
              }
            ] : [
              {
                title: 'Ürün Kodu',
                dataIndex: ['variant', 'productCode'],
                key: 'productCode',
                width: 100
              },
              {
                title: 'Ürün Açıklaması',
                dataIndex: ['variant', 'productDescription'],
                key: 'productDescription',
                width: 200,
                ellipsis: true
              },
              {
                title: 'Renk',
                dataIndex: ['variant', 'colorDescription'],
                key: 'colorDescription',
                width: 80,
                render: (text): ReactNode => text || '-'
              },
              {
                title: 'Beden',
                dataIndex: ['variant', 'itemDim1Code'],
                key: 'itemDim1Code',
                width: 60,
                render: (text): ReactNode => text || '-'
              },
              {
                title: 'Miktar',
                dataIndex: 'quantity',
                key: 'quantity',
                width: 80,
                render: (quantity, record, index): ReactNode => (
                  <InputNumber
                    value={quantity}
                    min={1}
                    max={9999}
                    step={1}
                    precision={0}
                    style={{ width: '100%' }}
                    onChange={(value) => updateScannedItemQuantity(index, value as number)}
                  />
                )
              },
              {
                title: 'Birim Fiyat',
                dataIndex: ['variant', 'salesPrice1'],
                key: 'salesPrice1',
                width: 100,
                render: (price, record, index): ReactNode => (
                  <InputNumber
                    value={price}
                    min={0.01}
                    max={999999}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    onChange={(value) => updateScannedItemPrice(index, value as number)}
                  />
                )
              },
              {
                title: 'KDV (%)',
                dataIndex: ['variant', 'vatRate'],
                key: 'vatRate',
                width: 80,
                render: (vatRate): ReactNode => `%${vatRate}`
              },
              {
                title: 'İşlem',
                key: 'action',
                width: 60,
                render: (_: any, record: ScannedItem, index: number): ReactNode => (
                  <Button 
                    type="link" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => removeScannedItem(index)}
                  />
                )
              }
            ] as ColumnsType<ScannedItem>}
          />
          
          {/* Satırları Faturaya Ekleme Butonu */}
          {scannedItems.length > 0 && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Button 
                type="primary" 
                size="large"
                icon={<PlusOutlined />}
                onClick={addAllToInvoice}
                style={{ 
                  width: isMobile ? '100%' : '50%',
                  height: isMobile ? '48px' : '40px',
                  fontSize: isMobile ? '16px' : '14px',
                  marginBottom: '10px'
                }}
              >
                Satırları Faturaya Ekle
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default BarcodeModal;