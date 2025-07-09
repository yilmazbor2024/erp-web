import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Modal, Input, Button, Table, InputNumber, Row, Col, Space, Typography, Spin, Empty, message, Tag, Switch, Tooltip, Tabs } from 'antd';
import { ScanOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, EditOutlined, CameraOutlined, CloseOutlined, SettingOutlined } from '@ant-design/icons';

// declarations.d.ts dosyasında tanımladığımız için doğrudan import edebiliriz
import { debounce } from 'lodash';

import BarcodeScanner from './BarcodeScanner';
import BarcodePerformanceMetrics from './BarcodePerformanceMetrics';
import { ProductVariant } from '../../services/productApi';
import { InventoryStock } from '../../services/inventoryApi';
import { useBarcodeSettings } from '../../contexts/BarcodeSettingsContext';

// Aynı dizindeki BarcodeSettingsForm bileşenini import ediyoruz
// @ts-ignore - Modül bulunamama hatasını geçici olarak bastırıyoruz
import BarcodeSettingsForm from './BarcodeSettingsForm';
import type { InputRef } from 'antd/lib/input';
import type { ColumnsType } from 'antd/lib/table';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface ScannedItem {
  variant: ProductVariant;
  quantity: number;
}

interface EnhancedBarcodeModalProps {
  open: boolean;
  onClose: () => void;
  barcodeInput: string;
  setBarcodeInput: (value: string) => void;
  onSearch: (barcode: string) => void;
  onSearchByProductCodeOrDescription?: (searchText: string) => void;
  loading: boolean;
  productVariants: ProductVariant[];
  setProductVariants: (variants: ProductVariant[]) => void;
  inputRef: React.RefObject<InputRef>;
  scannedItems: ScannedItem[];
  setScannedItems: (items: ScannedItem[]) => void;
  addAllToInvoice: () => void;
  isPriceIncludeVat: boolean;
  getProductPrice: (variant: ProductVariant) => Promise<void>;
  inventoryStock: InventoryStock[] | null;
  loadingInventory: boolean;
  removeScannedItem: (index: number) => void;
  removeAllScannedItems: () => void;
  updateScannedItemQuantity: (index: number, quantity: number) => void;
  updateScannedItemPrice: (index: number, price: number) => void;
  currencyCode?: string;
  taxTypeMode?: string;
}

