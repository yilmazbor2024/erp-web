import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Input, DatePicker, Space, Tag, Tooltip, message, Spin, Empty } from 'antd';
import { SearchOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, PrinterOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import invoiceApi, { WholesaleInvoiceListParams, WholesaleInvoice } from '../../services/invoiceApi';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const WholesaleInvoices: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<WholesaleInvoiceListParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'invoiceDate',
    sortDirection: 'desc'
  });
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Fatura verilerini çek - sayfalanmış olarak direk yükle
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['wholesaleInvoices', searchParams],
    queryFn: () => invoiceApi.getWholesaleInvoices(searchParams),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 dakika
    refetchOnWindowFocus: false,
    retry: 3 // Başarısız olursa 3 kez daha dene
  });

  // Hata durumunda mesaj göster
  useEffect(() => {
    if (error) {
      message.error(`Toptan satış faturaları yüklenirken hata oluştu: ${(error as Error).message}`);
    }
  }, [error]);

  // Arama işlemi
  const handleSearch = () => {
    const params: WholesaleInvoiceListParams = {
      ...searchParams,
      page: 1, // Arama yapıldığında ilk sayfaya dön
    };
    
    // Arama metni varsa, fatura numarası olarak ekle
    if (searchText) {
      params.searchTerm = searchText;
    }

    // Tarih aralığı seçilmişse ekle, seçilmemişse tarih filtresi kullanma
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].format('YYYY-MM-DD');
      params.endDate = dateRange[1].format('YYYY-MM-DD');
    } else {
      // Tarih aralığı seçilmemişse, tarih filtrelerini temizle
      params.startDate = undefined;
      params.endDate = undefined;
    }

    setSearchParams(params);
  };

  // Tablo değişikliklerini işle (sayfalama, sıralama)
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const params: WholesaleInvoiceListParams = {
      ...searchParams,
      page: pagination.current,
      pageSize: pagination.pageSize
    };

    // Sıralama varsa ekle
    if (sorter.field && sorter.order) {
      params.sortBy = sorter.field;
      params.sortDirection = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    setSearchParams(params);
  };

  // Fatura verilerini ve toplam sayıyı al
  const invoices = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const isEmpty = !isLoading && invoices.length === 0;

  // Tablo sütunları
  const columns = [
    {
      title: 'Fatura No',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      sorter: true,
      render: (text: string, record: WholesaleInvoice) => (
        <Link to={`/invoices/wholesale/${record.invoiceHeaderID}`}>{text}</Link>
      )
    },
    {
      title: 'Tarih',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      sorter: true,
      render: (text: string) => moment(text).format('DD.MM.YYYY')
    },
    {
      title: 'Müşteri',
      dataIndex: 'customerDescription',
      key: 'customerDescription',
      sorter: true,
      render: (text: string, record: WholesaleInvoice) => {
        // Müşteri bilgisi yoksa boş göster
        if (!text || text === '') return '-';
        return (
          <Tooltip title={record.customerCode}>
            {text}
          </Tooltip>
        );
      }
    },
    {
      title: 'Tutar',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      sorter: true,
      render: (text: number, record: WholesaleInvoice) => {
        // Tutar 0 ise veya yoksa "-" göster
        if (!text || text === 0) return '-';
        return (
          <span>{record.docCurrencyCode} {text.toFixed(2)}</span>
        );
      },
    },
    {
      title: 'KDV',
      dataIndex: 'totalTax',
      key: 'totalTax',
      sorter: true,
      render: (text: number, record: WholesaleInvoice) => {
        // KDV 0 ise veya yoksa "-" göster
        if (!text || text === 0) return '-';
        return (
          <span>{record.docCurrencyCode} {text.toFixed(2)}</span>
        );
      },
    },
    {
      title: 'Toplam',
      dataIndex: 'netAmount',
      key: 'netAmount',
      sorter: true,
      render: (text: number, record: WholesaleInvoice) => {
        // Toplam 0 ise veya yoksa "-" göster
        if (!text || text === 0) return '-';
        return (
          <span>{record.docCurrencyCode} {text.toFixed(2)}</span>
        );
      },
    },
    {
      title: 'Durum',
      key: 'status',
      render: (_: any, record: WholesaleInvoice) => (
        <Space>
          {record.isCompleted && (
            <Tag color="green">Tamamlandı</Tag>
          )}
          {record.isSuspended && (
            <Tag color="red">Askıda</Tag>
          )}
          {record.isEInvoice && (
            <Tag color="purple">e-Fatura</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: WholesaleInvoice) => (
        <Space>
          <Tooltip title="Görüntüle">
            <Button 
              type="text" 
              icon={<FileTextOutlined />} 
              onClick={() => navigate(`/invoices/wholesale/${record.invoiceHeaderID}`)} 
            />
          </Tooltip>
          <Tooltip title="Yazdır">
            <Button 
              type="text" 
              icon={<PrinterOutlined />} 
              onClick={() => console.log('Yazdır', record.invoiceHeaderID)} 
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Toptan Satış Faturaları</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => navigate('/invoices/wholesale/new')}
        >
          Yeni Fatura
        </Button>
      </div>

      <div style={{ marginBottom: '20px', background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <Input 
              placeholder="Fatura No" 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              onPressEnter={handleSearch}
            />
          </div>
          <div style={{ flex: '2', minWidth: '300px' }}>
            <RangePicker 
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
              format="DD.MM.YYYY"
            />
          </div>
          <div>
            <Button type="primary" onClick={handleSearch}>
              Ara
            </Button>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <Empty
          description="Toptan satış faturası bulunamadı"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button 
            type="primary" 
            onClick={() => navigate('/invoices/wholesale/new')}
          >
            İlk Toptan Satış Faturasını Oluştur
          </Button>
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="invoiceHeaderID"
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
    </div>
  );
};

export default WholesaleInvoices;
