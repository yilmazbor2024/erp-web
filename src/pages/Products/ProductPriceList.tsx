import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Table, Button, Input, Space, Spin, Empty, Card, Row, Col, 
  DatePicker, message, Typography
} from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import { 
  SearchOutlined, ReloadOutlined, FilterOutlined, 
  ExportOutlined, FileExcelOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import productPriceListApi, { ProductPriceListItem, ProductPriceListParams } from '../../services/productPriceListApi';
import dayjs from 'dayjs';
import { ColumnType } from 'antd/es/table';
import { CSVLink } from 'react-csv';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ProductPriceList: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useState<ProductPriceListParams>({
    page: 1,
    pageSize: 10,
    companyCode: 1
  });
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<RangePickerProps['value']>(null);

  // Fiyat listesi verilerini çek
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['productPriceList', searchParams],
    queryFn: () => productPriceListApi.getPriceList(searchParams),
    enabled: isAuthenticated,
    retry: 1
  });

  // Hata durumunu kontrol et
  React.useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      message.error(`Satış fiyat listesi yüklenirken bir hata oluştu: ${errorMessage}. Lütfen daha sonra tekrar deneyin.`);
      console.error('Fiyat listesi hatası:', error);
    }
  }, [error]);
  
  // Sayfa yüklenirken konsola bilgi yazdır
  React.useEffect(() => {
    console.log('Satış Fiyat Listesi sayfası yükleniyor...');
    console.log('Arama parametreleri:', searchParams);
    console.log('Sayfa URL:', window.location.pathname);
    console.log('ProductPriceList bileşeni başarıyla monte edildi');
  }, []);

  // Tarih aralığı değiştiğinde parametreleri güncelle
  const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
    setDateRange(dates);
    
    if (dates && dates[0] && dates[1]) {
      setSearchParams({
        ...searchParams,
        page: 1, // Tarih değiştiğinde ilk sayfaya dön
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      });
    } else {
      // Tarih aralığı temizlendiğinde tarih filtrelerini kaldır
      const { startDate, endDate, ...rest } = searchParams;
      setSearchParams({ ...rest, page: 1 });
    }
  };

  // Arama işlemi
  const handleSearch = () => {
    setSearchParams({
      ...searchParams,
      page: 1, // Arama yapıldığında ilk sayfaya dön
      searchText: searchText.trim() // Arama metni parametresini ekle
    });
    
    // Arama yapıldığında kullanıcıya bilgi mesajı göster
    if (searchText.trim()) {
      message.info(`"${searchText}" için arama yapılıyor...`);
    }
  };

  // Sayfa değiştiğinde
  const handleTableChange = (pagination: any) => {
    setSearchParams({
      ...searchParams,
      page: pagination.current,
      pageSize: pagination.pageSize
    });
  };

  // Yenile butonu
  const handleRefresh = () => {
    refetch();
    message.success('Veriler yenilendi');
  };

  // Tablo sütunları
  const columns: ColumnType<ProductPriceListItem>[] = [
    {
      title: 'Sıra No',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80
    },
    {
      title: 'Ürün Kodu',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 120,
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        return record.itemCode.toLowerCase().includes(value.toString().toLowerCase()) ||
               record.itemDescription.toLowerCase().includes(value.toString().toLowerCase());
      }
    },
    {
      title: 'Ürün Açıklaması',
      dataIndex: 'itemDescription',
      key: 'itemDescription',
      width: 250
    },
    {
      title: 'Renk',
      dataIndex: 'colorDescription',
      key: 'colorDescription',
      width: 120,
      render: (text, record) => text || record.colorCode || '-'
    },
    {
      title: 'Birim',
      dataIndex: 'unitOfMeasureCode',
      key: 'unitOfMeasureCode',
      width: 80
    },
    {
      title: 'Birim Fiyat',
      dataIndex: 'birimFiyat',
      key: 'birimFiyat',
      width: 120,
      render: (price, record) => {
        const formattedPrice = price?.toFixed(2) || '0.00';
        return (
          <span style={{ fontWeight: 'bold' }}>
            {formattedPrice} {record.docCurrencyCode}
          </span>
        );
      },
      sorter: (a, b) => (a.birimFiyat || 0) - (b.birimFiyat || 0)
    },
    {
      title: 'Durum',
      dataIndex: 'isDisabled',
      key: 'isDisabled',
      width: 100,
      render: (isDisabled) => (
        <span style={{ color: isDisabled ? 'red' : 'green' }}>
          {isDisabled ? 'Pasif' : 'Aktif'}
        </span>
      )
    }
  ];

  // CSV dışa aktarma için veri hazırlama
  const exportData = data?.data?.map(item => ({
    'Sıra No': item.sortOrder,
    'Ürün Kodu': item.itemCode,
    'Ürün Açıklaması': item.itemDescription,
    'Renk': item.colorDescription || item.colorCode || '-',
    'Birim': item.unitOfMeasureCode,
    'Birim Fiyat': `${(item.birimFiyat || 0).toFixed(2)} ${item.docCurrencyCode}`,
    'Durum': item.isDisabled ? 'Pasif' : 'Aktif',
    'Geçerlilik Tarihi': item.validFrom ? dayjs(item.validFrom).format('DD.MM.YYYY') : '-'
  })) || [];

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Title level={4}>Satış Fiyat Listesi</Title>
        <p>Tüm ürünlerin satış fiyatlarını görüntüleyebilir, tarih aralığına göre filtreleyebilir veya ürün kodu/açıklamasına göre arama yapabilirsiniz.</p>
        
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Ürün kodu veya açıklama ara"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Başlangıç Tarihi', 'Bitiş Tarihi']}
              value={dateRange}
              onChange={handleDateRangeChange}
              format="DD.MM.YYYY"
            />
          </Col>
          <Col xs={24} sm={24} md={8} lg={12}>
            <Space>
              <Button 
                type="primary" 
                icon={<FilterOutlined />} 
                onClick={handleSearch}
              >
                Filtrele
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
              >
                Yenile
              </Button>
              <Button
                onClick={() => {
                  setSearchText('');
                  setDateRange(null);
                  setSearchParams({
                    page: 1,
                    pageSize: 10,
                    companyCode: 1
                  });
                  message.success('Filtreler temizlendi');
                }}
                type="dashed"
              >
                Filtreleri Temizle
              </Button>
              {data?.data && data.data.length > 0 && (
                <CSVLink
                  data={exportData}
                  filename={`urun-fiyat-listesi-${dayjs().format('YYYY-MM-DD')}.csv`}
                >
                  <Button 
                    type="default" 
                    icon={<FileExcelOutlined />}
                  >
                    Excel'e Aktar
                  </Button>
                </CSVLink>
              )}
            </Space>
          </Col>
        </Row>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin tip="Satış fiyat listesi yükleniyor..." size="large">
              <div className="content" style={{ padding: '50px', marginTop: '20px' }} />
            </Spin>
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <Table
            columns={columns}
            dataSource={data.data.map(item => ({ ...item, key: item.headerID + '-' + item.itemCode }))}
            pagination={{
              current: searchParams.page,
              pageSize: searchParams.pageSize,
              // API'den gelen toplam kayıt sayısını kullan
              total: data.totalCount || data.data.length,
              showSizeChanger: true,
              showTotal: (total) => `Toplam ${total} kayıt`,
              // Sayfalama için ek ayarlar
              pageSizeOptions: ['10', '20', '50', '100'],
              showQuickJumper: true,
              position: ['bottomCenter']
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="middle"
            bordered
            loading={isLoading}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={columns.length}>
                    <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      Son güncelleme: {dayjs().format('DD.MM.YYYY HH:mm:ss')}
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        ) : (
          <Empty 
            description="Satış fiyat listesi bulunamadı" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <p>Aradığınız kriterlere uygun ürün fiyat bilgisi bulunamadı.</p>
            <p>Lütfen farklı arama kriterleri deneyin veya tarih aralığını genişletin.</p>
            <Space style={{ marginTop: '15px' }}>
              <Button 
                type="primary" 
                onClick={() => {
                  setSearchText('');
                  setDateRange(null);
                  setSearchParams({
                    page: 1,
                    pageSize: 10,
                    companyCode: 1
                  });
                }}
                icon={<FilterOutlined />}
              >
                Filtreleri Temizle
              </Button>
              <Button onClick={() => refetch()} icon={<ReloadOutlined />}>
                Yenile
              </Button>
            </Space>
          </Empty>
        )}
      </Card>
    </div>
  );
};

export default ProductPriceList;
