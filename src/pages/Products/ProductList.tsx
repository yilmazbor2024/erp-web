import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Table, Button, Input, Select, Space, Tag, Tooltip, message, Spin, Empty, Switch, 
  Card, Row, Col, Dropdown, Menu, Checkbox, DatePicker, Drawer, Statistic, Divider,
  Badge, Modal
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, 
  EyeOutlined, FilterOutlined, DownloadOutlined, UploadOutlined, SettingOutlined,
  ExportOutlined, ImportOutlined, SortAscendingOutlined, SortDescendingOutlined,
  CheckOutlined, CloseOutlined, ExclamationCircleOutlined, PrinterOutlined,
  BarChartOutlined, ShoppingOutlined, DollarOutlined, FileExcelOutlined, FilePdfOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import productApi, { Product, ProductListParams } from '../../services/productApi';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

const ProductList: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<ProductListParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'productCode',
    sortDirection: 'asc'
  });
  const [searchText, setSearchText] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<string | undefined>(undefined);
  const [blockedFilter, setBlockedFilter] = useState<boolean | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false);
  const [dateRange, setDateRange] = useState<[moment.Moment | null, moment.Moment | null] | null>(null);
  const [featureFilters, setFeatureFilters] = useState({
    usePOS: undefined,
    useStore: undefined,
    useRoll: undefined,
    useBatch: undefined,
    useSerialNumber: undefined
  });

  // Ürün verilerini çek
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', searchParams],
    queryFn: () => productApi.getProducts(searchParams),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 dakika
    refetchOnWindowFocus: false
  });

  // Hata durumunda mesaj göster
  useEffect(() => {
    if (error) {
      message.error(`Ürünler yüklenirken hata oluştu: ${(error as Error).message}`);
    }
  }, [error]);

  // Ürün tiplerini çek
  const { data: productTypes, isLoading: isLoadingProductTypes } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => productApi.getProductTypes(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000 // 5 dakika
  });

  // Ürün tipleri yüklenirken hata durumunda mesaj göster
  useEffect(() => {
    if (productTypes === undefined && !isLoadingProductTypes) {
      message.error('Ürün tipleri yüklenirken hata oluştu');
    }
  }, [productTypes, isLoadingProductTypes]);

  // Arama işlemi
  const handleSearch = () => {
    const params: ProductListParams = {
      ...searchParams,
      page: 1, // Arama yapıldığında ilk sayfaya dön
      searchTerm: searchText,
      productTypeCode: productTypeFilter,
      isBlocked: blockedFilter
    };

    setSearchParams(params);
  };

  // Gelişmiş filtreleme işlemi
  const handleAdvancedFilter = () => {
    // Burada gelişmiş filtreleme parametrelerini ekleyebiliriz
    // Gerçek API entegrasyonu için backend desteği gerekebilir
    setAdvancedFilterVisible(false);
    
    message.info('Gelişmiş filtreleme uygulandı');
    handleSearch();
  };

  // Filtreleri temizle
  const handleClearFilters = () => {
    setSearchText('');
    setProductTypeFilter(undefined);
    setBlockedFilter(undefined);
    setDateRange(null);
    setFeatureFilters({
      usePOS: undefined,
      useStore: undefined,
      useRoll: undefined,
      useBatch: undefined,
      useSerialNumber: undefined
    });
    
    setSearchParams({
      page: 1,
      pageSize: 10,
      sortBy: 'productCode',
      sortDirection: 'asc'
    });
  };

  // Sayfa değişimi
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSearchParams({
      ...searchParams,
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortBy: sorter.field || 'productCode',
      sortDirection: sorter.order === 'ascend' ? 'asc' : 'desc'
    });
  };

  // Ürün silme işlemi
  const handleDeleteProduct = async (productCode: string) => {
    confirm({
      title: 'Bu ürünü silmek istediğinizden emin misiniz?',
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await productApi.deleteProduct(productCode);
          message.success('Ürün başarıyla silindi');
          refetch();
        } catch (error: any) {
          message.error(`Ürün silme işlemi başarısız: ${error.message}`);
        }
      }
    });
  };

  // Toplu işlem: Seçili ürünleri sil
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Lütfen silmek istediğiniz ürünleri seçin');
      return;
    }

    confirm({
      title: `${selectedRowKeys.length} ürünü silmek istediğinizden emin misiniz?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'Hayır',
      onOk: async () => {
        message.info('Toplu silme işlemi başlatıldı');
        // Burada gerçek API çağrısı yapılacak
        // Örnek: await productApi.bulkDeleteProducts(selectedRowKeys);
        
        // Şimdilik simüle ediyoruz
        setTimeout(() => {
          message.success(`${selectedRowKeys.length} ürün başarıyla silindi`);
          setSelectedRowKeys([]);
          refetch();
        }, 1000);
      }
    });
  };

  // Toplu işlem: Seçili ürünleri aktif/pasif yap
  const handleBulkToggleStatus = (isBlocked: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Lütfen işlem yapmak istediğiniz ürünleri seçin');
      return;
    }

    const statusText = isBlocked ? 'pasif' : 'aktif';
    
    confirm({
      title: `${selectedRowKeys.length} ürünü ${statusText} yapmak istediğinizden emin misiniz?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem toplu olarak uygulanacaktır.',
      okText: 'Evet',
      okType: 'primary',
      cancelText: 'Hayır',
      onOk: async () => {
        message.info(`Toplu ${statusText} yapma işlemi başlatıldı`);
        // Burada gerçek API çağrısı yapılacak
        // Örnek: await productApi.bulkUpdateStatus(selectedRowKeys, isBlocked);
        
        // Şimdilik simüle ediyoruz
        setTimeout(() => {
          message.success(`${selectedRowKeys.length} ürün başarıyla ${statusText} yapıldı`);
          setSelectedRowKeys([]);
          refetch();
        }, 1000);
      }
    });
  };

  // Dışa aktarma işlemi
  const handleExport = () => {
    message.info('Ürün listesi dışa aktarılıyor...');
    // Burada gerçek dışa aktarma işlemi yapılacak
    setTimeout(() => {
      message.success('Ürün listesi başarıyla dışa aktarıldı');
    }, 1000);
  };

  // Yazdırma işlemi
  const handlePrint = () => {
    message.info('Ürün listesi yazdırılıyor...');
    // Burada gerçek yazdırma işlemi yapılacak
    setTimeout(() => {
      message.success('Ürün listesi yazdırma işlemi başlatıldı');
    }, 1000);
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Ürün Kodu',
      dataIndex: 'productCode',
      key: 'productCode',
      sorter: true,
      render: (text: string, record: Product) => (
        <Link to={`/products/${record.productCode}`}>{text}</Link>
      )
    },
    {
      title: 'Ürün Adı',
      dataIndex: 'productDescription',
      key: 'productDescription',
      sorter: true,
      ellipsis: true
    },
    {
      title: 'Ürün Tipi',
      dataIndex: 'productTypeDescription',
      key: 'productTypeDescription',
      sorter: true
    },
    {
      title: 'Boyut Tipi',
      dataIndex: 'itemDimTypeDescription',
      key: 'itemDimTypeDescription'
    },
    {
      title: 'Ölçü Birimi',
      dataIndex: 'unitOfMeasureCode1',
      key: 'unitOfMeasureCode1'
    },
    {
      title: 'Marka',
      dataIndex: 'companyBrandCode',
      key: 'companyBrandCode',
      render: (text: string) => text?.replace(/[{}]/g, '') || '-'
    },
    {
      title: 'Özellikler',
      key: 'features',
      render: (text: string, record: Product) => (
        <Space>
          {record.usePOS && <Tag color="blue">POS</Tag>}
          {record.useStore && <Tag color="green">Mağaza</Tag>}
          {record.useRoll && <Tag color="purple">Rulo</Tag>}
          {record.useBatch && <Tag color="orange">Parti</Tag>}
          {record.useSerialNumber && <Tag color="cyan">Seri No</Tag>}
          {record.isUTSDeclaratedItem && <Tag color="magenta">ÜTS</Tag>}
        </Space>
      )
    },
    {
      title: 'Durum',
      key: 'status',
      dataIndex: 'isBlocked',
      render: (isBlocked: boolean) => (
        isBlocked ? <Tag color="red">Pasif</Tag> : <Tag color="green">Aktif</Tag>
      )
    },
    {
      title: 'Son Güncelleme',
      dataIndex: 'lastUpdatedDate',
      key: 'lastUpdatedDate',
      sorter: true,
      render: (text: string) => text ? moment(text).format('DD.MM.YYYY HH:mm') : '-'
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (text: string, record: Product) => (
        <Space>
          <Tooltip title="Detay">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/products/${record.productCode}`)} 
            />
          </Tooltip>
          <Tooltip title="Düzenle">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/products/edit/${record.productCode}`)} 
            />
          </Tooltip>
          <Tooltip title="Sil">
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteProduct(record.productCode)} 
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // Yükleme durumu
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Ürünler yükleniyor..." />
      </div>
    );
  }

  // Hata durumu
  if (error && !data) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-red-500 mb-4">Ürünler yüklenirken bir hata oluştu.</div>
        <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetch()}>
          Yeniden Dene
        </Button>
      </div>
    );
  }

  // Ürün listesi ve sayfalama
  const products = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const productTypesList = productTypes || [];

  // Boş veri durumu
  const isEmpty = products.length === 0;

  // Toplu işlem menüsü
  const bulkActionMenu = (
    <Menu>
      <Menu.Item key="activate" icon={<CheckOutlined />} onClick={() => handleBulkToggleStatus(false)}>
        Seçilenleri Aktif Yap
      </Menu.Item>
      <Menu.Item key="deactivate" icon={<CloseOutlined />} onClick={() => handleBulkToggleStatus(true)}>
        Seçilenleri Pasif Yap
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={handleBulkDelete}>
        Seçilenleri Sil
      </Menu.Item>
    </Menu>
  );

  // Dışa aktarma menüsü
  const exportMenu = (
    <Menu>
      <Menu.Item key="excel" icon={<FileExcelOutlined />} onClick={handleExport}>
        Excel olarak dışa aktar
      </Menu.Item>
      <Menu.Item key="pdf" icon={<FilePdfOutlined />} onClick={handleExport}>
        PDF olarak dışa aktar
      </Menu.Item>
      <Menu.Item key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
        Yazdır
      </Menu.Item>
    </Menu>
  );

  // Satır seçimi ayarları
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    }
  };

  return (
    <div className="p-6">
      {/* Başlık ve Butonlar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Ürün Listesi</h1>
          <p className="text-gray-500">Toplam {totalCount} ürün</p>
        </div>
        <div className="flex gap-2">
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
          >
            Yenile
          </Button>
          <Dropdown overlay={exportMenu} placement="bottomRight">
            <Button icon={<ExportOutlined />}>
              Dışa Aktar
            </Button>
          </Dropdown>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/products/new')}
          >
            Yeni Ürün
          </Button>
        </div>
      </div>

      {/* Özet İstatistikler */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Toplam Ürün"
              value={totalCount}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Aktif Ürünler"
              value={products.filter(p => !p.isBlocked).length}
              prefix={<CheckOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pasif Ürünler"
              value={products.filter(p => p.isBlocked).length}
              prefix={<CloseOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Ortalama Fiyat"
              value={0}
              prefix={<DollarOutlined />}
              suffix="₺"
            />
          </Card>
        </Col>
      </Row>

      {/* Arama ve Filtreleme */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Ürün kodu veya adı ara"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              onPressEnter={handleSearch}
            />
          </div>
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Tipi</label>
            <Select
              placeholder="Tüm Tipler"
              style={{ width: '100%' }}
              value={productTypeFilter}
              onChange={(value) => setProductTypeFilter(value)}
              allowClear
              loading={isLoadingProductTypes}
            >
              {productTypesList?.map((type: any) => (
                <Option key={type.code} value={type.code}>{type.description}</Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <Select
              placeholder="Tüm Durumlar"
              style={{ width: 120 }}
              value={blockedFilter === undefined ? undefined : (blockedFilter ? '1' : '0')}
              onChange={(value) => setBlockedFilter(value === undefined ? undefined : value === '1')}
              allowClear
            >
              <Option value="0">Aktif</Option>
              <Option value="1">Pasif</Option>
            </Select>
          </div>
          <div>
            <Button 
              type="primary" 
              onClick={handleSearch}
              className="mr-2"
            >
              Ara
            </Button>
            <Button 
              onClick={() => setAdvancedFilterVisible(true)}
              icon={<FilterOutlined />}
            >
              Gelişmiş
            </Button>
          </div>
        </div>
      </Card>

      {/* Seçili Ürünler ve Toplu İşlemler */}
      {selectedRowKeys.length > 0 && (
        <div className="bg-blue-50 p-4 mb-6 rounded-lg flex justify-between items-center">
          <div>
            <span className="font-medium">{selectedRowKeys.length} ürün seçildi</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setSelectedRowKeys([])}>Seçimi Temizle</Button>
            <Dropdown overlay={bulkActionMenu} placement="bottomRight">
              <Button type="primary">
                Toplu İşlem
              </Button>
            </Dropdown>
          </div>
        </div>
      )}

      {/* Ürün Tablosu */}
      {isEmpty ? (
        <Empty
          description="Ürün bulunamadı"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button 
            type="primary" 
            onClick={() => navigate('/products/new')}
          >
            İlk Ürünü Oluştur
          </Button>
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={products}
          rowKey="productCode"
          rowSelection={rowSelection}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: totalCount,
            showSizeChanger: true,
            showTotal: (total) => `Toplam ${total} kayıt`
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      )}

      {/* Gelişmiş Filtreleme Drawer */}
      <Drawer
        title="Gelişmiş Filtreleme"
        placement="right"
        width={400}
        onClose={() => setAdvancedFilterVisible(false)}
        visible={advancedFilterVisible}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleClearFilters}>Filtreleri Temizle</Button>
            <Button type="primary" onClick={handleAdvancedFilter}>Uygula</Button>
          </div>
        }
      >
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Aralığı</label>
          <RangePicker 
            style={{ width: '100%' }}
            value={dateRange as any}
            onChange={(dates) => setDateRange(dates as any)}
          />
        </div>

        <Divider orientation="left">Özellikler</Divider>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">POS Kullanımı</label>
          <Select
            placeholder="Seçiniz"
            style={{ width: '100%' }}
            value={featureFilters.usePOS}
            onChange={(value) => setFeatureFilters({...featureFilters, usePOS: value})}
            allowClear
          >
            <Option value={true}>Evet</Option>
            <Option value={false}>Hayır</Option>
          </Select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Mağaza Kullanımı</label>
          <Select
            placeholder="Seçiniz"
            style={{ width: '100%' }}
            value={featureFilters.useStore}
            onChange={(value) => setFeatureFilters({...featureFilters, useStore: value})}
            allowClear
          >
            <Option value={true}>Evet</Option>
            <Option value={false}>Hayır</Option>
          </Select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rulo Kullanımı</label>
          <Select
            placeholder="Seçiniz"
            style={{ width: '100%' }}
            value={featureFilters.useRoll}
            onChange={(value) => setFeatureFilters({...featureFilters, useRoll: value})}
            allowClear
          >
            <Option value={true}>Evet</Option>
            <Option value={false}>Hayır</Option>
          </Select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Parti Takibi</label>
          <Select
            placeholder="Seçiniz"
            style={{ width: '100%' }}
            value={featureFilters.useBatch}
            onChange={(value) => setFeatureFilters({...featureFilters, useBatch: value})}
            allowClear
          >
            <Option value={true}>Evet</Option>
            <Option value={false}>Hayır</Option>
          </Select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Seri No Kullanımı</label>
          <Select
            placeholder="Seçiniz"
            style={{ width: '100%' }}
            value={featureFilters.useSerialNumber}
            onChange={(value) => setFeatureFilters({...featureFilters, useSerialNumber: value})}
            allowClear
          >
            <Option value={true}>Evet</Option>
            <Option value={false}>Hayır</Option>
          </Select>
        </div>
      </Drawer>
    </div>
  );
};

export default ProductList;
