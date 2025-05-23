import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Tooltip, Input, DatePicker, Select, Row, Col, Typography, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import invoiceApi from '../../services/invoiceApi';
import InvoiceForm from '../../components/invoice/InvoiceForm';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Fatura tipi enum
enum InvoiceType {
  WHOLESALE_SALES = 'WS',
  WHOLESALE_PURCHASE = 'BP',
  EXPENSE_SALES = 'EXP',
  EXPENSE_PURCHASE = 'EP'
}

// Fatura tipi açıklamaları
const invoiceTypeDescriptions = {
  [InvoiceType.WHOLESALE_SALES]: 'Toptan Satış Faturası',
  [InvoiceType.WHOLESALE_PURCHASE]: 'Toptan Alış Faturası',
  [InvoiceType.EXPENSE_SALES]: 'Masraf Satış Faturası',
  [InvoiceType.EXPENSE_PURCHASE]: 'Masraf Alış Faturası'
};

// Fatura tipi renkleri
const invoiceTypeColors = {
  [InvoiceType.WHOLESALE_SALES]: 'green',
  [InvoiceType.WHOLESALE_PURCHASE]: 'blue',
  [InvoiceType.EXPENSE_SALES]: 'orange',
  [InvoiceType.EXPENSE_PURCHASE]: 'purple'
};

// URL'deki type parametresini doğru fatura tipi koduna dönüştür
const mapTypeToInvoiceTypeCode = (type: string | null): string => {
  if (!type) return '';
  
  switch(type) {
    case 'wholesale':
      return 'WS'; // Toptan Satış
    case 'wholesale-purchase':
      return 'BP'; // Toptan Alış
    case 'expense':
      return ''; // Masraf Faturası için boş döndür, özel filtreleme yapacağız
    default:
      return '';
  }
};

const InvoiceListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const typeParam = queryParams.get('type');
  const mappedTypeCode = mapTypeToInvoiceTypeCode(typeParam);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    invoiceNumber: '',
    invoiceTypeCode: mappedTypeCode,
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    currAccCode: ''
  });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<InvoiceType>(InvoiceType.WHOLESALE_SALES);

  // Faturaları yükle
  const loadInvoices = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      
      // API isteği parametrelerini hazırla
      const requestParams: any = {
        pageNumber: page,
        pageSize,
        invoiceNumber: filters.invoiceNumber,
        startDate: filters.dateRange ? filters.dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: filters.dateRange ? filters.dateRange[1].format('YYYY-MM-DD') : undefined,
        currAccCode: filters.currAccCode
        // Tüm fatura listelerinde sadece sayfalama ve ProcessCode gönderilmeli
        // CompanyCode, StoreCode ve WarehouseCode backend tarafında varsayılan değerlerle doldurulacak
      };
      
      // Masraf faturaları için özel filtreleme
      if (typeParam === 'expense') {
        // Masraf faturaları için hem EP hem de EXP kodlarını destekle
        requestParams.processCodeList = ['EP', 'EXP'];
      } else {
        // Diğer fatura tipleri için normal ProcessCode kullan
        requestParams.processCode = mapTypeToInvoiceTypeCode(typeParam);
      }
      
      console.log('API request params:', requestParams);
      
      const response = await invoiceApi.getAllInvoices(requestParams);

      if (response.success) {
        console.log('API response data:', response.data.items);
        setInvoices(response.data.items || []);
        setPagination({
          current: page,
          pageSize,
          total: response.data.totalCount || 0
        });
      } else {
        message.error(`Faturalar yüklenirken bir hata oluştu: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Fatura yükleme hatası:', error);
      message.error(`Faturalar yüklenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [typeParam]);
  
  // URL'deki tip değiştiğinde filtreleri güncelle
  useEffect(() => {
    if (typeParam) {
      setFilters(prev => ({
        ...prev,
        invoiceTypeCode: mappedTypeCode
      }));
    }
  }, [typeParam, mappedTypeCode]);

  // Filtreleri uygula
  const applyFilters = () => {
    loadInvoices(1, pagination.pageSize);
  };

  // Filtreleri temizle
  const clearFilters = () => {
    setFilters({
      invoiceNumber: '',
      invoiceTypeCode: '',
      dateRange: null,
      currAccCode: ''
    });
    loadInvoices(1, pagination.pageSize);
  };

  // Sayfa değişikliği
  const handleTableChange = (pagination: any) => {
    loadInvoices(pagination.current, pagination.pageSize);
  };

  // Fatura detayını görüntüle
  const viewInvoiceDetails = (invoiceId: string, invoiceType: string) => {
    let type = 'wholesale';
    
    if (invoiceType === InvoiceType.WHOLESALE_PURCHASE) {
      type = 'purchase';
    } else if (invoiceType === InvoiceType.EXPENSE_SALES || invoiceType === InvoiceType.EXPENSE_PURCHASE) {
      type = 'expense';
    }
    
    navigate(`/invoice/${invoiceId}?type=${type}`);
  };
  
  // Fatura düzenleme sayfasına yönlendir
  const editInvoice = (invoiceId: string, invoiceType: string) => {
    let type = 'wholesale';
    
    if (invoiceType === InvoiceType.WHOLESALE_PURCHASE) {
      type = 'purchase';
    } else if (invoiceType === InvoiceType.EXPENSE_SALES || invoiceType === InvoiceType.EXPENSE_PURCHASE) {
      type = 'expense';
    }
    
    navigate(`/invoice/edit/${invoiceId}?type=${type}`);
  };

  // Yeni fatura oluştur
  const handleCreateInvoice = (type?: string) => {
    if (type) {
      navigate(`/invoice/create?type=${type}`);
    } else {
      navigate('/invoice/create');
    }
  };

  // Fatura oluşturma başarılı
  const handleCreateSuccess = (data: any) => {
    setCreateModalVisible(false);
    loadInvoices();
    message.success('Fatura başarıyla oluşturuldu.');
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Fatura No',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text: string) => <span style={{ fontWeight: 'bold' }}>{text}</span>
    },
    {
      title: 'Fatura Tipi',
      dataIndex: 'processCode',
      key: 'processCode',
      render: (text: string) => (
        <Tag color={invoiceTypeColors[text as InvoiceType] || 'default'}>
          {invoiceTypeDescriptions[text as InvoiceType] || text}
        </Tag>
      )
    },
    {
      title: 'Belge Tipi',
      dataIndex: 'invoiceTypeCode',
      key: 'invoiceTypeCode',
      render: (text: string) => text || '-'
    },
    {
      title: 'Belge Tipi Açıklaması',
      dataIndex: 'invoiceTypeDescription',
      key: 'invoiceTypeDescription',
      render: (text: string) => text || '-'
    },
    {
      title: 'Tarih',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (text: string) => dayjs(text).format('DD.MM.YYYY')
    },
    {
      title: 'Müşteri/Tedarikçi',
      key: 'currAccCode',
      render: (_: any, record: any) => {
        // CurrAccTypeCode'a göre müşteri veya tedarikçi bilgisini göster
        if (record.currAccTypeCode === 3) { // Müşteri
          return (
            <Tooltip title={record.customerCode}>
              {record.customerDescription || '-'}
            </Tooltip>
          );
        } else if (record.currAccTypeCode === 1) { // Tedarikçi
          return (
            <Tooltip title={record.vendorCode}>
              {record.vendorDescription || '-'}
            </Tooltip>
          );
        } else {
          return record.currAccCode || '-';
        }
      }
    },
    {
      title: 'Iade',
      dataIndex: 'isReturn',
      key: 'isReturn',
      render: (isReturn: boolean) => (
        isReturn ? <Tag color="orange">Evet</Tag> : <Tag color="default">Hayır</Tag>
      )
    },
    {
      title: 'e-Fatura',
      dataIndex: 'isEInvoice',
      key: 'isEInvoice',
      render: (isEInvoice: boolean) => (
        isEInvoice ? <Tag color="purple">Evet</Tag> : <Tag color="default">Hayır</Tag>
      )
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (text: string, record: any) => (
        <Space>
          {record.isCompleted && (
            <Tag color="green">Tamamlandı</Tag>
          )}
          {record.isSuspended && (
            <Tag color="red">Askıda</Tag>
          )}
          {!record.isCompleted && !record.isSuspended && (
            <Tag color="blue">Bekliyor</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (text: string, record: any) => (
        <Space>
          <Tooltip title="Görüntüle">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => viewInvoiceDetails(record.invoiceHeaderID || record.invoiceHeaderId, record.invoiceTypeCode)}
            />
          </Tooltip>
          <Tooltip title="Düzenle">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => editInvoice(record.invoiceHeaderID || record.invoiceHeaderId, record.invoiceTypeCode)}
            />
          </Tooltip>
          <Tooltip title="Yazdır">
            <Button
              type="text"
              icon={<FileTextOutlined />}
              onClick={() => message.info('Yazdırma özelliği yakında eklenecek.')}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4}>Faturalar</Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreateInvoice()}
              >
                Yeni Fatura
              </Button>
              <Button
                type="primary"
                onClick={() => handleCreateInvoice('wholesale')}
              >
                Toptan Satış Faturası
              </Button>
              <Button
                type="primary"
                onClick={() => handleCreateInvoice('wholesale-purchase')}
              >
                Toptan Alış Faturası
              </Button>
              <Button
                type="primary"
                onClick={() => handleCreateInvoice('expense')}
              >
                Masraf Faturası
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="Fatura No"
              value={filters.invoiceNumber}
              onChange={(e) => setFilters({ ...filters, invoiceNumber: e.target.value })}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Fatura Tipi"
              style={{ width: '100%' }}
              value={filters.invoiceTypeCode}
              onChange={(value) => setFilters({ ...filters, invoiceTypeCode: value })}
              allowClear
            >
              <Option value={InvoiceType.WHOLESALE_SALES}>{invoiceTypeDescriptions[InvoiceType.WHOLESALE_SALES]}</Option>
              <Option value={InvoiceType.WHOLESALE_PURCHASE}>{invoiceTypeDescriptions[InvoiceType.WHOLESALE_PURCHASE]}</Option>
              <Option value={InvoiceType.EXPENSE_SALES}>{invoiceTypeDescriptions[InvoiceType.EXPENSE_SALES]}</Option>
              <Option value={InvoiceType.EXPENSE_PURCHASE}>{invoiceTypeDescriptions[InvoiceType.EXPENSE_PURCHASE]}</Option>
            </Select>
          </Col>
          <Col span={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] })}
              format="DD.MM.YYYY"
              allowClear
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={applyFilters}
              >
                Ara
              </Button>
              <Button onClick={clearFilters}>Temizle</Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="invoiceHeaderId"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal kaldırıldı, yerine sayfa yönlendirmesi kullanılıyor */}
    </div>
  );
};

export default InvoiceListPage;
