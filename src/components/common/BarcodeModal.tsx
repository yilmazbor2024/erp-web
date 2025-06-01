import React, { useRef, useEffect, ReactNode, useState } from 'react';
import { Modal, Input, Button, Table, InputNumber, Row, Col, Space, Typography, Spin, Empty, message, Tag, Switch } from 'antd';
import { ScanOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { ProductVariant } from '../../services/productApi';
import { InventoryStock } from '../../services/inventoryApi';
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
  addAllToInvoice: () => void;
  isPriceIncludeVat: boolean;
  getProductPrice: (variant: ProductVariant) => Promise<void>;
  inventoryStock: InventoryStock[] | null;
  loadingInventory: boolean;
  removeScannedItem: (index: number) => void;
  removeAllScannedItems: () => void;
  updateScannedItemQuantity: (index: number, quantity: number) => void;
  updateScannedItemPrice: (index: number, price: number) => void;
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
  addAllToInvoice,
  isPriceIncludeVat,
  getProductPrice,
  inventoryStock,
  loadingInventory,
  removeScannedItem,
  removeAllScannedItems,
  updateScannedItemQuantity,
  updateScannedItemPrice,
}) => {
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [bulkVatRate, setBulkVatRate] = useState<number>(10); // Varsayılan KDV oranı
  const [searchByProduct, setSearchByProduct] = useState<boolean>(false); // false: barkod ile arama, true: ürün kodu/açıklaması ile arama
  
  // Toplu fiyat güncelleme fonksiyonu
  const updateAllPrices = () => {
    if (bulkPrice === null) {
      message.error('Lütfen geçerli bir fiyat girin');
      return;
    }

    // Tüm ürünlerin fiyatını güncelle
    scannedItems.forEach((item, index) => {
      // KDV dahil fiyat girilmişse, KDV hariç fiyata çevir
      let newPrice = bulkPrice;
      if (isPriceIncludeVat) {
        newPrice = bulkPrice / (1 + (bulkVatRate / 100));
      }
      updateScannedItemPrice(index, newPrice);
      item.variant.vatRate = bulkVatRate;
    });

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

  // Enter tuşuna basıldığında arama yap
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Arama işlemini gerçekleştir
  const handleSearch = () => {
    if (!barcodeInput.trim()) {
      message.warning('Lütfen arama metni girin');
      return;
    }
    
    // Doğrudan seçilen moda göre arama yap
    if (searchByProduct) {
      // Ürün kodu veya açıklaması ile arama
      console.log('Ürün kodu/açıklaması ile arama yapılıyor:', barcodeInput);
      if (onSearchByProductCodeOrDescription) {
        onSearchByProductCodeOrDescription(barcodeInput);
      } else {
        message.error('Ürün kodu veya açıklaması ile arama fonksiyonu tanımlanmamış');
      }
    } else {
      // Barkod ile arama
      console.log('Barkod ile arama yapılıyor:', barcodeInput);
      onSearch(barcodeInput);
    }
  };

  // Stok miktarını bul
  const getStockQuantity = (variant: ProductVariant): ReactNode => {
    // Envanter/Stok Bilgisi tablosundan doğru stok miktarını bul
    const stock = inventoryStock?.find(s => 
      s.itemCode === variant.productCode && 
      s.colorCode === variant.colorCode && 
      s.itemDim1Code === variant.itemDim1Code
    );
    
    // Stok miktarını göster - eğer varsa stok.qty değerini, yoksa 0 göster
    return loadingInventory ? 
      <Spin size="small" /> : 
      <Tag color={stock && stock.qty > 0 ? 'green' : 'red'}>
        {stock ? stock.qty.toFixed(2) : '0.00'}
      </Tag>;
  };
  
  // Bulunan tüm varyantları listeye ekle
  const addAllVariantsToList = async () => {
    if (productVariants.length === 0) return;
    
    try {
      // Tüm varyantları sırayla ekle
      for (const variant of productVariants) {
        await getProductPrice(variant);
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
              onChange={(checked) => {
                setSearchByProduct(checked);
                setBarcodeInput(''); // Mod değiştiğinde input'u temizle
              }}
            />
            <Text>Ürün Kodu/Açıklaması ile Ara</Text>
          </Space>
        </Col>
      </Row>

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
                addonAfter="TL"
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
                render: (_, record: ProductVariant) => {
                  // Debug için stok verilerini konsola yazdır
                  console.log('BarcodeModal - Ürün:', record.productCode, record.colorCode, record.itemDim1Code);
                  console.log('BarcodeModal - Tüm stok verileri:', inventoryStock);
                  
                  // Envanter/Stok Bilgisi tablosundan doğru stok miktarını bul
                  // Önce tam eşleşme ara
                  let stock = inventoryStock?.find(s => 
                    s.itemCode === record.productCode && 
                    s.colorCode === record.colorCode && 
                    s.itemDim1Code === record.itemDim1Code
                  );
                  
                  // Tam eşleşme bulunamazsa sadece ürün koduna göre ara
                  if (!stock && inventoryStock && inventoryStock.length > 0) {
                    stock = inventoryStock.find(s => s.itemCode === record.productCode);
                  }
                  
                  console.log('BarcodeModal - Bulunan stok:', stock);
                  
                  // Stok miktarını göster - eğer varsa stok.qty değerini, yoksa 0 göster
                  return loadingInventory ? 
                    <Spin size="small" /> : 
                    <Tag color={stock && stock.qty > 0 ? 'green' : 'red'}>
                      {stock ? stock.qty.toFixed(2) : '0.00'}
                    </Tag>;
                }
              },
              {
                title: 'İşlem',
                key: 'action',
                width: 80,
                render: (_: any, record: ProductVariant): ReactNode => (
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={async () => {
                      try {
                        await getProductPrice(record);
                      } catch (error) {
                        console.error('Ürün fiyatı alınırken hata:', error);
                        message.error('Ürün fiyatı alınırken bir hata oluştu.');
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
          <div style={{ marginTop: 16 }}>
            <Title level={5}>Taranan Ürünler</Title>
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
