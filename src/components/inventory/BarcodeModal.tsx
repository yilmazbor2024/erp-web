import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  Input, 
  Button, 
  Table, 
  Space, 
  message, 
  Spin,
  Typography,
  Divider,
  Row,
  Col,
  InputNumber,
  Card,
  Switch
} from 'antd';
import { 
  SearchOutlined, 
  BarcodeOutlined, 
  PlusOutlined,
  CloseOutlined,
  CameraOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import BarcodeScanner from '../common/BarcodeScanner';
import productApi, { ProductVariant, InventoryStock } from '../../services/productApi';

const { Text, Title } = Typography;

// API'den gelen ürün tipini kullanarak oluşturulan ürün tipi
interface Product {
  key?: string;
  itemCode: string;
  itemName: string;
  barcode?: string;
  colorCode?: string;
  colorName?: string;
  itemDim1Code?: string; // Beden
  itemDim1Name?: string;
  unitCode: string;
  stock?: number;
  quantity?: number;
}

interface ScannedProduct extends Product {
  quantity: number;
}

// ProductVariant'tan Product'a dönüştürme fonksiyonu
const convertToProduct = (variant: ProductVariant, stock?: InventoryStock): Product => ({
  itemCode: variant.productCode,
  itemName: variant.productDescription,
  barcode: variant.barcode,
  colorCode: variant.colorCode,
  colorName: variant.colorDescription,
  itemDim1Code: variant.itemDim1Code,
  itemDim1Name: variant.itemDim1Code, // API'de itemDim1Name yok, kodu kullanıyoruz
  unitCode: variant.unitOfMeasureCode1,
  stock: stock?.qty || 0
});

interface BarcodeModalProps {
  visible: boolean;
  onCancel: () => void;
  onAdd: (products: ScannedProduct[]) => void;
  warehouseCode?: string;
  onScan?: (barcode: string) => void;
}

const BarcodeModal: React.FC<BarcodeModalProps> = ({
  visible,
  onCancel,
  onAdd,
  warehouseCode,
  onScan
}) => {
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [searchMode, setSearchMode] = useState<'product' | 'barcode'>('product'); // Arama modu: ürün veya barkod
  
  const searchInputRef = useRef<any>(null);

  // Modal açıldığında input'a odaklan
  useEffect(() => {
    if (visible && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  // Barkod kontrolü
  const isBarcodeFormat = (text: string): boolean => {
    // 2 veya 8 ile başlayan en az 10 haneli rakamlar barkod olarak kabul edilir
    const barcodeRegex = /^[28]\d{9,}$/;
    return barcodeRegex.test(text.trim());
  };

  // Arama fonksiyonu - Barkod veya ürün araması yapar
  const handleSearch = async () => {
    if (!searchText.trim()) {
      message.warning('Lütfen bir arama terimi girin');
      return;
    }

    setLoading(true);
    try {
      const searchValue = searchText.trim();
      
      // Arama moduna göre işlem yap
      if (searchMode === 'barcode') {
        // Barkod modunda ise doğrudan barkod araması yap
        console.log('BARKOD modunda arama yapılıyor:', searchValue);
        await searchByBarcode(searchValue);
      } else {
        // Ürün modunda ise, barkod formatında mı kontrol et
        if (isBarcodeFormat(searchValue)) {
          console.log('Barkod formatında arama yapılıyor:', searchValue);
          await searchByBarcode(searchValue);
        } else {
          console.log('Ürün olarak arama yapılıyor:', searchValue);
          await searchByProductInfo(searchValue);
        }
      }
    } catch (error) {
      console.error('Arama sırasında bir hata oluştu:', error);
      message.error('Arama sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Barkod ile arama
  const searchByBarcode = async (barcode: string) => {
    try {
      // Doğrudan barkod ile ürün ara
      const variants = await productApi.getProductVariantsByBarcode(barcode);
      console.log('Barkod ile bulunan ürünler:', variants);
      
      if (variants && variants.length > 0) {
        // Stok bilgilerini al
        const stockPromises = variants.map(variant => {
          if (warehouseCode) {
            return productApi.getInventoryStockMultiPurpose({
              productCode: variant.productCode,
              colorCode: variant.colorCode,
              itemDim1Code: variant.itemDim1Code,
              warehouseCode: warehouseCode,
              showOnlyPositiveStock: false
            });
          }
          return Promise.resolve([]);
        });
        
        const stockResults = await Promise.all(stockPromises);
        
        // Ürünleri stok bilgileriyle birleştir
        const productsWithStock = variants.map((variant, index) => {
          const stockInfo = stockResults[index];
          return convertToProduct(
            variant, 
            stockInfo && stockInfo.length > 0 ? stockInfo[0] : undefined
          );
        });
        
        setProducts(productsWithStock);
        
        // Eğer tek ürün bulunduysa otomatik olarak seç
        if (productsWithStock.length === 1) {
          const product = productsWithStock[0];
          if (!selectedProducts.some(p => 
            p.itemCode === product.itemCode && 
            p.colorCode === product.colorCode && 
            p.itemDim1Code === product.itemDim1Code
          )) {
            handleSelectProduct(product);
            message.success('Ürün otomatik olarak seçildi');
          } else {
            message.info('Bu ürün zaten seçili');
          }
        }
      } else {
        message.warning(`Barkod ile ürün bulunamadı: ${barcode}`);
        setProducts([]);
      }
    } catch (error) {
      console.error('Barkod araması sırasında hata oluştu:', error);
      throw error;
    }
  };

  // Ürün bilgisi ile arama
  const searchByProductInfo = async (searchText: string) => {
    try {
      // Ürün araması yap
      const variants = await productApi.searchProducts(searchText);
      
      if (variants.length === 0) {
        message.info('Arama kriterlerine uygun ürün bulunamadı');
        setProducts([]);
        return;
      }
      
      // Stok bilgilerini al
      const productsWithStock = await Promise.all(
        variants.map(async (variant) => {
          // Stok bilgisini sorgula
          const stockInfo = warehouseCode ? 
            await productApi.getInventoryStockMultiPurpose({
              productCode: variant.productCode,
              colorCode: variant.colorCode,
              itemDim1Code: variant.itemDim1Code,
              warehouseCode: warehouseCode,
              showOnlyPositiveStock: false
            }) : [];
          
          // Ürün nesnesini oluştur
          return convertToProduct(
            variant, 
            stockInfo.length > 0 ? stockInfo[0] : undefined
          );
        })
      );
      
      setProducts(productsWithStock);
    } catch (error) {
      console.error('Ürün araması sırasında bir hata oluştu:', error);
      throw error;
    }
  };

  // Enter tuşuna basıldığında arama yap
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Ürün seçme işlemi
  const handleSelectProduct = (product: Product) => {
    const isAlreadySelected = selectedProducts.some(p => 
      p.itemCode === product.itemCode && 
      p.colorCode === product.colorCode && 
      p.itemDim1Code === product.itemDim1Code
    );

    if (isAlreadySelected) {
      message.warning('Bu ürün zaten seçili');
      return;
    }

    const productKey = `${product.itemCode}-${product.colorCode || ''}-${product.itemDim1Code || ''}`;
    setSelectedProducts([...selectedProducts, product]);
    setQuantities({
      ...quantities,
      [productKey]: 1 // Varsayılan miktar
    });
  };

  // Seçili ürünü kaldır
  const handleRemoveProduct = (product: Product) => {
    const productKey = `${product.itemCode}-${product.colorCode || ''}-${product.itemDim1Code || ''}`;
    setSelectedProducts(selectedProducts.filter(p => 
      !(p.itemCode === product.itemCode && 
        p.colorCode === product.colorCode && 
        p.itemDim1Code === product.itemDim1Code)
    ));
    
    const newQuantities = { ...quantities };
    delete newQuantities[productKey];
    setQuantities(newQuantities);
  };

  // Miktar değiştirme
  const handleQuantityChange = (product: Product, quantity: number | null) => {
    if (quantity === null) return; // Null değer gelirse işlem yapma
    
    const productKey = `${product.itemCode}-${product.colorCode || ''}-${product.itemDim1Code || ''}`;
    setQuantities({
      ...quantities,
      [productKey]: quantity
    });
  };

  // Seçili ürünleri ekle
  const handleAddProducts = () => {
    if (selectedProducts.length === 0) {
      message.warning('Lütfen en az bir ürün seçin');
      return;
    }

    const productsToAdd = selectedProducts.map(product => {
      const productKey = `${product.itemCode}-${product.colorCode || ''}-${product.itemDim1Code || ''}`;
      return {
        ...product,
        quantity: quantities[productKey] || 1
      };
    });

    onAdd(productsToAdd);
    resetForm();
    onCancel();
  };

  // Formu sıfırla
  const resetForm = () => {
    setSearchText('');
    setProducts([]);
    setSelectedProducts([]);
    setQuantities({});
    setShowScanner(false);
  };

  // Arama ve seçili ürünleri temizleme
  const clearSearchResults = () => {
    setProducts([]);
    setSearchText('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Seçili ürünleri temizleme
  const clearSelectedProducts = () => {
    setSelectedProducts([]);
    setQuantities({});
  };

  // Barkod tarama işlemi
  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode || barcode.trim() === '') {
      message.warning('Geçerli bir barkod okunamadı');
      return;
    }
    
    const cleanBarcode = barcode.trim();
    console.log('Barkod tarandı:', cleanBarcode);
    setSearchText(cleanBarcode);
    setShowScanner(false); // Tarama başarılı olduğunda tarayıcıyı kapat
    
    // onScan prop'u varsa çağır
    if (onScan) {
      onScan(cleanBarcode);
    }
    
    console.log('Seçili ürünler:', selectedProducts);
    
    // Önce seçili ürünler listesinde bu barkoda sahip ürün var mı kontrol et
    // Barkodları karşılaştırırken trim yaparak ve büyük/küçük harf duyarlılığını kaldırarak karşılaştır
    const existingProduct = selectedProducts.find(p => 
      p.barcode && p.barcode.trim().toLowerCase() === cleanBarcode.toLowerCase()
    );
    
    if (existingProduct) {
      console.log('Ürün zaten seçili, miktarı artırılıyor:', existingProduct);
      // Ürün zaten seçili, miktarını artır
      const productKey = `${existingProduct.itemCode}-${existingProduct.colorCode || ''}-${existingProduct.itemDim1Code || ''}`;
      const currentQty = quantities[productKey] || 1;
      const maxQty = existingProduct.stock || 9999;
      
      if (currentQty < maxQty) {
        // Miktarı artır
        const newQty = currentQty + 1;
        handleQuantityChange(existingProduct, newQty);
        message.success(`Ürün miktarı artırıldı: ${existingProduct.itemCode} - ${newQty} ${existingProduct.unitCode || 'AD'}`);
      } else {
        message.warning(`Maksimum stok miktarına ulaşıldı: ${maxQty} ${existingProduct.unitCode || 'AD'}`);
      }
      return;
    }
    
    // Seçili ürünlerde yoksa veritabanından sorgula
    setLoading(true);
    try {
      // Doğrudan barkod ile ürün ara
      const variants = await productApi.getProductVariantsByBarcode(cleanBarcode);
      console.log('Barkod ile bulunan ürünler:', variants);
      
      if (variants && variants.length > 0) {
        // Stok bilgilerini al
        const stockPromises = variants.map(variant => {
          if (warehouseCode) {
            return productApi.getInventoryStockMultiPurpose({
              productCode: variant.productCode,
              colorCode: variant.colorCode,
              itemDim1Code: variant.itemDim1Code,
              warehouseCode: warehouseCode,
              showOnlyPositiveStock: false
            });
          }
          return Promise.resolve([]);
        });
        
        const stockResults = await Promise.all(stockPromises);
        
        // Ürünleri stok bilgileriyle birleştir
        const productsWithStock = variants.map((variant, index) => {
          const stockInfo = stockResults[index];
          return convertToProduct(
            variant, 
            stockInfo && stockInfo.length > 0 ? stockInfo[0] : undefined
          );
        });
        
        setProducts(productsWithStock);
        
        // Eğer tek ürün bulunduysa otomatik olarak seç
        if (productsWithStock.length === 1) {
          const product = productsWithStock[0];
          if (!selectedProducts.some(p => 
            p.itemCode === product.itemCode && 
            p.colorCode === product.colorCode && 
            p.itemDim1Code === product.itemDim1Code
          )) {
            handleSelectProduct(product);
            message.success('Ürün otomatik olarak seçildi');
          } else {
            message.info('Bu ürün zaten seçili');
          }
        }
      } else {
        message.warning(`Barkod ile ürün bulunamadı: ${cleanBarcode}`);
        setProducts([]);
      }
    } catch (error) {
      console.error('Barkod tarama sırasında hata oluştu:', error);
      message.error('Barkod tarama sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Barkod tarayıcısını aç/kapat
  const toggleScanner = () => {
    setShowScanner(!showScanner);
  };

  return (
    <Modal
      title="Barkod ile Ürün Ekle"
      open={visible}
      onCancel={onCancel}
      width="100%"
      style={{ top: 0, margin: 0, maxWidth: '100%', padding: 0 }}
      styles={{ body: { padding: '5px' } }}
      footer={[
        <Button key="cancel" onClick={onCancel} size="large" style={{ width: '45%' }}>
          İptal
        </Button>,
        <Button 
          key="add" 
          type="primary" 
          onClick={handleAddProducts}
          disabled={selectedProducts.length === 0}
          size="large"
          style={{ width: '45%' }}
        >
          Seçili Ürünleri Ekle ({selectedProducts.length})
        </Button>
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Card size="small" styles={{ body: { padding: '5px' } }}>
          <div style={{ display: 'flex', marginBottom: 10 }}>
            <Input
              ref={searchInputRef}
              placeholder={searchMode === 'barcode' ? "Barkod numarası girin" : "Ürün kodu veya adı ile arama"}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ flex: 1, height: 40 }}
              prefix={searchMode === 'barcode' ? <BarcodeOutlined /> : <SearchOutlined />}
              suffix={
                searchText ? (
                  <CloseOutlined onClick={clearSearchResults} style={{ cursor: 'pointer' }} />
                ) : null
              }
            />
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              onClick={handleSearch}
              loading={loading}
              style={{ height: 40, width: 60, marginLeft: 5 }}
            >
              Ara
            </Button>
            <Button
              type={showScanner ? "primary" : "default"}
              icon={<CameraOutlined />}
              onClick={toggleScanner}
              style={{ height: 40, width: 60, marginLeft: 5 }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Text style={{ marginRight: 8 }}>ÜRÜN / BARKOD</Text>
                <Switch 
                  checked={searchMode === 'barcode'}
                  onChange={(checked) => setSearchMode(checked ? 'barcode' : 'product')}
                  size="small"
                  checkedChildren="BARKOD"
                  unCheckedChildren="ÜRÜN"
                />
              </div>
            </div>
            {warehouseCode && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Depo: {warehouseCode}</Text>
              </div>
            )}
          </div>

          {showScanner && (
            <div style={{ marginBottom: 16 }}>
              <BarcodeScanner 
                onScan={handleBarcodeScan} 
                isScanning={showScanner}
                onScanComplete={() => {}}
              />
            </div>
          )}
        </Card>
      </div>

      <div style={{ fontWeight: 'bold', margin: '10px 0' }}>Ürün Listesi {warehouseCode ? `(${warehouseCode})` : ''}</div>
      
      <Spin spinning={loading}>
        <div style={{ overflowY: 'auto', maxHeight: '200px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
          <Table
            columns={[
              {
                title: '',
                key: 'action',
                width: 50,
                fixed: 'left',
                render: (_: any, record: Product) => (
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<PlusOutlined />} 
                    onClick={() => handleSelectProduct(record)}
                  />
                )
              },
              {
                title: 'Ürün Bilgileri',
                key: 'productInfo',
                render: (_, record: Product) => (
                  <div>
                    <div style={{ fontWeight: 500 }}>{record.itemCode}</div>
                    <div style={{ fontSize: '12px' }}>{record.itemName}</div>
                    {record.barcode && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Barkod: {record.barcode}
                      </div>
                    )}
                    {record.colorName && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Renk: {record.colorName}
                      </div>
                    )}
                    {record.stock !== undefined && (
                      <div style={{ fontSize: '12px', color: record.stock > 0 ? '#52c41a' : '#ff4d4f' }}>
                        Stok: {record.stock} {record.unitCode || 'AD'}
                      </div>
                    )}
                  </div>
                )
              }
            ]}
            dataSource={products}
            rowKey={(record) => `${record.itemCode}-${record.colorCode || ''}-${record.itemDim1Code || ''}`}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content', y: 180 }}
            style={{ fontSize: '14px' }}
            locale={{ emptyText: 'Ürün bulunamadı' }}
          />
        </div>
        {products.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Toplam {products.length} ürün - Kaydırmak için yukarı/aşağı kaydırın
          </div>
        )}
      </Spin>

      {selectedProducts.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
            <div style={{ fontWeight: 'bold' }}>Seçili Ürünler</div>
            <Button 
              size="small" 
              danger 
              icon={<CloseOutlined />} 
              onClick={clearSelectedProducts}
            >
              Temizle
            </Button>
          </div>
          
          <div style={{ overflowY: 'auto', maxHeight: '200px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
            <Table
              columns={[
                {
                  title: '',
                  key: 'action',
                  width: 50,
                  fixed: 'left',
                  render: (_: any, record: Product) => (
                    <Button 
                      type="text" 
                      danger 
                      size="small" 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleRemoveProduct(record)}
                    />
                  )
                },
                {
                  title: 'Ürün Bilgileri',
                  key: 'productInfo',
                  render: (_, record: Product) => {
                    const productKey = `${record.itemCode}-${record.colorCode || ''}-${record.itemDim1Code || ''}`;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{record.itemCode}</div>
                          <div style={{ fontSize: '12px' }}>{record.itemName}</div>
                          {record.colorName && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Renk: {record.colorName}
                            </div>
                          )}
                          {record.stock !== undefined && (
                            <div style={{ fontSize: '12px', color: record.stock > 0 ? '#52c41a' : '#ff4d4f' }}>
                              Stok: {record.stock} {record.unitCode || 'AD'}
                            </div>
                          )}
                        </div>
                        <div style={{ width: '80px', marginLeft: '10px' }}>
                          <InputNumber
                            min={1}
                            max={record.stock || 9999}
                            value={quantities[productKey] || 1}
                            onChange={(value) => handleQuantityChange(record, value as number)}
                            style={{ width: '100%' }}
                            size="small"
                          />
                          <div style={{ fontSize: '12px', textAlign: 'center', color: '#666' }}>
                            {record.unitCode || 'AD'}
                          </div>
                        </div>
                      </div>
                    );
                  }
                }
              ]}
              dataSource={selectedProducts}
              rowKey={(record) => `${record.itemCode}-${record.colorCode || ''}-${record.itemDim1Code || ''}`}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content', y: 180 }}
              style={{ fontSize: '14px' }}
            />
          </div>
          {selectedProducts.length > 0 && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Toplam {selectedProducts.length} ürün - Kaydırmak için yukarı/aşağı kaydırın
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default BarcodeModal;
