import React, { useState, useEffect } from 'react';
import { 
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Table, 
  Tabs,
  Typography,
  message,
  Modal,
  Row,
  Space
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined, 
  CloseOutlined,
  BarcodeOutlined
} from '@ant-design/icons';
import { WarehouseResponse } from '../../services/warehouseTransferApi';
import BarcodeModal from './BarcodeModal';

const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;

// Ürün satırı tipi
interface TransferItem {
  key: string;
  itemCode: string;
  itemName: string;
  colorCode?: string;
  colorName?: string;
  itemDim1Code?: string; // Beden
  itemDim1Name?: string;
  quantity: number;
  unitCode: string;
  barcode?: string;
  lineDescription?: string;
  itemTypeCode?: number; // 1: Ürün, 2: Malzeme
  currencyCode?: string; // Para birimi
  costPrice?: number; // Maliyet fiyatı
  costAmount?: number; // Maliyet tutarı
  costPriceWithInflation?: number; // Enflasyon düzeltmeli maliyet fiyatı
  costAmountWithInflation?: number; // Enflasyon düzeltmeli maliyet tutarı
  [key: string]: any; // String indeksleme için gerekli
}

// Form tipi enum
export enum FormType {
  WAREHOUSE_TRANSFER = 'warehouse_transfer', // Depolar arası transfer
  PRODUCTION_ORDER = 'production_order',     // İmalat fişi
  CONSUMPTION_ORDER = 'consumption_order'    // Sarf fişi
}

// Form props tipi
interface ProductionOrderFormProps {
  warehouses: WarehouseResponse[];
  onSave: (formData: any) => void;
  onCancel: () => void;
  formType?: FormType; // Form tipi (varsayılan: depolar arası transfer)
  loading: boolean;
  initialValues?: any;
}

