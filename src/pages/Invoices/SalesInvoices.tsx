import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Input, DatePicker, Space, Tag, Tooltip, message, Spin, Empty } from 'antd';
import { SearchOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, PrinterOutlined, SendOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import invoiceApi, { InvoiceHeader, InvoiceListParams } from '../../services/invoiceApi';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const SalesInvoices: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<InvoiceListParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'invoiceDate',
    sortDirection: 'desc'
  });
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Fatura verilerini çek
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['salesInvoices', searchParams],
    queryFn: () => invoiceApi.getSalesInvoices(searchParams),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 dakika
    refetchOnWindowFocus: false
  });

  // Hata durumunda mesaj göster
  useEffect(() => {
    if (error) {
      message.error(`Satış faturaları yüklenirken hata oluştu: ${(error as Error).message}`);
    }
  }, [error]);

  // Arama işlemi
  const handleSearch = () => {
    const params: InvoiceListParams = {
      ...searchParams,
      page: 1, // Arama yapıldığında ilk sayfaya dön
      searchTerm: searchText
    };

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].format('YYYY-MM-DD');
      params.endDate = dateRange[1].format('YYYY-MM-DD');
    }

    setSearchParams(params);
  };

  // Sayfa değişimi
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSearchParams({
      ...searchParams,
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortBy: sorter.field || 'invoiceDate',
      sortDirection: sorter.order === 'ascend' ? 'asc' : 'desc'
    });
  };

  // PDF indirme işlemi
  const handleDownloadPdf = async (invoiceHeaderID: string) => {
    try {
      const blob = await invoiceApi.getInvoicePdf(invoiceHeaderID);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura-${invoiceHeaderID}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      message.error(`PDF indirme işlemi başarısız: ${error.message}`);
    }
  };

  // E-Fatura gönderme işlemi
  const handleSendEInvoice = async (invoiceHeaderID: string) => {
    try {
      await invoiceApi.sendEInvoice(invoiceHeaderID);
      message.success('E-Fatura başarıyla gönderildi');
      refetch();
    } catch (error: any) {
      message.error(`E-Fatura gönderme işlemi başarısız: ${error.message}`);
    }
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Fatura No',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      sorter: true,
      render: (text: string, record: InvoiceHeader) => (
        <Link to={`/invoices/detail/${record.invoiceHeaderID}`}>{text}</Link>
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
      dataIndex: 'currAccName',
      key: 'currAccName',
      sorter: true
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Tutar',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      sorter: true,
      align: 'right' as const,
      render: (amount: number) => amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0.00'
    },
    {
      title: 'KDV',
      dataIndex: 'totalVat',
      key: 'totalVat',
      sorter: true,
      align: 'right' as const,
      render: (amount: number) => amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0.00'
    },
    {
      title: 'Net Tutar',
      dataIndex: 'netAmount',
      key: 'netAmount',
      sorter: true,
      align: 'right' as const,
      render: (amount: number) => amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0.00'
    },
    {
      title: 'Durum',
      key: 'status',
      render: (text: string, record: InvoiceHeader) => (
        <Space>
          {record.isReturn && <Tag color="orange">İade</Tag>}
          {record.isEInvoice && (
            <Tag color={record.eInvoiceStatusCode === 'SENT' ? 'green' : 'blue'}>
              {record.eInvoiceStatusCode === 'SENT' ? 'E-Fatura Gönderildi' : 'E-Fatura'}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (text: string, record: InvoiceHeader) => (
        <Space>
          <Tooltip title="Detay">
            <Button 
              type="text" 
              icon={<FileTextOutlined />} 
              onClick={() => navigate(`/invoices/detail/${record.invoiceHeaderID}`)} 
            />
          </Tooltip>
          <Tooltip title="PDF İndir">
            <Button 
              type="text" 
              icon={<PrinterOutlined />} 
              onClick={() => handleDownloadPdf(record.invoiceHeaderID)} 
            />
          </Tooltip>
          {record.isEInvoice && record.eInvoiceStatusCode !== 'SENT' && (
            <Tooltip title="E-Fatura Gönder">
              <Button 
                type="text" 
                onClick={() => handleSendEInvoice(record.invoiceHeaderID)} 
              >
                Gönder
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // Fatura listesi ve sayfalama
  const invoices = data?.items || [];
  const totalCount = data?.totalCount || 0;

  // Yükleme durumu
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Satış faturaları yükleniyor..." />
      </div>
    );
  }

  // Hata durumu
  if (error && !data) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-red-500 mb-4">Satış faturaları yüklenirken bir hata oluştu.</div>
        <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetch()}>
          Yeniden Dene
        </Button>
      </div>
    );
  }

  // Boş veri durumu
  const isEmpty = !invoices || invoices.length === 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Satış Faturaları</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => navigate('/invoices/sales/new')}
        >
          Yeni Satış Faturası
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Fatura no, açıklama veya müşteri ara"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              onPressEnter={handleSearch}
            />
          </div>
          <div>
            <RangePicker
              placeholder={['Başlangıç Tarihi', 'Bitiş Tarihi']}
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
          description="Satış faturası bulunamadı"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button 
            type="primary" 
            onClick={() => navigate('/invoices/sales/new')}
          >
            İlk Satış Faturasını Oluştur
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

export default SalesInvoices;
