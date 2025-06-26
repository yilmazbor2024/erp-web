import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Tabs, 
  Table, 
  Space, 
  Typography, 
  Divider, 
  message,
  Modal,
  InputNumber,
  Row,
  Col,
  Checkbox
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
  [key: string]: any; // String indeksleme için gerekli
}

// Form props tipi
interface WarehouseTransferFormProps {
  warehouses: WarehouseResponse[];
  onSave: (formData: any) => void;
  onCancel: () => void;
  loading: boolean;
  initialValues?: any;
}

const WarehouseTransferForm: React.FC<WarehouseTransferFormProps> = ({
  warehouses,
  onSave,
  onCancel,
  loading,
  initialValues
}) => {
  const [form] = Form.useForm();
  const [items, setItems] = useState<TransferItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('header');
  const [barcodeModalVisible, setBarcodeModalVisible] = useState<boolean>(false);
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const [sourceWarehouse, setSourceWarehouse] = useState<string>('');

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
    const total = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
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
        return { ...item, [field]: value };
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
    const newItems = products.map(product => ({
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
      lineDescription: form.getFieldValue('description') && form.getFieldValue('copyDescription') ? form.getFieldValue('description') : ''
    }));

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
        items: items.map(item => ({
          itemCode: item.itemCode,
          colorCode: item.colorCode,
          itemDim1Code: item.itemDim1Code,
          quantity: item.quantity,
          unitCode: item.unitCode,
          lineDescription: item.lineDescription
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
          onChange={value => updateItem(record.key, 'quantity', value)}
          size="small"
          min={0}
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
    <Card styles={{ body: { padding: '5px' } }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          operationDate: new Date().toISOString().split('T')[0],
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Başlık" key="header">
            <Row gutter={8}>
              <Col span={24}>
                <Card size="small" styles={{ body: { padding: '5px' } }}>
                  <Form.Item
                    name="sourceWarehouseCode"
                    label="Gönderen Depo"
                    rules={[{ required: true, message: 'Lütfen gönderen depo seçin!' }]}
                  >
                    <Select 
                      placeholder="Depo seçin" 
                      size="large" 
                      style={{ width: '100%' }}
                      onChange={(value) => {
                        console.log('Kaynak depo seçildi:', value);
                        setSourceWarehouse(value as string);
                        // Eğer hedef depo olarak aynı depo seçilmişse, hedef depoyu temizle
                        if (value === form.getFieldValue('targetWarehouseCode')) {
                          form.setFieldsValue({ targetWarehouseCode: undefined });
                        }
                      }}
                    >
                      {warehouses.map(warehouse => {
                        // Depo render ediliyor
                        return (
                          <Select.Option 
                            key={warehouse.warehouseCode} 
                            value={warehouse.warehouseCode}
                          >
                            {`${warehouse.warehouseCode} - ${warehouse.warehouseDescription || 'İsimsiz Depo'}`}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="targetWarehouseCode"
                    label="Teslim Alan Depo"
                    rules={[{ required: true, message: 'Lütfen teslim alan depo seçin!' }]}
                  >
                    <Select 
                      placeholder="Depo seçin" 
                      size="large" 
                      style={{ width: '100%' }}
                      onChange={(value) => {
                        // Depo render ediliyor
                      }}
                    >
                      {warehouses
                        .filter(warehouse => warehouse.warehouseCode !== sourceWarehouse) // Kaynak depo ile aynı olanı gösterme
                        .map(warehouse => {
                          return (
                            <Select.Option 
                              key={warehouse.warehouseCode} 
                              value={warehouse.warehouseCode}
                              disabled={warehouse.warehouseCode === sourceWarehouse}
                            >
                              {`${warehouse.warehouseCode} - ${warehouse.warehouseDescription || 'İsimsiz Depo'}`}
                            </Select.Option>
                          );
                        })}
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
                  display: 'flex', 
                  padding: '10px', 
                  borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{item.itemCode || '-'}</div>
                    <div style={{ 
                      color: '#666', 
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{item.itemName || 'Ürün açıklaması'}</div>
                  </div>
                  <div style={{ width: '80px', margin: '0 10px' }}>
                    <InputNumber
                      value={item.quantity}
                      onChange={(value) => updateItem(item.key, 'quantity', value)}
                      min={0}
                      size="middle"
                      style={{ width: '100%' }}
                    />
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#999' }}>
                      {item.unitCode || 'AD'}
                    </div>
                  </div>
                  <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeItem(item.key)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Card size="small" styles={{ body: { padding: '5px' } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Toplam Adet:</Text>
                  <Text strong>{totalQuantity.toFixed(2)}</Text>
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

export default WarehouseTransferForm;
