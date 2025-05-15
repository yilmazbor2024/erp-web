import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, message, Tag, Space, Divider, Modal, Tabs, Table, Statistic, Row, Col, Timeline } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, ExclamationCircleOutlined, BarcodeOutlined, TagOutlined, HistoryOutlined, ShoppingCartOutlined, ShoppingOutlined, DollarOutlined, FileSearchOutlined, PrinterOutlined } from '@ant-design/icons';
import productApi from '../../services/productApi';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';

const { confirm } = Modal;
const { TabPane } = Tabs;

const ProductDetail: React.FC = () => {
  const { productCode } = useParams<{ productCode: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('1');

  // Ürün detayını çek
  const { data: product, isLoading, error, refetch } = useQuery(
    ['product', productCode],
    () => productApi.getProductDetail(productCode!),
    {
      enabled: isAuthenticated && !!productCode,
      onError: (err: any) => {
        message.error(`Ürün detayı yüklenirken hata oluştu: ${err.message}`);
      }
    }
  );

  // Ürün silme işlemi
  const handleDeleteProduct = () => {
    confirm({
      title: 'Bu ürünü silmek istediğinizden emin misiniz?',
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await productApi.deleteProduct(productCode!);
          message.success('Ürün başarıyla silindi');
          navigate('/products');
        } catch (error: any) {
          message.error(`Ürün silme işlemi başarısız: ${error.message}`);
        }
      }
    });
  };

  // Yazdırma işlemi
  const handlePrint = () => {
    message.info('Ürün yazdırma özelliği yakında eklenecek');
  };

  // Yükleme durumu
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Ürün detayı yükleniyor..." />
      </div>
    );
  }

  // Hata durumu
  if (error || !product) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/products')}
            className="mr-4"
          >
            Geri
          </Button>
          <h1 className="text-2xl font-semibold">Ürün Bulunamadı</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Ürün detayı yüklenirken bir hata oluştu veya ürün bulunamadı.
        </div>
      </div>
    );
  }

  // Örnek stok verileri (gerçek veriler API'den gelecek)
  const stockData = [
    { location: 'Ana Depo', quantity: 120, reserved: 20, available: 100 },
    { location: 'Mağaza 1', quantity: 45, reserved: 5, available: 40 },
    { location: 'Mağaza 2', quantity: 30, reserved: 0, available: 30 }
  ];

  // Örnek fiyat verileri (gerçek veriler API'den gelecek)
  const priceData = [
    { type: 'Alış Fiyatı', price: '120,50 ₺', currency: 'TRY', date: '01.04.2025' },
    { type: 'Satış Fiyatı', price: '150,00 ₺', currency: 'TRY', date: '01.04.2025' },
    { type: 'İhracat Fiyatı', price: '12,50 €', currency: 'EUR', date: '01.04.2025' }
  ];

  // Örnek barkod verileri (gerçek veriler API'den gelecek)
  const barcodeData = [
    { barcode: '8680123456789', type: 'EAN-13', isDefault: true },
    { barcode: '8680123456790', type: 'EAN-13', isDefault: false }
  ];

  // Örnek hareket verileri (gerçek veriler API'den gelecek)
  const movementData = [
    { date: '02.05.2025 14:30', type: 'Satış', document: 'FTR-2025-0001', quantity: -2, location: 'Ana Depo', user: 'Ali Yılmaz' },
    { date: '01.05.2025 10:15', type: 'Alım', document: 'ALM-2025-0003', quantity: 10, location: 'Ana Depo', user: 'Mehmet Demir' },
    { date: '28.04.2025 16:45', type: 'Transfer', document: 'TRN-2025-0002', quantity: -5, location: 'Ana Depo', user: 'Ayşe Kaya' },
    { date: '28.04.2025 16:45', type: 'Transfer', document: 'TRN-2025-0002', quantity: 5, location: 'Mağaza 1', user: 'Ayşe Kaya' }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/products')}
            className="mr-4"
          >
            Geri
          </Button>
          <h1 className="text-2xl font-semibold">{product.productDescription}</h1>
          {product.isBlocked && <Tag color="red" className="ml-4">Pasif</Tag>}
        </div>
        <div>
          <Button 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            className="mr-2"
          >
            Yazdır
          </Button>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/products/edit/${productCode}`)}
            className="mr-2"
          >
            Düzenle
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleDeleteProduct}
          >
            Sil
          </Button>
        </div>
      </div>

      {/* Özet bilgiler */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Toplam Stok"
              value={195}
              suffix="Adet"
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Rezerve Stok"
              value={25}
              suffix="Adet"
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Satış Fiyatı"
              value={150.00}
              precision={2}
              suffix="₺"
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Son Hareket"
              value="2 gün önce"
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="1" onChange={setActiveTab} className="mb-6">
        <TabPane tab="Genel Bilgiler" key="1">
          <Card>
            <Descriptions title="Ürün Bilgileri" bordered column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
              <Descriptions.Item label="Ürün Kodu">{product.productCode}</Descriptions.Item>
              <Descriptions.Item label="Ürün Adı">{product.productDescription}</Descriptions.Item>
              <Descriptions.Item label="Ürün Tipi">{product.productTypeDescription}</Descriptions.Item>
              <Descriptions.Item label="Boyut Tipi">{product.itemDimTypeDescription}</Descriptions.Item>
              <Descriptions.Item label="Ölçü Birimi 1">{product.unitOfMeasureCode1}</Descriptions.Item>
              <Descriptions.Item label="Ölçü Birimi 2">{product.unitOfMeasureCode2 || '-'}</Descriptions.Item>
              <Descriptions.Item label="Marka">{product.companyBrandCode?.replace(/[{}]/g, '') || '-'}</Descriptions.Item>
              <Descriptions.Item label="Durum">{product.isBlocked ? 'Pasif' : 'Aktif'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${product.usePOS ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>POS Kullanımı</span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${product.useStore ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Mağaza Kullanımı</span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${product.useRoll ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Rulo Kullanımı</span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${product.useBatch ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Parti Takibi</span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${product.generateSerialNumber ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Seri No Oluşturma</span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${product.useSerialNumber ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Seri No Kullanımı</span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${product.isUTSDeclaratedItem ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>ÜTS Bildirimi</span>
              </div>
            </div>

            <Divider />

            <Descriptions title="Sistem Bilgileri" bordered column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
              <Descriptions.Item label="Oluşturulma Tarihi">
                {product.createdDate ? moment(product.createdDate).format('DD.MM.YYYY HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Son Güncelleme Tarihi">
                {product.lastUpdatedDate ? moment(product.lastUpdatedDate).format('DD.MM.YYYY HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </TabPane>

        <TabPane tab={<span><ShoppingOutlined /> Stok Bilgileri</span>} key="2">
          <Card>
            <Table 
              dataSource={stockData} 
              rowKey="location"
              pagination={false}
              columns={[
                { title: 'Lokasyon', dataIndex: 'location', key: 'location' },
                { title: 'Toplam Stok', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Rezerve', dataIndex: 'reserved', key: 'reserved' },
                { title: 'Kullanılabilir', dataIndex: 'available', key: 'available' },
                { 
                  title: 'Durum', 
                  key: 'status',
                  render: (_, record) => (
                    <Tag color={record.available > 0 ? 'green' : 'red'}>
                      {record.available > 0 ? 'Stokta Var' : 'Stokta Yok'}
                    </Tag>
                  )
                }
              ]} 
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><DollarOutlined /> Fiyat Bilgileri</span>} key="3">
          <Card>
            <Table 
              dataSource={priceData} 
              rowKey="type"
              pagination={false}
              columns={[
                { title: 'Fiyat Tipi', dataIndex: 'type', key: 'type' },
                { title: 'Fiyat', dataIndex: 'price', key: 'price' },
                { title: 'Para Birimi', dataIndex: 'currency', key: 'currency' },
                { title: 'Geçerlilik Tarihi', dataIndex: 'date', key: 'date' }
              ]} 
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><BarcodeOutlined /> Barkod Bilgileri</span>} key="4">
          <Card>
            <Table 
              dataSource={barcodeData} 
              rowKey="barcode"
              pagination={false}
              columns={[
                { title: 'Barkod', dataIndex: 'barcode', key: 'barcode' },
                { title: 'Barkod Tipi', dataIndex: 'type', key: 'type' },
                { 
                  title: 'Varsayılan', 
                  key: 'isDefault',
                  render: (_, record) => (
                    record.isDefault ? <Tag color="blue">Varsayılan</Tag> : '-'
                  )
                }
              ]} 
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><HistoryOutlined /> Hareketler</span>} key="5">
          <Card>
            <Table 
              dataSource={movementData} 
              rowKey={(record, index) => `${record.date}-${index}`}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: 'Tarih', dataIndex: 'date', key: 'date', sorter: (a, b) => a.date.localeCompare(b.date) },
                { 
                  title: 'İşlem Tipi', 
                  dataIndex: 'type', 
                  key: 'type',
                  render: (text) => {
                    const color = text === 'Alım' ? 'green' : text === 'Satış' ? 'red' : 'blue';
                    return <Tag color={color}>{text}</Tag>;
                  }
                },
                { title: 'Belge No', dataIndex: 'document', key: 'document' },
                { 
                  title: 'Miktar', 
                  dataIndex: 'quantity', 
                  key: 'quantity',
                  render: (text) => <span className={text < 0 ? 'text-red-500' : 'text-green-500'}>{text}</span>
                },
                { title: 'Lokasyon', dataIndex: 'location', key: 'location' },
                { title: 'Kullanıcı', dataIndex: 'user', key: 'user' }
              ]} 
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ProductDetail;