const ProductionOrderForm: React.FC<ProductionOrderFormProps> = ({
  warehouses,
  onSave,
  onCancel,
  loading,
  initialValues,
  formType = FormType.WAREHOUSE_TRANSFER // Varsayılan olarak depolar arası transfer
}) => {
  const [form] = Form.useForm();
  const [items, setItems] = useState<TransferItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('header');
  const [barcodeModalVisible, setBarcodeModalVisible] = useState<boolean>(false);
  const [totalQuantity, setTotalQuantity] = useState<number>(0);

  // Form yüklendiğinde initial değerleri set et
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        sourceWarehouseCode: initialValues.sourceWarehouseCode,
        targetWarehouseCode: initialValues.targetWarehouseCode,
        description: initialValues.description || '',
        operationDate: initialValues.operationDate,
        // shippingMethod kaldırıldı, her zaman "1" değeri gönderilecek
      });

      if (initialValues.items && initialValues.items.length > 0) {
        setItems(initialValues.items.map((item: any, index: number) => ({
          key: String(index),
          ...item
        })));
      }
    }
  }, [initialValues, form]);
  
  // Warehouses prop değiştiğinde kontrol et
  useEffect(() => {
    // Depo listesi değiştiğinde yapılacak işlemler
  }, [warehouses]);

  // Toplam miktarı hesapla
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      // quantity değeri string veya number olabilir, güvenli bir şekilde parse et
      const itemQuantity = typeof item.quantity === 'string' 
        ? parseFloat(item.quantity) || 0 
        : (item.quantity || 0);
      return sum + itemQuantity;
    }, 0);
    setTotalQuantity(total);
  }, [items]);

  // Yeni satır ekle
  const addItem = () => {
    const newItem: TransferItem = {
      key: `item-${Date.now()}`,
      itemCode: '',
      itemName: '',
      quantity: 0,
      unitCode: 'AD', // Varsayılan birim
      itemTypeCode: 1, // Varsayılan olarak Ürün (1: Ürün, 2: Malzeme)
      currencyCode: 'TRY', // Varsayılan para birimi
      costPrice: 0,
      costAmount: 0,
      costPriceWithInflation: 0,
      costAmountWithInflation: 0
    };
    setItems([...items, newItem]);
  };

  // Satır sil
  const removeItem = (key: string) => {
    setItems(items.filter(item => item.key !== key));
  };

  // Satır güncelle
  const updateItem = (key: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.key === key) {
        // Değeri doğrudan güncelle
        const updatedItem = { ...item, [field]: value };
        
        // Eğer miktar veya maliyet fiyatı değiştiyse, maliyet tutarını hesapla
        if (field === 'quantity' || field === 'costPrice') {
          // Null/undefined değerleri kontrol et
          if (value === null || value === undefined) {
            return updatedItem;
          }
          
          try {
            // Hesaplama için değerleri al
            let quantity, costPrice;
            
            if (field === 'quantity') {
              // Miktar alanı güncellendi
              quantity = typeof value === 'string' ? parseFloat(value) : value;
              costPrice = typeof item.costPrice === 'string' ? parseFloat(item.costPrice) : (item.costPrice || 0);
            } else {
              // Birim fiyat alanı güncellendi
              quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 0);
              costPrice = typeof value === 'string' ? parseFloat(value) : value;
            }
            
            // NaN kontrolü
            quantity = isNaN(quantity) ? 0 : quantity;
            costPrice = isNaN(costPrice) ? 0 : costPrice;
            
            // Hassas decimal hesaplama
            const costAmount = parseFloat((quantity * costPrice).toFixed(2));
            updatedItem.costAmount = costAmount;
            
            // Enflasyon düzeltmeli değerleri de güncelle
            const costPriceWithInflation = typeof item.costPriceWithInflation === 'string' 
              ? parseFloat(item.costPriceWithInflation) 
              : (item.costPriceWithInflation || costPrice);
              
            updatedItem.costAmountWithInflation = parseFloat((quantity * costPriceWithInflation).toFixed(2));
            
            // Hesaplama işlemi yapıldı
          } catch (error) {
            console.error('Hesaplama hatası:', error);
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Barkod modalını aç
  const openBarcodeModal = () => {
    setBarcodeModalVisible(true);
  };

  // Barkod modalından ürün ekleme
  const handleAddProductsFromBarcode = (products: any[]) => {
    const newItems = products.map(product => {
      // API'den gelen itemTypeCode değeri kullanılıyor
      return {
        key: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        itemCode: product.itemCode,
        itemName: product.itemName,
        colorCode: product.colorCode,
        colorName: product.colorName,
        itemDim1Code: product.itemDim1Code,
        itemDim1Name: product.itemDim1Name,
        quantity: product.quantity,
        unitCode: product.unitCode,
        barcode: product.barcode,
        // API'den gelen itemTypeCode değerini kullan
        itemTypeCode: product.itemTypeCode,
        lineDescription: form.getFieldValue('description') && form.getFieldValue('copyDescription') ? form.getFieldValue('description') : ''
      };
    });

    setItems([...items, ...newItems]);
    setBarcodeModalVisible(false);
  };

  // Form gönderme
  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (items.length === 0) {
        message.error('En az bir ürün satırı eklemelisiniz!');
        return;
      }

      const formData = {
        ...values,
        innerProcessCode: "OC", // Sair Sarf Fişi için OC (Other Consumption) kodu
        items: items.map(item => ({
          itemCode: item.itemCode,
          colorCode: item.colorCode,
          itemDim1Code: item.itemDim1Code,
          itemDim2Code: item.itemDim2Code,
          itemDim3Code: item.itemDim3Code,
          quantity: item.quantity, // Düzeltildi: Quantity -> quantity
          unitCode: item.unitCode,
          lineDescription: item.lineDescription,
          itemTypeCode: item.itemTypeCode || 1, // Varsayılan olarak Ürün
          currencyCode: item.currencyCode || 'TRY',
          costPrice: item.costPrice || 0,
          costAmount: item.costAmount || 0,
          costPriceWithInflation: item.costPriceWithInflation || 0,
          costAmountWithInflation: item.costAmountWithInflation || 0
        }))
      };

      onSave(formData);
    }).catch(error => {
      console.error('Form validation failed:', error);
    });
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Sıra',
      dataIndex: 'key',
      key: 'key',
      width: 60,
      render: (_: any, _record: any, index: number) => index + 1
    },
    {
      title: 'Tip',
      dataIndex: 'itemTypeCode',
      key: 'itemTypeCode',
      width: 100,
      render: (text: number, record: TransferItem) => (
        <Select
          value={text || 1}
          onChange={value => updateItem(record.key, 'itemTypeCode', value)}
          size="small"
          style={{ width: '100%' }}
        >
          <Option value={1}>Ürün</Option>
          <Option value={2}>Malzeme</Option>
        </Select>
      )
    },
    {
      title: 'Ürün',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 120,
      render: (text: string, record: TransferItem) => (
        <Input 
          value={text} 
          onChange={e => updateItem(record.key, 'itemCode', e.target.value)}
          size="small"
        />
      )
    },
    {
      title: 'Açıklama',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 200,
      render: (text: string, record: TransferItem) => (
        <Input 
          value={text} 
          onChange={e => updateItem(record.key, 'itemName', e.target.value)}
          size="small"
        />
      )
    },
    {
      title: 'Miktar',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (text: number, record: TransferItem) => (
        <InputNumber 
          value={text} 
          onChange={value => {
            updateItem(record.key, 'quantity', value);
            // Miktar değiştiğinde maliyet tutarını otomatik hesapla
            const quantity = value || 0;
            const costPrice = record.costPrice || 0;
            updateItem(record.key, 'costAmount', quantity * costPrice);
          }}
          size="small"
          min={0}
          precision={record.itemTypeCode === 2 ? 2 : 0} // Malzeme için ondalıklı, ürün için tam sayı
          step={record.itemTypeCode === 2 ? 0.01 : 1} // Malzeme için 0.01 adım, ürün için 1 adım
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Para Birimi',
      dataIndex: 'currencyCode',
      key: 'currencyCode',
      width: 100,
      render: (text: string, record: TransferItem) => (
        <Select
          value={text || 'TRY'}
          onChange={value => updateItem(record.key, 'currencyCode', value)}
          size="small"
          style={{ width: '100%' }}
        >
          <Option value="TRY">TRY</Option>
          <Option value="USD">USD</Option>
          <Option value="EUR">EUR</Option>
          <Option value="GBP">GBP</Option>
        </Select>
      )
    },
    {
      title: 'Maliyet Fiyatı',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 120,
      render: (text: number, record: TransferItem) => (
        <InputNumber
          value={text || 0}
          onChange={value => {
            updateItem(record.key, 'costPrice', value);
            // Maliyet tutarını hesapla
            const quantity = record.quantity || 0;
            const costPrice = value || 0;
            updateItem(record.key, 'costAmount', quantity * costPrice);
          }}
          size="small"
          precision={2}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Maliyet Tutarı',
      dataIndex: 'costAmount',
      key: 'costAmount',
      width: 120,
      render: (text: number, record: TransferItem) => (
        <InputNumber
          value={text || 0}
          disabled={true} // Otomatik hesaplanacak
          size="small"
          precision={2}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'İşlem',
      key: 'action',
      width: 80,
      render: (_: any, record: TransferItem) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => removeItem(record.key)}
          size="small"
        />
      )
    }
  ];

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <Card style={{ padding: '5px' }}>
      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{
        operationDate: new Date().toISOString().split('T')[0],
      }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Başlık" key="header">
            <Row gutter={8}>
              <Col span={24}>
                <Card size="small" styles={{ body: { padding: '5px' } }}>

                  <Form.Item
                    name="targetWarehouseCode"
                    label="Depo"
                    rules={[{ required: true, message: 'Lütfen depo seçin!' }]}
                  >
                    <Select 
                      placeholder="Depo seçin" 
                      size="large" 
                      style={{ width: '100%' }}
                    >
                      {warehouses.map(warehouse => (
                          <Select.Option 
                            key={warehouse.warehouseCode} 
                            value={warehouse.warehouseCode}
                          >
                            {`${warehouse.warehouseCode} - ${warehouse.warehouseDescription}`}
                          </Select.Option>
                        ))}
                    </Select>
                  </Form.Item>
                
                  
                  <Form.Item
                    name="operationDate"
                    label="İşlem Tarihi"
                    rules={[{ required: true, message: 'Lütfen işlem tarihi girin!' }]}
                  >
                    <Input type="date" size="large" style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Açıklama"
                  >
                    <Input.TextArea rows={2} size="large" style={{ width: '100%' }} />
                  </Form.Item>
                  
                  {/* Sevkiyat Yöntemi seçeneği kaldırıldı, her zaman "1" değeri gönderilecek */}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Satırlar" key="items">
            <Card
              size="small"
              styles={{ body: { padding: '5px' } }}
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setBarcodeModalVisible(true)}
                  size="large"
                  style={{ width: '100%' }}
                >
                  Satır Ekle
                </Button>
              }
            >
            <div style={{ marginBottom: 16 }}>
              <Form.Item name="copyDescription" valuePropName="checked" noStyle>
                <Checkbox>Açıklamayı Yeni Satıra Kopyala</Checkbox>
              </Form.Item>
            </div>

            <div style={{ border: '1px solid #f0f0f0', borderRadius: '4px' }}>
              {items.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  Ürün satırı eklemek için "Satır Ekle" butonunu kullanın
                </div>
              )}
              
              {items.map((item, index) => (
                <div key={item.key} style={{ 
                  padding: '10px', 
                  borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  {/* Ürün Bilgisi */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontWeight: 500 }}>{item.itemCode || '-'}</div>
                    <div style={{ 
                      color: '#666', 
                      fontSize: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{item.itemName || 'Ürün açıklaması'}</div>
                  </div>
                  
                  {/* Kontroller - Mobil uyumlu grid yapısı */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: formType === FormType.WAREHOUSE_TRANSFER 
                      ? 'minmax(70px, 1fr) 40px' // Depolar arası transfer için sadece miktar ve silme butonu
                      : 'repeat(auto-fit, minmax(70px, 1fr))', // İmalat ve Sarf fişleri için tüm alanlar
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    {/* Miktar */}
                    <div>
                      <Input
                        type="text"
                        value={item.quantity !== null && item.quantity !== undefined ? String(item.quantity) : ''}
                        onChange={(e) => {
                          // Sadece sayı ve nokta karakterlerine izin ver
                          const inputValue = e.target.value.replace(/[^0-9.]/g, '');
                          
                          // Birden fazla nokta varsa, sadece ilkini kabul et
                          const parts = inputValue.split('.');
                          const cleanedValue = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                          
                          // Değeri doğrudan güncelle
                          updateItem(item.key, 'quantity', cleanedValue);
                        }}
                        size="small"
                        style={{ width: '100%' }}
                        placeholder="0.000"
                      />
                      <div style={{ textAlign: 'center', fontSize: '11px', color: '#999' }}>
                        {String(item.unitCode || 'AD')}
                      </div>
                    </div>
                    
                    {/* İmalat ve Sarf fişleri için maliyet alanları */}
                    {formType !== FormType.WAREHOUSE_TRANSFER && (
                      <>
                        {/* Birim Maliyet */}
                        <div>
                          <Input
                            type="text"
                            value={item.costPrice !== null && item.costPrice !== undefined ? String(item.costPrice) : ''}
                            onChange={(e) => {
                              // Sadece sayı ve nokta karakterlerine izin ver
                              const inputValue = e.target.value.replace(/[^0-9.]/g, '');
                              
                              // Birden fazla nokta varsa, sadece ilkini kabul et
                              const parts = inputValue.split('.');
                              const cleanedValue = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                              
                              // Değeri doğrudan güncelle
                              updateItem(item.key, 'costPrice', cleanedValue);
                            }}
                            size="small"
                            style={{ width: '100%' }}
                            placeholder="0.00"
                          />
                          <div style={{ textAlign: 'center', fontSize: '11px', color: '#999' }}>Birim Fiyat</div>
                        </div>
                        
                        {/* Para birimi */}
                        <div>
                          <Select
                            value={item.currencyCode || 'TRY'}
                            onChange={(value) => updateItem(item.key, 'currencyCode', value)}
                            size="small"
                            style={{ width: '100%' }}
                          >
                            <Option value="TRY">TRY</Option>
                            <Option value="USD">USD</Option>
                            <Option value="EUR">EUR</Option>
                            <Option value="GBP">GBP</Option>
                          </Select>
                          <div style={{ textAlign: 'center', fontSize: '11px', color: '#999' }}>Para</div>
                        </div>
                        
                        {/* Toplam Maliyet */}
                        <div>
                          <Input
                            type="text"
                            value={item.costAmount !== null && item.costAmount !== undefined ? String(item.costAmount) : ''}
                            disabled={true}
                            size="small"
                            style={{ width: '100%' }}
                          />
                          <div style={{ textAlign: 'center', fontSize: '11px', color: '#999' }}>Maliyet</div>
                        </div>
                      </>
                    )}
                    
                    {/* Silme Butonu */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeItem(item.key)}
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Card size="small" styles={{ body: { padding: '5px' } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Toplam Adet:</Text>
                  <Text strong>{typeof totalQuantity === 'number' ? totalQuantity.toFixed(2) : '0.00'}</Text>
                </div>
              </Card>
            </div>
            </Card>
          </TabPane>
        </Tabs>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel} icon={<CloseOutlined />}>
            İptal
          </Button>
          <Button 
            type="primary" 
            loading={loading}
            icon={<SaveOutlined />}
            onClick={handleSubmit}
          >
            Kaydet
          </Button>
        </div>
      </Form>

      {/* Barkod ile Ürün Ekleme Modalı */}
      <BarcodeModal
        visible={barcodeModalVisible}
        onCancel={() => setBarcodeModalVisible(false)}
        onAdd={handleAddProductsFromBarcode}
        warehouseCode={form.getFieldValue('sourceWarehouseCode') || ''}
      />
    </Card>
  );
};

export default ProductionOrderForm;
