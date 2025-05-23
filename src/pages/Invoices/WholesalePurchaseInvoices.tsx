import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Card, Input, Button, Space, Tag, DatePicker, Row, Col, Typography, Spin, Empty, message, Tooltip } from 'antd';
import { SearchOutlined, FileTextOutlined, DownloadOutlined, CheckCircleOutlined, ClockCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import invoiceApi, { WholesalePurchaseInvoice } from '../../services/invoiceApi';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const WholesalePurchaseInvoices: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchText, setSearchText] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Fatura verilerini çek
  const { data, isLoading, error } = useQuery({
    queryKey: ['wholesalePurchaseInvoices', currentPage, pageSize, searchText, dateRange],
    queryFn: () => invoiceApi.getWholesalePurchaseInvoices({
      page: currentPage,
      pageSize: pageSize,
      invoiceNumber: searchText || undefined,
      startDate: dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
      endDate: dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
      sortBy: 'invoiceDate',
      sortDirection: 'desc'
    }),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 dakika
    refetchOnWindowFocus: false
  });

  // Fatura durumuna göre etiket rengi belirle
  const getStatusTag = (invoice: WholesalePurchaseInvoice) => {
    if (invoice.isCompleted) {
      return <Tag icon={<CheckCircleOutlined />} color="success">Tamamlandı</Tag>;
    } else if (invoice.isSuspended) {
      return <Tag icon={<StopOutlined />} color="error">Askıya Alındı</Tag>;
    // isLocked alanı WholesalePurchaseInvoice arayüzünde tanımlı olmadığı için bu kontrolü kaldırıyoruz
    // } else if (invoice.isLocked) {
    //   return <Tag icon={<StopOutlined />} color="warning">Kilitli</Tag>;
    } else {
      return <Tag icon={<ClockCircleOutlined />} color="processing">İşlemde</Tag>;
    }
  };

  // PDF indir
  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      await invoiceApi.downloadInvoicePdf(invoiceId);
      message.success('Fatura PDF başarıyla indirildi');
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      message.error('PDF indirme sırasında bir hata oluştu');
    }
  };

  // Detay sayfasına git
  const handleViewDetail = (invoiceId: string) => {
    navigate(`/invoices/wholesale-purchase/${invoiceId}`);
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Fatura No',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text: string) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: 'Tedarikçi',
      dataIndex: 'vendorDescription',
      key: 'vendorDescription',
      render: (text: string, record: WholesalePurchaseInvoice) => {
        // Tedarikçi bilgisi yoksa boş göster
        if (!text || text === '') return '-';
        return (
          <Tooltip title={record.vendorCode}>
            {text}
          </Tooltip>
        );
      },
    },
    {
      title: 'Fatura Tarihi',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (text: string) => text ? dayjs(text).format('DD.MM.YYYY') : '-',
    },
    {
      title: 'Tutar',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (text: number, record: WholesalePurchaseInvoice) => {
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
      render: (text: number, record: WholesalePurchaseInvoice) => {
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
      render: (text: number, record: WholesalePurchaseInvoice) => {
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
      render: (text: string, record: WholesalePurchaseInvoice) => getStatusTag(record),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (text: string, record: WholesalePurchaseInvoice) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<FileTextOutlined />} 
            onClick={() => handleViewDetail(record.invoiceHeaderID)}
            size="small"
          >
            Detay
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={() => handleDownloadPdf(record.invoiceHeaderID)}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  // Fatura listesi ve sayfalama
  const invoices = data?.items || [];
  const totalCount = data?.totalCount || 0;

  // Arama işlevi
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  // Sayfalama değişikliği
  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // Tarih aralığı değişikliği
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    setCurrentPage(1);
  };

  // Yükleme, hata veya veri yoksa uygun mesajı göster
  if (error) {
    return (
      <Card>
        <Empty
          description="Fatura verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card>
      <Title level={2}>Toptan Alış Faturaları</Title>
      
      {/* Filtreler */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Input.Search
            placeholder="Fatura No ile ara"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={8}>
          <RangePicker 
            style={{ width: '100%' }}
            placeholder={['Başlangıç Tarihi', 'Bitiş Tarihi']}
            onChange={handleDateRangeChange}
            format="DD.MM.YYYY"
          />
        </Col>
      </Row>
      
      {/* Tablo */}
      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="invoiceHeaderID"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} fatura`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: <Empty description="Fatura bulunamadı" />
          }}
        />
      </Spin>
    </Card>
  );
};

export default WholesalePurchaseInvoices;