const EnhancedBarcodeModal: React.FC<EnhancedBarcodeModalProps> = ({
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
  currencyCode = 'TRY',
  taxTypeMode
}) => {
  // Barkod ayarları context'ini kullan
  const { activeSettings, validateBarcode, updateUserSettings } = useBarcodeSettings();
  
  // Barkod işleme durumu
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Barkod önbelleği
  const [barcodeCache, setBarcodeCache] = useState<Record<string, ProductVariant>>({});
  
  // Barkod kuyruğu
  const [barcodeQueue, setBarcodeQueue] = useState<string[]>([]);
  
  // İşlem metrikleri
  const [metrics, setMetrics] = useState({
    totalScanned: 0,
    successCount: 0,
    errorCount: 0,
    startTime: 0,
    processingTime: 0
  });
  
  // Aktif tab
  const [activeTab, setActiveTab] = useState('scanner');
  
  // Barkod arama için debounce fonksiyonu
  const debouncedBarcodeSearch = useRef(
    debounce((barcode: string) => {
      if (barcode && validateBarcode(barcode)) {
        processBarcode(barcode);
      }
    }, activeSettings.debounceTime)
  ).current;
  
  // Barkod işleme fonksiyonu
  const processBarcode = useCallback(async (barcode: string) => {
    if (isProcessing || !barcode) return;
    
    // Önbellekte varsa direkt kullan
    if (barcodeCache[barcode]) {
      const variant = barcodeCache[barcode];
      addVariantToScannedList(variant);
      setBarcodeInput('');
      
      // Metrikleri güncelle
      setMetrics(prev => ({
        ...prev,
        totalScanned: prev.totalScanned + 1,
        successCount: prev.successCount + 1
      }));
      
      return;
    }
    
    setIsProcessing(true);
    setMetrics(prev => ({
      ...prev,
      startTime: Date.now(),
      totalScanned: prev.totalScanned + 1
    }));
    
    try {
      await onSearch(barcode);
      
      // Başarılı işlemden sonra input'u temizle
      setTimeout(() => setBarcodeInput(''), activeSettings.clearDelay);
      
      // Metrikleri güncelle
      setMetrics(prev => ({
        ...prev,
        successCount: prev.successCount + 1,
        processingTime: Date.now() - prev.startTime
      }));
    } catch (error) {
      console.error('Barkod işleme hatası:', error);
      
      // Metrikleri güncelle
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }));
      
      message.error(`Barkod işlenirken hata: ${barcode}`);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, barcodeCache, onSearch, setBarcodeInput, activeSettings]);
  
  // Barkod girişi değiştiğinde
  const handleBarcodeInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcodeInput(value);
    
    // Otomatik işleme aktifse debounce ile işle
    if (activeSettings.autoProcess) {
      debouncedBarcodeSearch(value);
    }
  }, [setBarcodeInput, debouncedBarcodeSearch, activeSettings]);
  
  // Tuş basıldığında
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter veya Tab tuşu algılandığında
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault(); // Formun gönderilmesini engelle
      
      const barcode = barcodeInput.trim();
      
      // Barkod doğrulama
      if (barcode && validateBarcode(barcode)) {
        processBarcode(barcode);
      } else if (barcode) {
        message.warning(`Geçersiz barkod formatı: ${barcode}`);
      }
    }
  }, [barcodeInput, processBarcode, validateBarcode]);
  
  // Varyantı taranan ürünler listesine ekle
  const addVariantToScannedList = useCallback((variant: ProductVariant) => {
    // Önbelleğe ekle
    setBarcodeCache(prev => ({...prev, [variant.barcode || '']: variant}));
    
    // Zaten listede var mı kontrol et
    const existingIndex = scannedItems.findIndex(item => 
      item.variant.productCode === variant.productCode
    );
    
    if (existingIndex >= 0) {
      // Varsa miktarını artır
      const updatedItems = [...scannedItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + 1
      };
      setScannedItems(updatedItems);
      message.success(`${variant.productDescription} miktarı güncellendi`);
    } else {
      // Yoksa yeni ekle
      setScannedItems([...scannedItems, { variant, quantity: 1 }]);
      message.success(`${variant.productDescription} eklendi`);
    }
    
    // Fiyat bilgisini getir
    getProductPrice(variant);
  }, [scannedItems, setScannedItems, getProductPrice]);
  
  // Modal açıldığında input'a odaklan
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, inputRef]);
  
  // Barkod kuyruğu işleme
  useEffect(() => {
    const processBarcodeQueue = async () => {
      if (barcodeQueue.length === 0 || isProcessing) return;
      
      const barcode = barcodeQueue[0];
      await processBarcode(barcode);
      
      // İşlenen barkodu kuyruktan çıkar
      setBarcodeQueue(prev => prev.slice(1));
    };
    
    if (barcodeQueue.length > 0 && !isProcessing) {
      processBarcodeQueue();
    }
  }, [barcodeQueue, isProcessing, processBarcode]);
  
  // Tablo sütunları
  const columns: ColumnsType<ScannedItem> = [
    {
      title: 'Ürün Kodu',
      dataIndex: ['variant', 'productCode'],
      key: 'productCode',
      width: 120
    },
    {
      title: 'Ürün Adı',
      dataIndex: ['variant', 'productDescription'],
      key: 'productDescription',
      ellipsis: true
    },
    {
      title: 'Miktar',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity: number, record: ScannedItem, index: number) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) => updateScannedItemQuantity(index, value || 1)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: `Birim Fiyat (${currencyCode})`,
      dataIndex: ['variant', 'salesPrice1'],
      key: 'salesPrice1',
      width: 150,
      render: (price: number, record: ScannedItem, index: number) => (
        <InputNumber
          min={0}
          value={price}
          onChange={(value) => updateScannedItemPrice(index, value || 0)}
          style={{ width: '100%' }}
          precision={2}
        />
      )
    },
    {
      title: 'Stok',
      key: 'stock',
      width: 80,
      render: (_, record: ScannedItem) => {
        // productCode ile eşleştirme yap
        const stock = inventoryStock?.find(s => s.productCode === record.variant.productCode);
        // quantity alanını kullan (qty de olabilir)
        return stock ? (stock.quantity || stock.qty || 0) : '-';
      }
    },
    {
      title: 'İşlem',
      key: 'action',
      width: 80,
      render: (_, record: ScannedItem, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeScannedItem(index)}
        />
      )
    }
  ];
  
  return (
    <Modal
      title="Barkod Tarama"
      open={open}
      onCancel={onClose}
      width={1000}
      footer={null}
      destroyOnClose
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Barkod Tarama" key="scanner">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Space style={{ width: '100%' }}>
                <Input
                  ref={inputRef}
                  placeholder="Barkod tarayın veya girin..."
                  value={barcodeInput}
                  onChange={handleBarcodeInputChange}
                  onKeyDown={handleKeyDown}
                  prefix={<ScanOutlined />}
                  disabled={isProcessing}
                  style={{ width: 300 }}
                  autoFocus
                />
                <Button
                  type="primary"
                  onClick={() => {
                    if (barcodeInput && validateBarcode(barcodeInput)) {
                      processBarcode(barcodeInput);
                    } else if (barcodeInput) {
                      message.warning(`Geçersiz barkod formatı: ${barcodeInput}`);
                    }
                  }}
                  loading={isProcessing}
                >
                  Ara
                </Button>
                
                {onSearchByProductCodeOrDescription && (
                  <Input.Search
                    placeholder="Ürün kodu veya açıklaması ile ara..."
                    onSearch={onSearchByProductCodeOrDescription}
                    style={{ width: 300 }}
                    enterButton
                  />
                )}
                
                <Switch
                  checkedChildren="Kamera Açık"
                  unCheckedChildren="Kamera Kapalı"
                  defaultChecked={false}
                />
              </Space>
            </Col>
            
            {/* Barkod tarama performans metrikleri */}
            <Col span={24}>
              <Row gutter={16}>
                <Col>
                  <Statistic title="Toplam Taranan" value={metrics.totalScanned} />
                </Col>
                <Col>
                  <Statistic 
                    title="Başarılı" 
                    value={metrics.successCount} 
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col>
                  <Statistic 
                    title="Başarısız" 
                    value={metrics.errorCount}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
                <Col>
                  <Statistic 
                    title="İşlem Süresi" 
                    value={metrics.processingTime} 
                    suffix="ms"
                  />
                </Col>
              </Row>
            </Col>
            
            {/* Ürün arama sonuçları */}
            {loading && (
              <Col span={24} style={{ textAlign: 'center' }}>
                <Spin tip="Ürün aranıyor..." />
              </Col>
            )}
            
            {!loading && productVariants.length > 0 && (
              <Col span={24}>
                <Title level={5}>Bulunan Ürünler</Title>
                <Table
                  dataSource={productVariants}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: 'Ürün Kodu',
                      dataIndex: 'productCode',
                      key: 'productCode',
                      width: 120
                    },
                    {
                      title: 'Ürün Adı',
                      dataIndex: 'productDescription',
                      key: 'productDescription',
                      ellipsis: true
                    },
                    {
                      title: 'Barkod',
                      dataIndex: 'barcode',
                      key: 'barcode',
                      width: 120
                    },
                    {
                      title: 'İşlem',
                      key: 'action',
                      width: 100,
                      render: (_, record) => (
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => addVariantToScannedList(record)}
                        >
                          Ekle
                        </Button>
                      )
                    }
                  ]}
                />
              </Col>
            )}
            
            {/* Taranan ürünler listesi */}
            <Col span={24}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Title level={5}>Taranan Ürünler ({scannedItems.length})</Title>
                <Space>
                  <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={removeAllScannedItems}
                    disabled={scannedItems.length === 0}
                  >
                    Tümünü Temizle
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={addAllToInvoice}
                    disabled={scannedItems.length === 0}
                  >
                    Faturaya Ekle
                  </Button>
                </Space>
              </div>
              
              <Table
                dataSource={scannedItems}
                columns={columns}
                rowKey={(record) => record.variant.productCode}
                pagination={false}
                size="small"
                locale={{ emptyText: 'Henüz ürün taranmadı' }}
                loading={loadingInventory}
              />
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="Barkod Ayarları" key="settings">
          <BarcodeSettingsForm />
        </TabPane>
      </Tabs>
    </Modal>
  );
};

// Statistic bileşeni
const Statistic = ({ title, value, suffix, valueStyle }: { title: string, value: number, suffix?: string, valueStyle?: React.CSSProperties }) => (
  <div style={{ padding: '8px 16px', border: '1px solid #f0f0f0', borderRadius: 4 }}>
    <div style={{ fontSize: 14, color: '#8c8c8c' }}>{title}</div>
    <div style={{ fontSize: 20, fontWeight: 'bold', ...valueStyle }}>
      {value}{suffix}
    </div>
  </div>
);

export default EnhancedBarcodeModal;
