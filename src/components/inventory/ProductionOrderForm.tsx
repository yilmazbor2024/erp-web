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
import { WarehouseResponse } from '../../services/productionOrderApi';
import BarcodeModal from './BarcodeModal';

const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;

// Ürün satırı tipi
interface ProductionItem {
  key: string;
  itemCode: string;
  itemName: string;
  colorCode?: string;
  colorName?: string;
  itemDim1Code?: string; // Beden
  itemDim1Name?: string;
  quantity: number;
  unitCode: string;
  unitName?: string;
  barcode?: string;
  lineDescription?: string;
  [key: string]: any; // String indeksleme için gerekli
}

// Form props tipi
interface ProductionOrderFormProps {
  warehouses: WarehouseResponse[];
  onSave: (formData: any) => void;
  onCancel: () => void;
  loading: boolean;
  initialValues?: any;
}

const ProductionOrderForm: React.FC<ProductionOrderFormProps> = ({
  warehouses,
  onSave,
  onCancel,
  loading,
  initialValues
}) => {
  const [form] = Form.useForm();
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('header');
  const [barcodeModalVisible, setBarcodeModalVisible] = useState<boolean>(false);
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const [targetWarehouse, setTargetWarehouse] = useState<string>('');

  // Form yüklendiğinde initial değerleri set et
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        targetWarehouseCode: initialValues.targetWarehouseCode,
        description: initialValues.description || '',
        operationDate: initialValues.operationDate,
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

  // Form gönderme işlemi
  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        // Form değerlerini ve ürün satırlarını birleştir
        const formData = {
          ...values,
          items: items.map(item => ({
            itemCode: item.itemCode,
            colorCode: item.colorCode || '',
            itemDim1Code: item.itemDim1Code || '',
            quantity: item.quantity,
            unitCode: item.unitCode || 'AD',
            lineDescription: item.lineDescription || '',
            barcode: item.barcode || ''
          }))
        };
        
        onSave(formData);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
        message.error('Lütfen form alanlarını kontrol ediniz');
      });
  };

  // Yeni ürün satırı ekleme
  const handleAddItem = () => {
    const newItem: ProductionItem = {
      key: Date.now().toString(),
      itemCode: '',
      itemName: '',
      quantity: 0,
      unitCode: 'AD',
      unitName: 'Adet'
    };
    
    setItems([...items, newItem]);
    
    // Otomatik olarak ürünler tabına geç
    setActiveTab('items');
  };

  // Ürün satırı silme
  const handleDeleteItem = (key: string) => {
    setItems(items.filter(item => item.key !== key));
  };

  // Ürün satırı güncelleme
  const handleItemChange = (key: string, field: string, value: any) => {
    const newItems = items.map(item => {
      if (item.key === key) {
        return { ...item, [field]: value };
      }
      return item;
    });
    
    setItems(newItems);
  };

  // Barkod modalını açma
  const handleOpenBarcodeModal = () => {
    setBarcodeModalVisible(true);
  };

  // Barkod okutma işlemi
  const handleBarcodeScanned = (barcode: string) => {
    // Burada barkod okutma işlemi yapılacak
    // Gerçek uygulamada bu barkoda göre ürün bilgilerini getiren bir API çağrısı yapılabilir
    message.info(`Barkod okutuldu: ${barcode}`);
    setBarcodeModalVisible(false);
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Stok Kodu',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 150,
      render: (text: string, record: ProductionItem) => (
        <Input
          value={text}
          onChange={(e) => handleItemChange(record.key, 'itemCode', e.target.value)}
          placeholder="Stok Kodu"
        />
      )
    },
    {
      title: 'Stok Adı',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 200,
      render: (text: string, record: ProductionItem) => (
        <Input
          value={text}
          onChange={(e) => handleItemChange(record.key, 'itemName', e.target.value)}
          placeholder="Stok Adı"
        />
      )
    },
    {
      title: 'Renk',
      dataIndex: 'colorCode',
      key: 'colorCode',
      width: 120,
      render: (text: string, record: ProductionItem) => (
        <Input
          value={text}
          onChange={(e) => handleItemChange(record.key, 'colorCode', e.target.value)}
          placeholder="Renk Kodu"
        />
      )
    },
    {
      title: 'Beden',
      dataIndex: 'itemDim1Code',
      key: 'itemDim1Code',
      width: 120,
      render: (text: string, record: ProductionItem) => (
        <Input
          value={text}
          onChange={(e) => handleItemChange(record.key, 'itemDim1Code', e.target.value)}
          placeholder="Beden Kodu"
        />
      )
    },
    {
      title: 'Miktar',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (text: number, record: ProductionItem) => (
        <InputNumber
          min={0}
          value={text}
          onChange={(value) => handleItemChange(record.key, 'quantity', value)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Birim',
      dataIndex: 'unitCode',
      key: 'unitCode',
      width: 100,
      render: (text: string, record: ProductionItem) => (
        <Select
          value={text || 'AD'}
          onChange={(value) => handleItemChange(record.key, 'unitCode', value)}
          style={{ width: '100%' }}
        >
          <Option value="AD">Adet</Option>
          <Option value="KG">Kg</Option>
          <Option value="MT">Metre</Option>
        </Select>
      )
    },
    {
      title: 'Açıklama',
      dataIndex: 'lineDescription',
      key: 'lineDescription',
      render: (text: string, record: ProductionItem) => (
        <Input
          value={text}
          onChange={(e) => handleItemChange(record.key, 'lineDescription', e.target.value)}
          placeholder="Açıklama"
        />
      )
    },
    {
      title: 'İşlem',
      key: 'action',
      width: 80,
      render: (_: any, record: ProductionItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteItem(record.key)}
        />
      )
    }
  ];

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          operationDate: new Date().toISOString().split('T')[0], // Bugünün tarihi
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Fiş Bilgileri" key="header">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="targetWarehouseCode"
                  label="Hedef Depo"
                  rules={[{ required: true, message: 'Lütfen hedef depo seçiniz' }]}
                >
                  <Select
                    placeholder="Hedef depo seçiniz"
                    onChange={(value) => setTargetWarehouse(value)}
                    showSearch
                    optionFilterProp="children"
                  >
                    {warehouses.map(warehouse => (
                      <Option key={warehouse.warehouseCode} value={warehouse.warehouseCode}>
                        {warehouse.warehouseName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  name="operationDate"
                  label="İşlem Tarihi"
                  rules={[{ required: true, message: 'Lütfen işlem tarihi giriniz' }]}
                >
                  <Input type="date" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="description"
              label="Açıklama"
            >
              <Input.TextArea rows={4} placeholder="Fiş açıklaması giriniz" />
            </Form.Item>
          </TabPane>
          
          <TabPane tab="Ürünler" key="items">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddItem}
                >
                  Yeni Ürün Ekle
                </Button>
                
                <Button
                  icon={<BarcodeOutlined />}
                  onClick={handleOpenBarcodeModal}
                >
                  Barkod Okut
                </Button>
              </Space>
              
              <Text strong>
                Toplam Miktar: {totalQuantity}
              </Text>
            </div>
            
            <Table
              columns={columns}
              dataSource={items}
              rowKey="key"
              size="small"
              pagination={false}
              scroll={{ x: 1000, y: 300 }}
              bordered
            />
            
            {items.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text type="secondary">Henüz ürün eklenmedi</Text>
              </div>
            )}
          </TabPane>
        </Tabs>
        
        <Divider />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button
              icon={<CloseOutlined />}
              onClick={onCancel}
            >
              İptal
            </Button>
            
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={loading}
              disabled={items.length === 0}
            >
              Kaydet
            </Button>
          </Space>
        </div>
      </Form>
      
      <BarcodeModal
        visible={barcodeModalVisible}
        onCancel={() => setBarcodeModalVisible(false)}
        onScan={handleBarcodeScanned}
        onAdd={(products) => {
          // Taranan ürünleri listeye ekle
          if (products && products.length > 0) {
            const newItems = products.map(product => ({
              key: Date.now() + Math.random().toString(),
              itemCode: product.itemCode,
              itemName: product.itemName,
              colorCode: product.colorCode,
              colorName: product.colorName,
              itemDim1Code: product.itemDim1Code,
              itemDim1Name: product.itemDim1Name,
              quantity: product.quantity || 1,
              unitCode: product.unitCode || 'AD',
              unitName: 'Adet', // Sabit değer kullanıyoruz çünkü ScannedProduct tipinde unitName yok
              barcode: product.barcode
            }));
            setItems([...items, ...newItems]);
          }
        }}
      />
    </Card>
  );
};

export default ProductionOrderForm;
