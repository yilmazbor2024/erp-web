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
import materialApi, { Material, MaterialListParams } from '../../services/materialApi';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

const MaterialList: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<MaterialListParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'materialCode',
    sortDirection: 'asc'
  });
  const [searchText, setSearchText] = useState('');
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string | undefined>(undefined);
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

  // Malzeme verilerini çek
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['materials', searchParams],
    queryFn: () => materialApi.getMaterials(searchParams),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 dakika
    refetchOnWindowFocus: false
  });

  // Hata durumunda mesaj göster
  useEffect(() => {
    if (error) {
      message.error(`Malzemeler yüklenirken hata oluştu: ${(error as Error).message}`);
    }
  }, [error]);

  // Malzeme tiplerini çek
  const { data: materialTypes, isLoading: isLoadingMaterialTypes } = useQuery({
    queryKey: ['materialTypes'],
    queryFn: () => materialApi.getMaterialTypes(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000 // 5 dakika
  });

  // Malzeme tipleri yüklenirken hata durumunda mesaj göster
  useEffect(() => {
    if (materialTypes === undefined && !isLoadingMaterialTypes) {
      message.error('Malzeme tipleri yüklenirken hata oluştu');
    }
  }, [materialTypes, isLoadingMaterialTypes]);

  // Arama işlemi
  const handleSearch = () => {
    const params: MaterialListParams = {
      ...searchParams,
      page: 1, // Arama yapıldığında ilk sayfaya dön
      searchTerm: searchText,
      productTypeCode: materialTypeFilter,
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
    setMaterialTypeFilter(undefined);
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
      sortBy: 'materialCode',
      sortDirection: 'asc'
    });
  };

  // Sayfa değişimi
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const params: MaterialListParams = {
      ...searchParams,
      page: pagination.current,
      pageSize: pagination.pageSize
    };

    if (sorter && sorter.field) {
      params.sortBy = sorter.field;
      params.sortDirection = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    setSearchParams(params);
  };

  // Malzeme silme işlemi
  const handleDeleteMaterial = (materialCode: string) => {
    confirm({
      title: 'Bu malzemeyi silmek istediğinizden emin misiniz?',
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await materialApi.deleteMaterial(materialCode);
          message.success('Malzeme başarıyla silindi');
          refetch();
        } catch (error) {
          message.error(`Malzeme silinirken hata oluştu: ${(error as Error).message}`);
        }
      }
    });
  };

  // Toplu işlem: Seçili malzemeleri sil
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Lütfen en az bir malzeme seçin');
      return;
    }

    confirm({
      title: `${selectedRowKeys.length} malzemeyi silmek istediğinizden emin misiniz?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          // Toplu silme işlemi için API çağrısı
          // Backend'de toplu silme desteği yoksa, her bir malzeme için ayrı ayrı silme işlemi yapılabilir
          const deletePromises = selectedRowKeys.map(key => 
            materialApi.deleteMaterial(key.toString())
          );
          
          await Promise.all(deletePromises);
          message.success(`${selectedRowKeys.length} malzeme başarıyla silindi`);
          setSelectedRowKeys([]);
          refetch();
        } catch (error) {
          message.error(`Malzemeler silinirken hata oluştu: ${(error as Error).message}`);
        }
      }
    });
  };

  // Toplu işlem: Seçili malzemeleri aktif/pasif yap
  const handleBulkToggleStatus = (isBlocked: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Lütfen en az bir malzeme seçin');
      return;
    }

    const statusText = isBlocked ? 'pasif' : 'aktif';
    
    confirm({
      title: `${selectedRowKeys.length} malzemeyi ${statusText} yapmak istediğinizden emin misiniz?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem malzemelerin durumunu değiştirecektir.',
      okText: 'Evet',
      okType: 'primary',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          // Toplu durum değiştirme işlemi için API çağrısı
          // Backend'de toplu güncelleme desteği yoksa, her bir malzeme için ayrı ayrı güncelleme işlemi yapılabilir
          const updatePromises = selectedRowKeys.map(key => 
            materialApi.updateMaterial(key.toString(), { isBlocked })
          );
          
          await Promise.all(updatePromises);
          message.success(`${selectedRowKeys.length} malzeme başarıyla ${statusText} yapıldı`);
          setSelectedRowKeys([]);
          refetch();
        } catch (error) {
          message.error(`Malzemeler güncellenirken hata oluştu: ${(error as Error).message}`);
        }
      }
    });
  };

  // Dışa aktarma işlemi
  const handleExport = () => {
    // Burada dışa aktarma işlemi yapılabilir
    // Excel, CSV, PDF vb. formatlar için ek kütüphaneler kullanılabilir
    message.info('Dışa aktarma işlemi başlatıldı');
    
    // Örnek: Excel dışa aktarma
    // exportToExcel(data.items, 'malzeme_listesi');
  };

  // Yazdırma işlemi
  const handlePrint = () => {
    // Burada yazdırma işlemi yapılabilir
    // Yazdırma için ek kütüphaneler kullanılabilir
    message.info('Yazdırma işlemi başlatıldı');
    
    // Örnek: Yazdırma işlemi
    // window.print();
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Malzeme Kodu',
      dataIndex: 'materialCode',
      key: 'materialCode',
      sorter: true,
      render: (text: string, record: Material) => (
        <Link to={`/materials/detail/${record.materialCode}`} className="text-blue-600 hover:text-blue-800">
          {text}
        </Link>
      )
    },
    {
      title: 'Malzeme Adı',
      dataIndex: 'materialDescription',
      key: 'materialDescription',
      sorter: true
    },
    {
      title: 'Malzeme Tipi',
      dataIndex: 'productTypeDescription',
      key: 'productTypeDescription',
      sorter: true,
      render: (text: string, record: Material) => (
        <Tag color="blue">{text || record.productTypeCode}</Tag>
      )
    },
    {
      title: 'Durum',
      dataIndex: 'isBlocked',
      key: 'isBlocked',
      render: (isBlocked: boolean) => (
        isBlocked ? <Tag color="red">Pasif</Tag> : <Tag color="green">Aktif</Tag>
      )
    },
    {
      title: 'Ölçü Birimi',
      dataIndex: 'unitOfMeasureCode1',
      key: 'unitOfMeasureCode1',
      render: (text: string) => text
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (text: string, record: Material) => (
        <Space size="small">
          <Tooltip title="Görüntüle">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/materials/detail/${record.materialCode}`)}
            />
          </Tooltip>
          <Tooltip title="Düzenle">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/materials/edit/${record.materialCode}`)}
            />
          </Tooltip>
          <Tooltip title="Sil">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteMaterial(record.materialCode)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // Tablo satır seçimi
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    }
  };

  // Veri ve toplam sayı
  const materials = data?.items || [];
  const totalCount = data?.totalCount || 0;

  return (
    <div className="p-4">
      <Card 
        title={
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Malzeme Listesi</span>
            <Space>
              <Statistic 
                title="Toplam Malzeme" 
                value={totalCount} 
                style={{ marginRight: 32 }}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/materials/create')}
              >
                Yeni Malzeme
              </Button>
            </Space>
          </div>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => refetch()}
              loading={isLoading}
            >
              Yenile
            </Button>
            <Button 
              icon={<FilterOutlined />}
              onClick={() => setAdvancedFilterVisible(true)}
            >
              Gelişmiş Filtre
            </Button>
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item key="1" icon={<FileExcelOutlined />} onClick={handleExport}>
                    Excel'e Aktar
                  </Menu.Item>
                  <Menu.Item key="2" icon={<FilePdfOutlined />} onClick={handleExport}>
                    PDF'e Aktar
                  </Menu.Item>
                  <Menu.Item key="3" icon={<PrinterOutlined />} onClick={handlePrint}>
                    Yazdır
                  </Menu.Item>
                </Menu>
              }
            >
              <Button icon={<DownloadOutlined />}>
                Dışa Aktar
              </Button>
            </Dropdown>
            {selectedRowKeys.length > 0 && (
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item 
                      key="1" 
                      icon={<DeleteOutlined />} 
                      danger
                      onClick={handleBulkDelete}
                    >
                      Seçilenleri Sil
                    </Menu.Item>
                    <Menu.Item 
                      key="2" 
                      icon={<CloseOutlined />}
                      onClick={() => handleBulkToggleStatus(true)}
                    >
                      Seçilenleri Pasif Yap
                    </Menu.Item>
                    <Menu.Item 
                      key="3" 
                      icon={<CheckOutlined />}
                      onClick={() => handleBulkToggleStatus(false)}
                    >
                      Seçilenleri Aktif Yap
                    </Menu.Item>
                  </Menu>
                }
              >
                <Button>
                  Toplu İşlemler ({selectedRowKeys.length})
                </Button>
              </Dropdown>
            )}
          </Space>
        }
        className="mb-4"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Input
            placeholder="Malzeme Kodu veya Adı"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="Malzeme Tipi"
            style={{ width: 200 }}
            allowClear
            loading={isLoadingMaterialTypes}
            value={materialTypeFilter}
            onChange={(value) => setMaterialTypeFilter(value)}
          >
            {materialTypes?.map((type) => (
              <Option key={type.code} value={type.code}>{type.description}</Option>
            ))}
          </Select>
          <Select
            placeholder="Durum"
            style={{ width: 150 }}
            allowClear
            value={blockedFilter}
            onChange={(value) => setBlockedFilter(value)}
          >
            <Option value={false}>Aktif</Option>
            <Option value={true}>Pasif</Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>Ara</Button>
          <Button onClick={handleClearFilters}>Temizle</Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center p-10">
          <Spin size="large" tip="Malzemeler yükleniyor..." />
        </div>
      ) : materials.length === 0 ? (
        <Empty
          description="Malzeme bulunamadı"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={materials}
          rowKey="materialCode"
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
        open={advancedFilterVisible}
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

export default MaterialList;
