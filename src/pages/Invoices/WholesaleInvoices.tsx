import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Input, DatePicker, Space, Tag, Tooltip, message, Spin, Empty } from 'antd';
import { SearchOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, PrinterOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import invoiceApi, { InvoiceSearchParams, InvoiceHeaderModel, WholesaleInvoiceListResponse } from '../../services/invoiceApi';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const WholesaleInvoices: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<InvoiceSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'invoiceDate',
    sortDirection: 'desc'
  });
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Fatura verilerini çek
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['wholesaleInvoices', searchParams],
    queryFn: () => invoiceApi.getWholesaleInvoices(searchParams),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 dakika
    refetchOnWindowFocus: false
  });

  // Hata durumunda mesaj göster
  useEffect(() => {
    if (error) {
      message.error(`Toptan satış faturaları yüklenirken hata oluştu: ${(error as Error).message}`);
    }
  }, [error]);

  // Arama işlemi
  const handleSearch = () => {
    const params: InvoiceSearchParams = {
      ...searchParams,
      page: 1, // Arama yapıldığında ilk sayfaya dön
    };
    
    // Arama metni varsa, fatura numarası olarak ekle
    if (searchText) {
      params.invoiceNumber = searchText;
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].format('YYYY-MM-DD');
      params.endDate = dateRange[1].format('YYYY-MM-DD');
    }

    setSearchParams(params);
  };

  // Tablo değişikliklerini işle (sayfalama, sıralama)
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const params: InvoiceSearchParams = {
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
  const invoices = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;
  const isEmpty = !isLoading && invoices.length === 0;

  // Tablo sütunları
  const columns = [
    {
      title: 'Fatura No',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      sorter: true,
      render: (text: string, record: InvoiceHeaderModel) => (
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
      render: (text: string, record: InvoiceHeaderModel) => (
        <Tooltip title={record.customerCode}>
          {text || record.customerCode}
        </Tooltip>
      )
    },
    {
      title: 'Fatura Tipi',
      dataIndex: 'invoiceTypeDescription',
      key: 'invoiceTypeDescription',
      sorter: true,
      render: (text: string, record: InvoiceHeaderModel) => (
        <Tag color={record.isReturn ? 'orange' : 'blue'}>
          {text}
        </Tag>
      )
    },
    {
      title: 'Durum',
      key: 'status',
      render: (_: any, record: InvoiceHeaderModel) => (
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
      render: (_: any, record: InvoiceHeaderModel) => (
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
