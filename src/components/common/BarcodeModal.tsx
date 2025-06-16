import React, { useRef, useEffect, ReactNode, useState } from 'react';
import { Modal, Input, Button, Table, InputNumber, Row, Col, Space, Typography, Spin, Empty, message, Tag, Switch } from 'antd';
import { ScanOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
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
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [bulkVatRate, setBulkVatRate] = useState<number>(taxTypeMode === 'vergisiz' ? 0 : 10); // Vergi tipine göre varsayılan KDV oranı
  
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

    console.log('Toplu fiyat güncelleme yapıldı:', updatedScannedItems);
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
      console.log("productVariants değişti, stok verilerini yükleniyor:", firstVariant.productCode);
      
      // Ürün kodu ile stok verilerini yükle
      loadInventoryStock({
        productCode: firstVariant.productCode,
        showOnlyPositiveStock: true
      }).then(stockData => {
        console.log("Stok verileri yüklendi ve state güncellendi:", stockData);
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
      console.log('Stok getirme seçeneği kapalı, stok verileri yüklenmeyecek');
      return [];
    }
    
    setLocalLoadingInventory(true);
    console.log('Stok verileri yükleniyor:', params);
    
    try {
      const stockData = await inventoryApi.getInventoryStock(params);
      console.log('Yüklenen stok verileri:', stockData);
      
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
    if (!barcodeInput.trim()) {
      message.warning('Lütfen bir barkod veya varyant kodu girin');
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
        } else {
          message.error('Ürün kodu veya açıklaması ile arama fonksiyonu tanımlanmamış');
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
        // Özel durumlar için 13-14 karakterli barkodlar da geçerli olmalı
        const isValidBarcode = isNumeric && (cleanBarcode.length >= 8 && cleanBarcode.length <= 14);
        
        if (isValidBarcode) {
          // Geçerli barkod formatı - önce stok verilerini yükle
          if (fetchStock) {
            setLocalLoadingInventory(true);
            const dbStartTime = performance.now();
            const stockData = await loadInventoryStock({ barcode: cleanBarcode });
            const dbEndTime = performance.now();
            const dbFetchTime = dbEndTime - dbStartTime;

            
            const uiStartTime = performance.now();
            // UI güncelleme işlemleri
            const uiEndTime = performance.now();
            const uiRenderTime = uiEndTime - uiStartTime;
            
            // Performans metriklerini güncelle
            updatePerformanceMetrics(dbFetchTime, uiRenderTime);
          }
          // State güncellemesinin tamamlanması için küçük bir gecikme
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Sonra ürün varyantlarını ara
          onSearch(barcodeInput);
        } else {
          // Barkod formatı geçerli değil, varyant bilgisi olabilir
          // Format: URUNCODE-RENKKODU-BEDENKODU şeklinde olabilir
          const parts = barcodeInput.split('-');
          
          if (parts.length >= 1) {
            // En azından ürün kodu var, varyant araması yap
            const productCode = parts[0].trim();
            const colorCode = parts.length >= 2 ? parts[1].trim() : '';
            const itemDim1Code = parts.length >= 3 ? parts[2].trim() : '';
            
            console.log(`Varyant bazında arama: Ürün Kodu=${productCode}, Renk Kodu=${colorCode || 'Yok'}, Beden Kodu=${itemDim1Code || 'Yok'}`);
            
            // Varyant parametreleri ile stok verilerini yükle
            const stockData = await loadInventoryStock({
              productCode: productCode,
              colorCode: colorCode || undefined,
              itemDim1Code: itemDim1Code || undefined,
              showOnlyPositiveStock: true
            });
            
            console.log('Varyant araması için stok verileri yüklendi:', stockData);
            
            // State güncellemesinin tamamlanması için küçük bir gecikme
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Varyant bazında arama için onSearch fonksiyonunu çağır
            onSearch(barcodeInput);
          } else {
            message.warning('Geçersiz barkod veya varyant formatı');
          }
        }
      }
    } catch (error) {
      console.error('Arama sırasında hata oluştu:', error);
      message.error('Arama sırasında bir hata oluştu');
    }
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
      console.log('Stok verileri değişti, yeniden render ediliyor');
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
    
    console.log('getStockQuantity - Bulunan stok:', stock);
    
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
      message.success(`${productVariants.length} ürün varyantı listeye eklendi`);
    } catch (error) {
      console.error('Varyantlar eklenirken hata oluştu:', error);
      message.error('Ürünler eklenirken bir hata oluştu.');
    }
  };

  return (
    <Modal
      title="Satır Ekle"
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          İptal
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={addAllToInvoice}
          disabled={scannedItems.length === 0}
        >
          Tamamla ve Faturaya Ekle
        </Button>
      ]}
      styles={{ body: { padding: '16px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
    >
      {/* Arama modu değiştirme switch'i */}
      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col span={24}>
          <Space align="center">
            <Text>Barkod ile Ara</Text>
            <Switch
              checked={searchByProduct}
              onChange={(checked) => setSearchByProduct(checked)}
              checkedChildren="Ürün Kodu/Açıklaması"
              unCheckedChildren="Barkod/Varyant"
              style={{ marginBottom: 8, width: 180 }}
            />
            <Text>Ürün Kodu/Açıklaması ile Ara</Text>
          </Space>
        </Col>
      </Row>

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
      
      {/* Arama kutusu ve ara butonu */}
      <Row gutter={8} style={{ marginBottom: 8, marginTop: 8 }}>
        <Col flex="auto">
          <Input
            ref={inputRef}
            placeholder={searchByProduct 
              ? "Ürün kodu veya açıklaması girin (en az 3 karakter)" 
              : "Barkod girin"}
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onPressEnter={() => {
              // Arama tipine göre minimum karakter kontrolü
              const minLength = searchByProduct ? 3 : 1;
              if (barcodeInput.trim().length >= minLength) {
                handleSearch();
                // Arama yapıldıktan sonra input'u temizle
                setBarcodeInput('');
              } else if (barcodeInput.trim().length > 0) {
                message.warning(`Lütfen en az ${minLength} karakter girin`);
              }
            }}
            suffix={loading ? <Spin size="small" /> : <SearchOutlined />}
            autoFocus
            style={{ width: '100%' }}
          />
        </Col>
        <Col>
          <Button 
            type="primary" 
            onClick={() => {
              // Arama tipine göre minimum karakter kontrolü
              const minLength = searchByProduct ? 3 : 1;
              if (barcodeInput.trim().length >= minLength) {
                handleSearch();
                // Arama yapıldıktan sonra input'u temizle
                setBarcodeInput('');
              } else if (barcodeInput.trim().length > 0) {
                message.warning(`Lütfen en az ${minLength} karakter girin`);
              }
            }} 
            loading={loading}
            disabled={barcodeInput.trim().length < (searchByProduct ? 3 : 1)}
          >
            Ara
          </Button>
        </Col>
      </Row>
      
      {/* Fazladan switch kaldırıldı */}
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={removeAllScannedItems}
            disabled={scannedItems.length === 0}
          >
            Tümünü Temizle
          </Button>
        </Col>
        
        {scannedItems.length > 0 && (
          <>
            <Col>
              <InputNumber
                placeholder="Toplu fiyat"
                value={bulkPrice}
                onChange={(value) => setBulkPrice(value)}
                min={0}
                style={{ width: 120 }}
                addonAfter={currencyCode || "TL"}
              />
            </Col>
            <Col>
              <InputNumber
                placeholder="KDV oranı"
                value={bulkVatRate}
                onChange={(value) => setBulkVatRate(value || 0)}
                min={0}
                max={100}
                style={{ width: 100 }}
                addonAfter="%"
              />
            </Col>
            <Col>
              <Button 
                type="primary" 
                onClick={updateAllPrices}
                disabled={bulkPrice === null}
              >
                Toplu Güncelle
              </Button>
            </Col>
          </>
        )}
      </Row>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ margin: 0 }}>Bulunan Ürünler ({productVariants.length})</Title>
          {productVariants.length > 0 && (
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
                      message.success(`${productVariants.length} ürün varyantı listeye eklendi`);
                    };
                    addAllVariants();
                  }}
                  icon={<PlusOutlined />}
                >
                  Tüm Varyantları Ekle
                </Button>
              <Button 
                type="link" 
                size="small"
                onClick={() => setProductVariants([])} 
                icon={<DeleteOutlined />}
              >
                Temizle
              </Button>
            </Space>
          )}
        </div>
        {productVariants.length === 0 ? (
          <Empty description="Ürün bulunamadı" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            dataSource={productVariants}
            rowKey={(record) => record.barcode || record.productCode + record.colorCode + record.itemDim1Code}
            size="small"
            pagination={false}
            scroll={{ y: 200 }}
            columns={[
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
                        } else {
                          // Fiyat getirme seçeneği işaretli değilse, fiyat bilgisi olmadan ekle
                          // Burada getProductPrice fonksiyonunu çağırmadan ürünü eklemek için
                          // gerekli işlemleri yapmanız gerekebilir
                          // Bu örnekte, fiyat bilgisi olmadan ürünü eklemek için
                          // scannedItems state'ine doğrudan ekleme yapıyoruz
                          const existingIndex = scannedItems.findIndex(item => 
                            item.variant.barcode === record.barcode || 
                            (item.variant.productCode === record.productCode && 
                             item.variant.colorCode === record.colorCode && 
                             item.variant.itemDim1Code === record.itemDim1Code)
                          );
                          
                          if (existingIndex >= 0) {
                            // Ürün zaten listede, miktarını artır
                            updateScannedItemQuantity(existingIndex, scannedItems[existingIndex].quantity + 1);
                          } else {
                            // Yeni ürün, listeye ekle
                            const newItem: ScannedItem = {
                              variant: record,
                              quantity: 1
                            };
                            setScannedItems([...scannedItems, newItem]);
                          }
                        }
                        message.success('Ürün listeye eklendi');
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
        )}
      </div>

      {scannedItems.length > 0 && (
        <>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={5}>Taranan Ürünler</Title>
            <Space>
              <Tag color="blue" style={{ fontSize: '14px' }}>
                Toplam: {scannedItems.length} ürün | {scannedItems.reduce((sum, item) => sum + item.quantity, 0)} adet
              </Tag>
              <Tag color="green" style={{ fontSize: '14px' }}>
                Toplam Tutar: {scannedItems.reduce((sum, item) => sum + (item.variant.salesPrice1 || 0) * item.quantity, 0).toFixed(2)} {currencyCode}
              </Tag>
            </Space>
          </div>
          
          <Table
            dataSource={scannedItems}
            rowKey={(item) => item.variant.barcode || item.variant.productCode + item.variant.colorCode + item.variant.itemDim1Code}
            size="small"
            pagination={false}
            className="compact-table"
            scroll={{ y: 200 }}
            columns={[
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
        </>
      )}
    </Modal>
  );
};

export default BarcodeModal;
